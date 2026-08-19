require('dotenv').config();

const app = require('./app');
const {
  pool,
  testDatabaseConnection,
} = require('./config/database');

const port = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    const databaseConnection = await testDatabaseConnection();

    console.log('\nPostgreSQL readiness check passed.');
    console.log(
      `Database: ${databaseConnection.database_name} | User: ${databaseConnection.database_user}`
    );

    const server = app.listen(port, () => {
      console.log(`FirstCommit Mission Control API listening on port ${port}.`);
      console.log(`Health: http://localhost:${port}/api/health`);
    });

    async function shutdown(signal) {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        await pool.end();
        console.log('HTTP server and PostgreSQL pool closed.');
        process.exit(0);
      });
    }

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('\nFirstCommit API failed to start.');
    console.error(`Reason: ${error.message}`);

    await pool.end();
    process.exit(1);
  }
}

startServer();