const AUTH_COOKIE_NAME =
  'firstcommit_session';

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:
    process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

module.exports = {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
};
