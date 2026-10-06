/**
 * Audit Log Routes
 * Protected routes — HOD can view and create audit entries.
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All audit routes require authentication
router.use(requireAuth);

// View audit logs — any authenticated user can view
router.get('/', auditController.getAllAuditLogs);

// Create audit entry — HOD only
router.post('/', requireRole('HOD'), auditController.createAuditLog);

module.exports = router;
