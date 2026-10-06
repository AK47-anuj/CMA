/**
 * Event Routes
 * Protected routes for event CRUD operations.
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody, createEventSchema } = require('../utils/validate');

// All event routes require authentication
router.use(requireAuth);

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', validateBody(createEventSchema), eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
