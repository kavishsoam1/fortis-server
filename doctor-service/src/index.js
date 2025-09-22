const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const doctorRoutes = require('./routes/doctorRoutes');
const { logger } = require('./utils/logger');
const { errorHandler } = require('../../shared/error-handler');

const app = express();

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

app.use('/api/doctors', doctorRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'doctor-service' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  logger.info(`Doctor service running on port ${PORT}`);
});

module.exports = app;
