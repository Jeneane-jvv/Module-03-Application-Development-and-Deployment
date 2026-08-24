const { Pool } = require('pg');
require('dotenv').config();

const requiredDatabaseVariables = [
  'PGHOST',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'DATABASE_TLS_MODE',
];

for (const variableName of requiredDatabaseVariables) {
  if (!process.env[variableName]) {
    throw new Error(
      `Missing required database environment variable: ${variableName}`
    );
  }
}

const applicationEnvironment = process.env.NODE_ENV;

if (!applicationEnvironment) {
  throw new Error('Missing required environment variable: NODE_ENV');
}

const allowedTlsModes = new Set([
  'disable',
  'verify-full',
]);

const databaseTlsMode =
  process.env.DATABASE_TLS_MODE;

if (!allowedTlsModes.has(databaseTlsMode)) {
  throw new Error(
    'DATABASE_TLS_MODE must be either "disable" or "verify-full".'
  );
}

if (
  applicationEnvironment === 'production' &&
  databaseTlsMode !== 'verify-full'
) {
  throw new Error(
    'Production database connections must use DATABASE_TLS_MODE=verify-full.'
  );
}

const databaseSsl =
  databaseTlsMode === 'verify-full'
    ? {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      }
    : false;

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: databaseSsl,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function testDatabaseConnection() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        NOW() AS connected_at
    `);

    return result.rows[0];
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
};
