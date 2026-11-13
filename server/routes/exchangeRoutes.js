const express = require('express');
const router = express.Router();
const {
  getExchanges,
  createExchange,
  respondToExchange
} = require('../controllers/exchangeController');
const { protect } = require('../middleware/auth');
const { requireFlat } = require('../middleware/flatAuth');

router.use(protect, requireFlat);

router.route('/')
  .get(getExchanges)
  .post(createExchange);

router.post('/:id/respond', respondToExchange);

module.exports = router;

