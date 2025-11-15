const express = require('express');
const { body } = require('express-validator');
const { 
  getClientActivities, 
  createActivity, 
  updateActivity, 
  deleteActivity, 
  getAllActivities 
} = require('../controllers/activityController');
const { requireAuth, checkRole, checkClientAccess } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Validation rules
const activityValidation = [
  body('type').isIn(['call', 'meeting', 'note', 'email', 'follow-up']).withMessage('Invalid activity type'),
  body('description').trim().isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority level')
];

const updateActivityValidation = [
  body('type').optional().isIn(['call', 'meeting', 'note', 'email', 'follow-up']).withMessage('Invalid activity type'),
  body('description').optional().trim().isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority level'),
  body('done').optional().isBoolean().withMessage('Done must be a boolean value')
];

// Routes
router.get('/all', getAllActivities);
router.get('/client/:id', checkClientAccess, getClientActivities);
router.post('/client/:id', checkClientAccess, activityValidation, createActivity);
router.patch('/:id', updateActivityValidation, updateActivity);
router.delete('/:id', deleteActivity);

module.exports = router;
