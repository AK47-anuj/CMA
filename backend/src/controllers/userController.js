const store = require('../data/store');

exports.getAllUsers = (req, res) => {
  const { role, status } = req.query;
  let users = store.get().users;
  if (role) {
    users = users.filter(u => u.role.toUpperCase() === role.toUpperCase());
  }
  if (status) {
    users = users.filter(u => u.status.toUpperCase() === status.toUpperCase());
  }
  res.json({ success: true, count: users.length, data: users });
};

exports.getUserById = (req, res) => {
  const user = store.get().users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
};

exports.login = (req, res) => {
  const { email, id } = req.body;
  const data = store.get();
  let user = null;
  if (id) {
    user = data.users.find(u => u.id === id);
  } else if (email) {
    user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Account not recognized in department roster.' });
  }
  res.json({ success: true, message: 'Login successful', data: user });
};

exports.registerFaculty = (req, res) => {
  const { name, email, designation, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and official email are required' });
  }

  const data = store.get();
  const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'A profile with this MET email address already exists.' });
  }

  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const now = new Date();
  const registeredAt = now.toISOString().replace('T', ' ').substring(0, 16);

  const newFaculty = {
    id: `usr_fac_${Date.now().toString().slice(-4)}`,
    name,
    role: 'FACULTY',
    email,
    designation: designation || 'Assistant Professor',
    department: department || 'Management Studies',
    status: 'PENDING_HOD_APPROVAL',
    registeredAt,
    avatar: initials
  };

  data.users.push(newFaculty);
  data.auditLog.unshift({
    timestamp: registeredAt,
    actor: 'System',
    action: 'FACULTY_REGISTRATION',
    details: `${name} submitted onboarding registration (Status: PENDING_HOD_APPROVAL)`
  });

  store.save();
  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Pending HOD approval.',
    data: newFaculty
  });
};

exports.updateUserStatus = (req, res) => {
  const { id } = req.params;
  const { status, actorName } = req.body; // status: 'ACTIVE' or 'REJECTED'

  if (!status || !['ACTIVE', 'REJECTED', 'PENDING_HOD_APPROVAL'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  const data = store.get();
  const faculty = data.users.find(u => u.id === id);
  if (!faculty) {
    return res.status(404).json({ success: false, message: 'Faculty member not found' });
  }

  faculty.status = status;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const actor = actorName || 'Prof. Nilesh Bread (HOD)';

  if (status === 'ACTIVE') {
    data.auditLog.unshift({
      timestamp: now,
      actor,
      action: 'FACULTY_APPROVED',
      details: `HOD approved onboarding credentials for ${faculty.name}`
    });
  } else if (status === 'REJECTED') {
    data.auditLog.unshift({
      timestamp: now,
      actor,
      action: 'FACULTY_REJECTED',
      details: `HOD rejected onboarding request for ${faculty.name}`
    });
  }

  store.save();
  res.json({
    success: true,
    message: `Faculty status updated to ${status}`,
    data: faculty
  });
};
