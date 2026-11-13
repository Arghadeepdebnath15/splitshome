const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { requireFlat } = require('../middleware/flatAuth');

router.get('/', protect, requireFlat, getDashboardStats);

module.exports = router;

