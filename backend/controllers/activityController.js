const Activity = require('../models/Activity');
const Client = require('../models/Client');
const { validationResult } = require('express-validator');

// Get activities for a client
const getClientActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, done } = req.query;

    let query = { clientId: id };

    if (type) {
      query.type = type;
    }

    if (done !== undefined) {
      query.done = done === 'true';
    }

    const activities = await Activity.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new activity
const createActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { type, description, date, priority } = req.body;
    const userId = req.session.user._id;

    // Verify client exists
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const activity = new Activity({
      clientId: id,
      type,
      description,
      date: date || new Date(),
      priority: priority || 'medium',
      createdBy: userId
    });

    await activity.save();

    // Update client's last contact date
    await Client.findByIdAndUpdate(id, { lastContactDate: new Date() });

    const populatedActivity = await Activity.findById(activity._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity: populatedActivity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update activity
const updateActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    // Find activity and check permissions
    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Employees can only update their own activities
    if (userRole === 'employee' && activity.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own activities'
      });
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Activity updated successfully',
      activity: updatedActivity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete activity
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Employees can only delete their own activities
    if (userRole === 'employee' && activity.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own activities'
      });
    }

    await Activity.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all activities (for manager dashboard)
const getAllActivities = async (req, res) => {
  try {
    const { type, done, assignedTo } = req.query;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    let query = {};

    // Employees can only see activities for their assigned clients
    if (userRole === 'employee') {
      const clientIds = await Client.find({ assignedTo: userId }).distinct('_id');
      query.clientId = { $in: clientIds };
    }

    if (type) {
      query.type = type;
    }

    if (done !== undefined) {
      query.done = done === 'true';
    }

    if (assignedTo && userRole === 'manager') {
      const clientIds = await Client.find({ assignedTo }).distinct('_id');
      query.clientId = { $in: clientIds };
    }

    const activities = await Activity.find(query)
      .populate('clientId', 'name company')
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .limit(50);

    res.json({
      success: true,
      activities
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
  getClientActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getAllActivities
};
