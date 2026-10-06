/**
 * System Routes
 * Protected routes for system/tenant info and data management.
 */

const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Tenant info — any authenticated user
router.get('/tenant', requireAuth, systemController.getTenant);

// Full data dump — HOD only (for debugging)
router.get('/data', requireAuth, requireRole('HOD'), systemController.getFullData);

// Reset data — HOD only
router.post('/reset', requireAuth, requireRole('HOD'), systemController.resetData);

module.exports = router;
