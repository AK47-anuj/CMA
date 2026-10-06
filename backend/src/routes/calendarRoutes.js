/**
 * Calendar Routes
 * Protected routes for calendar management.
 */

const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All calendar routes require authentication
router.use(requireAuth);

router.get('/', calendarController.getAllCalendarEvents);
router.post('/', requireRole('HOD'), calendarController.addCalendarEvent);

module.exports = router;
