const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  testDatabaseConnection,
} = require('./config/database');

const missionsRouter = require('./routes/missions');
const authRouter = require('./routes/auth');
const attemptsRouter = require('./routes/attempts');
const reviewerRouter = require('./routes/reviewer');
const experienceRouter = require('./routes/experience');

const app = express();

if (!process.env.CORS_ORIGIN) {
  throw new Error('Missing required environment variable: CORS_ORIGIN');
}

// Reduce unnecessary framework information in HTTP responses.
app.disable('x-powered-by');

// Allow the Angular development application to call this API.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Accept JSON request bodies while limiting unnecessarily large payloads.
app.use(
  express.json({
    limit: '100kb',
  })
);

app.use('/api/missions', missionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/reviewer', reviewerRouter);
app.use('/api/experience', experienceRouter);

// Lightweight application health check.
// This proves Express is running; database readiness will be separate.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'FirstCommit Mission Control API',
    status: 'ok',
  });
});

app.get('/api/ready', async (req, res) => {
  try {
    const connection = await testDatabaseConnection();

    res.status(200).json({
      service: 'FirstCommit Mission Control API',
      status: 'ready',
      database: connection.database_name,
      databaseUser: connection.database_user,
    });
  } catch (error) {
    res.status(503).json({
      service: 'FirstCommit Mission Control API',
      status: 'not_ready',
      database: 'unavailable',
    });
  }
});

module.exports = app;