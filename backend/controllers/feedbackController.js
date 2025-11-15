const Feedback = require('../models/Feedback');
const Client = require('../models/Client');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { clientId, rating, comment, serviceQuality, communication, wouldRecommend, submittedBy, isAnonymous } = req.body;

    // Validate required fields
    if (!clientId || !rating || !submittedBy) {
      return res.status(400).json({
        success: false,
        message: 'Client ID, rating, and submitter name are required'
      });
    }

    // Check if client exists and is won
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (client.status !== 'won') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for won deals'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      clientId,
      rating,
      comment,
      serviceQuality,
      communication,
      wouldRecommend,
      submittedBy,
      isAnonymous
    });

    await feedback.save();

    // Update client's average rating
    await updateClientRating(clientId);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get feedback for a client
const getClientFeedback = async (req, res) => {
  try {
    const { clientId } = req.params;

    const feedback = await Feedback.find({ clientId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all feedback (manager only)
const getAllFeedback = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    
    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    const { page = 1, limit = 10, status = 'approved' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const feedback = await Feedback.find(query)
      .populate('clientId', 'name company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: feedback,
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

// Update feedback status (manager only)
const updateFeedbackStatus = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    
    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager role required.'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get feedback statistics
const getFeedbackStats = async (req, res) => {
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
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          averageServiceQuality: { $avg: '$serviceQuality' },
          averageCommunication: { $avg: '$communication' },
          wouldRecommendCount: { $sum: { $cond: ['$wouldRecommend', 1, 0] } },
          ratingDistribution: {
            $push: {
              rating: '$rating',
              count: 1
            }
          }
        }
      }
    ];

    const stats = await Feedback.aggregate(pipeline);
    
    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalFeedback: 0,
          averageRating: 0,
          averageServiceQuality: 0,
          averageCommunication: 0,
          recommendationRate: 0,
          ratingDistribution: {}
        }
      });
    }

    const result = stats[0];
    
    // Calculate rating distribution
    const ratingDistribution = {};
    result.ratingDistribution.forEach(item => {
      ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + item.count;
    });

    res.json({
      success: true,
      data: {
        totalFeedback: result.totalFeedback,
        averageRating: Math.round(result.averageRating * 10) / 10,
        averageServiceQuality: Math.round(result.averageServiceQuality * 10) / 10,
        averageCommunication: Math.round(result.averageCommunication * 10) / 10,
        recommendationRate: result.totalFeedback > 0 
          ? Math.round((result.wouldRecommendCount / result.totalFeedback) * 100) 
          : 0,
        ratingDistribution
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

// Helper function to update client rating
const updateClientRating = async (clientId) => {
  try {
    const feedback = await Feedback.find({ clientId, status: 'approved' });
    
    if (feedback.length === 0) return;

    const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = totalRating / feedback.length;

    await Client.findByIdAndUpdate(clientId, {
      averageRating: Math.round(averageRating * 10) / 10,
      feedbackCount: feedback.length
    });
  } catch (error) {
    console.error('Error updating client rating:', error);
  }
};

module.exports = {
  submitFeedback,
  getClientFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  getFeedbackStats
};
