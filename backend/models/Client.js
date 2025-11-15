const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'won', 'lost'],
    default: 'new'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  estimatedValue: {
    type: Number,
    default: 0
  },
  lastContactDate: {
    type: Date,
    default: Date.now
  },
  feedbackRequested: {
    type: Boolean,
    default: false
  },
  feedbackRequestedAt: {
    type: Date
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  feedbackCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
clientSchema.index({ assignedTo: 1, status: 1 });
clientSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Client', clientSchema);
