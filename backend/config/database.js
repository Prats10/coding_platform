// This file connects our app to PostgreSQL database

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
// Pool = manages multiple database connections efficiently
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Database connected successfully at:', res.rows[0].now);
    }
});

// Export so other files can use it
module.exports = pool;