// MET SCMS - Frontend API Client
// Handles communication with Express Backend with automatic offline fallback to SCMS_DATA

const ApiClient = {
  // Determine backend base URL: if served from same host (e.g., port 5000), use relative /api
  baseUrl: (window.location.port === '5000' || window.location.protocol === 'file:')
    ? 'http://localhost:5000/api'
    : (window.location.origin + '/api'),

  isOnline: false,
  checkAttempted: false,

  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        this.isOnline = true;
        this.updateConnectionStatusBadge(true);
        return true;
      }
    } catch (e) {
      // Backend not running or unreachable
      this.isOnline = false;
    }
    this.checkAttempted = true;
    this.updateConnectionStatusBadge(false);
    return false;
  },

  updateConnectionStatusBadge(isOnline) {
    let badge = document.getElementById('scms-api-status-badge');
    if (!badge) {
      // Create subtle floating/header status indicator
      badge = document.createElement('div');
      badge.id = 'scms-api-status-badge';
      badge.className = 'fixed bottom-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono shadow-md border transition-all duration-300 pointer-events-auto cursor-pointer select-none';
      badge.title = 'Click to test/refresh backend API connection';
      badge.onclick = () => {
        ApiClient.checkHealth().then(online => {
          if (online && window.App) window.App.syncWithBackend();
        });
      };
      document.body.appendChild(badge);
    }

    if (isOnline) {
      badge.className = 'fixed bottom-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono shadow-md border bg-emerald-50 text-emerald-800 border-emerald-300 transition-all duration-300';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-bold">Backend: Online (Port 5000)</span>
      `;
    } else {
      badge.className = 'fixed bottom-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono shadow-md border bg-amber-50 text-amber-800 border-amber-300 transition-all duration-300';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
        <span class="font-bold">Backend: Standalone (Seed Mode)</span>
      `;
    }
  },

  async request(endpoint, options = {}) {
    if (!this.checkAttempted) {
      await this.checkHealth();
    }

    if (!this.isOnline) {
      return { offline: true };
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      };

      const res = await fetch(url, config);
      const data = await res.json();
      return { success: res.ok, data, offline: false };
    } catch (err) {
      console.warn(`[SCMS API] Fetch to ${endpoint} failed, falling back to local dataset:`, err.message);
      this.isOnline = false;
      this.updateConnectionStatusBadge(false);
      return { offline: true, error: err.message };
    }
  },

  // Sync entire dataset on startup
  async getSyncData() {
    const res = await this.request('/system/data');
    if (!res.offline && res.success && res.data && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  // Auth & Users
  async login(email, id) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, id })
    });
  },

  async registerFaculty(userData) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateFacultyStatus(facultyId, status, actorName) {
    return this.request(`/users/${facultyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actorName })
    });
  },

  // Reports
  async submitReport(reportData) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  async updateReport(reportId, reportData, resubmit = false) {
    return this.request(`/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...reportData, resubmit })
    });
  },

  async updateReportStatus(reportId, status, rejectionReason = '', approvedBy = '') {
    return this.request(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason, approvedBy })
    });
  },

  // Meetings
  async submitMeeting(meetingData) {
    return this.request('/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData)
    });
  },

  async updateMeetingStatus(meetingId, status, approvedBy = '') {
    return this.request(`/meetings/${meetingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approvedBy })
    });
  },

  // Calendar
  async addCalendarEvent(eventData) {
    return this.request('/calendar', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  // Audit Logs
  async recordAuditLog(actor, action, details) {
    return this.request('/audit-logs', {
      method: 'POST',
      body: JSON.stringify({ actor, action, details })
    });
  },

  // Reset Store
  async resetStore() {
    return this.request('/system/reset', { method: 'POST' });
  }
};
