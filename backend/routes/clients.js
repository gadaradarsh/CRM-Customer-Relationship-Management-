const express = require('express');
const { body } = require('express-validator');
const { 
  getClients, 
  getClient, 
  createClient, 
  updateClient, 
  deleteClient, 
  assignClient, 
  updateStatus 
} = require('../controllers/clientController');
const { requireAuth, checkRole, checkClientAccess } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Validation rules
const clientValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
  body('company').trim().isLength({ min: 2 }).withMessage('Company must be at least 2 characters'),
  body('estimatedValue').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    if (isNaN(value)) throw new Error('Estimated value must be a number');
    return true;
  })
];

const statusValidation = [
  body('status').isIn(['new', 'contacted', 'qualified', 'won', 'lost']).withMessage('Invalid status')
];

const assignValidation = [
  body('assignedTo').isMongoId().withMessage('Invalid employee ID')
];

// Routes
router.get('/', getClients);
router.get('/:id', checkClientAccess, getClient);
router.post('/', clientValidation, createClient);
router.patch('/:id', checkClientAccess, clientValidation, updateClient);
router.delete('/:id', checkClientAccess, deleteClient);
router.patch('/:id/assign', checkRole('manager'), assignValidation, assignClient);
router.patch('/:id/status', checkClientAccess, statusValidation, updateStatus);

module.exports = router;
