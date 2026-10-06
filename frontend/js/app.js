// MET Institute of Management - Smart College Management System (SCMS)
// STRICT TWO-ROLE ARCHITECTURE CONTROLLER: HOD & FACULTY

const App = {
  // Current session state: exactly 2 roles ('HOD' or 'FACULTY')
  currentUser: null,
  currentRole: 'HOD', // 'HOD' or 'FACULTY'
  currentView: 'public', // 'public', 'hod-dashboard', 'faculty-dashboard', 'faculty-studio', 'mom-studio', 'calendar-view', 'architecture-view'
  data: SCMS_DATA,
  activePreviewReport: null,
  resubmittingReportId: null,

  async init() {
    // Render the public-facing view and bind UI events first
    this.renderAllViews();
    this.bindEvents();
    this.updateLiveDossierPreview();
    this.updateLiveMoMPreview();

    // Try backend-authenticated flow first
    if (typeof Auth !== 'undefined' && typeof ApiClient !== 'undefined') {
      const online = await ApiClient.checkHealth();
      if (online) {
        // Attempt to restore an existing session
        const authenticated = await Auth.init();
        if (authenticated) {
          // Auth.onLoginSuccess will handle navigation
          return;
        }
        // No session — stay on public view, user can open login modal
        this.switchView('public');
        return;
      }
    }

    // Standalone / offline fallback — use local mock user
    this.currentUser = this.data.users.find(u => u.role === 'HOD');
    this.currentRole = this.currentUser ? this.currentUser.role : 'HOD';

    // Check URL hash
    const hash = window.location.hash.replace('#', '');
    const validViews = ['public', 'hod-dashboard', 'faculty-dashboard', 'faculty-studio', 'mom-studio', 'calendar-view', 'architecture-view'];
    if (hash && validViews.includes(hash)) {
      this.switchView(hash);
    } else {
      this.switchView('public');
    }
  },

  async syncWithBackend() {
    if (typeof ApiClient === 'undefined') return;
    try {
      const serverData = await ApiClient.getSyncData();
      if (serverData && serverData.users) {
        this.data = serverData;
        if (this.currentUser) {
          this.currentUser = this.data.users.find(u => u.id === this.currentUser.id) || this.currentUser;
        }
        this.renderAllViews();
        console.log('[SCMS] State synchronized with Backend REST API');
      }
    } catch (e) {
      console.warn('[SCMS] Backend sync error, continuing with local store:', e);
    }
  },

  renderAllViews() {
    this.renderUserBadge();
    this.renderPendingFacultyApprovals();
    this.renderActiveFacultyList();
    this.renderHODPendingReports();
    this.renderHODApprovedAndRejected();
    this.renderFacultyDashboard();
    this.renderHistoricalReminders();
    this.renderCalendar();
    this.renderAuditLogs();
    this.updateKPIBadges();
  },

  renderUserBadge() {
    const nameEls = document.querySelectorAll('.active-user-name');
    const roleEls = document.querySelectorAll('.active-user-role');
    const avatarEls = document.querySelectorAll('.active-user-avatar');

    nameEls.forEach(el => el.textContent = this.currentUser.name);
    roleEls.forEach(el => el.textContent = `Role: ${this.currentUser.role}`);
    avatarEls.forEach(el => el.textContent = this.currentUser.avatar);

    // Toggle role-specific navigation elements
    if (this.currentRole === 'HOD') {
      document.querySelectorAll('.hod-only').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.faculty-only').forEach(el => el.classList.add('hidden'));
    } else {
      document.querySelectorAll('.hod-only').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.faculty-only').forEach(el => el.classList.remove('hidden'));
    }
  },

  switchView(viewName) {
    // Enforce role-based access control (RBAC) on views
    if (viewName === 'hod-dashboard' && this.currentRole !== 'HOD') {
      this.showToast("Access Denied: Only HOD can access the Department Administrative Nexus.", "danger");
      return;
    }

    this.currentView = viewName;
    window.location.hash = viewName;

    document.querySelectorAll('.app-view-container').forEach(el => {
      el.classList.add('hidden');
    });

    const activeContainer = document.getElementById(`view-${viewName}`);
    if (activeContainer) {
      activeContainer.classList.remove('hidden');
      activeContainer.classList.add('animate-fade-in');
    }

    // Update nav tabs
    document.querySelectorAll('[data-nav-view]').forEach(btn => {
      if (btn.dataset.navView === viewName) {
        btn.classList.add('text-primary', 'font-bold', 'border-b-2', 'border-primary');
        btn.classList.remove('text-on-surface-variant');
      } else {
        btn.classList.remove('text-primary', 'font-bold', 'border-b-2', 'border-primary');
        btn.classList.add('text-on-surface-variant');
      }
    });

    // Update sidebar tabs
    document.querySelectorAll('[data-sidebar-view]').forEach(btn => {
      if (btn.dataset.sidebarView === viewName) {
        btn.classList.add('bg-surface-container', 'text-primary', 'font-bold', 'border-l-4', 'border-primary');
        btn.classList.remove('text-on-surface-variant');
      } else {
        btn.classList.remove('bg-surface-container', 'text-primary', 'font-bold', 'border-l-4', 'border-primary');
        btn.classList.add('text-on-surface-variant');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  switchUser(userId) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return;

    if (user.status === 'PENDING_HOD_APPROVAL') {
      alert(`[RBAC ENFORCEMENT]\nCannot log in: ${user.name} is currently PENDING_HOD_APPROVAL.\n\nPer security specifications: A faculty member must NOT be able to access the main application before HOD approval.`);
      this.showToast(`Login Rejected: Account ${user.email} is pending HOD approval!`, "danger");
      return;
    }

    if (user.status === 'DEACTIVATED' || user.status === 'REJECTED') {
      alert(`[RBAC ENFORCEMENT]\nCannot log in: ${user.name} account is ${user.status}.`);
      this.showToast(`Login Rejected: Account is ${user.status}!`, "danger");
      return;
    }

    this.currentUser = user;
    this.currentRole = user.role;
    this.renderAllViews();

    this.showToast(`Logged in as: ${user.name} (${user.role})`, "success");

    if (this.currentRole === 'HOD') {
      this.switchView('hod-dashboard');
    } else {
      this.switchView('faculty-dashboard');
    }
  },

  // ==========================================
  // AUTHENTICATION & FACULTY REGISTRATION FLOW
  // ==========================================
  openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.switchAuthTab(tab);
  },

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  switchAuthTab(tab) {
    const loginSec = document.getElementById('auth-login-section');
    const registerSec = document.getElementById('auth-register-section');
    const forgotSec = document.getElementById('auth-forgot-section');
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');

    // Hide all sections first
    loginSec?.classList.add('hidden');
    registerSec?.classList.add('hidden');
    forgotSec?.classList.add('hidden');

    // Reset tab styles
    [tabLogin, tabRegister].forEach(btn => {
      btn?.classList.remove('border-primary', 'text-primary', 'font-bold');
      btn?.classList.add('text-on-surface-variant', 'border-transparent');
    });

    if (tab === 'login') {
      loginSec?.classList.remove('hidden');
      tabLogin?.classList.add('border-primary', 'text-primary', 'font-bold');
      tabLogin?.classList.remove('text-on-surface-variant', 'border-transparent');
    } else if (tab === 'register') {
      registerSec?.classList.remove('hidden');
      tabRegister?.classList.add('border-primary', 'text-primary', 'font-bold');
      tabRegister?.classList.remove('text-on-surface-variant', 'border-transparent');
    } else if (tab === 'forgot') {
      forgotSec?.classList.remove('hidden');
      // Keep login tab visually active since forgot is a sub-flow of login
      tabLogin?.classList.add('border-primary', 'text-primary', 'font-bold');
      tabLogin?.classList.remove('text-on-surface-variant', 'border-transparent');
    }
  },

  async handleFacultyRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password')?.value;
    const designation = document.getElementById('reg-designation').value.trim();

    if (!name || !email || !password) {
      this.showToast('Please fill in all required fields (Name, Email, Password).', 'warning');
      return;
    }

    if (password.length < 8) {
      this.showToast('Password must be at least 8 characters long.', 'warning');
      return;
    }

    // Use real backend Auth if available
    if (typeof Auth !== 'undefined' && ApiClient.isOnline) {
      await Auth.register(name, email, password, designation);
      // Auth.showRegisterSuccess handles the UI feedback
      return;
    }

    // Offline fallback — local-only registration
    if (this.data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      this.showToast(`Account with email ${email} already exists!`, 'danger');
      return;
    }

    const newFaculty = {
      id: `usr_fac_${Date.now()}`,
      name: name,
      role: 'FACULTY',
      email: email,
      designation: designation || 'Assistant Professor',
      department: 'Management Studies',
      status: 'PENDING_HOD_APPROVAL',
      registeredAt: new Date().toLocaleString(),
      avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };

    this.data.users.push(newFaculty);
    this.data.auditLog.unshift({
      timestamp: new Date().toLocaleString(),
      actor: 'System',
      action: 'FACULTY_REGISTRATION',
      details: `${name} registered. Status: PENDING_HOD_APPROVAL`
    });

    this.renderPendingFacultyApprovals();
    this.updateKPIBadges();
    this.closeAuthModal();
    this.showToast('Faculty registration submitted: Pending HOD Approval!', 'warning');
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password')?.value;
    const remember = document.getElementById('login-remember')?.checked || false;

    if (!email || !password) {
      this.showToast('Please enter both email and password.', 'warning');
      return;
    }

    // Use real backend Auth if available
    if (typeof Auth !== 'undefined' && ApiClient.isOnline) {
      await Auth.login(email, password, remember);
      // Auth.onLoginSuccess handles navigation on success
      return;
    }

    // Offline fallback — local-only login
    const user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      this.showToast('Account not found. Please register first.', 'danger');
      return;
    }
    this.closeAuthModal();
    this.switchUser(user.id);
  },

  // ==========================================
  // HOD APPROVE / REJECT FACULTY REGISTRATIONS
  // ==========================================
  approveFaculty(facultyId) {
    if (this.currentRole !== 'HOD') return;
    const faculty = this.data.users.find(u => u.id === facultyId);
    if (!faculty) return;

    faculty.status = "ACTIVE";
    this.data.auditLog.unshift({
      timestamp: new Date().toLocaleString(),
      actor: "Prof. Nilesh Bread (HOD)",
      action: "FACULTY_ACCOUNT_APPROVED",
      details: `Approved faculty registration for ${faculty.name} (${faculty.email}). Account is now ACTIVE.`
    });

    if (typeof ApiClient !== 'undefined') {
      ApiClient.updateFacultyStatus(facultyId, 'ACTIVE', 'Prof. Nilesh Bread (HOD)');
    }

    this.renderPendingFacultyApprovals();
    this.renderActiveFacultyList();
    this.updateKPIBadges();
    this.showToast(`Approved registration for ${faculty.name}! They can now log in.`, "success");
  },

  rejectFaculty(facultyId) {
    if (this.currentRole !== 'HOD') return;
    const faculty = this.data.users.find(u => u.id === facultyId);
    if (!faculty) return;

    const reason = prompt(`Enter rejection reason for ${faculty.name}:`, "Incomplete institutional credentials / unverified department affiliation");
    if (!reason) return;

    faculty.status = "REJECTED";
    faculty.rejectionReason = reason;

    this.data.auditLog.unshift({
      timestamp: new Date().toLocaleString(),
      actor: "Prof. Nilesh Bread (HOD)",
      action: "FACULTY_ACCOUNT_REJECTED",
      details: `Rejected registration for ${faculty.name}: "${reason}"`
    });

    if (typeof ApiClient !== 'undefined') {
      ApiClient.updateFacultyStatus(facultyId, 'REJECTED', 'Prof. Nilesh Bread (HOD)');
    }

    this.renderPendingFacultyApprovals();
    this.updateKPIBadges();
    this.showToast(`Rejected faculty registration for ${faculty.name}.`, "warning");
  },

  toggleFacultyActive(facultyId) {
    if (this.currentRole !== 'HOD') return;
    const faculty = this.data.users.find(u => u.id === facultyId);
    if (!faculty) return;

    faculty.status = (faculty.status === "ACTIVE") ? "DEACTIVATED" : "ACTIVE";
    this.data.auditLog.unshift({
      timestamp: new Date().toLocaleString(),
      actor: "Prof. Nilesh Bread (HOD)",
      action: "FACULTY_STATUS_TOGGLE",
      details: `Changed account status of ${faculty.name} to ${faculty.status}`
    });

    this.renderActiveFacultyList();
    this.updateKPIBadges();
    this.showToast(`Faculty account for ${faculty.name} is now ${faculty.status}.`, "info");
  },

  renderPendingFacultyApprovals() {
    const container = document.getElementById('pendingFacultyList');
    if (!container) return;

    const pending = this.data.users.filter(u => u.status === 'PENDING_HOD_APPROVAL');
    if (pending.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-on-surface-variant font-medium">
          <span class="material-symbols-outlined text-[32px] text-tertiary mb-1">verified_user</span>
          <p class="text-xs">No pending faculty registration requests. All accounts reviewed!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = pending.map(f => `
      <div class="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-met-red text-white flex items-center justify-center font-bold text-xs font-heading">
            ${f.avatar}
          </div>
          <div>
            <div class="font-bold text-xs text-on-surface">${f.name}</div>
            <div class="text-[11px] text-on-surface-variant">${f.designation} • ${f.email}</div>
            <div class="text-[10px] font-mono text-outline">Registered: ${f.registeredAt || 'Today'}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="App.approveFaculty('${f.id}')" class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">check</span>
            <span>Approve</span>
          </button>
          <button onclick="App.rejectFaculty('${f.id}')" class="px-2.5 py-1.5 bg-white text-red-700 border border-red-200 hover:bg-red-50 rounded-lg text-xs font-bold transition-all">
            Reject
          </button>
        </div>
      </div>
    `).join('');
  },

  renderActiveFacultyList() {
    const container = document.getElementById('activeFacultyDirectory');
    if (!container) return;

    const faculties = this.data.users.filter(u => u.role === 'FACULTY' && u.status !== 'PENDING_HOD_APPROVAL');
    container.innerHTML = faculties.map(f => `
      <div class="p-3 bg-white rounded-lg border border-outline-variant flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full ${f.status === 'ACTIVE' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'} flex items-center justify-center font-bold text-xs">
            ${f.avatar}
          </div>
          <div>
            <div class="font-bold text-xs text-on-surface">${f.name}</div>
            <div class="text-[11px] text-on-surface-variant">${f.designation}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${f.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}">
            ${f.status}
          </span>
          <button onclick="App.toggleFacultyActive('${f.id}')" class="text-[11px] text-primary hover:underline font-semibold">
            ${f.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    `).join('');
  },

  // ==========================================
  // HOD APPROVAL WORKFLOW (PRD P0)
  // ==========================================
  renderHODPendingReports() {
    const container = document.getElementById('pendingApprovalsTableBody');
    if (!container) return;

    const pending = this.data.eventReports.filter(r => r.status === 'PENDING_HOD_APPROVAL');
    if (pending.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="px-4 py-8 text-center text-on-surface-variant font-medium">
            <span class="material-symbols-outlined text-[32px] text-tertiary mb-1">task_alt</span>
            <p class="text-xs">All event reports have been reviewed! No pending approvals.</p>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = pending.map(item => `
      <tr class="hover:bg-surface-container-low transition-colors border-b border-outline-variant/60">
        <td class="px-4 py-3">
          <div class="font-bold text-on-surface text-xs">${item.title}</div>
          <div class="text-[10px] font-mono text-on-surface-variant">${item.id} • ${item.venue}</div>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-container text-primary border border-outline-variant">
            ${item.type}
          </span>
        </td>
        <td class="px-4 py-3 text-xs text-on-surface">
          <div class="font-semibold">${item.submittedBy}</div>
          <div class="text-[10px] text-on-surface-variant">${item.submittedTime}</div>
        </td>
        <td class="px-4 py-3 text-xs">
          <div class="font-semibold text-on-surface">${item.attendees} Students</div>
          <div class="text-[10px] text-tertiary font-bold">${item.quorumStatus}</div>
        </td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <span class="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Pending HOD Approval
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-1.5">
          <button onclick="App.openReviewModal('${item.id}')" class="px-2.5 py-1 text-xs font-semibold bg-white border border-outline-variant text-on-surface rounded hover:bg-surface transition-all">
            Inspect Dossier
          </button>
          <button onclick="App.approveReport('${item.id}')" class="px-2.5 py-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded shadow-sm transition-all">
            Sign & Approve
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderHODApprovedAndRejected() {
    const approvedContainer = document.getElementById('hodApprovedReportsTableBody');
    if (approvedContainer) {
      const approved = this.data.eventReports.filter(r => r.status === 'APPROVED');
      approvedContainer.innerHTML = approved.map(r => `
        <tr class="border-b border-outline-variant/60 text-xs">
          <td class="px-4 py-2.5 font-semibold text-on-surface">${r.title}</td>
          <td class="px-4 py-2.5 font-mono text-[10px]">${r.type}</td>
          <td class="px-4 py-2.5">${r.submittedBy}</td>
          <td class="px-4 py-2.5 text-tertiary font-mono text-[10px]">${r.digitalSignatureHash || 'SHA-256 Validated'}</td>
          <td class="px-4 py-2.5 text-right">
            <button onclick="App.openPreviewReportModal('${r.id}')" class="text-primary font-semibold hover:underline">
              View Certified PDF
            </button>
          </td>
        </tr>
      `).join('');
    }

    const rejectedContainer = document.getElementById('hodRejectedReportsTableBody');
    if (rejectedContainer) {
      const rejected = this.data.eventReports.filter(r => r.status === 'REJECTED');
      rejectedContainer.innerHTML = rejected.map(r => `
        <tr class="border-b border-outline-variant/60 text-xs">
          <td class="px-4 py-2.5 font-semibold text-on-surface">${r.title}</td>
          <td class="px-4 py-2.5 font-mono text-[10px]">${r.type}</td>
          <td class="px-4 py-2.5">${r.submittedBy}</td>
          <td class="px-4 py-2.5 text-red-700 italic">${r.rejectionReason}</td>
          <td class="px-4 py-2.5 text-right">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Returned</span>
          </td>
        </tr>
      `).join('');
    }
  },

  // ==========================================
  // FACULTY DASHBOARD WORKFLOW
  // ==========================================
  renderFacultyDashboard() {
    const reportsContainer = document.getElementById('facultyReportsTableBody');
    if (!reportsContainer) return;

    // Show reports submitted by current faculty user or all if shared
    const myReports = this.data.eventReports.filter(r => 
      !r.submittedByEmail || r.submittedByEmail === this.currentUser.email || this.currentRole === 'HOD'
    );

    if (myReports.length === 0) {
      reportsContainer.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-8 text-center text-on-surface-variant">
            <p class="text-xs">No event records found. Click "+ Create New Event" to get started!</p>
          </td>
        </tr>
      `;
      return;
    }

    reportsContainer.innerHTML = myReports.map(item => `
      <tr class="border-b border-outline-variant/60 text-xs hover:bg-surface-container-low transition-colors">
        <td class="px-4 py-3">
          <div class="font-bold text-on-surface">${item.title}</div>
          <div class="text-[10px] font-mono text-outline">${item.id} • ${item.date}</div>
          ${item.status === 'REJECTED' ? `
            <div class="mt-1 p-2 rounded bg-red-50 border border-red-200 text-red-800 text-[11px] leading-tight">
              <strong>HOD Rejection Note:</strong> "${item.rejectionReason}"
            </div>
          ` : ''}
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-container text-primary">
            ${item.type}
          </span>
        </td>
        <td class="px-4 py-3 font-semibold text-on-surface">
          ${item.attendees} Students
        </td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
            item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
            item.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
            'bg-amber-100 text-amber-900 border border-amber-300'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${
              item.status === 'APPROVED' ? 'bg-emerald-600' :
              item.status === 'REJECTED' ? 'bg-red-600' :
              'bg-amber-600'
            }"></span>
            ${item.status === 'PENDING_HOD_APPROVAL' ? 'Pending HOD Approval' : item.status}
          </span>
        </td>
        <td class="px-4 py-3 text-right space-x-1.5">
          ${item.status === 'REJECTED' ? `
            <button onclick="App.openResubmitStudio('${item.id}')" class="px-3 py-1 bg-met-red hover:bg-met-red-dark text-white rounded text-xs font-bold shadow-sm transition-all flex-inline items-center gap-1">
              <span>Correct & Resubmit</span>
            </button>
          ` : `
            <button onclick="App.openPreviewReportModal('${item.id}')" class="px-2.5 py-1 bg-white border border-outline-variant text-on-surface rounded hover:bg-surface text-xs font-semibold">
              Preview Dossier
            </button>
          `}
        </td>
      </tr>
    `).join('');
  },

  openResubmitStudio(reportId) {
    const report = this.data.eventReports.find(r => r.id === reportId);
    if (!report) return;

    this.resubmittingReportId = reportId;
    this.switchView('faculty-studio');

    // Pre-populate form with existing data
    document.getElementById('evt-title').value = report.title;
    document.getElementById('evt-type').value = report.type;
    document.getElementById('evt-date').value = report.date;
    document.getElementById('evt-time').value = report.time || "10:00 AM - 01:00 PM";
    document.getElementById('evt-venue').value = report.venue;
    document.getElementById('evt-speaker').value = report.speaker;
    document.getElementById('evt-coordinator').value = report.submittedBy;
    document.getElementById('evt-attendees').value = report.attendees;
    document.getElementById('evt-objectives').value = report.objectives;
    document.getElementById('evt-outcomes').value = report.outcomes;

    this.updateLiveDossierPreview();

    alert(`[RESUBMISSION WORKFLOW]\n\nLoaded "${report.title}" for correction.\n\nHOD Feedback was: "${report.rejectionReason}"\n\nPlease make your changes and click 'Submit to HOD for Final Review'.`);
    this.showToast(`Loaded ${report.title} for correction & resubmission.`, "info");
  },

  // ==========================================
  // HISTORICAL REMINDERS (PRD FR-REM-01)
  // ==========================================
  renderHistoricalReminders() {
    const container = document.getElementById('historicalRemindersContainer');
    const facultyRemindersContainer = document.getElementById('facultyRemindersContainer');

    const content = this.data.historicalReminders.map(rem => `
      <div class="p-4 rounded-xl border ${rem.isToday ? 'border-primary bg-primary/5' : 'border-outline-variant bg-white'} shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${rem.isToday ? 'bg-met-red text-white' : 'bg-surface-container text-on-surface'}">
              ${rem.isToday ? '⚡ 7-DAY ANNIVERSARY RADAR (PRD FR-REM-01)' : 'ANNUAL LOOKAHEAD'}
            </span>
            <span class="text-xs font-bold ${rem.isToday ? 'text-met-red' : 'text-on-surface-variant'}">
              ${rem.daysRemaining} Days to Anniversary
            </span>
          </div>
          <h4 class="font-heading font-bold text-sm text-on-surface">${rem.eventTitle}</h4>
          <p class="text-xs text-on-surface-variant mt-1">
            Original Date: <strong>${rem.originalDate}</strong> | Scheduled 2026 Anniversary: <strong>${rem.anniversaryDate}</strong>
          </p>
          <div class="mt-2.5 pt-2 border-t border-outline-variant/60 grid grid-cols-2 gap-2 text-[11px] font-mono text-secondary">
            <div>Prior Year: ${rem.priorYearStats.participants} Participants</div>
            <div>Budget: ${rem.priorYearStats.budget}</div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between">
          <button onclick="App.cloneHistoricalEvent('${rem.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover shadow-sm active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[16px]">content_copy</span>
            1-Click Clone to AY26
          </button>
          <button onclick="App.dismissReminder('${rem.id}')" class="text-xs font-semibold text-on-surface-variant hover:text-met-red">
            Dismiss
          </button>
        </div>
      </div>
    `).join('');

    if (container) container.innerHTML = content;
    if (facultyRemindersContainer) facultyRemindersContainer.innerHTML = content;
  },

  cloneHistoricalEvent(reminderId) {
    const rem = this.data.historicalReminders.find(r => r.id === reminderId);
    if (!rem) return;

    this.switchView('faculty-studio');

    document.getElementById('evt-title').value = `${rem.eventTitle} 2026 (Annual Re-Run)`;
    document.getElementById('evt-type').value = rem.eventType;
    document.getElementById('evt-date').value = rem.anniversaryDate;
    document.getElementById('evt-time').value = "09:30 AM - 05:30 PM";
    document.getElementById('evt-venue').value = "Auditorium & Innovation Labs, MET Bhujbal Knowledge City";
    document.getElementById('evt-attendees').value = rem.priorYearStats.participants;
    document.getElementById('evt-objectives').value = `• 2026 Edition: Annual recurrence of ${rem.eventTitle}.\n• Expanded participation target: 300+ inter-collegiate delegates.\n• Approved departmental budget: ${rem.priorYearStats.budget}.`;
    document.getElementById('evt-outcomes').value = `Continued legacy of institutional innovation with validated NAAC SSR Criterion 1.3 mapping.`;

    this.updateLiveDossierPreview();
    this.showToast(`1-Click Cloned "${rem.eventTitle}" into Studio! Ready to review & submit.`, "success");
  },

  dismissReminder(reminderId) {
    this.data.historicalReminders = this.data.historicalReminders.filter(r => r.id !== reminderId);
    this.renderHistoricalReminders();
    this.updateKPIBadges();
    this.showToast("Historical reminder dismissed for this anniversary cycle.", "info");
  },

  // ==========================================
  // REVIEW & APPROVAL QUALITY GATE MODAL
  // ==========================================
  openReviewModal(reportId) {
    const report = this.data.eventReports.find(r => r.id === reportId);
    if (!report) return;
    this.activePreviewReport = report;

    const modal = document.getElementById('reviewDossierModal');
    if (!modal) return;

    document.getElementById('modal-report-title').textContent = report.title;
    document.getElementById('modal-report-ref').textContent = report.id;
    document.getElementById('modal-report-author').textContent = `${report.submittedBy} (${report.submittedTime})`;
    document.getElementById('modal-report-details').innerHTML = `
      <div class="space-y-3 text-xs text-on-surface">
        <div class="grid grid-cols-2 gap-3 p-3 bg-surface rounded-lg border border-outline-variant">
          <div><span class="text-on-surface-variant font-medium">Type:</span> <strong>${report.type}</strong></div>
          <div><span class="text-on-surface-variant font-medium">Date:</span> <strong>${report.date}</strong></div>
          <div><span class="text-on-surface-variant font-medium">Venue:</span> <strong>${report.venue}</strong></div>
          <div><span class="text-on-surface-variant font-medium">Attendance:</span> <strong>${report.attendees} (${report.quorumStatus})</strong></div>
        </div>
        <div>
          <label class="block font-bold text-on-surface">Speaker / Key Resource:</label>
          <p class="text-on-surface-variant mt-0.5">${report.speaker}</p>
        </div>
        <div>
          <label class="block font-bold text-on-surface">Objectives:</label>
          <p class="text-on-surface-variant mt-0.5 whitespace-pre-line">${report.objectives}</p>
        </div>
        <div>
          <label class="block font-bold text-on-surface">Activities & Outcomes:</label>
          <p class="text-on-surface-variant mt-0.5">${report.outcomes}</p>
        </div>
        <div>
          <label class="block font-bold text-on-surface">Evidence Verification:</label>
          <p class="text-tertiary font-mono text-[11px] mt-0.5">✓ ${report.photosAttached} GPS Geotagged Photographs • Biometric RFID Logs Verified (100% Quorum)</p>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeReviewModal() {
    const modal = document.getElementById('reviewDossierModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.activePreviewReport = null;
  },

  approveReport(reportId = null) {
    if (this.currentRole !== 'HOD') {
      alert("Unauthorized: Only the HOD can approve reports.");
      return;
    }

    const id = reportId || this.activePreviewReport?.id;
    if (!id) return;

    const report = this.data.eventReports.find(r => r.id === id);
    if (!report) return;

    report.status = "APPROVED";
    report.approvedBy = "Prof. Nilesh Bread (HOD)";
    report.approvalDate = new Date().toISOString().split('T')[0];
    report.digitalSignatureHash = `SHA256: ${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 8)}`;

    this.data.auditLog.unshift({
      timestamp: new Date().toLocaleString(),
      actor: "Prof. Nilesh Bread (HOD)",
      action: "EVENT_REPORT_APPROVED",
      details: `Approved "${report.title}" (${report.id}) with HOD digital signature.`
    });

    if (typeof ApiClient !== 'undefined') {
      ApiClient.updateReportStatus(report.id, 'APPROVED', '', 'Prof. Nilesh Bread (HOD)');
    }

    this.renderAllViews();
    this.closeReviewModal();
    this.showToast(`Approved "${report.title}" with HOD Cryptographic Signature Stamp!`, "success");
  },

  rejectReportPrompt() {
    if (this.currentRole !== 'HOD') return;
    if (!this.activePreviewReport) return;

    const reason = prompt("Enter formal rejection reason (PRD FR-APR-03 Compliance):", "Please attach the student feedback score summary chart and verify attendance count.");
    if (!reason || !reason.trim()) return;

    const report = this.data.eventReports.find(r => r.id === this.activePreviewReport.id);
    if (report) {
      report.status = "REJECTED";
      report.rejectionReason = reason;

      this.data.auditLog.unshift({
        timestamp: new Date().toLocaleString(),
        actor: "Prof. Nilesh Bread (HOD)",
        action: "EVENT_REPORT_REJECTED",
        details: `Rejected "${report.title}" (${report.id}): "${reason}"`
      });

      if (typeof ApiClient !== 'undefined') {
        ApiClient.updateReportStatus(report.id, 'REJECTED', reason, 'Prof. Nilesh Bread (HOD)');
      }

      this.renderAllViews();
      this.closeReviewModal();
      this.showToast(`Returned report to ${report.submittedBy} with rejection reason: "${reason}"`, "warning");
    }
  },

  openPreviewReportModal(reportId) {
    const report = this.data.eventReports.find(r => r.id === reportId);
    if (!report) return;

    // Load into live preview and show print dialog or preview
    document.getElementById('evt-title').value = report.title;
    document.getElementById('evt-type').value = report.type;
    document.getElementById('evt-date').value = report.date;
    document.getElementById('evt-venue').value = report.venue;
    document.getElementById('evt-speaker').value = report.speaker;
    document.getElementById('evt-coordinator').value = report.submittedBy;
    document.getElementById('evt-attendees').value = report.attendees;
    document.getElementById('evt-objectives').value = report.objectives;
    document.getElementById('evt-outcomes').value = report.outcomes;

    this.updateLiveDossierPreview();
    this.switchView('faculty-studio');
    this.showToast(`Viewing official dossier for "${report.title}"`, "info");
  },

  // ==========================================
  // EVENT REPORT SUBMISSION WORKFLOW
  // ==========================================
  submitEventForApproval() {
    const title = document.getElementById('evt-title').value.trim();
    const type = document.getElementById('evt-type').value;
    const date = document.getElementById('evt-date').value;
    const time = document.getElementById('evt-time').value;
    const venue = document.getElementById('evt-venue').value;
    const speaker = document.getElementById('evt-speaker').value;
    const coordinator = document.getElementById('evt-coordinator').value;
    const attendees = parseInt(document.getElementById('evt-attendees').value) || 150;
    const objectives = document.getElementById('evt-objectives').value;
    const outcomes = document.getElementById('evt-outcomes').value;

    if (!title || !date || !venue) {
      alert("Please fill in required fields (Title, Date, Venue).");
      return;
    }

    if (this.resubmittingReportId) {
      // It's a resubmission!
      const existing = this.data.eventReports.find(r => r.id === this.resubmittingReportId);
      if (existing) {
        existing.title = title;
        existing.type = type;
        existing.date = date;
        existing.time = time;
        existing.venue = venue;
        existing.speaker = speaker;
        existing.submittedBy = coordinator;
        existing.attendees = attendees;
        existing.objectives = objectives;
        existing.outcomes = outcomes;
        existing.status = "PENDING_HOD_APPROVAL";
        existing.submittedTime = "Resubmitted just now";
        delete existing.rejectionReason;

        this.data.auditLog.unshift({
          timestamp: new Date().toLocaleString(),
          actor: coordinator,
          action: "EVENT_REPORT_RESUBMITTED",
          details: `Resubmitted corrected report "${title}" (${existing.id}) for HOD Review.`
        });

        if (typeof ApiClient !== 'undefined') {
          ApiClient.updateReport(existing.id, existing, true);
        }

        this.resubmittingReportId = null;
        this.renderAllViews();
        this.showToast(`Corrected report "${title}" resubmitted to HOD for final review!`, "success");
        return;
      }
    }

    // New event submission
    const newReport = {
      id: `RPT-2026-${type.substring(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      title: title,
      type: type,
      submittedBy: coordinator,
      submittedByEmail: this.currentUser.email,
      submittedTime: "Just now",
      date: date,
      time: time,
      venue: venue,
      speaker: speaker,
      attendees: attendees,
      facultyInvolved: coordinator,
      quorumStatus: "100% Biometric Verified",
      photosAttached: 4,
      status: "PENDING_HOD_APPROVAL", // Exact requirement
      objectives: objectives,
      outcomes: outcomes,
      curriculumMapping: "NAAC Criterion 1.3.2"
    };

    this.data.eventReports.unshift(newReport);
    this.data.auditLog.unshift({
      timestamp: new Date().toLocaleString(),
      actor: coordinator,
      action: "EVENT_REPORT_SUBMITTED",
      details: `Submitted "${title}" (${newReport.id}) for HOD Review.`
    });

    if (typeof ApiClient !== 'undefined') {
      ApiClient.submitReport(newReport);
    }

    this.renderAllViews();
    this.showToast(`Report "${title}" successfully submitted to HOD Approval Queue!`, "success");

    // Suggest switching to HOD view to inspect
    if (this.currentRole === 'FACULTY') {
      this.switchView('faculty-dashboard');
    }
  },

  submitMoM() {
    const topic = document.getElementById('mom-topic').value;
    const committee = document.getElementById('mom-committee').value;
    const date = document.getElementById('mom-date').value;
    const time = document.getElementById('mom-time').value;
    const venue = document.getElementById('mom-venue').value;
    const chair = document.getElementById('mom-chair').value;
    const attendees = document.getElementById('mom-attendees').value;
    const agenda = document.getElementById('mom-agenda').value;
    const resolutions = document.getElementById('mom-resolutions').value;
    const actionsRaw = document.getElementById('mom-actions').value;

    const actionItems = actionsRaw.split('\n').filter(Boolean).map(line => ({
      task: line.replace(/^[•-]\s*/, ''),
      responsible: "Faculty Assignee",
      deadline: "Within 7 Days"
    }));

    const newMoM = {
      id: `MOM-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: topic,
      committee: committee,
      date: date,
      time: time,
      venue: venue,
      chairperson: chair,
      membersPresent: attendees,
      agenda: agenda,
      discussionPoints: "Documented through structured form.",
      decisions: resolutions,
      actionItems: actionItems,
      status: "PENDING_HOD_APPROVAL",
      submittedBy: this.currentUser.name
    };

    this.data.meetings.unshift(newMoM);
    this.data.auditLog.unshift({
      timestamp: new Date().toLocaleString(),
      actor: this.currentUser.name,
      action: "MOM_SUBMITTED",
      details: `Submitted Minutes of Meeting for "${topic}" (${newMoM.id}).`
    });

    if (typeof ApiClient !== 'undefined') {
      ApiClient.submitMeeting(newMoM);
    }

    this.renderAllViews();
    this.showToast(`Minutes of Meeting (MoM) submitted for HOD review!`, "success");
    setTimeout(() => {
      DocumentExporter.exportToWord('printable-mom-dossier', `MoM_${topic.replace(/\s+/g, '_')}.doc`);
    }, 400);
  },

  // ==========================================
  // LIVE PREVIEW SYNCHRONIZERS
  // ==========================================
  updateLiveDossierPreview() {
    const title = document.getElementById('evt-title')?.value || "National Conclave on Generative AI & FinTech Disruption";
    const type = document.getElementById('evt-type')?.value || "Guest Lecture";
    const date = document.getElementById('evt-date')?.value || "2026-10-14";
    const time = document.getElementById('evt-time')?.value || "10:00 AM - 01:30 PM";
    const venue = document.getElementById('evt-venue')?.value || "Convention Center, MET Bhujbal Knowledge City, Bandra (W)";
    const speaker = document.getElementById('evt-speaker')?.value || "Dr. Anand Ramanathan, Partner & Chief AI Officer, Deloitte India";
    const coordinator = document.getElementById('evt-coordinator')?.value || "Prof. Shubhangi Phade";
    const attendees = document.getElementById('evt-attendees')?.value || "285";
    const objectives = document.getElementById('evt-objectives')?.value || "• Explore real-world enterprise LLM implementations in credit risk assessment.\n• Understand regulatory compliance for automated credit scoring models.";
    const outcomes = document.getElementById('evt-outcomes')?.value || "Students gained firsthand knowledge of algorithmic risk management architectures and industry ESG compliance benchmarks.";

    const pTitle = document.getElementById('preview-evt-title');
    const pType = document.getElementById('preview-evt-type');
    const pDate = document.getElementById('preview-evt-date');
    const pVenue = document.getElementById('preview-evt-venue');
    const pSpeaker = document.getElementById('preview-evt-speaker');
    const pCoordinator = document.getElementById('preview-evt-coordinator');
    const pAttendees = document.getElementById('preview-evt-attendees');
    const pObjectives = document.getElementById('preview-evt-objectives');
    const pOutcomes = document.getElementById('preview-evt-outcomes');
    const pRef = document.getElementById('preview-evt-ref');

    if (pTitle) pTitle.textContent = title;
    if (pType) pType.textContent = type;
    if (pDate) pDate.textContent = `${date} (${time})`;
    if (pVenue) pVenue.textContent = venue;
    if (pSpeaker) pSpeaker.textContent = speaker;
    if (pCoordinator) pCoordinator.textContent = coordinator;
    if (pAttendees) pAttendees.textContent = `${attendees} Students (100% Biometric Quorum)`;
    if (pObjectives) pObjectives.innerHTML = objectives.split('\n').filter(Boolean).map(o => `<li>${o.replace(/^[•-]\s*/, '')}</li>`).join('');
    if (pOutcomes) pOutcomes.textContent = outcomes;
    if (pRef) {
      const typeCode = type.substring(0, 2).toUpperCase();
      pRef.textContent = `REF: MET/IOM/DMS/2026/${typeCode}-108 | NAAC CRITERION 1.3.2`;
    }
  },

  updateLiveMoMPreview() {
    const topic = document.getElementById('mom-topic')?.value || "Board of Studies (BoS) Q3 Curriculum Review Meeting";
    const committee = document.getElementById('mom-committee')?.value || "Board of Studies in Management";
    const date = document.getElementById('mom-date')?.value || "2026-09-29";
    const time = document.getElementById('mom-time')?.value || "10:00 AM - 12:30 PM";
    const venue = document.getElementById('mom-venue')?.value || "Boardroom A, MET Institute of Management";
    const chair = document.getElementById('mom-chair')?.value || "Prof. Nilesh Bread (Head of Department)";
    const attendees = document.getElementById('mom-attendees')?.value || "Prof. Nilesh Bread, Prof. Akshay Kale, Prof. Shubhangi Phade, External Expert";
    const agenda = document.getElementById('mom-agenda')?.value || "1. Review of Odd-Semester AY 2026-27 Electives.\n2. Inclusion of Generative AI in Financial Risk Modelling.\n3. Academic Calendar Ratification.";
    const resolutions = document.getElementById('mom-resolutions')?.value || "Resolved unanimously to introduce MBA-FIN-408 'Generative AI in Financial Engineering' with immediate effect.";
    const actions = document.getElementById('mom-actions')?.value || "• Prof. Akshay Kale to draft course syllabus guidelines by Oct 5.";

    const pTopic = document.getElementById('preview-mom-topic');
    const pCommittee = document.getElementById('preview-mom-committee');
    const pDate = document.getElementById('preview-mom-date');
    const pVenue = document.getElementById('preview-mom-venue');
    const pChair = document.getElementById('preview-mom-chair');
    const pAttendees = document.getElementById('preview-mom-attendees');
    const pAgenda = document.getElementById('preview-mom-agenda');
    const pResolutions = document.getElementById('preview-mom-resolutions');
    const pActions = document.getElementById('preview-mom-actions');

    if (pTopic) pTopic.textContent = topic;
    if (pCommittee) pCommittee.textContent = committee;
    if (pDate) pDate.textContent = `${date}, ${time}`;
    if (pVenue) pVenue.textContent = venue;
    if (pChair) pChair.textContent = chair;
    if (pAttendees) pAttendees.textContent = attendees;
    if (pAgenda) pAgenda.innerHTML = agenda.split('\n').filter(Boolean).map(a => `<li>${a.replace(/^[0-9.•-]\s*/, '')}</li>`).join('');
    if (pResolutions) pResolutions.textContent = resolutions;
    if (pActions) pActions.innerHTML = actions.split('\n').filter(Boolean).map(a => `<li>${a.replace(/^[•-]\s*/, '')}</li>`).join('');
  },

  renderCalendar() {
    const listContainer = document.getElementById('calendarEventsList');
    if (!listContainer) return;

    listContainer.innerHTML = this.data.calendarEvents.map(evt => `
      <div class="p-3.5 rounded-lg border border-outline-variant bg-white flex items-center justify-between hover:shadow-sm transition-all">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-surface-container flex flex-col items-center justify-center text-primary font-bold">
            <span class="text-[10px] uppercase font-mono">${evt.date.split('-')[1] === '09' ? 'SEP' : 'OCT'}</span>
            <span class="font-heading font-bold text-base leading-none">${evt.date.split('-')[2]}</span>
          </div>
          <div>
            <div class="font-bold text-xs text-on-surface">${evt.title}</div>
            <div class="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
              <span>🕒 ${evt.time}</span>
              <span>•</span>
              <span>📍 ${evt.venue}</span>
            </div>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
          evt.type === 'Holiday' ? 'bg-red-50 text-red-700 border border-red-200' :
          evt.type === 'Meeting' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
          'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }">
          ${evt.tag}
        </span>
      </div>
    `).join('');
  },

  renderAuditLogs() {
    const container = document.getElementById('auditLogContainer');
    if (!container) return;

    container.innerHTML = this.data.auditLog.slice(0, 10).map(log => `
      <div class="p-2.5 rounded bg-surface border border-outline-variant text-xs flex items-start justify-between">
        <div>
          <span class="font-mono font-bold text-primary text-[11px]">${log.action}</span>
          <span class="text-on-surface-variant">by <strong>${log.actor}</strong></span>
          <p class="text-on-surface text-[11px] mt-0.5">${log.details}</p>
        </div>
        <span class="text-[10px] font-mono text-outline whitespace-nowrap ml-2">${log.timestamp}</span>
      </div>
    `).join('');
  },

  updateKPIBadges() {
    const pendingFaculty = this.data.users.filter(u => u.status === 'PENDING_HOD_APPROVAL').length;
    const pendingReports = this.data.eventReports.filter(r => r.status === 'PENDING_HOD_APPROVAL').length;
    const approvedReports = this.data.eventReports.filter(r => r.status === 'APPROVED').length;
    const rejectedReports = this.data.eventReports.filter(r => r.status === 'REJECTED').length;
    const totalFaculty = this.data.users.filter(u => u.role === 'FACULTY').length;
    const totalEvents = this.data.eventReports.length;
    const totalMeetings = this.data.meetings.length;
    const remindersCount = this.data.historicalReminders.length;

    document.querySelectorAll('.count-pending-faculty').forEach(el => el.textContent = pendingFaculty);
    document.querySelectorAll('.count-pending-approvals').forEach(el => el.textContent = pendingReports);
    document.querySelectorAll('.count-approved-reports').forEach(el => el.textContent = approvedReports);
    document.querySelectorAll('.count-rejected-reports').forEach(el => el.textContent = rejectedReports);
    document.querySelectorAll('.count-total-faculty').forEach(el => el.textContent = totalFaculty);
    document.querySelectorAll('.count-total-events').forEach(el => el.textContent = totalEvents);
    document.querySelectorAll('.count-total-meetings').forEach(el => el.textContent = totalMeetings);
    document.querySelectorAll('.count-historical-reminders').forEach(el => el.textContent = remindersCount);
  },

  bindEvents() {
    // Navigation view buttons
    document.querySelectorAll('[data-nav-view], [data-sidebar-view], [data-action-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.dataset.navView || btn.dataset.sidebarView || btn.dataset.actionView;
        if (view) this.switchView(view);
      });
    });

    // Form inputs for live synchronizer
    document.querySelectorAll('#eventCreationForm input, #eventCreationForm select, #eventCreationForm textarea').forEach(input => {
      input.addEventListener('input', () => this.updateLiveDossierPreview());
      input.addEventListener('change', () => this.updateLiveDossierPreview());
    });

    document.querySelectorAll('#momCreationForm input, #momCreationForm select, #momCreationForm textarea').forEach(input => {
      input.addEventListener('input', () => this.updateLiveMoMPreview());
      input.addEventListener('change', () => this.updateLiveMoMPreview());
    });

    // Submit forms
    document.getElementById('eventCreationForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitEventForApproval();
    });

    document.getElementById('momCreationForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitMoM();
    });

    document.getElementById('facultyRegistrationForm')?.addEventListener('submit', (e) => {
      this.handleFacultyRegistration(e);
    });

    document.getElementById('userLoginForm')?.addEventListener('submit', (e) => {
      this.handleLogin(e);
    });

    // Forgot password form
    document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email')?.value?.trim();
      if (email && typeof Auth !== 'undefined') {
        Auth.forgotPassword(email);
      }
    });

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
        Auth.logout();
      } else {
        // Standalone/offline: reset to public view
        this.currentUser = null;
        this.currentRole = null;
        this.switchView('public');
        this.showToast('Logged out.', 'info');
      }
    });
  },

  showToast(message, type = "info") {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = "info";
    if (type === "success") icon = "check_circle";
    if (type === "warning") icon = "warning";
    if (type === "danger") icon = "error";

    toast.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-[20px] text-${type === 'success' ? 'emerald-600' : type === 'warning' ? 'amber-600' : 'indigo-600'}">${icon}</span>
        <span class="text-xs font-semibold text-on-surface">${message}</span>
      </div>
      <button onclick="this.parentElement.remove()" class="text-outline hover:text-on-surface ml-3 text-[14px]">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
