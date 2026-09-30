const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/tenant', systemController.getTenant);
router.get('/data', systemController.getFullData);
router.post('/reset', systemController.resetData);

module.exports = router;
