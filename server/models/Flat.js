const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a flat name'],
    trim: true,
    maxlength: [100, 'Flat name cannot exceed 100 characters']
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    allowInstantCreditSettle: {
      type: Boolean,
      default: true
    },
    defaultCreditValue: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flat', flatSchema);

