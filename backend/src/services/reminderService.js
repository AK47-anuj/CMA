/**
 * Reminder Service
 * 
 * Computes event anniversaries, triggers reminders 7 days before anniversary,
 * handles leap year rule (29 Feb → 28 Feb in non-leap years),
 * and provides idempotent reminder creation.
 * 
 * Scheduler: runs daily at 00:05 and once on startup (catch-up).
 */

const clock = require('../utils/clock');

/**
 * Compute the next anniversary of an event date relative to today.
 * Leap year rule: if event was on Feb 29 and target year is not a leap year,
 * the anniversary moves to Feb 28.
 * 
 * @param {string} eventDateStr - Original event date (YYYY-MM-DD)
 * @param {Date} [refDate] - Reference date (defaults to clock.now())
 * @returns {{ date: Date, year: number }} - Next anniversary date and the anniversary year
 */
function computeNextAnniversary(eventDateStr, refDate) {
  const ref = refDate || clock.now();
  const eventDate = new Date(eventDateStr);
  const eventMonth = eventDate.getMonth();
  const eventDay = eventDate.getDate();
  const refYear = ref.getFullYear();

  // Try this year first
  let candidateYear = refYear;
  let candidate = makeAnniversaryDate(eventMonth, eventDay, candidateYear);

  // If the anniversary this year has already passed, go to next year
  if (candidate < ref) {
    candidateYear = refYear + 1;
    candidate = makeAnniversaryDate(eventMonth, eventDay, candidateYear);
  }

  return {
    date: candidate,
    year: candidateYear - eventDate.getFullYear() // How many years since the event
  };
}

/**
 * Create an anniversary date, handling the leap year rule.
 */
function makeAnniversaryDate(month, day, year) {
  // Check if Feb 29 in a non-leap year → use Feb 28
  if (month === 1 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28);
  }
  return new Date(year, month, day);
}

/**
 * Check if a year is a leap year.
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Check if a reminder should trigger for an event.
 * Triggers 7 days before the anniversary date.
 * 
 * @param {string} eventDateStr - Original event date
 * @param {Date} [refDate] - Reference "today"
 * @returns {{ shouldTrigger: boolean, daysUntil: number, anniversaryDate: Date, anniversaryYear: number }}
 */
function shouldTrigger(eventDateStr, refDate) {
  const ref = refDate || clock.now();
  const { date: anniversaryDate, year: anniversaryYear } = computeNextAnniversary(eventDateStr, ref);

  // Calculate days until anniversary
  const diffMs = anniversaryDate.getTime() - ref.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    shouldTrigger: daysUntil >= 0 && daysUntil <= 7,
    daysUntil,
    anniversaryDate,
    anniversaryYear
  };
}

/**
 * Generate unique reminder key for idempotency.
 */
function reminderKey(eventId, anniversaryYear) {
  return `${eventId}_anniv_${anniversaryYear}`;
}

/**
 * Run reminder computation for all events.
 * Creates new reminders for events whose anniversaries are within 7 days.
 * Idempotent: won't duplicate if reminder with same key exists.
 */
function computeReminders(store) {
  const data = store.get();
  if (!data.events || data.events.length === 0) return;
  if (!data.reminders) data.reminders = [];

  const now = clock.now();
  let created = 0;

  // Only consider approved, past events
  const pastApprovedEvents = data.events.filter(e => 
    e.status === 'APPROVED' && new Date(e.date) < now
  );

  for (const event of pastApprovedEvents) {
    const result = shouldTrigger(event.date, now);
    if (!result.shouldTrigger) continue;

    const key = reminderKey(event.id, result.anniversaryYear);
    
    // Idempotency check
    if (data.reminders.some(r => r.key === key)) continue;

    const reminder = {
      id: store.generateId('rem'),
      key,
      eventId: event.id,
      eventTitle: event.title,
      eventType: event.type,
      originalDate: event.date,
      anniversaryDate: result.anniversaryDate.toISOString().split('T')[0],
      anniversaryYear: result.anniversaryYear,
      daysUntil: result.daysUntil,
      status: 'PENDING', // PENDING | READ | DISMISSED
      createdAt: now.toISOString(),
      readBy: [],
      dismissedBy: []
    };

    data.reminders.push(reminder);
    created++;

    // Create notifications for all active faculty and HOD
    const activeUsers = data.users.filter(u => u.status === 'ACTIVE');
    for (const user of activeUsers) {
      if (!data.notifications) data.notifications = [];
      data.notifications.push({
        id: store.generateId('notif'),
        userId: user.id,
        type: 'EVENT_ANNIVERSARY',
        title: `Anniversary Reminder: ${event.title}`,
        body: `The ${result.anniversaryYear}-year anniversary of "${event.title}" is in ${result.daysUntil} day(s).`,
        link: `/reminders/${reminder.id}`,
        read: false,
        createdAt: now.toISOString()
      });
    }
  }

  if (created > 0) {
    store.save();
    console.log(`[ReminderService] Created ${created} new reminder(s)`);
  }
}

/**
 * Start the reminder scheduler.
 * Runs once on startup (catch-up), then daily at 00:05.
 */
function startScheduler() {
  const store = require('../data/store');

  // Run once immediately on startup
  try {
    computeReminders(store);
    console.log('[ReminderService] Startup catch-up run completed');
  } catch (err) {
    console.error('[ReminderService] Error during startup run:', err.message);
  }

  // Schedule daily at 00:05
  try {
    const cron = require('node-cron');
    cron.schedule('5 0 * * *', () => {
      console.log('[ReminderService] Running daily reminder check...');
      try {
        computeReminders(store);
      } catch (err) {
        console.error('[ReminderService] Error during scheduled run:', err.message);
      }
    });
    console.log('[ReminderService] Daily scheduler set for 00:05');
  } catch (err) {
    console.error('[ReminderService] Failed to start scheduler:', err.message);
  }
}

module.exports = {
  computeNextAnniversary,
  shouldTrigger,
  isLeapYear,
  computeReminders,
  startScheduler,
  reminderKey
};
