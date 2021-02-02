// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

import dotenv from 'dotenv'
dotenv.config() // we want to synchronize @nuxt-dotenv and nuxt-env

// Load Package Details for some default values
const pkg = require('../package')

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' || false,
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
  NUXT_BUILD: process.env.NUXT_BUILD || '.nuxt',
  STYLEGUIDE_DEV: process.env.STYLEGUIDE_DEV || false,
  RELEASE: process.env.release,
}

const server = {
  GRAPHQL_URI: process.env.GRAPHQL_URI || 'http://localhost:4000',
  BACKEND_TOKEN: process.env.BACKEND_TOKEN || 'NULL',
}

const sentry = {
  SENTRY_DSN_WEBAPP: process.env.SENTRY_DSN_WEBAPP,
  COMMIT: process.env.COMMIT,
}

const options = {
  VERSION: process.env.VERSION || pkg.version,
  DESCRIPTION: process.env.DESCRIPTION || pkg.description,
  // Cookies
  COOKIE_EXPIRE_TIME: process.env.COOKIE_EXPIRE_TIME || 730, // Two years by default
  COOKIE_HTTPS_ONLY: process.env.COOKIE_HTTPS_ONLY || process.env.NODE_ENV === 'production', // ensure true in production if not set explicitly
}

const CONFIG = {
  ...environment,
  ...server,
  ...sentry,
  ...options,
}

// override process.env with the values here since they contain default values
process.env = {
  ...process.env,
  ...CONFIG,
}

export default CONFIG