const jwt = require('jsonwebtoken');
const { ApiError } = require('../../../shared/error-handler');

/**
 * Authentication middleware
 * Verifies the JWT access token in the Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new ApiError(401, 'Authorization header is required');
    }
    
    // Check if header format is correct
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(401, 'Authorization header format must be "Bearer {token}"');
    }
    
    const token = parts[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fortis-jwt-secret');
    
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token has expired'));
    }
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Tries to verify the JWT access token but doesn't fail if not present
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continue without authentication
    }
    
    // Check if header format is correct
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(); // Continue without authentication
    }
    
    const token = parts[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fortis-jwt-secret');
    
    req.user = decoded;
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
