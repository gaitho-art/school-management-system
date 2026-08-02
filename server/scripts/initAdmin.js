import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';
dotenv.config();
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
async function run() {
  try {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.execute('UPDATE users SET password_hash = :h WHERE username = :u', { h: hash, u: ADMIN_USERNAME });
    console.log('Admin password set to:', ADMIN_PASSWORD);
    process.exit(0);
  } catch (e) {
    console.error('Failed:', e.message);
    process.exit(1);
  }
}
run();
