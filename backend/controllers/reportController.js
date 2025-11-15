const Client = require('../models/Client');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// Get summary report
const getSummary = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const oid = new mongoose.Types.ObjectId(userId);
    const userRole = req.session.user.role;

    let matchQuery = {};
    
    // Employees can only see their assigned clients
    if (userRole === 'employee') {
      matchQuery.assignedTo = userId;
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' }
        }
      }
    ];

    const statusCounts = await Client.aggregate(pipeline);
    
    // Get total counts
    const totalClients = await Client.countDocuments(matchQuery);
    const totalValue = await Client.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
    ]);

    // Calculate conversion rate
    const wonClients = statusCounts.find(s => s._id === 'won')?.count || 0;
    const conversionRate = totalClients > 0 ? (wonClients / totalClients * 100).toFixed(2) : 0;

    res.json({
      success: true,
      summary: {
        totalClients,
        totalValue: totalValue[0]?.total || 0,
        conversionRate: parseFloat(conversionRate),
        statusBreakdown: statusCounts
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

// Get employee performance report
const getEmployeePerformance = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    
    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $group: {
          _id: '$assignedTo',
          employeeName: { $first: '$employee.name' },
          employeeEmail: { $first: '$employee.email' },
          totalClients: { $sum: 1 },
          wonClients: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] }
          },
          totalValue: { $sum: '$estimatedValue' },
          wonValue: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, '$estimatedValue', 0] }
          },
          statusCounts: {
            $push: {
              status: '$status',
              value: '$estimatedValue'
            }
          }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $cond: [
              { $gt: ['$totalClients', 0] },
              { $multiply: [{ $divide: ['$wonClients', '$totalClients'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { totalValue: -1 }
      }
    ];

    const performance = await Client.aggregate(pipeline);

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get revenue report
const getRevenueReport = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    let matchQuery = { status: 'won' };
    
    // Employees can only see their assigned clients
    if (userRole === 'employee') {
      matchQuery.assignedTo = userId;
    }

    // Add date filter based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    matchQuery.updatedAt = { $gte: startDate };

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$estimatedValue' },
          totalDeals: { $sum: 1 },
          averageDealValue: { $avg: '$estimatedValue' }
        }
      }
    ];

    const revenue = await Client.aggregate(pipeline);

    // Get monthly breakdown
    const monthlyPipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          revenue: { $sum: '$estimatedValue' },
          deals: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ];

    const monthlyBreakdown = await Client.aggregate(monthlyPipeline);

    res.json({
      success: true,
      revenue: {
        totalRevenue: revenue[0]?.totalRevenue || 0,
        totalDeals: revenue[0]?.totalDeals || 0,
        averageDealValue: revenue[0]?.averageDealValue || 0,
        monthlyBreakdown
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

// Get activity report
const getActivityReport = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    console.log('Activity report request:', {
      period,
      userId,
      userRole
    });

    let matchQuery = {};
    
    // Employees can only see their activities
    if (userRole === 'employee') {
      matchQuery.createdBy = userId;
    }

    // Add date filter
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    matchQuery.date = { $gte: startDate };

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          completed: { $sum: { $cond: ['$done', 1, 0] } }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$count', 0] },
              { $multiply: [{ $divide: ['$completed', '$count'] }, 100] },
              0
            ]
          }
        }
      }
    ];

    const activityStats = await Activity.aggregate(pipeline);

    console.log('Activity stats result:', activityStats);

    res.json({
      success: true,
      activityStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get quick stats for current employee
async function getEmployeeQuickStats(req, res) {
  try {
    const userId = req.session.user._id;
    const oid = new mongoose.Types.ObjectId(userId);

    // Clients assigned to this employee
    const totalClients = await Client.countDocuments({ assignedTo: oid });

    // Completed tasks assigned to this employee
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: oid } },
      {
        $group: {
          _id: null,
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);
    const completedTasks = taskStats[0]?.completed || 0;

    // Activities created by this employee (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activitiesTotal = await Activity.countDocuments({
      createdBy: oid,
      date: { $gte: sevenDaysAgo }
    });

    // Revenue total from won clients assigned to this employee (lifetime)
    const revenueAgg = await Client.aggregate([
      { $match: { assignedTo: oid, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    return res.json({
      success: true,
      summary: {
        clients: { total: totalClients },
        tasks: { completed: completedTasks },
        activities: { total: activitiesTotal },
        revenue: { total: totalRevenue }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

module.exports = {
  getSummary,
  getEmployeePerformance,
  getRevenueReport,
  getActivityReport,
  getEmployeeQuickStats
};