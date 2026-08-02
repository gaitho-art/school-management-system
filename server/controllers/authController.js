import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const [rows] = await pool.execute('SELECT u.id, u.username, u.password_hash, u.full_name, u.role_id, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.username = :u AND u.is_active = 1', { u: username });
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  await pool.execute('UPDATE users SET last_login = NOW() WHERE id = :id', { id: user.id });
  await logActivity(user, 'LOGIN', 'auth', 'User logged in');
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.full_name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, user: { id: user.id, name: user.full_name, role: user.role, username: user.username } });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
