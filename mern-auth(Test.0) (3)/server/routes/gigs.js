const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Gig = require('../models/Gig');
const logger = require('../utils/logger');

// Helper: send validation errors
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
};

// @route   GET /api/gigs
// @desc    Get all active gigs (with optional category filter)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;

    const gigs = await Gig.find(filter)
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(gigs);
  } catch (err) {
    console.error('Error fetching gigs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gigs/my
// @desc    Get all gigs owned by the logged-in freelancer
// @access  Private (freelancer only)
router.get('/my', protect, authorize('freelancer', 'admin'), async (req, res) => {
  try {
    const gigs = await Gig.find({ freelancer: req.user._id }).sort({ createdAt: -1 });
    res.json(gigs);
  } catch (err) {
    console.error('Error fetching my gigs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gigs/:id
// @desc    Get single gig by ID
// @access  Public
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid gig ID')],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const gig = await Gig.findById(req.params.id).populate('freelancer', 'name email');
      if (!gig) return res.status(404).json({ message: 'Gig not found' });
      res.json(gig);
    } catch (err) {
      console.error('Error fetching gig:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/gigs
// @desc    Create a new gig
// @access  Private (freelancer only)
router.post(
  '/',
  protect,
  authorize('freelancer'),
  [
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters'),
    body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20–2000 characters'),
    body('category').isIn([
      'Web Development', 'Mobile Development', 'Graphic Design',
      'Content Writing', 'Digital Marketing', 'Data Analysis', 'Video Editing', 'Other',
    ]).withMessage('Invalid category'),
    body('price').isFloat({ min: 1, max: 100000 }).withMessage('Price must be between R1 and R100,000'),
    body('deliveryDays').isInt({ min: 1, max: 365 }).withMessage('Delivery days must be between 1 and 365'),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { title, description, category, price, deliveryDays } = req.body;

      const gig = await Gig.create({
        title,
        description,
        category,
        price,
        deliveryDays,
        freelancer: req.user._id,
      });

      logger.info('GIG_CREATED', {
        gigId: gig._id,
        freelancerId: req.user._id,
        title: gig.title,
        price: gig.price,
        category: gig.category,
      });

      res.status(201).json(gig);
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: messages[0] });
      }
      logger.error('GIG_CREATE_ERROR', { error: err.message, userId: req.user?._id });
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/gigs/:id
// @desc    Update a gig (owner only)
// @access  Private (freelancer who owns the gig)
router.put(
  '/:id',
  protect,
  authorize('freelancer', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid gig ID'),
    body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters'),
    body('description').optional().trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20–2000 characters'),
    body('category').optional().isIn([
      'Web Development', 'Mobile Development', 'Graphic Design',
      'Content Writing', 'Digital Marketing', 'Data Analysis', 'Video Editing', 'Other',
    ]).withMessage('Invalid category'),
    body('price').optional().isFloat({ min: 1, max: 100000 }).withMessage('Price must be between R1 and R100,000'),
    body('deliveryDays').optional().isInt({ min: 1, max: 365 }).withMessage('Delivery days must be between 1 and 365'),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const gig = await Gig.findById(req.params.id);
      if (!gig) return res.status(404).json({ message: 'Gig not found' });

      // Ownership check (admins can bypass)
      if (req.user.role !== 'admin' && gig.freelancer.toString() !== req.user._id.toString()) {
        logger.warn('UNAUTHORIZED_GIG_UPDATE_ATTEMPT', {
          gigId: req.params.id,
          userId: req.user._id,
          ownerId: gig.freelancer,
          ip: req.ip,
        });
        return res.status(403).json({ message: 'Not authorized to update this gig' });
      }

      const allowed = ['title', 'description', 'category', 'price', 'deliveryDays', 'isActive'];
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) gig[field] = req.body[field];
      });

      await gig.save();

      logger.info('GIG_UPDATED', {
        gigId: gig._id,
        updatedBy: req.user._id,
        role: req.user.role,
      });

      res.json(gig);
    } catch (err) {
      logger.error('GIG_UPDATE_ERROR', { error: err.message, gigId: req.params.id, userId: req.user?._id });
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/gigs/:id
// @desc    Delete a gig (owner or admin)
// @access  Private (freelancer who owns the gig, or admin)
router.delete(
  '/:id',
  protect,
  authorize('freelancer', 'admin'),
  [param('id').isMongoId().withMessage('Invalid gig ID')],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const gig = await Gig.findById(req.params.id);
      if (!gig) return res.status(404).json({ message: 'Gig not found' });

      if (req.user.role !== 'admin' && gig.freelancer.toString() !== req.user._id.toString()) {
        logger.warn('UNAUTHORIZED_GIG_DELETE_ATTEMPT', {
          gigId: req.params.id,
          userId: req.user._id,
          ownerId: gig.freelancer,
          ip: req.ip,
        });
        return res.status(403).json({ message: 'Not authorized to delete this gig' });
      }

      await gig.deleteOne();

      logger.info('GIG_DELETED', {
        gigId: gig._id,
        deletedBy: req.user._id,
        role: req.user.role,
      });

      res.json({ message: 'Gig deleted successfully' });
    } catch (err) {
      logger.error('GIG_DELETE_ERROR', { error: err.message, gigId: req.params.id, userId: req.user?._id });
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
