const store = require('../data/store');

exports.getAllMeetings = (req, res) => {
  const { status } = req.query;
  let meetings = store.get().meetings;
  if (status) {
    meetings = meetings.filter(m => m.status.toUpperCase() === status.toUpperCase());
  }
  res.json({ success: true, count: meetings.length, data: meetings });
};

exports.getMeetingById = (req, res) => {
  const meeting = store.get().meetings.find(m => m.id === req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, message: 'Meeting not found' });
  }
  res.json({ success: true, data: meeting });
};

exports.createMeeting = (req, res) => {
  const data = store.get();
  const {
    title, committee, date, time, venue, chairperson,
    membersPresent, agenda, discussionPoints, decisions, actionItems,
    submittedBy
  } = req.body;

  if (!title || !committee || !date) {
    return res.status(400).json({ success: false, message: 'Title, committee, and date are required' });
  }

  const prefix = committee.includes('Board') ? 'BOS' : 'FAC';
  const randomNum = Math.floor(10 + Math.random() * 90);
  const newId = `MOM-2026-${prefix}-${randomNum}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const newMeeting = {
    id: newId,
    title,
    committee,
    date,
    time: time || '10:00 AM - 12:30 PM',
    venue: venue || 'Conference Boardroom A',
    chairperson: chairperson || 'Prof. Nilesh Bread (Head of Department)',
    membersPresent: membersPresent || 'Faculty Members',
    agenda: agenda || '',
    discussionPoints: discussionPoints || '',
    decisions: decisions || '',
    actionItems: actionItems || [],
    status: 'PENDING_HOD_APPROVAL',
    submittedBy: submittedBy || 'Faculty Member'
  };

  data.meetings.unshift(newMeeting);
  data.auditLog.unshift({
    timestamp: now,
    actor: newMeeting.submittedBy,
    action: 'MOM_SUBMISSION',
    details: `Created draft Minutes of Meeting for '${title}' (${newId})`
  });

  store.save();
  res.status(201).json({ success: true, message: 'Minutes of Meeting created successfully', data: newMeeting });
};

exports.updateMeetingStatus = (req, res) => {
  const { id } = req.params;
  const { status, approvedBy } = req.body;

  if (!['APPROVED', 'PENDING_HOD_APPROVAL'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status provided' });
  }

  const data = store.get();
  const meeting = data.meetings.find(m => m.id === id);
  if (!meeting) {
    return res.status(404).json({ success: false, message: 'Meeting record not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  meeting.status = status;

  if (status === 'APPROVED') {
    meeting.approvedBy = approvedBy || 'Prof. Nilesh Bread (HOD)';
    meeting.approvalDate = now.split(' ')[0];

    data.auditLog.unshift({
      timestamp: now,
      actor: meeting.approvedBy,
      action: 'MOM_APPROVED',
      details: `HOD finalized and approved MoM for '${meeting.title}' (${meeting.id})`
    });
  }

  store.save();
  res.json({ success: true, message: `Meeting status updated to ${status}`, data: meeting });
};
