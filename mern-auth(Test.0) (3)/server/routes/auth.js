const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper: send validation errors
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('VALIDATION_FAILED', {
      route: req.originalUrl,
      errors: errors.array().map((e) => e.msg),
      ip: req.ip,
    });
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return null;
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['client', 'freelancer'])
      .withMessage('Role must be either "client" or "freelancer". Admin accounts cannot be self-registered.'),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { name, email, password, role } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        logger.warn('REGISTRATION_CONFLICT', { email, ip: req.ip });
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      // Explicitly reject any attempt to pass 'admin'
      if (role === 'admin') {
        logger.warn('PRIVILEGE_ESCALATION_ATTEMPT', { email, requestedRole: role, ip: req.ip });
        return res.status(403).json({ message: 'Administrative roles cannot be self-assigned.' });
      }

      const assignedRole = role || 'client';
      const user = await User.create({
        name,
        email,
        password,
        role: assignedRole,
      });

      const token = generateToken(user._id);

      logger.info('USER_REGISTERED', {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: messages[0] });
      }
      logger.error('REGISTER_ERROR', { error: err.message, ip: req.ip });
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Please provide your password'),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        logger.warn('LOGIN_FAILED_UNKNOWN_EMAIL', { email, ip: req.ip });
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        logger.warn('LOGIN_FAILED_BAD_PASSWORD', { userId: user._id, email, ip: req.ip });
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = generateToken(user._id);

      logger.info('USER_LOGIN_SUCCESS', {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      logger.error('LOGIN_ERROR', { error: err.message, ip: req.ip });
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// @route   GET /api/auth/user
// @desc    Get current user
// @access  Private
router.get('/user', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    createdAt: req.user.createdAt,
  });
});

module.exports = router;
