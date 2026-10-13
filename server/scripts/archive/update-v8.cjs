const fs = require('fs');

const files = {
  'controllers/examController.js': `import { pool } from '../config/db.js';

export async function getExamRankings(req, res) {
  const examId = req.params.examId || 1;
  const gradeId = req.query.grade_id;
  const streamId = req.query.stream_id;
  
  let query = \`
    SELECT s.id, s.admission_number, s.full_name, g.name as grade_name, st.name as stream_name, 
           SUM(er.marks) as total_marks, 
           AVG(er.marks) as average_marks,
           COUNT(er.id) as subjects_taken
    FROM students s
    JOIN exam_results er ON s.id = er.student_id
    LEFT JOIN grades g ON s.current_grade_id = g.id
    LEFT JOIN streams st ON s.current_stream_id = st.id
    WHERE er.exam_id = ? \${gradeId ? 'AND s.current_grade_id = ?' : ''} \${streamId ? 'AND s.current_stream_id = ?' : ''}
    GROUP BY s.id
    ORDER BY total_marks DESC
  \`;
  
  const params = [examId];
  if (gradeId) params.push(gradeId);
  if (streamId) params.push(streamId);
  
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
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
  const [exams] = await pool.query('SELECT e.name as exam_name, sub.name as subject_name, er.marks, er.grade, er.teacher_comment FROM exam_results er JOIN exams e ON er.exam_id = e.id JOIN subjects sub ON er.subject_id = sub.id WHERE er.student_id = ?', [req.params.id]);
  
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalBilled = 15000 + (student.uses_transport ? 5000 : 0); 
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

export async function updateStudent(req, res) {
  const b = req.body;
  const toNull = (val) => (val === undefined || val === '') ? null : val;
  await pool.execute(
    'UPDATE students SET current_grade_id = ?, current_stream_id = ?, guardian_name = ?, guardian_phone = ?, uses_transport = ? WHERE id = ?',
    [toNull(b.current_grade_id), toNull(b.current_stream_id), toNull(b.guardian_name), toNull(b.guardian_phone), b.uses_transport ? 1 : 0, req.params.id]
  );
  res.json({ message: 'Student updated successfully' });
}

export async function deleteStudent(req, res) {
  await pool.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
  res.json({ message: 'Student deleted' });
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
  const { student_id, exam_id, subject_id, marks, teacher_comment } = req.body;
  if (marks > 100 || marks < 0) return res.status(400).json({ error: 'Marks must be between 0 and 100' });
  let grade = 'E';
  if (marks >= 80) grade = 'A';
  else if (marks >= 65) grade = 'B';
  else if (marks >= 50) grade = 'C';
  else if (marks >= 40) grade = 'D';
  try {
    await pool.execute(
      'INSERT INTO exam_results (exam_id, student_id, subject_id, marks, grade, teacher_comment) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE marks = VALUES(marks), grade = VALUES(grade), teacher_comment = VALUES(teacher_comment)',
      [exam_id, student_id, subject_id, marks, grade, teacher_comment || null]
    );
    res.status(201).json({ message: 'Exam result added', grade });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
}

export async function deleteExpense(req, res) {
  await pool.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
  res.json({ message: 'Expense deleted' });
}`,
  'controllers/timetableController.js': `import { pool } from '../config/db.js';

export async function getTimetable(req, res) {
  const streamId = req.query.stream_id;
  let query = \`
    SELECT t.id, t.day_of_week, t.period, t.start_time, t.end_time, 
           g.name as grade_name, s.name as stream_name, 
           sub.name as subject_name, t.room
    FROM timetable t
    JOIN streams s ON t.stream_id = s.id
    JOIN grades g ON s.grade_id = g.id
    LEFT JOIN subjects sub ON t.subject_id = sub.id
  \`;
  const params = [];
  if (streamId) {
    query += ' WHERE t.stream_id = ?';
    params.push(streamId);
  }
  const [rows] = await pool.query(query, params);
  res.json(rows);
}

export async function addTimetableEntry(req, res) {
  const { stream_id, day_of_week, period, start_time, end_time, subject_id, room } = req.body;
  await pool.execute(
    'INSERT INTO timetable (stream_id, day_of_week, period, start_time, end_time, subject_id, room) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [stream_id, day_of_week, period, start_time, end_time, subject_id || null, room || null]
  );
  res.status(201).json({ message: 'Timetable entry added' });
}`,
  'routes/index.js': `import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { getProfile, updateProfile } from '../controllers/schoolController.js';
import { getStats } from '../controllers/dashboardController.js';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, addFeePayment, addExamResult } from '../controllers/studentController.js';
import { getTeachers, createTeacher } from '../controllers/teacherController.js';
import { getGrades, getStreams, getSubjects } from '../controllers/metadataController.js';
import { assignClassTeacher, getClassTeachers } from '../controllers/classTeacherController.js';
import { assignTeacherSubject, getAssignments } from '../controllers/assignmentController.js';
import { getExamRankings } from '../controllers/examController.js';
import { getTimetable, addTimetableEntry } from '../controllers/timetableController.js';
import { getExpenses, addExpense, deleteExpense } from '../controllers/expenseController.js';
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
router.put('/students/:id', authenticate, allow('admin', 'admissions'), updateStudent);
router.delete('/students/:id', authenticate, allow('admin'), deleteStudent);
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
router.delete('/expenses/:id', authenticate, allow('admin', 'bursar'), deleteExpense);

export default router;`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Backend updated successfully!');