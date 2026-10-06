/**
 * Demo Routes
 * Only active when DEMO_MODE=true.
 */

const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');

// All demo routes guarded by DEMO_MODE check
router.use(demoController.demoGuard);

router.get('/info', demoController.info);
router.get('/clock', demoController.getClock);
router.post('/clock', demoController.setClock);
router.post('/reset', demoController.reset);

module.exports = router;
