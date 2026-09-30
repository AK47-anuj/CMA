const store = require('../data/store');

exports.getAllCalendarEvents = (req, res) => {
  const events = store.get().calendarEvents;
  res.json({ success: true, count: events.length, data: events });
};

exports.addCalendarEvent = (req, res) => {
  const { date, time, title, type, venue, tag } = req.body;
  if (!date || !title) {
    return res.status(400).json({ success: false, message: 'Date and Title are required' });
  }

  const data = store.get();
  const newEvent = {
    id: `cal-${Date.now().toString().slice(-4)}`,
    date,
    time: time || '10:00 AM',
    title,
    type: type || 'Academic',
    venue: venue || 'Campus',
    tag: tag || 'Department Schedule'
  };

  data.calendarEvents.push(newEvent);
  store.save();
  res.status(201).json({ success: true, message: 'Calendar event added', data: newEvent });
};
