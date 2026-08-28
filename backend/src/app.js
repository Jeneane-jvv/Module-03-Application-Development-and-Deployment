const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
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

const frontendBuildPath = path.resolve(
  __dirname,
  '../../frontend/dist/frontend/browser'
);

const frontendIndexPath = path.join(
  frontendBuildPath,
  'index.html'
);

const frontendBuildExists =
  fs.existsSync(frontendIndexPath);

if (
  process.env.NODE_ENV === 'production' &&
  !frontendBuildExists
) {
  throw new Error(
    `Angular production build not found: ${frontendIndexPath}`
  );
}

// Reduce unnecessary framework information in HTTP responses.
app.disable('x-powered-by');

// Parse authentication cookies before protected API routes.
app.use(cookieParser());

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
// This proves Express is running; database readiness is separate.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'FirstCommit Mission Control API',
    status: 'ok',
  });
});

app.get('/api/ready', async (req, res) => {
  try {
    await testDatabaseConnection();

    res.status(200).json({
      service: 'FirstCommit Mission Control API',
      status: 'ready',
      database: 'available',
    });
  } catch (error) {
    res.status(503).json({
      service: 'FirstCommit Mission Control API',
      status: 'not_ready',
      database: 'unavailable',
    });
  }
});

// API requests must never fall through to the Angular SPA.
app.use('/api', (req, res) => {
  res.status(404).json({
    service: 'FirstCommit Mission Control API',
    status: 'not_found',
    message: 'API route not found.',
  });
});

if (frontendBuildExists) {
  // Serve the compiled Angular application.
  app.use(
    express.static(frontendBuildPath)
  );

  // Support Angular client-side routes and browser refreshes.
  app.get('/{*splat}', (req, res, next) => {
    // Missing static assets should remain genuine 404 responses.
    if (path.extname(req.path)) {
      return next();
    }

    return res.sendFile(frontendIndexPath);
  });
}

// Final fallback for requests not handled above.
app.use((req, res) => {
  res.status(404).json({
    service: 'FirstCommit',
    status: 'not_found',
  });
});

module.exports = app;
