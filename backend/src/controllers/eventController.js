/**
 * Event Controller
 * CRUD operations for events (the source-of-truth event records).
 */

const store = require('../data/store');
const clock = require('../utils/clock');
const crypto = require('crypto');

/**
 * GET /api/events
 * List events with optional filters.
 */
exports.getAllEvents = (req, res) => {
  const { type, status, createdBy } = req.query;
  let events = store.get().events || [];

  if (type) events = events.filter(e => e.type === type);
  if (status) events = events.filter(e => e.status === status);
  if (createdBy) events = events.filter(e => e.createdBy === createdBy);

  // Faculty can only see their own events + approved events
  if (req.user.role === 'FACULTY') {
    events = events.filter(e => 
      e.createdBy === req.user.id || e.status === 'APPROVED'
    );
  }

  res.json({ success: true, count: events.length, data: events });
};

/**
 * GET /api/events/:id
 * Get event by ID.
 */
exports.getEventById = (req, res) => {
  const event = (store.get().events || []).find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  res.json({ success: true, data: event });
};

/**
 * POST /api/events
 * Create a new event.
 */
exports.createEvent = async (req, res, next) => {
  try {
    const data = store.get();
    if (!data.events) data.events = [];

    const {
      title, type, date, time, venue, guest, guestDesignation,
      guestOrganisation, attendees, facultyInvolved, objectives,
      activities, outcomes
    } = req.body;

    const newEvent = {
      id: store.generateId('evt'),
      title,
      type,
      date,
      time: time || '',
      venue: venue || '',
      guest: guest || '',
      guestDesignation: guestDesignation || '',
      guestOrganisation: guestOrganisation || '',
      attendees: attendees || 0,
      facultyInvolved: facultyInvolved || req.user.name,
      objectives: objectives || '',
      activities: activities || '',
      outcomes: outcomes || '',
      status: 'DRAFT',
      createdBy: req.user.id,
      createdByName: req.user.name,
      createdAt: clock.now().toISOString(),
      feedbackSummary: null,
      attachments: []
    };

    data.events.push(newEvent);

    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: clock.now().toISOString(),
      actor: req.user.name,
      actorId: req.user.id,
      action: 'EVENT_CREATED',
      details: `Created event "${title}" (${newEvent.id})`
    });

    await store.save();
    res.status(201).json({ success: true, message: 'Event created', data: newEvent });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/events/:id
 * Update an event.
 */
exports.updateEvent = async (req, res, next) => {
  try {
    const data = store.get();
    const event = (data.events || []).find(e => e.id === req.params.id);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only creator or HOD can edit
    if (req.user.role !== 'HOD' && event.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own events.' });
    }

    // Cannot edit approved events
    if (event.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot edit an approved event.' });
    }

    const allowedFields = [
      'title', 'type', 'date', 'time', 'venue', 'guest', 'guestDesignation',
      'guestOrganisation', 'attendees', 'facultyInvolved', 'objectives',
      'activities', 'outcomes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    event.updatedAt = clock.now().toISOString();

    await store.save();
    res.json({ success: true, message: 'Event updated', data: event });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/events/:id
 * Delete an event (only DRAFT, by creator or HOD).
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const data = store.get();
    const idx = (data.events || []).findIndex(e => e.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = data.events[idx];

    if (event.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot delete an approved event.' });
    }

    if (req.user.role !== 'HOD' && event.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own events.' });
    }

    data.events.splice(idx, 1);

    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: clock.now().toISOString(),
      actor: req.user.name,
      actorId: req.user.id,
      action: 'EVENT_DELETED',
      details: `Deleted event "${event.title}" (${event.id})`
    });

    await store.save();
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};
