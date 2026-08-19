const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');

const {
  pool,
} = require('../config/database');

const router = express.Router();

if (!process.env.JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

// POST /api/auth/login
// Verifies a FirstCommit user against the bcrypt hash stored in PostgreSQL
// and issues a signed JWT when authentication succeeds.

router.post('/login', async (req, res) => {
  const {
    email,
    password,
  } = req.body || {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.trim() === '' ||
    password === ''
  ) {
    return res.status(400).json({
      error: 'invalid_login_request',
      message: 'Email and password are required.',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      `
        SELECT
          user_id::int AS "userId",
          full_name AS "fullName",
          email,
          password_hash AS "passwordHash",
          role,
          is_active AS "isActive"

        FROM users

        WHERE LOWER(email) = LOWER($1)

        LIMIT 1;
      `,
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'The supplied email or password is incorrect.',
      });
    }

    const user = result.rows[0];

    if (!user.isActive) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'The supplied email or password is incorrect.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'The supplied email or password is incorrect.',
      });
    }

    const token = jwt.sign(
      {
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        subject: String(user.userId),
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        issuer: 'firstcommit-mission-control-api',
        audience: 'firstcommit-mission-control',
      }
    );

    res.status(200).json({
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Authentication failed:', error.message);

    res.status(500).json({
      error: 'authentication_service_unavailable',
      message: 'Authentication could not be completed.',
    });
  }
});
// GET /api/auth/me
// Returns the currently authenticated FirstCommit user.

router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    user: {
      userId: req.user.userId,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
    },
  });
});
module.exports = router;