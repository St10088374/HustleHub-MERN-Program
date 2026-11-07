const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    // Estimated tax at 27% (South African corporate / provisional tax reference rate)
    estimatedTax: {
      type: Number,
      required: true,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['earning', 'refund'],
      default: 'earning',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
TransactionSchema.index({ freelancer: 1 });
TransactionSchema.index({ client: 1 });
TransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
