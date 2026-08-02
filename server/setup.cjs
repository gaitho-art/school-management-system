const fs = require('fs');
const path = require('path');

const files = {
  'app.js': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { testConnection } from './config/db.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message || 'Server error' }));

const PORT = process.env.PORT || 5000;
testConnection().then(() => app.listen(PORT, () => console.log('API on http://localhost:' + PORT)));
`,
  'config/db.js': `import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('MySQL connected');
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }
}
`,
  'routes/index.js': `import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { getProfile, updateProfile } from '../controllers/schoolController.js';
import { getStats } from '../controllers/dashboardController.js';
import { authenticate, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);
router.get('/dashboard/stats', authenticate, getStats);
router.get('/school', authenticate, getProfile);
router.put('/school', authenticate, allow('admin'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'stamp', maxCount: 1 }]), updateProfile);

export default router;
`,
  'controllers/authController.js': `import bcrypt from 'bcrypt';
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
`,
  'controllers/dashboardController.js': `import { pool } from '../config/db.js';

export async function getStats(req, res) {
  try {
    const [[s]] = await pool.query('SELECT COUNT(*) AS c FROM students WHERE status=\\'active\\'');
    const [[t]] = await pool.query('SELECT COUNT(*) AS c FROM teachers WHERE status=\\'active\\'');
    const [[c]] = await pool.query('SELECT COUNT(*) AS c FROM streams');
    const [[att]] = await pool.query('SELECT COUNT(*) AS c FROM attendance WHERE date = CURDATE() AND status=\\'present\\'');
    const [[fee]] = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM fee_payments WHERE MONTH(payment_date)=MONTH(CURDATE()) AND YEAR(payment_date)=YEAR(CURDATE())');
    res.json({ students: s.c, teachers: t.c, classes: c.c, present_today: att.c, fees_collected: fee.total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
`,
  'controllers/schoolController.js': `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getProfile(req, res) {
  const [rows] = await pool.query('SELECT * FROM school_profile WHERE id = 1');
  res.json(rows[0] || {});
}

export async function updateProfile(req, res) {
  const fields = ['school_name','motto','vision','mission','address','county','sub_county','email','phone_primary','phone_secondary','principal_name','deputy_principal','opening_date','academic_year','logo_path','stamp_path','term1_start','term1_end','term2_start','term2_end','term3_start','term3_end'];
  const values = {};
  fields.forEach(f => { if (req.body[f] !== undefined) values[f] = req.body[f]; });
  if (req.files?.logo?.[0]) values.logo_path = '/uploads/logos/' + req.files.logo[0].filename;
  if (req.files?.stamp?.[0]) values.stamp_path = '/uploads/logos/' + req.files.stamp[0].filename;
  const exists = (await pool.query('SELECT id FROM school_profile WHERE id = 1'))[0].length;
  if (exists) {
    const cols = Object.keys(values).map(k => k + ' = :' + k).join(', ');
    await pool.execute('UPDATE school_profile SET ' + cols + ' WHERE id = 1', values);
  } else {
    values.id = 1;
    const cols = Object.keys(values).join(', ');
    const ph = Object.keys(values).map(k => ':' + k).join(', ');
    await pool.execute('INSERT INTO school_profile (' + cols + ') VALUES (' + ph + ')', values);
  }
  await logActivity(req.user, 'UPDATE_SCHOOL_PROFILE', 'school', 'Updated school profile');
  res.json({ message: 'School profile saved' });
}
`,
  'middleware/auth.js': `import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
    next();
  };
}
`,
  'middleware/upload.js': `import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
['photos','logos','documents'].forEach(d => {
  const p = path.join(uploadDir, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname === 'logo' || file.fieldname === 'stamp' ? 'logos' : file.mimetype.startsWith('image') ? 'photos' : 'documents';
    cb(null, path.join(uploadDir, type));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + ext);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|pdf|docx?/.test(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  }
});
`,
  'middleware/logActivity.js': `import { pool } from '../config/db.js';

export async function logActivity(user, action, module, detail = '') {
  try {
    await pool.execute('INSERT INTO activity_logs (user_id, action, module, detail, ip_address) VALUES (:uid, :a, :m, :d, :ip)', { uid: user?.id || null, a: action, m: module, d: detail, ip: '' });
  } catch (e) {
    console.warn('log fail', e.message);
  }
}
`,
  'scripts/initAdmin.js': `import bcrypt from 'bcrypt';
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
`,
  '.env': `PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=school_ms
JWT_SECRET=supersecretkey1234567890
JWT_EXPIRES_IN=8h
UPLOAD_DIR=./uploads
`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Created: ' + filePath);
});

console.log('All files created successfully!');