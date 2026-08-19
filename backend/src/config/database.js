const { Pool } = require('pg');
require('dotenv').config();

const requiredDatabaseVariables = [
  'PGHOST',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
];

for (const variableName of requiredDatabaseVariables) {
  if (!process.env[variableName]) {
    throw new Error(
      `Missing required database environment variable: ${variableName}`
    );
  }
}

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,

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