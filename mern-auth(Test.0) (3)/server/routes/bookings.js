const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

// Rate limiter for booking creation (prevents abuse)
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many booking requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const TAX_RATE = 0.27; // 27% estimated provisional tax

// Helper: send validation errors
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
};

// @route   POST /api/bookings
// @desc    Create a new booking (atomic booking + transaction creation)
// @access  Private (client only)
router.post(
  '/',
  protect,
  authorize('client'),
  bookingLimiter,
  [
    body('gigId').isMongoId().withMessage('Invalid gig ID'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { gigId, notes } = req.body;

      // Fetch the gig
      const gig = await Gig.findById(gigId);
      if (!gig) {
        return res.status(404).json({ message: 'Gig not found' });
      }
      if (!gig.isActive) {
        return res.status(400).json({ message: 'This gig is no longer active' });
      }

      // Prevent booking own gig
      if (gig.freelancer.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot book your own gig' });
      }

      const estimatedTax = parseFloat((gig.price * TAX_RATE).toFixed(2));
      const netAmount = parseFloat((gig.price - estimatedTax).toFixed(2));

      // Try database transaction if replica set is active; otherwise use compensation rollback
      let booking;
      let transaction;
      let session = null;

      try {
        session = await mongoose.startSession();
        session.startTransaction();

        const createdBookings = await Booking.create(
          [
            {
              gig: gig._id,
              client: req.user._id,
              freelancer: gig.freelancer,
              amount: gig.price,
              status: 'confirmed',
              notes: notes || '',
            },
          ],
          { session }
        );
        booking = createdBookings[0];

        const createdTransactions = await Transaction.create(
          [
            {
              booking: booking._id,
              freelancer: gig.freelancer,
              client: req.user._id,
              gig: gig._id,
              amount: gig.price,
              estimatedTax,
              netAmount,
              type: 'earning',
              description: `Booking for gig: ${gig.title}`,
            },
          ],
          { session }
        );
        transaction = createdTransactions[0];

        await session.commitTransaction();
        session.endSession();
      } catch (txnError) {
        if (session) {
          try {
            await session.abortTransaction();
            session.endSession();
          } catch {}
        }

        // Fallback for standalone MongoDB (without replica set)
        // Execute atomic compensation: if transaction write fails, roll back booking
        booking = await Booking.create({
          gig: gig._id,
          client: req.user._id,
          freelancer: gig.freelancer,
          amount: gig.price,
          status: 'confirmed',
          notes: notes || '',
        });

        try {
          transaction = await Transaction.create({
            booking: booking._id,
            freelancer: gig.freelancer,
            client: req.user._id,
            gig: gig._id,
            amount: gig.price,
            estimatedTax,
            netAmount,
            type: 'earning',
            description: `Booking for gig: ${gig.title}`,
          });
        } catch (txCreateErr) {
          // Compensating rollback
          await Booking.findByIdAndDelete(booking._id);
          logger.error('BOOKING_TRANSACTION_ROLLBACK', {
            bookingId: booking._id,
            error: txCreateErr.message,
          });
          return res.status(500).json({ message: 'Transaction creation failed; booking was aborted.' });
        }
      }

      logger.info('BOOKING_COMPLETED', {
        bookingId: booking._id,
        transactionId: transaction._id,
        clientId: req.user._id,
        freelancerId: gig.freelancer,
        amount: gig.price,
        estimatedTax,
      });

      // Populate for response
      const populated = await Booking.findById(booking._id)
        .populate('gig', 'title price deliveryDays')
        .populate('freelancer', 'name email')
        .populate('client', 'name email');

      res.status(201).json({
        message: 'Booking confirmed successfully!',
        booking: populated,
        transactionId: transaction._id,
      });
    } catch (err) {
      logger.error('BOOKING_ERROR', { error: err.message, ip: req.ip });
      res.status(500).json({ message: 'Server error during booking' });
    }
  }
);

// @route   GET /api/bookings/my
// @desc    Get bookings for the current user
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'client') {
      query = { client: req.user._id };
    } else if (req.user.role === 'freelancer') {
      query = { freelancer: req.user._id };
    } else {
      query = {}; // admin
    }

    const bookings = await Booking.find(query)
      .populate('gig', 'title price category deliveryDays')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    logger.error('FETCH_BOOKINGS_ERROR', { error: err.message });
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid booking ID')],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const booking = await Booking.findById(req.params.id)
        .populate('gig', 'title price category deliveryDays')
        .populate('client', 'name email')
        .populate('freelancer', 'name email');

      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      const isClient = booking.client._id.toString() === req.user._id.toString();
      const isFreelancer = booking.freelancer._id.toString() === req.user._id.toString();

      if (!isClient && !isFreelancer && req.user.role !== 'admin') {
        logger.warn('UNAUTHORIZED_BOOKING_ACCESS_ATTEMPT', {
          bookingId: req.params.id,
          userId: req.user._id,
        });
        return res.status(403).json({ message: 'Not authorized to view this booking' });
      }

      res.json(booking);
    } catch (err) {
      logger.error('FETCH_BOOKING_ERROR', { error: err.message });
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
