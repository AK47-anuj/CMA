/**
 * User Controller
 * User profile management and faculty status updates.
 * Auth is now handled by authController. This controller handles
 * user listing, profile retrieval, and admin status management.
 */

const store = require('../data/store');
const clock = require('../utils/clock');

/**
 * GET /api/users
 * List users with optional filters.
 */
exports.getAllUsers = (req, res) => {
  const { role, status } = req.query;
  let users = store.get().users;
  
  if (role) {
    users = users.filter(u => u.role.toUpperCase() === role.toUpperCase());
  }
  if (status) {
    users = users.filter(u => u.status.toUpperCase() === status.toUpperCase());
  }

  // Strip sensitive fields
  const safeUsers = users.map(u => {
    const { passwordHash, ...safe } = u;
    return safe;
  });

  res.json({ success: true, count: safeUsers.length, data: safeUsers });
};

/**
 * GET /api/users/:id
 * Get a user by ID.
 */
exports.getUserById = (req, res) => {
  const user = store.get().users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const { passwordHash, ...safe } = user;
  res.json({ success: true, data: safe });
};

/**
 * PATCH /api/users/:id/status
 * Update a user's status (HOD only). Used for approving/rejecting faculty.
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'REJECTED', 'DEACTIVATED', 'PENDING_HOD_APPROVAL'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const data = store.get();
    const faculty = data.users.find(u => u.id === id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    // HOD can't change their own status
    if (faculty.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot change your own status' });
    }

    const previousStatus = faculty.status;
    faculty.status = status;
    const now = clock.now().toISOString();

    // Audit
    let action, details;
    if (status === 'ACTIVE' && previousStatus === 'PENDING_HOD_APPROVAL') {
      action = 'FACULTY_APPROVED';
      details = `HOD approved onboarding credentials for ${faculty.name}`;
    } else if (status === 'REJECTED') {
      action = 'FACULTY_REJECTED';
      details = `HOD rejected onboarding request for ${faculty.name}`;
    } else if (status === 'DEACTIVATED') {
      action = 'FACULTY_DEACTIVATED';
      details = `HOD deactivated account for ${faculty.name}`;
    } else {
      action = 'USER_STATUS_CHANGED';
      details = `Status changed from ${previousStatus} to ${status} for ${faculty.name}`;
    }

    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: now,
      actor: req.user.name,
      actorId: req.user.id,
      action,
      details
    });

    // Notify the faculty
    if (!data.notifications) data.notifications = [];
    data.notifications.push({
      id: store.generateId('notif'),
      userId: faculty.id,
      type: action,
      title: status === 'ACTIVE' ? 'Account Approved' : `Account ${status}`,
      body: status === 'ACTIVE'
        ? 'Your faculty account has been approved by the HOD. You can now access all features.'
        : `Your account status has been changed to ${status}.`,
      link: '/',
      read: false,
      createdAt: now
    });

    await store.save();

    const { passwordHash, ...safeFaculty } = faculty;
    res.json({
      success: true,
      message: `Faculty status updated to ${status}`,
      data: safeFaculty
    });
  } catch (err) {
    next(err);
  }
};
