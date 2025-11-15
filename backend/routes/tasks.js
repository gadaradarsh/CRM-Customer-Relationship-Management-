const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireAuth, checkRole } = require('../middleware/auth');

// Get tasks for current user
router.get('/my-tasks', requireAuth, taskController.getMyTasks);

// Get task statistics
router.get('/stats', requireAuth, taskController.getTaskStats);

// Manager-only routes
router.post('/', requireAuth, checkRole('manager'), taskController.createTask);
router.delete('/:id', requireAuth, checkRole('manager'), taskController.deleteTask);

// Update task status (employees and managers)
router.patch('/:id/status', requireAuth, taskController.updateTaskStatus);

module.exports = router;
