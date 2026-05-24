const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const apiRoutes = require('./routes/api');
const { SERVER_CONFIG } = require('./config/sources');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ code: -1, message: 'Internal Server Error' });
});

app.listen(SERVER_CONFIG.port, () => {
  logger.info(`Server running at http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
});

module.exports = app;
