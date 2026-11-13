const express = require('express');
const router = express.Router();
const {
  getLedger,
  getTransactions,
  settleDebt,
  disputeTransaction,
  resolveDispute
} = require('../controllers/choreCreditController');
const { protect } = require('../middleware/auth');
const { requireFlat } = require('../middleware/flatAuth');

router.use(protect, requireFlat);

router.get('/ledger', getLedger);
router.get('/transactions', getTransactions);
router.post('/settle', settleDebt);
router.post('/dispute', disputeTransaction);
router.post('/resolve-dispute', resolveDispute);

module.exports = router;

