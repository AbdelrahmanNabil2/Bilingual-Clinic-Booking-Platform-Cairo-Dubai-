const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep the pool lazy: no connection is opened until the first query runs,
  // so the API can boot even before a database is reachable.
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
