const express = require('express');
const { 
  getSummary, 
  getEmployeePerformance, 
  getRevenueReport, 
  getActivityReport,
  getEmployeeQuickStats
} = require('../controllers/reportController');
const { requireAuth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Routes
router.get('/summary', getSummary);
router.get('/employees', checkRole('manager'), getEmployeePerformance);
router.get('/revenue', getRevenueReport);
router.get('/activities', getActivityReport);
router.get('/employee-quick-stats', getEmployeeQuickStats);

module.exports = router;
