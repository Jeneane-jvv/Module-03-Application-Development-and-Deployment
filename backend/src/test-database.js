const {
  pool,
  testDatabaseConnection,
} = require('./config/database');

async function runDatabaseTest() {
  try {
    const connection = await testDatabaseConnection();

    console.log('\nFirstCommit database connection successful.');
    console.log('-------------------------------------------');
    console.log(`Database : ${connection.database_name}`);
    console.log(`User     : ${connection.database_user}`);
    console.log(`Connected: ${connection.connected_at}`);
  } catch (error) {
    console.error('\nFirstCommit database connection failed.');
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runDatabaseTest();