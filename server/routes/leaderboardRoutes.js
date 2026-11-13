const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');
const { requireFlat } = require('../middleware/flatAuth');

router.get('/', protect, requireFlat, getLeaderboard);

module.exports = router;

