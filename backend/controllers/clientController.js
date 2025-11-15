const Client = require('../models/Client');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all clients (filtered by role)
const getClients = async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    let query = {};

    // Employees can only see assigned clients
    if (userRole === 'employee') {
      query.assignedTo = userId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by assigned employee (managers only)
    if (assignedTo && userRole === 'manager') {
      query.assignedTo = assignedTo;
    }

    const clients = await Client.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single client
const getClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new client
const createClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user is authenticated
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to create a client'
      });
    }

    const { name, email, phone, company, notes, estimatedValue, assignedTo } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    // If employee is creating client, assign to themselves
    const assignedUserId = userRole === 'employee' ? userId : assignedTo;

    const client = new Client({
      name,
      email,
      phone,
      company,
      notes: notes || '',
      estimatedValue: estimatedValue || 0,
      assignedTo: assignedUserId,
      createdBy: userId
    });

    await client.save();

    const populatedClient = await Client.findById(client._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: populatedClient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update client
const updateClient = async (req, res) => {
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

    // Employees can't change assignedTo
    if (userRole === 'employee' && 'assignedTo' in updates) {
      delete updates.assignedTo;
    }

    const client = await Client.findByIdAndUpdate(
      id,
      { ...updates, lastContactDate: new Date() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email')
     .populate('createdBy', 'name email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client updated successfully',
      client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete client
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Assign client to employee (manager only)
const assignClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // Verify assigned user exists and is an employee
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || assignedUser.role !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const client = await Client.findByIdAndUpdate(
      id,
      { assignedTo },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email')
     .populate('createdBy', 'name email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client assigned successfully',
      client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update client status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'contacted', 'qualified', 'won', 'lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const client = await Client.findByIdAndUpdate(
      id,
      { status, lastContactDate: new Date() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email')
     .populate('createdBy', 'name email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      client
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
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  assignClient,
  updateStatus
};
