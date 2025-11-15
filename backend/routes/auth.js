const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getCurrentUser, getEmployees } = require('../controllers/authController');
const { requireAuth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['manager', 'employee']).withMessage('Role must be either manager or employee')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/logout', logout);
router.get('/me', getCurrentUser);
router.get('/employees', requireAuth, checkRole('manager'), getEmployees);

module.exports = router;
