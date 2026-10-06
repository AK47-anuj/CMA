/**
 * Auth Routes
 * Public routes for authentication (no auth middleware required).
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateBody, registerSchema, loginSchema, googleAuthSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require('../utils/validate');

// Public routes (rate limited)
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/google', authLimiter, validateBody(googleAuthSchema), authController.google);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

// Public config
router.get('/config', authController.config);

// Demo login (rate limited, only works in DEMO_MODE)
router.post('/demo-login', authLimiter, authController.demoLogin);

// Protected routes
router.get('/me', requireAuth, authController.me);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), authController.changePassword);

module.exports = router;
