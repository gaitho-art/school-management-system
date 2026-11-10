import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

async function createTeacherLogin(connection, teacher, username, password) {
  await connection.execute(
    'INSERT INTO roles (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
    ['teacher']
  );
  const [roles] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['teacher']);
  const passwordHash = await bcrypt.hash(password, 10);
  const [userResult] = await connection.execute(
    'INSERT INTO users (role_id, full_name, email, phone, username, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [roles[0].id, teacher.full_name, teacher.email || null, teacher.phone || null, username, passwordHash]
  );
  return userResult.insertId;
}

export async function getTeachers(req, res) {
  const [rows] = await pool.query('SELECT id, teacher_number, full_name, phone, email, status, user_id IS NOT NULL AS has_login FROM teachers');
  res.json(rows);
}

export async function createTeacher(req, res) {
  const { full_name, phone, email, qualification, tsc_number, national_id, tax_pin, nssf_number, sha_number, address, employment_date, username, password } = req.body;
  if (!full_name || !phone || !username || !password) {
    return res.status(400).json({ error: 'Name, phone, username and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const teacher_number = 'TCH-' + Date.now();
  const toNull = (val) => (val === undefined || val === '') ? null : val;
  const photoPath = req.file ? req.file.filename : null;
  const connection = await pool.getConnection();
  let teacherId;

  try {
    await connection.beginTransaction();
    const userId = await createTeacherLogin(
      connection,
      { full_name, phone, email: toNull(email) },
      username,
      password
    );
    const [teacherResult] = await connection.execute(
      'INSERT INTO teachers (user_id, teacher_number, full_name, phone, email, qualification, tsc_number, national_id, tax_pin, nssf_number, sha_number, address, employment_date, photo_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active")',
      [userId, teacher_number, toNull(full_name), toNull(phone), toNull(email), toNull(qualification), toNull(tsc_number), toNull(national_id), toNull(tax_pin), toNull(nssf_number), toNull(sha_number), toNull(address), toNull(employment_date), toNull(photoPath)]
    );
    teacherId = teacherResult.insertId;
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That username or email is already in use' });
    }
    throw error;
  } finally {
    connection.release();
  }

  await logActivity(req.user, 'CREATE_TEACHER', 'teachers', 'Added teacher: ' + full_name);
  res.status(201).json({ id: teacherId, teacher_number, message: 'Teacher and login account created successfully' });
}

export async function createTeacherAccount(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const connection = await pool.getConnection();
  let teacher;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT id, full_name, email, phone, user_id FROM teachers WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    teacher = rows[0];
    if (!teacher) {
      await connection.rollback();
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const userId = await createTeacherLogin(connection, teacher, username, password);
    await connection.execute('UPDATE teachers SET user_id = ? WHERE id = ?', [userId, teacher.id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That username or email is already in use' });
    }
    throw error;
  } finally {
    connection.release();
  }

  await logActivity(req.user, 'CREATE_TEACHER_LOGIN', 'teachers', 'Created login for: ' + teacher.full_name);
  res.status(201).json({ message: 'Teacher login account created successfully' });
}
