const fs = require('fs');
const path = require('path');

const files = {
  'controllers/studentController.js': `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getStudents(req, res) {
  const [rows] = await pool.query('SELECT s.id, s.admission_number, s.full_name, s.gender, g.name as grade_name, s.status FROM students s LEFT JOIN grades g ON s.current_grade_id = g.id');
  res.json(rows);
}

export async function getStudentById(req, res) {
  const [students] = await pool.query('SELECT s.*, g.name as grade_name FROM students s LEFT JOIN grades g ON s.current_grade_id = g.id WHERE s.id = ?', [req.params.id]);
  if (students.length === 0) return res.status(404).json({ error: 'Student not found' });
  const student = students[0];
  
  const [payments] = await pool.query('SELECT * FROM fee_payments WHERE student_id = ? ORDER BY payment_date DESC', [req.params.id]);
  
  // Join exam_results with subjects to get subject names
  const [exams] = await pool.query('SELECT e.name as exam_name, sub.name as subject_name, er.marks, er.grade FROM exam_results er JOIN exams e ON er.exam_id = e.id JOIN subjects sub ON er.subject_id = sub.id WHERE er.student_id = ?', [req.params.id]);
  
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalBilled = 15000; 
  const balance = totalBilled - totalPaid;
  
  // Calculate total marks
  const totalMarks = exams.reduce((sum, ex) => sum + Number(ex.marks), 0);

  res.json({ ...student, payments, exams, totalPaid, totalBilled, balance, totalMarks });
}

export async function createStudent(req, res) {
  const { full_name, gender, date_of_birth, current_grade_id, current_stream_id, guardian_name, guardian_phone, medical_conditions } = req.body;
  const admission_number = 'ADM-' + Date.now();
  
  const [result] = await pool.execute(
    'INSERT INTO students (admission_number, full_name, gender, date_of_birth, current_grade_id, current_stream_id, guardian_name, guardian_phone, medical_conditions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "active")',
    [admission_number, full_name, gender, date_of_birth, current_grade_id || null, current_stream_id || null, guardian_name || null, guardian_phone || null, medical_conditions || null]
  );
  
  await logActivity(req.user, 'CREATE_STUDENT', 'students', 'Added student: ' + full_name);
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
  'controllers/assignmentController.js': `import { pool } from '../config/db.js';

export async function assignTeacherSubject(req, res) {
  const { teacher_id, stream_id, subject_id } = req.body;
  await pool.execute(
    'INSERT INTO teacher_assignments (teacher_id, stream_id, subject_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id)',
    [teacher_id, stream_id, subject_id]
  );
  res.status(201).json({ message: 'Teacher assigned to subject successfully' });
}

export async function getAssignments(req, res) {
  const [rows] = await pool.query(\`
    SELECT ta.id, t.full_name as teacher_name, g.name as grade_name, s.name as stream_name, sub.name as subject_name 
    FROM teacher_assignments ta 
    JOIN teachers t ON ta.teacher_id = t.id 
    JOIN streams s ON ta.stream_id = s.id 
    JOIN grades g ON s.grade_id = g.id 
    JOIN subjects sub ON ta.subject_id = sub.id
  \`);
  res.json(rows);
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

export default router;`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Backend updated successfully!');