const store = require('../data/store');

exports.getAllAuditLogs = (req, res) => {
  const auditLogs = store.get().auditLog;
  res.json({ success: true, count: auditLogs.length, data: auditLogs });
};

exports.createAuditLog = (req, res) => {
  const { actor, action, details } = req.body;
  if (!actor || !action || !details) {
    return res.status(400).json({ success: false, message: 'Actor, action, and details are required' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const logEntry = {
    timestamp: now,
    actor,
    action,
    details
  };

  const data = store.get();
  data.auditLog.unshift(logEntry);
  store.save();
  res.status(201).json({ success: true, message: 'Audit entry recorded', data: logEntry });
};
