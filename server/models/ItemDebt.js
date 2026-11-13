const mongoose = require('mongoose');

const itemDebtSchema = new mongoose.Schema({
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true,
    index: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemName: {
    type: String,
    required: [true, 'Please provide the item name (e.g. Onions, Rice, Milk)'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [0.1, 'Quantity must be greater than 0']
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    default: 'units' // e.g. 'onions', 'glass', 'kg', 'packet', 'litre', 'cup', 'spoon'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['owed', 'returned', 'forgiven'],
    default: 'owed',
    index: true
  },
  returnedAt: {
    type: Date,
    default: null
  },
  history: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      default: ''
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ItemDebt', itemDebtSchema);

