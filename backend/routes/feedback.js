const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { requireAuth, checkRole } = require('../middleware/auth');

// Public routes (for client feedback submission)
router.post('/submit', feedbackController.submitFeedback);

// Get feedback for a specific client (requires auth)
router.get('/client/:clientId', requireAuth, feedbackController.getClientFeedback);

// Manager-only routes
router.get('/', requireAuth, checkRole('manager'), feedbackController.getAllFeedback);
router.get('/stats', requireAuth, checkRole('manager'), feedbackController.getFeedbackStats);
router.patch('/:id/status', requireAuth, checkRole('manager'), feedbackController.updateFeedbackStatus);

module.exports = router;
