const User = require('../models/User');

// Check if user is authenticated (has active session)
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. Please log in.' 
    });
  }
  next();
};

// Check if user has specific role
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please log in.' 
      });
    }

    const userRole = req.session.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    
    next();
  };
};

// Check if user can access client (employee can only access assigned clients)
const checkClientAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    // Managers can access all clients
    if (userRole === 'manager') {
      return next();
    }

    // Employees can only access assigned clients
    const Client = require('../models/Client');
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }

    if (client.assignedTo.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only access assigned clients.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  requireAuth,
  checkRole,
  checkClientAccess
};
