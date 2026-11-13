const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema({
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true,
    index: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means open to any flatmate
  },
  type: {
    type: String,
    enum: ['request_help', 'volunteer', 'swap'],
    required: true
  },
  offeredTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  targetTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null // required if type === 'swap'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  responseNote: {
    type: String,
    trim: true,
    default: ''
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExchangeRequest', exchangeRequestSchema);

