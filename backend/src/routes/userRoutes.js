/**
 * User Routes
 * Protected routes for user management.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All user routes require authentication
router.use(requireAuth);

// List users — HOD can see all, Faculty can see active only
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

// Faculty status management — HOD only
router.patch('/:id/status', requireRole('HOD'), userController.updateUserStatus);

module.exports = router;
