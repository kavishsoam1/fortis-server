const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const paymentRoutes = require('./routes/paymentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const { logger } = require('./utils/logger');
const { errorHandler } = require('../../shared/error-handler');

const app = express();

app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    path: req.path,
    query: req.query,
  });
  next();
});

app.use('/api', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'payment-service' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  logger.info(`Payment service running on port ${PORT}`);
});

module.exports = app;
