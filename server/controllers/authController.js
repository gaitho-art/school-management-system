import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';
import { normalizeRole } from '../middleware/auth.js';

export async function login(req, res) {
  const { username, password, expectedRole } = req.body;
  if (!username || !password || !expectedRole) return res.status(400).json({ error: 'Username, password and account type required' });
  const [rows] = await pool.execute('SELECT u.id, u.username, u.password_hash, u.full_name, u.role_id, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.username = :u AND u.is_active = 1', { u: username });
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (normalizeRole(user.role) !== normalizeRole(expectedRole)) {
    return res.status(401).json({ error: 'Selected account type does not match this account' });
  }
  await pool.execute('UPDATE users SET last_login = NOW() WHERE id = :id', { id: user.id });
  await logActivity(user, 'LOGIN', 'auth', 'User logged in');
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.full_name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, user: { id: user.id, name: user.full_name, role: user.role, username: user.username } });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
