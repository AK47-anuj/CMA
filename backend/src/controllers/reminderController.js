/**
 * Reminder Controller
 * Manages anniversary reminders with read/dismiss tracking per user.
 */

const store = require('../data/store');
const { computeReminders } = require('../services/reminderService');

/**
 * GET /api/reminders
 * Get all reminders (with user-specific read/dismissed status).
 */
exports.getAllReminders = (req, res) => {
  const data = store.get();
  const reminders = (data.reminders || []).map(r => ({
    ...r,
    isRead: (r.readBy || []).includes(req.user.id),
    isDismissed: (r.dismissedBy || []).includes(req.user.id)
  }));

  res.json({ success: true, count: reminders.length, data: reminders });
};

/**
 * GET /api/reminders/:id
 * Get a single reminder by ID.
 */
exports.getReminderById = (req, res) => {
  const data = store.get();
  const reminder = (data.reminders || []).find(r => r.id === req.params.id);

  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Reminder not found' });
  }

  res.json({
    success: true,
    data: {
      ...reminder,
      isRead: (reminder.readBy || []).includes(req.user.id),
      isDismissed: (reminder.dismissedBy || []).includes(req.user.id)
    }
  });
};

/**
 * PATCH /api/reminders/:id/read
 * Mark a reminder as read by the current user.
 */
exports.markRead = async (req, res, next) => {
  try {
    const data = store.get();
    const reminder = (data.reminders || []).find(r => r.id === req.params.id);

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    if (!reminder.readBy) reminder.readBy = [];
    if (!reminder.readBy.includes(req.user.id)) {
      reminder.readBy.push(req.user.id);
    }

    await store.save();
    res.json({ success: true, message: 'Reminder marked as read' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/reminders/:id/dismiss
 * Dismiss a reminder for the current user.
 */
exports.dismiss = async (req, res, next) => {
  try {
    const data = store.get();
    const reminder = (data.reminders || []).find(r => r.id === req.params.id);

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    if (!reminder.dismissedBy) reminder.dismissedBy = [];
    if (!reminder.dismissedBy.includes(req.user.id)) {
      reminder.dismissedBy.push(req.user.id);
    }

    await store.save();
    res.json({ success: true, message: 'Reminder dismissed' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reminders/run
 * Manually trigger reminder computation (HOD only).
 */
exports.runManual = async (req, res, next) => {
  try {
    computeReminders(store);
    const data = store.get();
    res.json({
      success: true,
      message: 'Reminder computation completed',
      count: (data.reminders || []).length
    });
  } catch (err) {
    next(err);
  }
};
