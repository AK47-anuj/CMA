/**
 * MET SCMS Backend Server
 * Express app with security middleware, auth, and API routes.
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const systemRoutes = require('./routes/systemRoutes');
const demoRoutes = require('./routes/demoRoutes');

// Refuse to start in production with the default JWT_SECRET
if (process.env.NODE_ENV === 'production' && 
    (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change') || process.env.JWT_SECRET.includes('dev-secret'))) {
  console.error('FATAL: JWT_SECRET must be set to a strong random value in production.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 
                  "https://cdn.tailwindcss.com", 
                  "https://accounts.google.com",
                  "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", 
                 "https://fonts.googleapis.com",
                 "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com"],
      frameSrc: ["https://accounts.google.com"]
    }
  },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  if (req.url !== '/api/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Rate limit on general API
app.use('/api', generalLimiter);

// ---- API Routes ----

// Public routes (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'MET SCMS Backend API',
    version: '2.0.0',
    demoMode: process.env.DEMO_MODE === 'true'
  });
});

app.use('/api/auth', authRoutes);

// Demo routes (only when DEMO_MODE=true)
app.use('/api/demo', demoRoutes);

// Protected routes (auth required — enforced inside route files)
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/system', systemRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static assets
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// SPA fallback
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start reminder scheduler
const { startScheduler } = require('./services/reminderService');

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🚀 MET SCMS Backend API v2.0 running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend served at: http://localhost:${PORT}/`);
  if (process.env.DEMO_MODE === 'true') {
    console.log(`🎯 DEMO MODE is ON — demo login and guided tour available`);
  }
  console.log('========================================================');

  // Start the reminder scheduler after server is running
  startScheduler();
});

module.exports = app;
