const ChoreTransaction = require('../models/ChoreTransaction');
const Flat = require('../models/Flat');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationHelper');
const { emitToFlat } = require('../config/socket');

// @route GET /api/credits/ledger
const getLedger = async (req, res, next) => {
  try {
    const flat = await Flat.findById(req.flatId).populate(
      'members.user',
      'name username email avatarColor role'
    );

    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }

    // Get all non-cancelled transactions for this flat
    const transactions = await ChoreTransaction.find({
      flat: req.flatId,
      status: { $in: ['confirmed', 'disputed'] }
    });

    const members = flat.members.map(m => m.user).filter(Boolean);

    // Initialize stats per member
    const memberStats = {};
    members.forEach(member => {
      memberStats[member._id.toString()] = {
        user: member,
        creditsEarned: 0,
        creditsOwed: 0,
        netBalance: 0,
        completedForOthersCount: 0,
        tasksOthersCompletedCount: 0
      };
    });

    // Pairwise map: key is `${smallerId}_${largerId}`
    const pairwiseMap = {};

    transactions.forEach(txn => {
      const creditorId = txn.creditor.toString();
      const debtorId = txn.debtor.toString();

      // Only count confirmed for balance (disputed are flagged separately)
      if (txn.status === 'confirmed') {
        if (memberStats[creditorId]) {
          memberStats[creditorId].creditsEarned += txn.credits;
          if (txn.type === 'chore_completed') {
            memberStats[creditorId].completedForOthersCount += 1;
          }
        }

        if (memberStats[debtorId]) {
          memberStats[debtorId].creditsOwed += txn.credits;
          if (txn.type === 'chore_completed') {
            memberStats[debtorId].tasksOthersCompletedCount += 1;
          }
        }

        // Pairwise tracking
        const isAtoB = creditorId < debtorId;
        const pairKey = isAtoB ? `${creditorId}_${debtorId}` : `${debtorId}_${creditorId}`;

        if (!pairwiseMap[pairKey]) {
          pairwiseMap[pairKey] = {
            userAId: isAtoB ? creditorId : debtorId,
            userBId: isAtoB ? debtorId : creditorId,
            aEarnedFromB: 0,
            bEarnedFromA: 0
          };
        }

        if (isAtoB) {
          pairwiseMap[pairKey].aEarnedFromB += txn.credits;
        } else {
          pairwiseMap[pairKey].bEarnedFromA += txn.credits;
        }
      }
    });

    // Compute net balances
    const ledger = Object.values(memberStats).map(stat => {
      stat.netBalance = Number((stat.creditsEarned - stat.creditsOwed).toFixed(2));
      stat.creditsEarned = Number(stat.creditsEarned.toFixed(2));
      stat.creditsOwed = Number(stat.creditsOwed.toFixed(2));
      return stat;
    });

    // Compute pairwise summaries
    const pairwiseDebts = [];
    Object.values(pairwiseMap).forEach(pair => {
      const userA = members.find(m => m._id.toString() === pair.userAId);
      const userB = members.find(m => m._id.toString() === pair.userBId);

      if (!userA || !userB) return;

      const diff = pair.aEarnedFromB - pair.bEarnedFromA;

      let debtor = null;
      let creditor = null;
      let amount = 0;

      if (diff > 0) {
        // User B owes User A
        creditor = userA;
        debtor = userB;
        amount = Number(diff.toFixed(2));
      } else if (diff < 0) {
        // User A owes User B
        creditor = userB;
        debtor = userA;
        amount = Number(Math.abs(diff).toFixed(2));
      }

      pairwiseDebts.push({
        userA,
        userB,
        aEarnedFromB: Number(pair.aEarnedFromB.toFixed(2)),
        bEarnedFromA: Number(pair.bEarnedFromA.toFixed(2)),
        netAmount: amount,
        debtor,
        creditor,
        isSettled: diff === 0
      });
    });

    res.status(200).json({
      success: true,
      ledger,
      pairwiseDebts,
      totalTransactions: transactions.length
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/credits/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { status, type, limit = 50, page = 1 } = req.query;

    const query = { flat: req.flatId };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (type && type !== 'all') {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await ChoreTransaction.find(query)
      .populate('creditor', 'name username avatarColor email')
      .populate('debtor', 'name username avatarColor email')
      .populate('task', 'title category creditValue')
      .populate('disputedBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChoreTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/credits/settle
const settleDebt = async (req, res, next) => {
  try {
    const { debtorId, creditorId, amount, notes } = req.body;

    if (!debtorId || !creditorId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid debtor, creditor, and settlement amount.'
      });
    }

    const debtor = await User.findOne({ _id: debtorId, flat: req.flatId });
    const creditor = await User.findOne({ _id: creditorId, flat: req.flatId });

    if (!debtor || !creditor) {
      return res.status(400).json({
        success: false,
        message: 'Debtor or creditor not found in this flat.'
      });
    }

    // Creating a debt_settled transaction:
    // When Debtor settles with Creditor, we record a transaction where Debtor acts as the creditor of the settlement!
    // That means: Creditor (who was owed) now owes the settlement credit, balancing out the previous debt!
    const transaction = await ChoreTransaction.create({
      flat: req.flatId,
      creditor: debtor._id,   // Debtor earns offsetting credit
      debtor: creditor._id,   // Creditor accepts the offset
      credits: Number(amount),
      type: 'debt_settled',
      status: 'confirmed',
      notes: notes || `Direct settlement: ${debtor.name} settled ${amount} credit(s) with ${creditor.name}.`
    });

    // Notify Creditor
    await createNotification({
      recipient: creditor._id,
      sender: req.user._id,
      flat: req.flatId,
      type: 'general',
      title: 'Chore Debt Settled',
      message: `${debtor.name} settled ${amount} credit(s) with you.`,
      link: '/credits'
    });

    await logActivity({
      flat: req.flatId,
      actor: req.user._id,
      targetUser: creditor._id,
      action: 'settled_debt',
      category: 'credit',
      details: `${debtor.name} settled ${amount} credit(s) with ${creditor.name}. Notes: ${notes || 'Mutual settlement'}`
    });

    const populatedTxn = await ChoreTransaction.findById(transaction._id)
      .populate('creditor', 'name username avatarColor')
      .populate('debtor', 'name username avatarColor');

    emitToFlat(req.flatId.toString(), 'ledger_updated', {});

    res.status(201).json({
      success: true,
      message: `Successfully settled ${amount} credit(s)!`,
      transaction: populatedTxn
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/credits/dispute
const disputeTransaction = async (req, res, next) => {
  try {
    const { transactionId, reason } = req.body;

    if (!transactionId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide transaction ID and reason for dispute.'
      });
    }

    const transaction = await ChoreTransaction.findOne({
      _id: transactionId,
      flat: req.flatId
    }).populate('creditor debtor task');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    // Only debtor or creditor or admin can dispute
    const isDebtor = transaction.debtor._id.toString() === req.user._id.toString();
    const isCreditor = transaction.creditor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDebtor && !isCreditor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not involved in this transaction.'
      });
    }

    transaction.status = 'disputed';
    transaction.disputeReason = reason.trim();
    transaction.disputedBy = req.user._id;
    transaction.disputedAt = new Date();
    await transaction.save();

    const otherParty = isDebtor ? transaction.creditor._id : transaction.debtor._id;

    await createNotification({
      recipient: otherParty,
      sender: req.user._id,
      flat: req.flatId,
      type: 'transaction_disputed',
      title: 'Chore Credit Transaction Disputed',
      message: `${req.user.name} disputed a transaction of ${transaction.credits} credit(s): "${reason}"`,
      link: '/credits'
    });

    await logActivity({
      flat: req.flatId,
      actor: req.user._id,
      action: 'disputed_transaction',
      category: 'dispute',
      details: `${req.user.name} disputed a credit transaction (${transaction.credits} credits): "${reason}"`
    });

    emitToFlat(req.flatId.toString(), 'ledger_updated', {});

    res.status(200).json({
      success: true,
      message: 'Transaction marked as disputed. Flatmates have been notified.',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/credits/resolve-dispute
const resolveDispute = async (req, res, next) => {
  try {
    const { transactionId, resolution, resolutionNote } = req.body; // resolution: 'confirm' | 'cancel'

    const transaction = await ChoreTransaction.findOne({
      _id: transactionId,
      flat: req.flatId
    }).populate('creditor debtor');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    if (resolution === 'confirm') {
      transaction.status = 'confirmed';
      transaction.notes = (transaction.notes ? transaction.notes + ' | ' : '') + `Dispute resolved as confirmed: ${resolutionNote || 'Agreed'}`;
    } else if (resolution === 'cancel') {
      transaction.status = 'settled'; // marks as non-active
      transaction.credits = 0; // neutralizes credit effect while preserving immutable record
      transaction.notes = (transaction.notes ? transaction.notes + ' | ' : '') + `Dispute cancelled: ${resolutionNote || 'Invalidated'}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid resolution option. Choose confirm or cancel.'
      });
    }

    await transaction.save();

    await logActivity({
      flat: req.flatId,
      actor: req.user._id,
      action: 'resolved_dispute',
      category: 'dispute',
      details: `${req.user.name} resolved transaction dispute with verdict "${resolution}".`
    });

    emitToFlat(req.flatId.toString(), 'ledger_updated', {});

    res.status(200).json({
      success: true,
      message: `Dispute resolved as ${resolution}.`,
      transaction
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLedger,
  getTransactions,
  settleDebt,
  disputeTransaction,
  resolveDispute
};

