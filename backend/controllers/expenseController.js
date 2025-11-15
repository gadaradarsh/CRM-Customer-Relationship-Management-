const Expense = require('../models/Expense');
const Client = require('../models/Client');

// Add expense for a client
const addExpense = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { description, category, amount, date } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    // Validate required fields
    if (!description || !category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Description, category, and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if user has access to this client
    if (userRole === 'employee' && client.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only add expenses for your assigned clients.'
      });
    }

    // Create expense
    const expense = new Expense({
      clientId,
      description,
      category,
      amount,
      date: date ? new Date(date) : new Date(),
      createdBy: userId
    });

    await expense.save();

    // Populate the expense with client and user details
    await expense.populate([
      { path: 'clientId', select: 'name company' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all expenses for a client
const getClientExpenses = async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if user has access to this client
    if (userRole === 'employee' && client.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view expenses for your assigned clients.'
      });
    }

    const { page = 1, limit = 10, category, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let matchQuery = { clientId };

    // Filter by category
    if (category && category !== 'all') {
      matchQuery.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(matchQuery)
      .populate([
        { path: 'clientId', select: 'name company' },
        { path: 'createdBy', select: 'name email' }
      ])
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(matchQuery);

    // Calculate total amount
    const totalAmount = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, category, amount, date } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const expense = await Expense.findById(id).populate('clientId');
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user has access to this expense
    if (userRole === 'employee' && expense.clientId.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update expenses for your assigned clients.'
      });
    }

    // Check if expense is already invoiced
    if (expense.isInvoiced) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update invoiced expense'
      });
    }

    // Validate amount
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (date !== undefined) updateData.date = new Date(date);

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate([
      { path: 'clientId', select: 'name company' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const expense = await Expense.findById(id).populate('clientId');
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user has access to this expense
    if (userRole === 'employee' && expense.clientId.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete expenses for your assigned clients.'
      });
    }

    // Check if expense is already invoiced
    if (expense.isInvoiced) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete invoiced expense'
      });
    }

    await Expense.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get expense statistics
const getExpenseStats = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    let matchQuery = {};
    
    // Employees can only see their assigned clients' expenses
    if (userRole === 'employee') {
      const clients = await Client.find({ assignedTo: userId }).select('_id');
      const clientIds = clients.map(client => client._id);
      matchQuery.clientId = { $in: clientIds };
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          categoryBreakdown: {
            $push: {
              category: '$category',
              amount: '$amount'
            }
          }
        }
      }
    ];

    const stats = await Expense.aggregate(pipeline);
    
    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalExpenses: 0,
          totalAmount: 0,
          averageAmount: 0,
          categoryBreakdown: {}
        }
      });
    }

    const result = stats[0];
    
    // Calculate category breakdown
    const categoryBreakdown = {};
    result.categoryBreakdown.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { count: 0, total: 0 };
      }
      categoryBreakdown[item.category].count += 1;
      categoryBreakdown[item.category].total += item.amount;
    });

    res.json({
      success: true,
      data: {
        totalExpenses: result.totalExpenses,
        totalAmount: result.totalAmount,
        averageAmount: Math.round(result.averageAmount * 100) / 100,
        categoryBreakdown
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

// Get all expenses (for managers)
const getAllExpenses = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    const { page = 1, limit = 50, client, category, dateRange } = req.query;
    const skip = (page - 1) * limit;

    // Only managers can access all expenses
    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    let matchQuery = {};

    // Apply filters
    if (client) {
      matchQuery.clientId = client;
    }

    if (category) {
      matchQuery.category = category;
    }

    if (dateRange) {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        matchQuery.date = { $gte: startDate };
      }
    }

    const expenses = await Expense.find(matchQuery)
      .populate('clientId', 'name company')
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(matchQuery);

    res.json({
      success: true,
      expenses: expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error getting all expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  addExpense,
  getClientExpenses,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getAllExpenses
};
