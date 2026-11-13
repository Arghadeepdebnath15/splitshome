const mongoose = require('mongoose');

const choreTransactionSchema = new mongoose.Schema({
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true,
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  creditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  debtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  credits: {
    type: Number,
    required: true,
    min: [0.5, 'Credits must be at least 0.5']
  },
  type: {
    type: String,
    enum: ['chore_completed', 'debt_settled', 'direct_adjustment', 'exchange_settlement'],
    default: 'chore_completed'
  },
  status: {
    type: String,
    enum: ['confirmed', 'disputed', 'settled'],
    default: 'confirmed'
  },
  disputeReason: {
    type: String,
    default: ''
  },
  disputedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  disputedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  isImmutable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChoreTransaction', choreTransactionSchema);

