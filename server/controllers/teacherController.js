import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getTeachers(req, res) {
  const [rows] = await pool.query('SELECT id, teacher_number, full_name, phone, email, status FROM teachers');
  res.json(rows);
}

export async function createTeacher(req, res) {
  const { full_name, phone, email, qualification, tsc_number, national_id, tax_pin, nssf_number, sha_number, address, employment_date } = req.body;
  const teacher_number = 'TCH-' + Date.now();
  const toNull = (val) => (val === undefined || val === '') ? null : val;
  const photoPath = req.file ? req.file.filename : null;
  
  const [result] = await pool.execute(
    'INSERT INTO teachers (teacher_number, full_name, phone, email, qualification, tsc_number, national_id, tax_pin, nssf_number, sha_number, address, employment_date, photo_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active")',
    [teacher_number, toNull(full_name), toNull(phone), toNull(email), toNull(qualification), toNull(tsc_number), toNull(national_id), toNull(tax_pin), toNull(nssf_number), toNull(sha_number), toNull(address), toNull(employment_date), toNull(photoPath)]
  );
  
  await logActivity(req.user, 'CREATE_TEACHER', 'teachers', 'Added teacher: ' + full_name);
  res.status(201).json({ id: result.insertId, teacher_number, message: 'Teacher registered successfully' });
}
