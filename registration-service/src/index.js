const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const registrationRoutes = require('./routes/registrationRoutes');

const { errorHandler } = require('../../shared/error-handler');

const app = express();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'registration-service' },
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

app.use('/api', registrationRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'registration-service' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  logger.info(`Patient Registration service running on port ${PORT}`);
});

module.exports = app;
