const fs = require('fs');

const content = `import { pool } from '../config/db.js';
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
  const [exams] = await pool.query('SELECT e.name as exam_name, sub.name as subject_name, er.marks, er.grade FROM exam_results er JOIN exams e ON er.exam_id = e.id JOIN subjects sub ON er.subject_id = sub.id WHERE er.student_id = ?', [req.params.id]);
  
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalBilled = 15000; 
  const balance = totalBilled - totalPaid;
  const totalMarks = exams.reduce((sum, ex) => sum + Number(ex.marks), 0);

  res.json({ ...student, payments, exams, totalPaid, totalBilled, balance, totalMarks });
}

export async function createStudent(req, res) {
  const b = req.body;
  const admission_number = 'ADM-' + Date.now();
  
  // Convert undefined or empty strings to null
  const toNull = (val) => (val === undefined || val === '') ? null : val;
  
  const full_name = toNull(b.full_name);
  const gender = toNull(b.gender);
  const date_of_birth = toNull(b.date_of_birth);
  const current_grade_id = toNull(b.current_grade_id);
  const current_stream_id = toNull(b.current_stream_id);
  const guardian_name = toNull(b.guardian_name);
  const guardian_phone = toNull(b.guardian_phone);
  const medical_conditions = toNull(b.medical_conditions);
  
  const [result] = await pool.execute(
    'INSERT INTO students (admission_number, full_name, gender, date_of_birth, current_grade_id, current_stream_id, guardian_name, guardian_phone, medical_conditions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "active")',
    [admission_number, full_name, gender, date_of_birth, current_grade_id, current_stream_id, guardian_name, guardian_phone, medical_conditions]
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
}
`;

fs.writeFileSync('controllers/studentController.js', content);
console.log('Student controller updated successfully!');