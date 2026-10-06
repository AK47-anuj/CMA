// MET SCMS - Frontend API Client
// Handles communication with Backend REST API.
// All requests include credentials (httpOnly JWT cookie).
// On 401, redirects to login.

const ApiClient = {
  // Production-safe API base URL resolution
  baseUrl: (() => {
    if (window.SCMS_API_BASE_URL) return window.SCMS_API_BASE_URL;
    if (window.location.protocol === 'file:') return null;
    return window.location.origin + '/api';
  })(),

  isOnline: false,
  checkAttempted: false,

  async checkHealth() {
    if (!this.baseUrl) {
      this.checkAttempted = true;
      this.isOnline = false;
      this.updateConnectionStatusBadge(false);
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
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
      this.isOnline = false;
    }
    this.checkAttempted = true;
    this.updateConnectionStatusBadge(false);
    return false;
  },

  updateConnectionStatusBadge(isOnline) {
    let badge = document.getElementById('scms-api-status-badge');
    if (!badge) {
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
        <span class="font-bold">Backend: Online</span>
      `;
    } else {
      badge.className = 'fixed bottom-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono shadow-md border bg-amber-50 text-amber-800 border-amber-300 transition-all duration-300';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
        <span class="font-bold">Backend: Standalone (Seed Mode)</span>
      `;
    }
  },

  /**
   * Core request method. Includes credentials for JWT cookie.
   * On 401, triggers re-login flow.
   */
  async request(endpoint, options = {}) {
    if (!this.checkAttempted) {
      await this.checkHealth();
    }

    if (!this.isOnline || !this.baseUrl) {
      return { offline: true };
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        credentials: 'include', // Send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      };

      const res = await fetch(url, config);

      // Handle 401 — session expired or not authenticated
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        console.warn('[SCMS API] 401 Unauthorized:', data.message);
        
        // Notify the auth module
        if (typeof Auth !== 'undefined') {
          Auth.isAuthenticated = false;
          Auth.currentUser = null;
        }
        
        // Show toast and open login
        if (typeof App !== 'undefined') {
          App.showToast('Session expired. Please log in again.', 'warning');
          App.openAuthModal('login');
        }
        
        return { success: false, data, offline: false, unauthorized: true };
      }

      // Handle 403
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (typeof App !== 'undefined') {
          App.showToast(data.message || 'Access denied.', 'danger');
        }
        return { success: false, data, offline: false, forbidden: true };
      }

      const data = await res.json();
      return { success: res.ok, data, offline: false };
    } catch (err) {
      console.warn(`[SCMS API] Fetch to ${endpoint} failed:`, err.message);
      this.isOnline = false;
      this.updateConnectionStatusBadge(false);
      return { offline: true, error: err.message };
    }
  },

  // ---- Sync ----
  async getSyncData() {
    const res = await this.request('/system/data');
    if (!res.offline && res.success && res.data && res.data.data) {
      return res.data.data;
    }
    return null;
  },

  // ---- Users ----
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/users${params ? '?' + params : ''}`);
  },

  async updateFacultyStatus(facultyId, status) {
    return this.request(`/users/${facultyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // ---- Events ----
  async getEvents(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/events${params ? '?' + params : ''}`);
  },

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  async updateEvent(eventId, eventData) {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
  },

  // ---- Reports ----
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

  async updateReportStatus(reportId, status, rejectionReason = '') {
    return this.request(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason })
    });
  },

  // ---- Meetings ----
  async submitMeeting(meetingData) {
    return this.request('/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData)
    });
  },

  async updateMeetingStatus(meetingId, status, rejectionReason = '') {
    return this.request(`/meetings/${meetingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason })
    });
  },

  // ---- Calendar ----
  async addCalendarEvent(eventData) {
    return this.request('/calendar', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  // ---- Reminders ----
  async getReminders() {
    return this.request('/reminders');
  },

  async markReminderRead(reminderId) {
    return this.request(`/reminders/${reminderId}/read`, { method: 'PATCH' });
  },

  async dismissReminder(reminderId) {
    return this.request(`/reminders/${reminderId}/dismiss`, { method: 'PATCH' });
  },

  // ---- Notifications ----
  async getNotifications() {
    return this.request('/notifications');
  },

  async markNotificationRead(notifId) {
    return this.request(`/notifications/${notifId}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'POST' });
  },

  // ---- Audit Logs ----
  async recordAuditLog(actor, action, details) {
    return this.request('/audit-logs', {
      method: 'POST',
      body: JSON.stringify({ actor, action, details })
    });
  },

  // ---- Demo ----
  async getDemoInfo() {
    return this.request('/demo/info');
  },

  async setDemoClock(date) {
    return this.request('/demo/clock', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  },

  async resetDemo() {
    return this.request('/demo/reset', { method: 'POST' });
  },

  // ---- System ----
  async resetStore() {
    return this.request('/system/reset', { method: 'POST' });
  }
};
