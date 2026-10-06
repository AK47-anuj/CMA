/**
 * Auth Controller
 * 
 * Handles: register, login (email+password), Google Sign-In, 
 * logout, me (current user), config (client-side auth config),
 * forgot-password, reset-password, change-password, demo-login
 */

const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const store = require('../data/store');
const clock = require('../utils/clock');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * POST /api/auth/register
 * Register a new faculty account (pending HOD approval).
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, designation } = req.body;
    const data = store.get();

    // Check for existing user
    const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email already exists.' 
      });
    }

    // Check allowed email domain
    if (process.env.ALLOWED_EMAIL_DOMAIN) {
      const domain = email.split('@')[1];
      if (domain !== process.env.ALLOWED_EMAIL_DOMAIN) {
        return res.status(400).json({
          success: false,
          message: `Only @${process.env.ALLOWED_EMAIL_DOMAIN} email addresses are allowed.`
        });
      }
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const now = clock.now().toISOString();

    const newUser = {
      id: store.generateId('usr'),
      name,
      role: 'FACULTY',
      email: email.toLowerCase(),
      passwordHash,
      authProvider: 'local',
      designation: designation || 'Assistant Professor',
      department: 'Management Studies',
      status: 'PENDING_HOD_APPROVAL',
      registeredAt: now,
      avatar: initials,
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: null
    };

    data.users.push(newUser);

    // Create notification for HOD
    const hod = data.users.find(u => u.role === 'HOD');
    if (hod) {
      data.notifications.push({
        id: store.generateId('notif'),
        userId: hod.id,
        type: 'FACULTY_REGISTRATION',
        title: 'New Faculty Registration',
        body: `${name} has requested faculty account approval.`,
        link: '/faculty/pending',
        read: false,
        createdAt: now
      });
    }

    // Audit log
    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: now,
      actor: 'System',
      actorId: null,
      action: 'FACULTY_REGISTRATION',
      details: `${name} (${email}) submitted onboarding registration (Status: PENDING_HOD_APPROVAL)`
    });

    await store.save();

    // Return user without sensitive fields
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Pending HOD approval.',
      data: safeUser
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Login with email + password.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;
    const data = store.get();

    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > clock.now()) {
      const remainingMs = new Date(user.lockedUntil) - clock.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(403).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`,
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Verify password
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please use the Google button to log in.'
      });
    }

    const isValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isValid) {
      // Increment failed login counter
      user.failedLogins = (user.failedLogins || 0) + 1;
      
      if (user.failedLogins >= LOCKOUT_THRESHOLD) {
        user.lockedUntil = new Date(clock.now().getTime() + LOCKOUT_DURATION_MINUTES * 60000).toISOString();
        user.failedLogins = 0;

        data.auditLog.unshift({
          id: store.generateId('aud'),
          timestamp: clock.now().toISOString(),
          actor: 'System',
          actorId: null,
          action: 'ACCOUNT_LOCKED',
          details: `Account locked for ${user.email} after ${LOCKOUT_THRESHOLD} failed login attempts`
        });

        await store.save();
        return res.status(403).json({
          success: false,
          message: `Account locked for ${LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts.`,
          code: 'ACCOUNT_LOCKED'
        });
      }

      await store.save();
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.',
        attemptsRemaining: LOCKOUT_THRESHOLD - user.failedLogins
      });
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Contact your HOD.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Successful login — reset counters
    user.failedLogins = 0;
    user.lockedUntil = null;
    user.lastLoginAt = clock.now().toISOString();

    // Audit log
    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: clock.now().toISOString(),
      actor: user.name,
      actorId: user.id,
      action: 'USER_LOGIN',
      details: `${user.name} logged in via email/password`
    });

    await store.save();

    // Generate JWT and set cookie
    const token = generateToken(user.id, remember);
    setTokenCookie(res, token, remember);

    // Return user without sensitive fields
    const { passwordHash: _, resetToken: _2, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Login successful',
      data: safeUser,
      token // Also return token for clients that use Authorization header
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/google
 * Login/register via Google Sign-In credential token.
 */
exports.google = async (req, res, next) => {
  try {
    const { credential } = req.body;
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message: 'Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in .env. See README for setup instructions.',
        code: 'GOOGLE_NOT_CONFIGURED'
      });
    }

    // Verify the Google ID token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credential token.'
      });
    }

    const { email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Google email is not verified.'
      });
    }

    // Check domain restriction
    if (process.env.ALLOWED_EMAIL_DOMAIN) {
      const domain = email.split('@')[1];
      if (domain !== process.env.ALLOWED_EMAIL_DOMAIN) {
        return res.status(403).json({
          success: false,
          message: `Only @${process.env.ALLOWED_EMAIL_DOMAIN} accounts are allowed.`
        });
      }
    }

    const data = store.get();
    let user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Auto-register via Google
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      user = {
        id: store.generateId('usr'),
        name,
        role: 'FACULTY',
        email: email.toLowerCase(),
        passwordHash: null,
        authProvider: 'google',
        designation: 'Assistant Professor',
        department: 'Management Studies',
        status: 'PENDING_HOD_APPROVAL',
        registeredAt: clock.now().toISOString(),
        avatar: initials,
        googlePicture: picture,
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: clock.now().toISOString()
      };
      data.users.push(user);

      // Notify HOD
      const hod = data.users.find(u => u.role === 'HOD');
      if (hod) {
        data.notifications.push({
          id: store.generateId('notif'),
          userId: hod.id,
          type: 'FACULTY_REGISTRATION',
          title: 'New Faculty Registration (Google)',
          body: `${name} registered via Google Sign-In and needs account approval.`,
          link: '/faculty/pending',
          read: false,
          createdAt: clock.now().toISOString()
        });
      }

      data.auditLog.unshift({
        id: store.generateId('aud'),
        timestamp: clock.now().toISOString(),
        actor: 'System',
        actorId: null,
        action: 'FACULTY_REGISTRATION',
        details: `${name} (${email}) registered via Google Sign-In (Status: PENDING_HOD_APPROVAL)`
      });
    } else {
      // Existing user — update auth provider if needed
      if (user.authProvider === 'local') {
        user.authProvider = 'both';
      }
      user.lastLoginAt = clock.now().toISOString();
      user.failedLogins = 0;
      user.lockedUntil = null;
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      await store.save();
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Contact your HOD.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Audit
    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: clock.now().toISOString(),
      actor: user.name,
      actorId: user.id,
      action: 'USER_LOGIN',
      details: `${user.name} logged in via Google Sign-In`
    });

    await store.save();

    const token = generateToken(user.id, false);
    setTokenCookie(res, token, false);

    const { passwordHash: _, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Google login successful',
      data: safeUser,
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clear auth cookie.
 */
exports.logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
};

/**
 * GET /api/auth/me
 * Return current authenticated user.
 */
exports.me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({ success: true, data: req.user });
};

/**
 * GET /api/auth/config
 * Return client-side auth configuration (Google client ID, demo mode, etc.)
 */
exports.config = (req, res) => {
  res.json({
    success: true,
    data: {
      googleClientId: process.env.GOOGLE_CLIENT_ID || null,
      demoMode: process.env.DEMO_MODE === 'true',
      allowedDomain: process.env.ALLOWED_EMAIL_DOMAIN || null
    }
  });
};

/**
 * POST /api/auth/forgot-password
 * Send password reset token (in dev: returns token in response).
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = store.get();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    };

    if (!user) {
      return res.json(successResponse);
    }

    if (user.authProvider === 'google') {
      return res.json(successResponse);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(clock.now().getTime() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token
    if (!data.resetTokens) data.resetTokens = [];
    // Remove any existing tokens for this user
    data.resetTokens = data.resetTokens.filter(t => t.userId !== user.id);
    data.resetTokens.push({
      userId: user.id,
      tokenHash: resetTokenHash,
      expiresAt,
      createdAt: clock.now().toISOString()
    });

    await store.save();

    // In development/demo mode: include token in response for testing
    const response = { ...successResponse };
    if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
      response.devToken = resetToken;
      response.devNote = 'This token is only shown in development/demo mode. In production, it would be sent via email.';
    }

    // TODO: Send actual email with SMTP when configured
    // if (process.env.SMTP_HOST) { ... }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password using a token.
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const data = store.get();

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetEntry = data.resetTokens?.find(t => t.tokenHash === tokenHash);

    if (!resetEntry) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    if (new Date(resetEntry.expiresAt) < clock.now()) {
      // Remove expired token
      data.resetTokens = data.resetTokens.filter(t => t.tokenHash !== tokenHash);
      await store.save();
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new one.'
      });
    }

    const user = data.users.find(u => u.id === resetEntry.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Update password
    user.passwordHash = await bcryptjs.hash(newPassword, 10);
    user.failedLogins = 0;
    user.lockedUntil = null;

    // Remove used token
    data.resetTokens = data.resetTokens.filter(t => t.tokenHash !== tokenHash);

    // Audit
    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: clock.now().toISOString(),
      actor: user.name,
      actorId: user.id,
      action: 'PASSWORD_RESET',
      details: `Password reset completed for ${user.email}`
    });

    await store.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/change-password
 * Change password for authenticated user.
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const data = store.get();
    const user = data.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In and has no password to change.'
      });
    }

    const isValid = await bcryptjs.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    user.passwordHash = await bcryptjs.hash(newPassword, 10);

    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: clock.now().toISOString(),
      actor: user.name,
      actorId: user.id,
      action: 'PASSWORD_CHANGED',
      details: `${user.name} changed their password`
    });

    await store.save();

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/demo-login
 * Quick login for demo mode — login by user ID without password.
 */
exports.demoLogin = async (req, res, next) => {
  try {
    if (process.env.DEMO_MODE !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Demo login is only available in DEMO_MODE.'
      });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required for demo login.'
      });
    }

    const data = store.get();
    const user = data.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Demo user not found.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'This demo user account is not active.'
      });
    }

    user.lastLoginAt = clock.now().toISOString();

    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: clock.now().toISOString(),
      actor: user.name,
      actorId: user.id,
      action: 'DEMO_LOGIN',
      details: `${user.name} logged in via demo mode`
    });

    await store.save();

    const token = generateToken(user.id, false);
    setTokenCookie(res, token, false);

    const { passwordHash: _, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Demo login successful',
      data: safeUser,
      token
    });
  } catch (err) {
    next(err);
  }
};
