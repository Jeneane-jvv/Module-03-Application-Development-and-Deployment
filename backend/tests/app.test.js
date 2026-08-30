const {
  after,
  before,
  test,
} = require('node:test');

const assert = require('node:assert/strict');


// Test-only environment configuration.
//
// These values allow the backend modules to load without using
// production credentials. The tests below deliberately avoid
// database-dependent endpoints.
process.env.NODE_ENV = 'test';
process.env.PGHOST = '127.0.0.1';
process.env.PGPORT = '5432';
process.env.PGDATABASE = 'firstcommit_test';
process.env.PGUSER = 'firstcommit_test';
process.env.PGPASSWORD =
  'test-only-password-not-for-production';
process.env.DATABASE_TLS_MODE = 'disable';
process.env.JWT_SECRET =
  'test-only-jwt-secret-not-for-production';
process.env.JWT_EXPIRES_IN = '1h';


const app = require('../src/app');


let server;
let baseUrl;


before(async () => {
  await new Promise((resolve) => {
    server = app.listen(
      0,
      '127.0.0.1',
      resolve,
    );
  });

  const address = server.address();

  baseUrl =
    `http://127.0.0.1:${address.port}`;
});


after(async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});


test(
  'GET /api/health returns service health',
  async () => {
    const response = await fetch(
      `${baseUrl}/api/health`,
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      body.service,
      'FirstCommit Mission Control API',
    );
    assert.equal(body.status, 'ok');
  },
);


test(
  'Express framework header is disabled',
  async () => {
    const response = await fetch(
      `${baseUrl}/api/health`,
    );

    assert.equal(
      response.headers.get('x-powered-by'),
      null,
    );
  },
);


test(
  'GET /api/auth/me rejects missing session cookie',
  async () => {
    const response = await fetch(
      `${baseUrl}/api/auth/me`,
    );

    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(
      body.error,
      'authentication_required',
    );
  },
);


test(
  'POST /api/auth/login validates required credentials',
  async () => {
    const response = await fetch(
      `${baseUrl}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
      body.error,
      'invalid_login_request',
    );
  },
);


test(
  'unknown API routes return API 404 response',
  async () => {
    const response = await fetch(
      `${baseUrl}/api/not-a-real-route`,
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.status, 'not_found');
    assert.equal(
      body.message,
      'API route not found.',
    );
  },
);


test(
  'JSON requests larger than 100 KB are rejected',
  async () => {
    const oversizedValue =
      'x'.repeat(101 * 1024);

    const response = await fetch(
      `${baseUrl}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: oversizedValue,
          password: 'test',
        }),
      },
    );

    assert.equal(response.status, 413);
  },
);
