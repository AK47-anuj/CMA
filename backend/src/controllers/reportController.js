const store = require('../data/store');

exports.getAllReports = (req, res) => {
  const { status, submittedByEmail } = req.query;
  let reports = store.get().eventReports;

  if (status) {
    reports = reports.filter(r => r.status.toUpperCase() === status.toUpperCase());
  }
  if (submittedByEmail) {
    reports = reports.filter(r => r.submittedByEmail && r.submittedByEmail.toLowerCase() === submittedByEmail.toLowerCase());
  }

  res.json({ success: true, count: reports.length, data: reports });
};

exports.getReportById = (req, res) => {
  const report = store.get().eventReports.find(r => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  res.json({ success: true, data: report });
};

exports.createReport = (req, res) => {
  const data = store.get();
  const {
    title, type, date, time, venue, speaker, attendees,
    facultyInvolved, objectives, activities, outcomes, curriculumMapping,
    photosAttached, submittedBy, submittedByEmail
  } = req.body;

  if (!title || !type || !date) {
    return res.status(400).json({ success: false, message: 'Title, type, and date are required' });
  }

  const prefixMap = {
    'Guest Lecture': 'GL',
    'Workshop': 'WS',
    'Industrial Visit': 'IV',
    'Seminar': 'SEM',
    'Competition': 'CMP'
  };
  const prefix = prefixMap[type] || 'EVT';
  const randomNum = Math.floor(100 + Math.random() * 900);
  const newId = `RPT-2026-${prefix}-${randomNum}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const newReport = {
    id: newId,
    title,
    type,
    submittedBy: submittedBy || 'Faculty Member',
    submittedByEmail: submittedByEmail || 'faculty@met.edu',
    submittedTime: 'Just now',
    date,
    time: time || '10:00 AM - 01:00 PM',
    venue: venue || 'Auditorium',
    speaker: speaker || 'Industry Expert',
    attendees: parseInt(attendees, 10) || 0,
    facultyInvolved: facultyInvolved || submittedBy || '',
    quorumStatus: '100% Biometric Verified',
    photosAttached: parseInt(photosAttached, 10) || 4,
    status: 'PENDING_HOD_APPROVAL',
    objectives: objectives || '',
    activities: activities || '',
    outcomes: outcomes || '',
    curriculumMapping: curriculumMapping || 'NAAC Criterion 1.3 • Aligned'
  };

  data.eventReports.unshift(newReport);
  data.auditLog.unshift({
    timestamp: now,
    actor: newReport.submittedBy,
    action: 'EVENT_REPORT_SUBMITTED',
    details: `Submitted '${title}' for HOD Review (Ref: ${newId})`
  });

  store.save();
  res.status(201).json({ success: true, message: 'Event report submitted successfully for HOD approval', data: newReport });
};

exports.updateReport = (req, res) => {
  const { id } = req.params;
  const data = store.get();
  const report = data.eventReports.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  // Merge allowed editable fields
  const allowedFields = [
    'title', 'type', 'date', 'time', 'venue', 'speaker', 'attendees',
    'facultyInvolved', 'objectives', 'activities', 'outcomes', 'curriculumMapping',
    'photosAttached'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      report[field] = req.body[field];
    }
  });

  // If was rejected and resubmitted
  if (req.body.resubmit) {
    report.status = 'PENDING_HOD_APPROVAL';
    delete report.rejectionReason;
    report.submittedTime = 'Resubmitted just now';

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    data.auditLog.unshift({
      timestamp: now,
      actor: report.submittedBy,
      action: 'EVENT_REPORT_RESUBMITTED',
      details: `Resubmitted revised dossier for '${report.title}' (${report.id})`
    });
  }

  store.save();
  res.json({ success: true, message: 'Report updated successfully', data: report });
};

exports.updateReportStatus = (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason, approvedBy } = req.body; // 'APPROVED' or 'REJECTED'

  if (!['APPROVED', 'REJECTED', 'PENDING_HOD_APPROVAL'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status provided' });
  }

  const data = store.get();
  const report = data.eventReports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  report.status = status;

  if (status === 'APPROVED') {
    const hash = 'SHA256: ' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const docRef = `MET/IOM/DMS/2026/${report.id.replace('RPT-2026-', '')}`;

    report.approvedBy = approvedBy || 'Prof. Nilesh Bread (HOD)';
    report.approvalDate = now.split(' ')[0];
    report.digitalSignatureHash = hash;
    report.documentRef = docRef;
    delete report.rejectionReason;

    data.auditLog.unshift({
      timestamp: now,
      actor: report.approvedBy,
      action: 'EVENT_REPORT_APPROVED',
      details: `Approved '${report.title}' with digital seal (${report.documentRef})`
    });
  } else if (status === 'REJECTED') {
    report.rejectionReason = rejectionReason || 'Requires revision and additional documentation before approval.';
    const actor = approvedBy || 'Prof. Nilesh Bread (HOD)';

    data.auditLog.unshift({
      timestamp: now,
      actor,
      action: 'EVENT_REPORT_REJECTED',
      details: `Returned '${report.title}' for revision: "${report.rejectionReason}"`
    });
  }

  store.save();
  res.json({ success: true, message: `Report status updated to ${status}`, data: report });
};
