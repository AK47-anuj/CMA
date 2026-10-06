/**
 * Zod Validation Schemas
 * All input validation schemas and a middleware wrapper.
 */

const { z } = require('zod');

// ---- Common ----
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').refine(val => {
  const d = new Date(val);
  return !isNaN(d.getTime());
}, 'Invalid date value');

const emailSchema = z.string().email('Invalid email address').max(100);
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(100);

// ---- Auth ----
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  password: passwordSchema,
  designation: z.string().min(2).max(100).optional()
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional()
});

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required')
});

const forgotPasswordSchema = z.object({
  email: emailSchema
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

// ---- Events ----
const eventTypeEnum = z.enum(['Workshop', 'Seminar', 'Guest Lecture', 'Competition', 'Industrial Visit']);

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  type: eventTypeEnum,
  date: dateSchema,
  time: z.string().min(3).max(50).optional(),
  venue: z.string().min(2).max(200).optional(),
  guest: z.string().max(200).optional(),
  guestDesignation: z.string().max(200).optional(),
  guestOrganisation: z.string().max(200).optional(),
  attendees: z.number().int().min(0).optional(),
  facultyInvolved: z.string().max(500).optional(),
  objectives: z.string().max(2000).optional(),
  activities: z.string().max(2000).optional(),
  outcomes: z.string().max(2000).optional()
});

// ---- Meetings ----
const createMeetingSchema = z.object({
  title: z.string().min(3).max(200),
  committee: z.string().min(2).max(200),
  date: dateSchema,
  startTime: z.string().min(3).max(20),
  endTime: z.string().min(3).max(20),
  venue: z.string().min(2).max(200),
  chairperson: z.string().max(200).optional(),
  invitees: z.array(z.string()).min(1, 'At least one invitee is required'),
  agendaItems: z.array(z.object({
    title: z.string().min(1),
    presenter: z.string().optional(),
    duration: z.string().optional()
  })).min(1, 'At least one agenda item is required'),
  notes: z.string().max(2000).optional()
});

const createMomSchema = z.object({
  membersPresent: z.array(z.string()).min(1),
  membersAbsent: z.array(z.string()).optional(),
  discussionPoints: z.array(z.object({
    agendaItemIndex: z.number().int().min(0),
    discussion: z.string().min(1),
    decision: z.string().optional()
  })),
  actionItems: z.array(z.object({
    task: z.string().min(1, 'Task description is required'),
    responsibleUserId: z.string().min(1, 'Responsible person is required'),
    deadline: dateSchema
  })),
  additionalNotes: z.string().max(2000).optional()
});

// ---- Calendar ----
const calendarEntrySchema = z.object({
  date: dateSchema,
  time: z.string().max(50).optional(),
  title: z.string().min(2).max(200),
  type: z.string().max(50).optional(),
  venue: z.string().max(200).optional(),
  tag: z.string().max(100).optional()
});

// ---- Status updates ----
const reportStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional()
}).refine(data => {
  if (data.status === 'REJECTED' && (!data.rejectionReason || data.rejectionReason.trim().length < 5)) {
    return false;
  }
  return true;
}, {
  message: 'Rejection reason is required (at least 5 characters)',
  path: ['rejectionReason']
});

const meetingStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional()
}).refine(data => {
  if (data.status === 'REJECTED' && (!data.rejectionReason || data.rejectionReason.trim().length < 5)) {
    return false;
  }
  return true;
}, {
  message: 'Rejection reason is required (at least 5 characters)',
  path: ['rejectionReason']
});

const facultyStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'DEACTIVATED'])
});

// ---- Validation middleware ----
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        });
      }
      next(err);
    }
  };
}

module.exports = {
  // Schemas
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createEventSchema,
  createMeetingSchema,
  createMomSchema,
  calendarEntrySchema,
  reportStatusSchema,
  meetingStatusSchema,
  facultyStatusSchema,
  eventTypeEnum,
  dateSchema,
  // Middleware
  validateBody
};
