# Logger Usage Guide

This document explains how to use the common Winston logger module in each microservice.

## Basic Usage

Every service has a `logger.js` module in its `src/utils` directory that exports a preconfigured logger instance as well as a factory function to create custom loggers.

### Importing the Logger

To use the default logger in your files:

```javascript
const { logger } = require('../utils/logger');

// Then use it
logger.info('This is an info message');
logger.error('This is an error message', { errorCode: 500 });
logger.debug('This is a debug message');
logger.warn('This is a warning message');
```

### Log Levels

The logger supports the following log levels (in order of priority):
- `error` - For errors and exceptions
- `warn` - For warnings
- `info` - For general information (default level)
- `debug` - For detailed debugging information
- `silly` - For extremely detailed debugging

The default log level is set to `info`, but can be overridden by setting the `LOG_LEVEL` environment variable.

### Adding Context to Logs

You can add additional metadata to your logs:

```javascript
logger.info('Processing payment', { 
  paymentId: 'abc123', 
  amount: 100.00, 
  currency: 'USD'
});
```

### Request Logging

All HTTP requests are automatically logged by middleware in the `index.js` file of each service:

```javascript
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    path: req.path,
    query: req.query,
  });
  next();
});
```

## Advanced Usage

### Creating a Custom Logger

If you need a logger with specific metadata or configuration for a particular module, you can use the `createLogger` factory function:

```javascript
const { createLogger } = require('../utils/logger');

// Create a custom logger with module-specific metadata
const paymentLogger = createLogger('payment-service', { 
  meta: { module: 'payment-processor' } 
});

paymentLogger.info('Payment processed successfully');
// Output will include { "service": "payment-service", "module": "payment-processor" }
```

### Changing Log Level Dynamically

The log level can be changed at runtime:

```javascript
const { logger } = require('../utils/logger');

// Enable debug logs for a specific operation
logger.level = 'debug';

// Do some operations with detailed logging...
logger.debug('Detailed operation information');

// Return to normal logging level
logger.level = 'info';
```

### Error Logging with Stack Traces

When logging errors, pass the actual Error object for automatic stack trace capture:

```javascript
try {
  // Some operation that might throw
  throw new Error('Something went wrong');
} catch (error) {
  logger.error('Failed to process operation', error);
  // The error stack trace will be included in the log
}
```

## Best Practices

1. Use the appropriate log level for different types of information
2. Include relevant context in logs (IDs, user info, etc.)
3. Don't log sensitive information (passwords, tokens, etc.)
4. Use structured logging (passing objects rather than concatenating strings)
5. For high-frequency operations, consider using `logger.debug` instead of `logger.info`
