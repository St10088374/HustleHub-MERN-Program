const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

// Helper: send validation errors
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
};

// @route   GET /api/transactions/my
// @desc    Get all transactions for the current freelancer (income + tax summary)
// @access  Private (freelancer, admin)
router.get('/my', protect, authorize('freelancer', 'admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { freelancer: req.user._id };

    const transactions = await Transaction.find(query)
      .populate('gig', 'title category')
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    // Aggregate totals
    const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTax = transactions.reduce((sum, t) => sum + t.estimatedTax, 0);
    const totalNet = transactions.reduce((sum, t) => sum + t.netAmount, 0);

    res.json({
      transactions,
      summary: {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalEstimatedTax: parseFloat(totalTax.toFixed(2)),
        totalNetIncome: parseFloat(totalNet.toFixed(2)),
        transactionCount: transactions.length,
        taxRate: 0.27,
      },
    });
  } catch (err) {
    logger.error('FETCH_TRANSACTIONS_ERROR', { error: err.message, userId: req.user?._id });
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/transactions/summary
// @desc    Get income summary for a specific year
// @access  Private (freelancer only)
router.get(
  '/summary',
  protect,
  authorize('freelancer'),
  [
    query('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be a valid 4-digit year between 2000 and 2100'),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { year } = req.query;
      const filter = { freelancer: req.user._id };

      if (year) {
        const start = new Date(`${year}-01-01T00:00:00.000Z`);
        const end = new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`);
        filter.createdAt = { $gte: start, $lt: end };
      }

      const transactions = await Transaction.find(filter).sort({ createdAt: 1 });

      // Group by month
      const monthly = {};
      transactions.forEach((t) => {
        const month = t.createdAt.toISOString().slice(0, 7); // YYYY-MM
        if (!monthly[month]) {
          monthly[month] = { income: 0, tax: 0, net: 0, count: 0 };
        }
        monthly[month].income += t.amount;
        monthly[month].tax += t.estimatedTax;
        monthly[month].net += t.netAmount;
        monthly[month].count++;
      });

      res.json({
        year: year || 'all',
        monthly,
        totals: {
          income: parseFloat(transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)),
          tax: parseFloat(transactions.reduce((s, t) => s + t.estimatedTax, 0).toFixed(2)),
          net: parseFloat(transactions.reduce((s, t) => s + t.netAmount, 0).toFixed(2)),
        },
      });
    } catch (err) {
      logger.error('FETCH_SUMMARY_ERROR', { error: err.message, userId: req.user?._id });
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
