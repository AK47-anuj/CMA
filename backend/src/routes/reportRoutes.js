/**
 * Report Routes
 * Protected routes for event report CRUD and approval workflow.
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All report routes require authentication
router.use(requireAuth);

router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReportById);
router.post('/', reportController.createReport);
router.put('/:id', reportController.updateReport);

// Status updates — HOD only can approve/reject
router.patch('/:id/status', requireRole('HOD'), reportController.updateReportStatus);

module.exports = router;
