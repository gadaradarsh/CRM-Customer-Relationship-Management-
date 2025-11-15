const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Consulting', 'Hosting', 'Maintenance', 'Development', 'Design', 'Marketing', 'Other'],
    default: 'Other'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isInvoiced: {
    type: Boolean,
    default: false
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ clientId: 1, date: -1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ isInvoiced: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
