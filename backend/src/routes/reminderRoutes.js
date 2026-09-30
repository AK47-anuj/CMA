const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.get('/', reminderController.getAllReminders);
router.get('/:id', reminderController.getReminderById);

module.exports = router;
