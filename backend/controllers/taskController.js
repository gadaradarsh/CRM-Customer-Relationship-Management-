const Task = require('../models/Task');
const User = require('../models/User');
const Client = require('../models/Client');

// Create a new task
const createTask = async (req, res) => {
  try {
    console.log('Create task request:', {
      body: req.body,
      user: req.session.user
    });

    const userRole = req.session.user.role;
    
    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    const {
      title,
      description,
      assignedTo,
      clientId,
      priority = 'medium',
      dueDate,
      notes,
      tags = []
    } = req.body;

    // Validate required fields
    if (!title || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Title and assignedTo are required'
      });
    }

    // Check if assigned user exists and is an employee
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || assignedUser.role !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must be an employee'
      });
    }

    // Check if client exists (if provided)
    if (clientId) {
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(400).json({
          success: false,
          message: 'Client not found'
        });
      }
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.session.user._id,
      clientId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
      tags
    });

    await task.save();

    // Populate the task with user details
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' },
      { path: 'clientId', select: 'name company' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get tasks for current user
const getMyTasks = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;
    const { status, priority, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('getMyTasks called:', {
      userId,
      userRole,
      query: req.query,
      session: req.session.user
    });

    let query = {};
    
    if (userRole === 'employee') {
      query.assignedTo = userId;
    } else if (userRole === 'manager') {
      // Managers can see all tasks
      query = {};
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const tasks = await Task.find(query)
      .populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'assignedBy', select: 'name email' },
        { path: 'clientId', select: 'name company' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    console.log('Tasks found:', {
      count: tasks.length,
      total,
      query,
      tasks: tasks.map(t => ({ id: t._id, title: t.title, status: t.status }))
    });

    res.json({
      success: true,
      tasks: tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.session.user._id;

    console.log('Update task status request:', { id, status, notes, userId, userRole: req.session.user.role });

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can update this task
    if (task.assignedTo.toString() !== userId.toString() && req.session.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = { status };
    
    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' },
      { path: 'clientId', select: 'name company' }
    ]);

    console.log('Task updated successfully:', updatedTask);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get task statistics
const getTaskStats = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    let matchQuery = {};
    
    if (userRole === 'employee') {
      matchQuery.assignedTo = userId;
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'completed'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalTasks', 0] },
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
              0
            ]
          }
        }
      }
    ];

    const stats = await Task.aggregate(pipeline);
    console.log('Stats aggregation result:', stats);
    
    if (stats.length === 0) {
      console.log('No stats found, returning default');
      return res.json({
        success: true,
        data: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          completionRate: 0
        }
      });
    }

    console.log('Stats calculated successfully:', stats[0]);
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete task (manager only)
const deleteTask = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    
    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  updateTaskStatus,
  getTaskStats,
  deleteTask
};
