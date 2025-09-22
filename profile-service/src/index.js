const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const memberRoutes = require('./routes/memberRoutes');

const { errorHandler } = require('../../shared/error-handler');

const app = express();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'profile-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

app.use(helmet());
app.use(cors());
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

app.use('/api', memberRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'profile-service' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  logger.info(`Profile service running on port ${PORT}`);
});

module.exports = app;
