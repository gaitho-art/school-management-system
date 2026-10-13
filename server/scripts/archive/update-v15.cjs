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

  console.log('Creating student_charges table...');
  await conn.query(`CREATE TABLE IF NOT EXISTS student_charges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    term TINYINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  )`);
  console.log('student_charges table ready');

  console.log('Updating fee_payments payment_type enum...');
  try {
    await conn.query("ALTER TABLE fee_payments MODIFY COLUMN payment_type ENUM('school_fees', 'transport', 'other_charges') DEFAULT 'school_fees'");
    console.log('payment_type updated');
  } catch (e) { console.log('payment_type enum might already be updated'); }

  await conn.end();
}

const files = {
  'controllers/studentController.js': `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';
import * as XLSX from 'xlsx';

export async function getStudents(req, res) {
  const [rows] = await pool.query(\`
    SELECT s.id, s.admission_number, s.full_name, s.gender, g.name as grade_name, s.uses_transport, s.status,
      (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE student_id = s.id AND payment_type = 'school_fees') as fees_paid,
      (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE student_id = s.id AND payment_type = 'transport') as transport_paid
    FROM students s 
    LEFT JOIN grades g ON s.current_grade_id = g.id
  \`);
  
  const students = rows.map(s => {
    const totalFeesBilled = 15000;
    const transportBilled = s.uses_transport ? 15000 : 0; // 5000 per term * 3
    return {
      ...s,
      fees_paid: Number(s.fees_paid),
      transport_paid: Number(s.transport_paid),
      fees_balance: totalFeesBilled - Number(s.fees_paid),
      transport_balance: transportBilled - Number(s.transport_paid)
    };
  });
  
  res.json(students);
}

export async function getStudentById(req, res) {
  const [students] = await pool.query('SELECT s.*, g.name as grade_name FROM students s LEFT JOIN grades g ON s.current_grade_id = g.id WHERE s.id = ?', [req.params.id]);
  if (students.length === 0) return res.status(404).json({ error: 'Student not found' });
  const student = students[0];
  
  const [payments] = await pool.query('SELECT * FROM fee_payments WHERE student_id = ? ORDER BY payment_date DESC', [req.params.id]);
  const [charges] = await pool.query('SELECT * FROM student_charges WHERE student_id = ? ORDER BY created_at DESC', [req.params.id]);
  const [exams] = await pool.query('SELECT er.id as result_id, e.name as exam_name, sub.name as subject_name, er.subject_id, er.exam_id, er.marks, er.grade, er.teacher_comment FROM exam_results er JOIN exams e ON er.exam_id = e.id JOIN subjects sub ON er.subject_id = sub.id WHERE er.student_id = ?', [req.params.id]);
  
  const expectedPerTerm = 5000;
  const transportPerTerm = 5000;
  
  const totalFeesBilled = expectedPerTerm * 3;
  const transportBilled = student.uses_transport ? transportPerTerm * 3 : 0;
  const otherChargesBilled = charges.reduce((sum, c) => sum + Number(c.amount), 0);
  
  const feesPaid = payments.filter(p => p.payment_type === 'school_fees').reduce((sum, p) => sum + Number(p.amount), 0);
  const transportPaid = payments.filter(p => p.payment_type === 'transport').reduce((sum, p) => sum + Number(p.amount), 0);
  const otherChargesPaid = payments.filter(p => p.payment_type === 'other_charges').reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalPaid = feesPaid + transportPaid + otherChargesPaid;
  const totalBilled = totalFeesBilled + transportBilled + otherChargesBilled;
  const balance = totalBilled - totalPaid;
  const totalMarks = exams.reduce((sum, ex) => sum + Number(ex.marks), 0);

  // Cumulative logic for school fees
  const cumPaidT1Fees = payments.filter(p => p.paid_for_term <= 1 && p.payment_type === 'school_fees').reduce((sum, p) => sum + Number(p.amount), 0);
  const cumPaidT2Fees = payments.filter(p => p.paid_for_term <= 2 && p.payment_type === 'school_fees').reduce((sum, p) => sum + Number(p.amount), 0);
  const cumPaidT3Fees = payments.filter(p => p.paid_for_term <= 3 && p.payment_type === 'school_fees').reduce((sum, p) => sum + Number(p.amount), 0);

  // Cumulative logic for transport
  const cumPaidT1Trans = payments.filter(p => p.paid_for_term <= 1 && p.payment_type === 'transport').reduce((sum, p) => sum + Number(p.amount), 0);
  const cumPaidT2Trans = payments.filter(p => p.paid_for_term <= 2 && p.payment_type === 'transport').reduce((sum, p) => sum + Number(p.amount), 0);
  const cumPaidT3Trans = payments.filter(p => p.paid_for_term <= 3 && p.payment_type === 'transport').reduce((sum, p) => sum + Number(p.amount), 0);

  res.json({ 
    ...student, 
    payments, 
    charges,
    exams, 
    totalPaid, 
    totalBilled, 
    balance, 
    totalMarks,
    transport: {
      billed: transportBilled,
      paid: transportPaid,
      balance: transportBilled - transportPaid
    },
    otherCharges: {
      billed: otherChargesBilled,
      paid: otherChargesPaid,
      balance: otherChargesBilled - otherChargesPaid
    },
    finances: {
      term1: { expected: expectedPerTerm, paid: cumPaidT1Fees, balance: expectedPerTerm - cumPaidT1Fees },
      term2: { expected: expectedPerTerm, paid: cumPaidT2Fees - cumPaidT1Fees, balance: (expectedPerTerm * 2) - cumPaidT2Fees },
      term3: { expected: expectedPerTerm, paid: cumPaidT3Fees - cumPaidT2Fees, balance: (expectedPerTerm * 3) - cumPaidT3Fees },
    },
    transportFinances: {
      term1: { expected: transportPerTerm, paid: cumPaidT1Trans, balance: transportPerTerm - cumPaidT1Trans },
      term2: { expected: transportPerTerm, paid: cumPaidT2Trans - cumPaidT1Trans, balance: (transportPerTerm * 2) - cumPaidT2Trans },
      term3: { expected: transportPerTerm, paid: cumPaidT3Trans - cumPaidT2Trans, balance: (transportPerTerm * 3) - cumPaidT3Trans },
    }
  });
}

export async function createStudent(req, res) {
  const b = req.body;
  const [lastStudent] = await pool.query("SELECT admission_number FROM students ORDER BY id DESC LIMIT 1");
  let nextNum = 1;
  if (lastStudent.length > 0 && lastStudent[0].admission_number) {
    const match = lastStudent[0].admission_number.match(/(\\\\d+)$/);
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
  const { student_id, amount, payment_method, paid_for_term, payment_type } = req.body;
  const receipt_no = 'RCPT-' + Date.now();
  await pool.execute(
    'INSERT INTO fee_payments (student_id, amount, payment_method, receipt_no, paid_by, paid_for_term, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [student_id, amount, payment_method, receipt_no, req.user.id, paid_for_term || 1, payment_type || 'school_fees']
  );
  await logActivity(req.user, 'FEE_PAYMENT', 'fees', 'Recorded ' + (payment_type || 'fee') + ' payment of ' + amount + ' for student ' + student_id);
  res.status(201).json({ receipt_no, message: 'Payment recorded successfully' });
}

export async function addStudentCharge(req, res) {
  const { student_id, description, amount, term } = req.body;
  await pool.execute(
    'INSERT INTO student_charges (student_id, description, amount, term) VALUES (?, ?, ?, ?)',
    [student_id, description, amount, term || null]
  );
  await logActivity(req.user, 'ADD_CHARGE', 'finance', 'Added charge: ' + description + ' for student ' + student_id);
  res.status(201).json({ message: 'Charge added successfully' });
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
    res.status(201).json({ message: 'Exam result added/updated', grade });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function deleteExamResult(req, res) {
  await pool.execute('DELETE FROM exam_results WHERE id = ?', [req.params.id]);
  res.json({ message: 'Exam result deleted' });
}

export async function importStudents(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const [lastStudent] = await pool.query("SELECT admission_number FROM students ORDER BY id DESC LIMIT 1");
    let nextNum = 1;
    if (lastStudent.length > 0 && lastStudent[0].admission_number) {
      const match = lastStudent[0].admission_number.match(/(\\\\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    const toNull = (val) => (val === undefined || val === '') ? null : val;
    let importedCount = 0;

    for (const row of data) {
      const admission_number = 'ADM-' + String(nextNum).padStart(3, '0');
      nextNum++;
      
      await pool.execute(
        'INSERT INTO students (admission_number, full_name, gender, date_of_birth, guardian_name, guardian_phone, uses_transport, status) VALUES (?, ?, ?, ?, ?, ?, ?, "active")',
        [admission_number, toNull(row.full_name), toNull(row.gender), toNull(row.date_of_birth), toNull(row.guardian_name), toNull(row.guardian_phone), row.uses_transport ? 1 : 0]
      );
      importedCount++;
    }

    await logActivity(req.user, 'IMPORT_STUDENTS', 'students', 'Imported ' + importedCount + ' students via Excel');
    res.status(201).json({ message: 'Successfully imported ' + importedCount + ' students!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}`,
  'routes/index.js': `import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { getProfile, updateProfile } from '../controllers/schoolController.js';
import { getStats } from '../controllers/dashboardController.js';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, addFeePayment, addStudentCharge, addExamResult, deleteExamResult, importStudents } from '../controllers/studentController.js';
import { getTeachers, createTeacher } from '../controllers/teacherController.js';
import { getGrades, getStreams, getSubjects } from '../controllers/metadataController.js';
import { assignClassTeacher, getClassTeachers } from '../controllers/classTeacherController.js';
import { assignTeacherSubject, getAssignments } from '../controllers/assignmentController.js';
import { getExamRankings, getExamsList } from '../controllers/examController.js';
import { getTimetable, addTimetableEntry } from '../controllers/timetableController.js';
import { getExpenses, addExpense, deleteExpense } from '../controllers/expenseController.js';
import { getFinanceOverview, getTransactions } from '../controllers/financeController.js';
import { getAttendance, markAttendance } from '../controllers/attendanceController.js';
import { getItems, addItem, updateItem, deleteItem } from '../controllers/inventoryController.js';
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
router.post('/students/import', authenticate, allow('admin', 'admissions'), upload.single('file'), importStudents);
router.put('/students/:id', authenticate, allow('admin', 'admissions'), updateStudent);
router.delete('/students/:id', authenticate, allow('admin'), deleteStudent);
router.post('/fees/payment', authenticate, allow('admin', 'bursar'), addFeePayment);
router.post('/students/charge', authenticate, allow('admin', 'bursar'), addStudentCharge);
router.post('/exams/results', authenticate, allow('admin', 'teacher'), addExamResult);
router.delete('/exams/results/:id', authenticate, allow('admin', 'teacher'), deleteExamResult);

router.get('/teachers', authenticate, getTeachers);
router.post('/teachers', authenticate, allow('admin'), createTeacher);

router.get('/class-teachers', authenticate, getClassTeachers);
router.post('/class-teachers', authenticate, allow('admin'), assignClassTeacher);

router.get('/assignments', authenticate, getAssignments);
router.post('/assignments', authenticate, allow('admin'), assignTeacherSubject);

router.get('/exams/list', authenticate, getExamsList);
router.get('/exams/rankings/:examId', authenticate, getExamRankings);

router.get('/timetable', authenticate, getTimetable);
router.post('/timetable', authenticate, allow('admin'), addTimetableEntry);

router.get('/expenses', authenticate, getExpenses);
router.post('/expenses', authenticate, allow('admin', 'bursar'), addExpense);
router.delete('/expenses/:id', authenticate, allow('admin', 'bursar'), deleteExpense);

router.get('/finance/overview', authenticate, getFinanceOverview);
router.get('/finance/transactions', authenticate, getTransactions);

router.get('/attendance', authenticate, getAttendance);
router.post('/attendance/mark', authenticate, allow('admin', 'teacher'), markAttendance);

router.get('/inventory', authenticate, getItems);
router.post('/inventory', authenticate, allow('admin', 'store_keeper'), addItem);
router.put('/inventory/:id', authenticate, allow('admin', 'store_keeper'), updateItem);
router.delete('/inventory/:id', authenticate, allow('admin', 'store_keeper'), deleteItem);

export default router;`
};

// Run DB migration
migrateDB().catch(console.error);

// Write files
Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Backend updated for Term Transport & Other Charges!');