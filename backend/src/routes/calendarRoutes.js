const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

router.get('/', calendarController.getAllCalendarEvents);
router.post('/', calendarController.addCalendarEvent);

module.exports = router;
