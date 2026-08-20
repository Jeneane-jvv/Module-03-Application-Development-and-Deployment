const bcrypt = require('bcrypt');
require('dotenv').config({
  override: true,
});

const {
  pool,
} = require('../config/database');

const BCRYPT_ROUNDS = 12;

const usersToSeed = [
  {
    fullName: 'FirstCommit Learner',
    email: 'learner@firstcommit.local',
    role: 'learner',
    passwordEnvironmentVariable: 'SEED_LEARNER_PASSWORD',
  },
  {
    fullName: 'FirstCommit Reviewer',
    email: 'reviewer@firstcommit.local',
    role: 'reviewer',
    passwordEnvironmentVariable: 'SEED_REVIEWER_PASSWORD',
  },
];

async function seedUser(client, user) {
  const plainPassword =
    process.env[user.passwordEnvironmentVariable];

  if (!plainPassword) {
    throw new Error(
      `Missing required environment variable: ${user.passwordEnvironmentVariable}`
    );
  }

  if (plainPassword.length < 12) {
    throw new Error(
      `${user.passwordEnvironmentVariable} must contain at least 12 characters.`
    );
  }

  const passwordHash = await bcrypt.hash(
    plainPassword,
    BCRYPT_ROUNDS
  );

  const existingUser = await client.query(
    `
      SELECT user_id
      FROM users
      WHERE LOWER(email) = LOWER($1);
    `,
    [user.email]
  );

  if (existingUser.rowCount === 0) {
    await client.query(
      `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          is_active
        )
        VALUES ($1, $2, $3, $4, TRUE);
      `,
      [
        user.fullName,
        user.email,
        passwordHash,
        user.role,
      ]
    );

    return 'created';
  }

  await client.query(
    `
      UPDATE users
      SET
        full_name = $1,
        password_hash = $2,
        role = $3,
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4;
    `,
    [
      user.fullName,
      passwordHash,
      user.role,
      existingUser.rows[0].user_id,
    ]
  );

  return 'updated';
}

async function seedUsers() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const user of usersToSeed) {
      const action = await seedUser(client, user);

      console.log(
        `${user.email} (${user.role}) ${action}.`
      );
    }

    await client.query('COMMIT');

    console.log(
      '\nFirstCommit authentication users seeded successfully.'
    );
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      '\nFirstCommit authentication user seeding failed.'
    );
    console.error(`Reason: ${error.message}`);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedUsers();