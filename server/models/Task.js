const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign task to a flatmate']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Cleaning',
      'Washing dishes',
      'Cooking',
      'Grocery shopping',
      'Laundry',
      'Bathroom cleaning',
      'Garbage disposal',
      'Other'
    ],
    default: 'Cleaning'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Overdue'],
    default: 'Pending',
    index: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date']
  },
  creditValue: {
    type: Number,
    required: true,
    min: [0.5, 'Credit value must be at least 0.5'],
    default: 1
  },
  completedAt: {
    type: Date,
    default: null
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isCompletedOnBehalf: {
    type: Boolean,
    default: false
  },
  choreTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChoreTransaction',
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
    details: {
      type: String,
      default: ''
    }
  }]
}, {
  timestamps: true
});

// Auto mark as overdue if past due date and not completed
taskSchema.methods.checkOverdue = function () {
  if (this.status !== 'Completed' && this.dueDate && new Date() > new Date(this.dueDate)) {
    this.status = 'Overdue';
  }
};

module.exports = mongoose.model('Task', taskSchema);

