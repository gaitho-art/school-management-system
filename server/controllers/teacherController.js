import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getTeachers(req, res) {
  const [rows] = await pool.query('SELECT id, teacher_number, full_name, phone, email, status FROM teachers');
  res.json(rows);
}

export async function createTeacher(req, res) {
  const { full_name, phone, email, qualification, tsc_number } = req.body;
  const teacher_number = 'TCH-' + Date.now();
  
  const [result] = await pool.execute(
    'INSERT INTO teachers (teacher_number, full_name, phone, email, qualification, tsc_number, status) VALUES (?, ?, ?, ?, ?, ?, "active")',
    [teacher_number, full_name, phone, email, qualification, tsc_number]
  );
  
  await logActivity(req.user, 'CREATE_TEACHER', 'teachers', 'Added teacher: ' + full_name);
  res.status(201).json({ id: result.insertId, teacher_number, message: 'Teacher registered successfully' });
}
