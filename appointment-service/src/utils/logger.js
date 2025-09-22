const winston = require('winston');
const path = require('path');

/**
 * Create a configured Winston logger instance
 * @param {string} serviceName - Name of the service for logging context
 * @param {Object} options - Additional logger options
 * @returns {winston.Logger} Configured Winston logger instance
 */
const createLogger = (serviceName = 'appointment-service', options = {}) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { 
      service: serviceName,
      ...options.meta
    },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, service, ...rest }) => {
            const restString = Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : '';
            return `${timestamp} [${service}] ${level}: ${message}${restString}`;
          })
        ),
      }),
      // You can add additional transports here as needed
      // For example, file transport:
      // new winston.transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
      // new winston.transports.File({ filename: path.join('logs', 'combined.log') }),
    ],
  });
};

// Create default logger instance for the service
const logger = createLogger();

// Export both the factory function and the default logger
module.exports = {
  createLogger,
  logger
};
