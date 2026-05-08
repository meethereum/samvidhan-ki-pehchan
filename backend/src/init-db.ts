import pg from 'pg';
const { Pool } = pg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  console.log('Initializing database...');
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table checked/created.');

    // Seed admin user
    const username = 'admin';
    const password = 'admin123';
    
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
      console.log('Default user created: admin / admin123');
    } else {
      console.log('Default user already exists.');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
