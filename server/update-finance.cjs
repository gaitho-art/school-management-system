const fs = require('fs');

const files = {
  'controllers/financeController.js': `import { pool } from '../config/db.js';

export async function getFinanceOverview(req, res) {
  try {
    const [[collected]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments');
    const [[studentStats]] = await pool.query('SELECT COUNT(*) as count, SUM(uses_transport) as transport_count FROM students WHERE status = "active"');
    
    const totalExpected = (studentStats.count * 15000) + (studentStats.transport_count * 5000);
    const totalOutstanding = totalExpected - collected.total;
    
    res.json({
      collected: collected.total,
      expected: totalExpected,
      outstanding: totalOutstanding > 0 ? totalOutstanding : 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getTransactions(req, res) {
  try {
    const [rows] = await pool.query(\`
      SELECT fp.id, fp.receipt_no, fp.amount, fp.payment_method, fp.paid_for_term, fp.payment_date, 
             s.full_name, s.admission_number 
      FROM fee_payments fp 
      JOIN students s ON fp.student_id = s.id 
      ORDER BY fp.payment_date DESC
    \`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}`,
  'routes/index.js': `import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { getProfile, updateProfile } from '../controllers/schoolController.js';
import { getStats } from '../controllers/dashboardController.js';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, addFeePayment, addExamResult, deleteExamResult, importStudents } from '../controllers/studentController.js';
import { getTeachers, createTeacher } from '../controllers/teacherController.js';
import { getGrades, getStreams, getSubjects } from '../controllers/metadataController.js';
import { assignClassTeacher, getClassTeachers } from '../controllers/classTeacherController.js';
import { assignTeacherSubject, getAssignments } from '../controllers/assignmentController.js';
import { getExamRankings } from '../controllers/examController.js';
import { getTimetable, addTimetableEntry } from '../controllers/timetableController.js';
import { getExpenses, addExpense, deleteExpense } from '../controllers/expenseController.js';
import { getFinanceOverview, getTransactions } from '../controllers/financeController.js';
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
router.post('/exams/results', authenticate, allow('admin', 'teacher'), addExamResult);
router.delete('/exams/results/:id', authenticate, allow('admin', 'teacher'), deleteExamResult);

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

router.get('/finance/overview', authenticate, getFinanceOverview);
router.get('/finance/transactions', authenticate, getTransactions);

export default router;`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Backend updated for Finance Page!');