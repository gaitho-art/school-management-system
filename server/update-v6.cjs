const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDB() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Adding transport columns to students table...');
  try {
    await conn.query("ALTER TABLE students ADD COLUMN uses_transport TINYINT(1) DEFAULT 0");
    console.log('Added uses_transport column');
  } catch (e) { console.log('uses_transport column might already exist'); }

  console.log('Creating expenses table...');
  await conn.query(`CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100),
    expense_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('Expenses table ready');
  await conn.end();
}

const files = {
  'controllers/dashboardController.js': `import { pool } from '../config/db.js';

export async function getStats(req, res) {
  try {
    const [[s]] = await pool.query('SELECT COUNT(*) AS c FROM students WHERE status=\\'active\\'');
    const [[t]] = await pool.query('SELECT COUNT(*) AS c FROM teachers WHERE status=\\'active\\'');
    const [[c]] = await pool.query('SELECT COUNT(*) AS c FROM streams');
    const [[att]] = await pool.query('SELECT COUNT(*) AS c FROM attendance WHERE date = CURDATE() AND status=\\'present\\'');
    const [[fee]] = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM fee_payments');
    const [[exp]] = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM expenses');
    res.json({ students: s.c, teachers: t.c, classes: c.c, present_today: att.c, fees_collected: fee.total, total_expenses: exp.total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}`,
  'controllers/studentController.js': `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getStudents(req, res) {
  const [rows] = await pool.query('SELECT s.id, s.admission_number, s.full_name, s.gender, g.name as grade_name, s.uses_transport, s.status FROM students s LEFT JOIN grades g ON s.current_grade_id = g.id');
  res.json(rows);
}

export async function getStudentById(req, res) {
  const [students] = await pool.query('SELECT s.*, g.name as grade_name FROM students s LEFT JOIN grades g ON s.current_grade_id = g.id WHERE s.id = ?', [req.params.id]);
  if (students.length === 0) return res.status(404).json({ error: 'Student not found' });
  const student = students[0];
  
  const [payments] = await pool.query('SELECT * FROM fee_payments WHERE student_id = ? ORDER BY payment_date DESC', [req.params.id]);
  const [exams] = await pool.query('SELECT e.name as exam_name, sub.name as subject_name, er.marks, er.grade FROM exam_results er JOIN exams e ON er.exam_id = e.id JOIN subjects sub ON er.subject_id = sub.id WHERE er.student_id = ?', [req.params.id]);
  
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalBilled = 15000 + (student.uses_transport ? 5000 : 0); // Base 15000 + 5000 if using transport
  const balance = totalBilled - totalPaid;
  const totalMarks = exams.reduce((sum, ex) => sum + Number(ex.marks), 0);

  res.json({ ...student, payments, exams, totalPaid, totalBilled, balance, totalMarks });
}

export async function createStudent(req, res) {
  const b = req.body;
  const [lastStudent] = await pool.query("SELECT admission_number FROM students ORDER BY id DESC LIMIT 1");
  let nextNum = 1;
  if (lastStudent.length > 0 && lastStudent[0].admission_number) {
    const match = lastStudent[0].admission_number.match(/(\\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const admission_number = 'ADM-' + String(nextNum).padStart(3, '0');
  
  const toNull = (val) => (val === undefined || val === '') ? null : val;
  
  const [result] = await pool.execute(
    'INSERT INTO students (admission_number, full_name, gender, date_of_birth, current_grade_id, current_stream_id, guardian_name, guardian_phone, medical_conditions, uses_transport, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active")',
    [admission_number, toNull(b.full_name), toNull(b.gender), toNull(b.date_of_birth), toNull(b.current_grade_id), toNull(b.current_stream_id), toNull(b.guardian_name), toNull(b.guardian_phone), toNull(b.medical_conditions), b.uses_transport ? 1 : 0]
  );
  
  await logActivity(req.user, 'CREATE_STUDENT', 'students', 'Added student: ' + b.full_name);
  res.status(201).json({ id: result.insertId, admission_number, message: 'Student registered successfully' });
}

export async function addFeePayment(req, res) {
  const { student_id, amount, payment_method, paid_for_term } = req.body;
  const receipt_no = 'RCPT-' + Date.now();
  await pool.execute(
    'INSERT INTO fee_payments (student_id, amount, payment_method, receipt_no, paid_by, paid_for_term) VALUES (?, ?, ?, ?, ?, ?)',
    [student_id, amount, payment_method, receipt_no, req.user.id, paid_for_term || 1]
  );
  await logActivity(req.user, 'FEE_PAYMENT', 'fees', 'Recorded payment of ' + amount + ' for student ' + student_id);
  res.status(201).json({ receipt_no, message: 'Payment recorded successfully' });
}

export async function addExamResult(req, res) {
  const { student_id, exam_id, subject_id, marks, grade } = req.body;
  await pool.execute(
    'INSERT INTO exam_results (exam_id, student_id, subject_id, marks, grade) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE marks = VALUES(marks), grade = VALUES(grade)',
    [exam_id, student_id, subject_id, marks, grade]
  );
  res.status(201).json({ message: 'Exam result added' });
}`,
  'controllers/expenseController.js': `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getExpenses(req, res) {
  const [rows] = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
  res.json(rows);
}

export async function addExpense(req, res) {
  const { description, amount, category } = req.body;
  const [result] = await pool.execute(
    'INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)',
    [description, amount, category || 'General']
  );
  await logActivity(req.user, 'ADD_EXPENSE', 'finance', 'Recorded expense: ' + description);
  res.status(201).json({ id: result.insertId, message: 'Expense recorded successfully' });
}`,
  'routes/index.js': `import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { getProfile, updateProfile } from '../controllers/schoolController.js';
import { getStats } from '../controllers/dashboardController.js';
import { getStudents, getStudentById, createStudent, addFeePayment, addExamResult } from '../controllers/studentController.js';
import { getTeachers, createTeacher } from '../controllers/teacherController.js';
import { getGrades, getStreams, getSubjects } from '../controllers/metadataController.js';
import { assignClassTeacher, getClassTeachers } from '../controllers/classTeacherController.js';
import { assignTeacherSubject, getAssignments } from '../controllers/assignmentController.js';
import { getExamRankings } from '../controllers/examController.js';
import { getTimetable, addTimetableEntry } from '../controllers/timetableController.js';
import { getExpenses, addExpense } from '../controllers/expenseController.js';
import { authenticate, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);
router.get('/dashboard/stats', authenticate, getStats);

router.get('/school', authenticate, getProfile);
router.put('/school', authenticate, allow('admin'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'stamp', maxCount: 1 }]), updateProfile);

router.get('/grades', authenticate, getGrades);
router.get('/streams', authenticate, getStreams);
router.get('/subjects', authenticate, getSubjects);

router.get('/students', authenticate, getStudents);
router.get('/students/:id', authenticate, getStudentById);
router.post('/students', authenticate, allow('admin', 'admissions'), createStudent);
router.post('/fees/payment', authenticate, allow('admin', 'bursar'), addFeePayment);
router.post('/exams/results', authenticate, allow('admin', 'teacher'), addExamResult);

router.get('/teachers', authenticate, getTeachers);
router.post('/teachers', authenticate, allow('admin'), createTeacher);

router.get('/class-teachers', authenticate, getClassTeachers);
router.post('/class-teachers', authenticate, allow('admin'), assignClassTeacher);

router.get('/assignments', authenticate, getAssignments);
router.post('/assignments', authenticate, allow('admin'), assignTeacherSubject);

router.get('/exams/rankings/:examId', authenticate, getExamRankings);

router.get('/timetable', authenticate, getTimetable);
router.post('/timetable', authenticate, allow('admin'), addTimetableEntry);

router.get('/expenses', authenticate, getExpenses);
router.post('/expenses', authenticate, allow('admin', 'bursar'), addExpense);

export default router;`
};

// Run DB migration
migrateDB().catch(console.error);

// Write files
Object.entries(files).forEach(([filePath, content]) => {
  const dir = require('path').dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Backend updated successfully!');