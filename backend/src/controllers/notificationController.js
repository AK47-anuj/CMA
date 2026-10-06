/**
 * Notification Controller
 * Manages user notifications (bell icon, read/unread).
 */

const store = require('../data/store');
const clock = require('../utils/clock');

/**
 * GET /api/notifications
 * Get notifications for the current user.
 */
exports.getNotifications = (req, res) => {
  const data = store.get();
  const notifications = (data.notifications || [])
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = notifications.filter(n => !n.read).length;

  res.json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: notifications
  });
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read.
 */
exports.markRead = async (req, res, next) => {
  try {
    const data = store.get();
    const notif = (data.notifications || []).find(
      n => n.id === req.params.id && n.userId === req.user.id
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notif.read = true;
    await store.save();
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user.
 */
exports.markAllRead = async (req, res, next) => {
  try {
    const data = store.get();
    (data.notifications || [])
      .filter(n => n.userId === req.user.id && !n.read)
      .forEach(n => { n.read = true; });

    await store.save();
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
