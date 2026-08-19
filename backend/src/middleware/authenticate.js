const jwt = require('jsonwebtoken');

const {
  pool,
} = require('../config/database');

if (!process.env.JWT_SECRET) {
  throw new Error(
    'Missing required environment variable: JWT_SECRET'
  );
}

async function authenticate(req, res, next) {
  const authorizationHeader = req.get('Authorization');

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      error: 'authentication_required',
      message: 'A valid authentication token is required.',
    });
  }

  const token = authorizationHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      error: 'authentication_required',
      message: 'A valid authentication token is required.',
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        issuer: 'firstcommit-mission-control-api',
        audience: 'firstcommit-mission-control',
      }
    );

    const userId = Number(payload.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: 'invalid_token',
        message: 'The authentication token is invalid.',
      });
    }

    const result = await pool.query(
      `
        SELECT
          user_id::int AS "userId",
          full_name AS "fullName",
          email,
          role

        FROM users

        WHERE user_id = $1
          AND is_active = TRUE

        LIMIT 1;
      `,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: 'invalid_token',
        message: 'The authentication token is invalid.',
      });
    }

    const user = result.rows[0];

    if (payload.role !== user.role) {
      return res.status(401).json({
        error: 'invalid_token',
        message: 'The authentication token is invalid.',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'The authentication token is invalid or expired.',
    });
  }
}

module.exports = authenticate;