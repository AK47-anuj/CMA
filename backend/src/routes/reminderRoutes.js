/**
 * Reminder Routes
 * Protected routes for reminder management.
 */

const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All reminder routes require authentication
router.use(requireAuth);

router.get('/', reminderController.getAllReminders);
router.get('/:id', reminderController.getReminderById);
router.patch('/:id/read', reminderController.markRead);
router.patch('/:id/dismiss', reminderController.dismiss);
router.post('/run', requireRole('HOD'), reminderController.runManual);

module.exports = router;
