/**
 * MET SCMS - Frontend Authentication Module
 * 
 * Handles:
 * - Login with email + password (JWT in httpOnly cookie)
 * - Demo login (one-click, DEMO_MODE only)
 * - Google Sign-In integration
 * - Session management (auto-redirect on 401)
 * - Registration with password
 * - Forgot/reset password flow
 */

const Auth = {
  currentUser: null,
  config: null,
  isAuthenticated: false,

  /**
   * Initialize auth — check if user has a valid session.
   */
  async init() {
    try {
      // Load auth config (Google client ID, demo mode, etc.)
      await this.loadConfig();

      // Check existing session
      const me = await this.fetchMe();
      if (me) {
        this.currentUser = me;
        this.isAuthenticated = true;
        this.onLoginSuccess(me, false);
        return true;
      }
    } catch (e) {
      console.log('[Auth] No existing session');
    }

    // No session — show appropriate UI
    this.showLoginUI();
    return false;
  },

  /**
   * Load auth configuration from the server.
   */
  async loadConfig() {
    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const data = await res.json();
        this.config = data.data;
        
        // Set up Google Sign-In if configured
        if (this.config.googleClientId) {
          this.setupGoogleSignIn(this.config.googleClientId);
        }
        
        // Show/hide demo panel
        if (this.config.demoMode) {
          this.showDemoPanel();
        }
      }
    } catch (e) {
      console.warn('[Auth] Could not load config:', e.message);
    }
  },

  /**
   * Fetch current user from /api/auth/me.
   */
  async fetchMe() {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
    return null;
  },

  /**
   * Login with email + password.
   */
  async login(email, password, remember = false) {
    const statusEl = document.getElementById('login-status');
    const submitBtn = document.getElementById('login-submit-btn');

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        this.currentUser = data.data;
        this.isAuthenticated = true;
        this.onLoginSuccess(data.data, true);
        return true;
      } else {
        this.showLoginError(data.message || 'Login failed', statusEl);
        return false;
      }
    } catch (err) {
      this.showLoginError('Network error. Is the server running?', statusEl);
      return false;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Secure Login';
      }
    }
  },

  /**
   * Demo login — one-click login by user ID (DEMO_MODE only).
   */
  async demoLogin(userId) {
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        this.currentUser = data.data;
        this.isAuthenticated = true;
        this.onLoginSuccess(data.data, true);
        return true;
      } else {
        alert(data.message || 'Demo login failed');
        return false;
      }
    } catch (err) {
      alert('Network error during demo login.');
      return false;
    }
  },

  /**
   * Register a new faculty account.
   */
  async register(name, email, password, designation) {
    const statusEl = document.getElementById('register-status');
    const submitBtn = document.getElementById('register-submit-btn');

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, designation })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        this.showRegisterSuccess(statusEl);
        return true;
      } else {
        this.showRegisterError(data.message || 'Registration failed', data.details, statusEl);
        return false;
      }
    } catch (err) {
      this.showRegisterError('Network error. Is the server running?', null, statusEl);
      return false;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration to HOD';
      }
    }
  },

  /**
   * Google Sign-In callback.
   */
  async handleGoogleCredential(response) {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        this.currentUser = data.data;
        this.isAuthenticated = true;
        this.onLoginSuccess(data.data, true);
      } else {
        alert(data.message || 'Google Sign-In failed');
      }
    } catch (err) {
      alert('Network error during Google Sign-In.');
    }
  },

  /**
   * Logout — clear session.
   */
  async logout() {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
    } catch (_) {}

    this.currentUser = null;
    this.isAuthenticated = false;
    
    // Reload the page to reset app state
    window.location.href = '/';
  },

  /**
   * Forgot password — request reset token.
   */
  async forgotPassword(email) {
    const statusEl = document.getElementById('forgot-password-status');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (statusEl) {
        if (data.devToken) {
          statusEl.innerHTML = `
            <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px]">
              <strong>✓ Reset link sent!</strong> (Demo mode — token shown below)<br>
              <code class="text-xs bg-white px-1 py-0.5 rounded border mt-1 inline-block select-all">${data.devToken}</code>
            </div>`;
        } else {
          statusEl.innerHTML = `
            <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px]">
              <strong>✓</strong> ${data.message}
            </div>`;
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = `<div class="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[11px]">Network error.</div>`;
      }
    }
  },

  /**
   * Change password (authenticated).
   */
  async changePassword(oldPassword, newPassword) {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ oldPassword, newPassword })
    });

    const data = await res.json();
    return data;
  },

  // ---- UI Helpers ----

  /**
   * Called after successful login.
   */
  onLoginSuccess(user, showToast) {
    // Close auth modal
    App.closeAuthModal();

    // Update App with authenticated user
    if (typeof App !== 'undefined') {
      App.currentUser = user;
      App.currentRole = user.role;
      App.syncWithBackend().then(() => {
        // Navigate to appropriate dashboard
        if (user.role === 'HOD') {
          App.switchView('hod-dashboard');
        } else {
          App.switchView('faculty-dashboard');
        }
        if (showToast) {
          App.showToast(`Welcome back, ${user.name}! (${user.role})`, 'success');
        }
      });
    }
  },

  showLoginUI() {
    // On page load, if not authenticated, keep the public view
    // The login modal can be opened via header buttons
  },

  showLoginError(message, statusEl) {
    if (statusEl) {
      statusEl.innerHTML = `<div class="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[11px] font-medium">${message}</div>`;
    }
  },

  showRegisterSuccess(statusEl) {
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px]">
          <strong>✓ Registration submitted!</strong> Your account is pending HOD approval. You'll be able to log in once approved.
        </div>`;
    }
    // Reset form
    const form = document.getElementById('facultyRegistrationForm');
    if (form) form.reset();
  },

  showRegisterError(message, details, statusEl) {
    if (statusEl) {
      let html = `<div class="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[11px]"><strong>Error:</strong> ${message}`;
      if (details && details.length) {
        html += '<ul class="mt-1 ml-3 list-disc">';
        details.forEach(d => { html += `<li>${d.field}: ${d.message}</li>`; });
        html += '</ul>';
      }
      html += '</div>';
      statusEl.innerHTML = html;
    }
  },

  /**
   * Show the demo login panel (when DEMO_MODE=true).
   */
  showDemoPanel() {
    const panel = document.getElementById('demo-login-panel');
    if (panel) panel.classList.remove('hidden');
  },

  /**
   * Toggle password visibility for a given input.
   */
  togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = btnEl?.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = isPassword ? 'visibility_off' : 'visibility';
    }
  },

  /**
   * Set up Google Sign-In button.
   */
  setupGoogleSignIn(clientId) {
    // Load the Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => Auth.handleGoogleCredential(response)
        });
        
        // Render Google button in the login form
        const googleBtnContainer = document.getElementById('google-signin-btn');
        if (googleBtnContainer) {
          google.accounts.id.renderButton(googleBtnContainer, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with'
          });
          googleBtnContainer.classList.remove('hidden');
        }
      }
    };
    document.head.appendChild(script);
  }
};
