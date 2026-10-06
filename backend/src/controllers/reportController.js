/**
 * Report Controller
 * Event report CRUD with approval workflow, version tracking,
 * SHA-256 digital signature, and real audit trails.
 */

const store = require('../data/store');
const clock = require('../utils/clock');
const crypto = require('crypto');

/**
 * GET /api/reports
 */
exports.getAllReports = (req, res) => {
  const { status, submittedBy } = req.query;
  let reports = store.get().eventReports || [];

  if (status) {
    reports = reports.filter(r => r.status.toUpperCase() === status.toUpperCase());
  }
  if (submittedBy) {
    reports = reports.filter(r => r.submittedBy === submittedBy);
  }

  // Faculty can only see their own reports + approved reports
  if (req.user.role === 'FACULTY') {
    reports = reports.filter(r => 
      r.submittedBy === req.user.id || r.status === 'APPROVED'
    );
  }

  res.json({ success: true, count: reports.length, data: reports });
};

/**
 * GET /api/reports/:id
 */
exports.getReportById = (req, res) => {
  const report = (store.get().eventReports || []).find(r => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }
  res.json({ success: true, data: report });
};

/**
 * POST /api/reports
 * Create a new event report. No fake defaults — all fields come from input.
 */
exports.createReport = async (req, res, next) => {
  try {
    const data = store.get();
    const {
      eventId, title, type, date, time, venue, guest, guestDesignation,
      attendees, facultyInvolved, objectives, activities, outcomes,
      curriculumMapping
    } = req.body;

    if (!title || !type || !date) {
      return res.status(400).json({ success: false, message: 'Title, type, and date are required' });
    }

    // Generate proper report ID
    const prefixMap = {
      'Guest Lecture': 'GL',
      'Workshop': 'WS',
      'Industrial Visit': 'IV',
      'Seminar': 'SEM',
      'Competition': 'CMP'
    };
    const prefix = prefixMap[type] || 'EVT';
    const existingCount = (data.eventReports || []).length;
    const newId = `RPT-${String(existingCount + 1).padStart(3, '0')}`;
    const now = clock.now().toISOString();

    const newReport = {
      id: newId,
      eventId: eventId || null,
      title,
      type,
      submittedBy: req.user.id,
      submittedByName: req.user.name,
      date,
      time: time || '',
      venue: venue || '',
      guest: guest || '',
      guestDesignation: guestDesignation || '',
      attendees: parseInt(attendees, 10) || 0,
      facultyInvolved: facultyInvolved || req.user.name,
      objectives: objectives || '',
      activities: activities || '',
      outcomes: outcomes || '',
      curriculumMapping: curriculumMapping || '',
      status: 'PENDING_HOD_APPROVAL',
      version: 1,
      history: [],
      feedbackSummary: null,
      attachments: [],
      createdAt: now
    };

    if (!data.eventReports) data.eventReports = [];
    data.eventReports.unshift(newReport);

    // Audit log
    data.auditLog.unshift({
      id: store.generateId('aud'),
      timestamp: now,
      actor: req.user.name,
      actorId: req.user.id,
      action: 'EVENT_REPORT_SUBMITTED',
      details: `Submitted "${title}" for HOD Review (Ref: ${newId})`
    });

    // Notify HOD
    const hod = data.users.find(u => u.role === 'HOD');
    if (hod) {
      if (!data.notifications) data.notifications = [];
      data.notifications.push({
        id: store.generateId('notif'),
        userId: hod.id,
        type: 'REPORT_SUBMITTED',
        title: 'Report Submitted for Review',
        body: `${req.user.name} submitted "${title}" for your review.`,
        link: `/reports/${newId}`,
        read: false,
        createdAt: now
      });
    }

    await store.save();
    res.status(201).json({ success: true, message: 'Event report submitted successfully for HOD approval', data: newReport });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/reports/:id
 * Update a report. Cannot edit approved reports.
 */
exports.updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = store.get();
    const report = (data.eventReports || []).find(r => r.id === id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Only submitter or HOD can edit
    if (req.user.role !== 'HOD' && report.submittedBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reports.' });
    }

    // Cannot edit approved reports
    if (report.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot edit an approved report.' });
    }

    // Merge allowed editable fields
    const allowedFields = [
      'title', 'type', 'date', 'time', 'venue', 'guest', 'guestDesignation',
      'attendees', 'facultyInvolved', 'objectives', 'activities', 'outcomes',
      'curriculumMapping'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        report[field] = req.body[field];
      }
    });

    // If resubmitting after rejection
    if (req.body.resubmit && report.status === 'REJECTED') {
      // Save current version to history
      report.history.push({
        action: 'RESUBMITTED',
        version: report.version,
        reviewer: req.user.id,
        reviewerName: req.user.name,
        timestamp: clock.now().toISOString()
      });

      report.status = 'PENDING_HOD_APPROVAL';
      report.version = (report.version || 1) + 1;
      delete report.rejectionReason;

      const now = clock.now().toISOString();
      data.auditLog.unshift({
        id: store.generateId('aud'),
        timestamp: now,
        actor: req.user.name,
        actorId: req.user.id,
        action: 'EVENT_REPORT_RESUBMITTED',
        details: `Resubmitted revised dossier for "${report.title}" (${report.id}) — v${report.version}`
      });

      // Notify HOD
      const hod = data.users.find(u => u.role === 'HOD');
      if (hod) {
        if (!data.notifications) data.notifications = [];
        data.notifications.push({
          id: store.generateId('notif'),
          userId: hod.id,
          type: 'REPORT_RESUBMITTED',
          title: 'Report Resubmitted',
          body: `${req.user.name} resubmitted "${report.title}" (v${report.version}) for your review.`,
          link: `/reports/${report.id}`,
          read: false,
          createdAt: now
        });
      }
    }

    report.updatedAt = clock.now().toISOString();
    await store.save();
    res.json({ success: true, message: 'Report updated successfully', data: report });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/reports/:id/status
 * HOD approve or reject a report. Uses real SHA-256 hash for signatures.
 */
exports.updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
    }

    // Mandatory rejection reason
    if (status === 'REJECTED' && (!rejectionReason || rejectionReason.trim().length < 5)) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required (at least 5 characters)' });
    }

    const data = store.get();
    const report = (data.eventReports || []).find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const now = clock.now().toISOString();
    const nowDate = now.split('T')[0];

    if (status === 'APPROVED') {
      // Real SHA-256 digital signature
      const signaturePayload = `${report.id}|${req.user.id}|${now}|APPROVED`;
      const signatureHash = crypto.createHash('sha256').update(signaturePayload).digest('hex');

      // Real document reference
      const year = clock.now().getFullYear();
      const typeCode = {
        'Guest Lecture': 'GL',
        'Workshop': 'WS',
        'Industrial Visit': 'IV',
        'Seminar': 'SEM',
        'Competition': 'CMP'
      }[report.type] || 'EVT';
      const docRef = `MET/IOM/DMS/${year}/${typeCode}-${report.id.replace('RPT-', '')}`;

      report.status = 'APPROVED';
      report.approvedBy = req.user.id;
      report.approvedByName = req.user.name;
      report.approvedAt = now;
      report.approvalDate = nowDate;
      report.digitalSignatureHash = `SHA256:${signatureHash}`;
      report.documentRef = docRef;
      delete report.rejectionReason;

      // History
      report.history.push({
        action: 'APPROVED',
        reviewer: req.user.id,
        reviewerName: req.user.name,
        timestamp: now
      });

      data.auditLog.unshift({
        id: store.generateId('aud'),
        timestamp: now,
        actor: req.user.name,
        actorId: req.user.id,
        action: 'EVENT_REPORT_APPROVED',
        details: `Approved "${report.title}" with digital seal (${docRef})`
      });

      // Notify submitter
      if (!data.notifications) data.notifications = [];
      data.notifications.push({
        id: store.generateId('notif'),
        userId: report.submittedBy,
        type: 'REPORT_APPROVED',
        title: 'Report Approved',
        body: `Your report "${report.title}" has been approved by the HOD.`,
        link: `/reports/${report.id}`,
        read: false,
        createdAt: now
      });

    } else if (status === 'REJECTED') {
      report.status = 'REJECTED';
      report.rejectionReason = rejectionReason;

      // History
      report.history.push({
        action: 'REJECTED',
        reviewer: req.user.id,
        reviewerName: req.user.name,
        reason: rejectionReason,
        timestamp: now
      });

      data.auditLog.unshift({
        id: store.generateId('aud'),
        timestamp: now,
        actor: req.user.name,
        actorId: req.user.id,
        action: 'EVENT_REPORT_REJECTED',
        details: `Returned "${report.title}" for revision: "${rejectionReason}"`
      });

      // Notify submitter
      if (!data.notifications) data.notifications = [];
      data.notifications.push({
        id: store.generateId('notif'),
        userId: report.submittedBy,
        type: 'REPORT_REJECTED',
        title: 'Report Returned for Revision',
        body: `HOD returned "${report.title}" — ${rejectionReason}`,
        link: `/reports/${report.id}`,
        read: false,
        createdAt: now
      });
    }

    await store.save();
    res.json({ success: true, message: `Report status updated to ${status}`, data: report });
  } catch (err) {
    next(err);
  }
};
