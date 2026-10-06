/**
 * Authentication & Authorization Middleware
 * 
 * - requireAuth: Validates JWT from httpOnly cookie, attaches req.user
 * - requireRole(...roles): Checks if authenticated user has one of the specified roles
 * - optionalAuth: Like requireAuth, but doesn't block if no token present
 */

const jwt = require('jsonwebtoken');
const store = require('../data/store');
const { AppError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-met-scms-2026';

/**
 * Extract and verify JWT from cookie or Authorization header.
 * Attaches the full user object to req.user.
 */
function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please log in.',
        code: 'AUTH_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.get().users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User account not found. Please log in again.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is not active. Contact your HOD for approval.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is temporarily locked due to multiple failed login attempts.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Attach user to request (exclude sensitive fields)
    req.user = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      designation: user.designation,
      department: user.department,
      avatar: user.avatar,
      status: user.status
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authentication token.',
        code: 'INVALID_TOKEN'
      });
    }
    next(err);
  }
}

/**
 * Optional auth — sets req.user if valid token present, but doesn't block.
 */
function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.get().users.find(u => u.id === decoded.userId);

    if (user && user.status === 'ACTIVE') {
      req.user = {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        designation: user.designation,
        department: user.department,
        avatar: user.avatar,
        status: user.status
      };
    }
  } catch (_) {
    // Silently ignore invalid tokens for optional auth
  }
  next();
}

/**
 * Role-based access control.
 * Usage: requireRole('HOD') or requireRole('HOD', 'FACULTY')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. This action requires ${roles.join(' or ')} role.`,
        code: 'INSUFFICIENT_ROLE'
      });
    }
    next();
  };
}

/**
 * Extract JWT token from httpOnly cookie or Authorization header.
 */
function extractToken(req) {
  // Check httpOnly cookie first
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  // Fallback: Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Generate JWT token for a user.
 */
function generateToken(userId, remember = false) {
  const sessionHours = parseInt(process.env.SESSION_HOURS || '8', 10);
  const expiresIn = remember ? '7d' : `${sessionHours}h`;
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

/**
 * Set token as httpOnly cookie on response.
 */
function setTokenCookie(res, token, remember = false) {
  const sessionHours = parseInt(process.env.SESSION_HOURS || '8', 10);
  const maxAge = remember 
    ? 7 * 24 * 60 * 60 * 1000  // 7 days
    : sessionHours * 60 * 60 * 1000;

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/'
  });
}

/**
 * Clear the auth cookie.
 */
function clearTokenCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

module.exports = { 
  requireAuth, 
  optionalAuth, 
  requireRole, 
  generateToken, 
  setTokenCookie, 
  clearTokenCookie 
};
