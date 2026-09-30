const store = require('../data/store');

exports.getAllReminders = (req, res) => {
  const reminders = store.get().historicalReminders;
  res.json({ success: true, count: reminders.length, data: reminders });
};

exports.getReminderById = (req, res) => {
  const reminder = store.get().historicalReminders.find(r => r.id === req.params.id);
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Reminder not found' });
  }
  res.json({ success: true, data: reminder });
};
