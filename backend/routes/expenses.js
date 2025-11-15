const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { requireAuth, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Add expense for a client
router.post('/clients/:clientId/expenses', checkRole('employee'), expenseController.addExpense);

// Get all expenses for a client
router.get('/clients/:clientId/expenses', expenseController.getClientExpenses);

// Update expense
router.patch('/expenses/:id', expenseController.updateExpense);

// Delete expense
router.delete('/expenses/:id', expenseController.deleteExpense);

// Get expense statistics
router.get('/expenses/stats', expenseController.getExpenseStats);

// Get all expenses (managers only)
router.get('/expenses/all', expenseController.getAllExpenses);

module.exports = router;
