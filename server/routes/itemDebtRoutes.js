const express = require('express');
const router = express.Router();
const {
  getItemDebts,
  createItemDebt,
  markItemReturned,
  deleteItemDebt
} = require('../controllers/itemDebtController');
const { protect } = require('../middleware/auth');
const { requireFlat } = require('../middleware/flatAuth');

router.use(protect, requireFlat);

router.route('/')
  .get(getItemDebts)
  .post(createItemDebt);

router.put('/:id/return', markItemReturned);
router.delete('/:id', deleteItemDebt);

module.exports = router;

