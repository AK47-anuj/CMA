/**
 * Meeting Routes
 * Protected routes for meeting management and MoM.
 */

const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All meeting routes require authentication
router.use(requireAuth);

router.get('/', meetingController.getAllMeetings);
router.get('/:id', meetingController.getMeetingById);
router.post('/', meetingController.createMeeting);

// Meeting status — HOD only
router.patch('/:id/status', requireRole('HOD'), meetingController.updateMeetingStatus);

module.exports = router;
