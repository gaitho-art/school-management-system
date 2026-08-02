const fs = require('fs');
const path = require('path');

const files = {
  'controllers/studentController.js': `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getStudents(req, res) {
  const [rows] = await pool.query('SELECT id, admission_number, full_name, gender, current_grade_id, status FROM students');
  res.json(rows);
}

export async function getStudentById(req, res) {
  const [students] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
  if (students.length === 0) return res.status(404).json({ error: 'Student not found' });
  
  const [payments] = await pool.query('SELECT * FROM fee_payments WHERE student_id = ?', [req.params.id]);
  
  // Calculate balance (Assuming default fee of 10000 for demo if no structure set)
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalBilled = 10000; 
  const balance = totalBilled - totalPaid;

  res.json({ ...students[0], payments, totalPaid, totalBilled, balance });
}

export async function createStudent(req, res) {
  const { full_name, gender, date_of_birth, parent_id, current_grade_id, current_stream_id, medical_conditions } = req.body;
  const admission_number = 'ADM-' + Date.now();
  
  const [result] = await pool.execute(
    'INSERT INTO students (admission_number, full_name, gender, date_of_birth, parent_id, current_grade_id, current_stream_id, medical_conditions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active")',
    [admission_number, full_name, gender, date_of_birth, parent_id || null, current_grade_id || null, current_stream_id || null, medical_conditions || null]
  );
  
  await logActivity(req.user, 'CREATE_STUDENT', 'students', 'Added student: ' + full_name);
  res.status(201).json({ id: result.insertId, admission_number, message: 'Student registered successfully' });
}

export async function addFeePayment(req, res) {
  const { student_id, amount, payment_method } = req.body;
  const receipt_no = 'RCPT-' + Date.now();
  
  await pool.execute(
    'INSERT INTO fee_payments (student_id, amount, payment_method, receipt_no, paid_by) VALUES (?, ?, ?, ?, ?)',
    [student_id, amount, payment_method, receipt_no, req.user.id]
  );
  
  await logActivity(req.user, 'FEE_PAYMENT', 'fees', 'Recorded payment of ' + amount + ' for student ' + student_id);
  res.status(201).json({ receipt_no, message: 'Payment recorded successfully' });
}
`,
  'controllers/teacherController.js': `import { pool } from '../config/db.js';
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
`,
  'routes/index.js': `import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { getProfile, updateProfile } from '../controllers/schoolController.js';
import { getStats } from '../controllers/dashboardController.js';
import { getStudents, getStudentById, createStudent, addFeePayment } from '../controllers/studentController.js';
import { getTeachers, createTeacher } from '../controllers/teacherController.js';
import { authenticate, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);

router.get('/dashboard/stats', authenticate, getStats);

router.get('/school', authenticate, getProfile);
router.put('/school', authenticate, allow('admin'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'stamp', maxCount: 1 }]), updateProfile);

// Students & Fees
router.get('/students', authenticate, getStudents);
router.get('/students/:id', authenticate, getStudentById);
router.post('/students', authenticate, allow('admin', 'admissions'), createStudent);
router.post('/fees/payment', authenticate, allow('admin', 'bursar'), addFeePayment);

// Teachers
router.get('/teachers', authenticate, getTeachers);
router.post('/teachers', authenticate, allow('admin'), createTeacher);

export default router;
`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Created/Updated: ' + filePath);
});

console.log('Backend modules added successfully!');