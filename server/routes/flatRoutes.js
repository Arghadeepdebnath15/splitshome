const express = require('express');
const router = express.Router();
const {
  createFlat,
  joinFlat,
  getFlatDetails,
  updateFlatSettings,
  leaveFlat
} = require('../controllers/flatController');
const { protect } = require('../middleware/auth');
const { requireFlat } = require('../middleware/flatAuth');

router.post('/create', protect, createFlat);
router.post('/join', protect, joinFlat);
router.get('/current', protect, requireFlat, getFlatDetails);
router.put('/settings', protect, requireFlat, updateFlatSettings);
router.post('/leave', protect, requireFlat, leaveFlat);

module.exports = router;

