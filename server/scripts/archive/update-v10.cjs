const fs = require('fs');

const files = {
  'controllers/attendanceController.js': `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getAttendance(req, res) {
  const { date, stream_id } = req.query;
  if (!date || !stream_id) return res.json([]);
  
  const [rows] = await pool.query(
    \`SELECT s.id, s.full_name, s.admission_number, a.status 
    FROM students s 
    LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ? 
    WHERE s.current_stream_id = ?\`,
    [date, stream_id]
  );
  res.json(rows);
}

export async function markAttendance(req, res) {
  const { date, stream_id, records } = req.body;
  
  for (const rec of records) {
    await pool.execute(
      \`INSERT INTO attendance (student_id, stream_id, date, status, recorded_by) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_by = VALUES(recorded_by)\`,
      [rec.student_id, stream_id, date, rec.status, req.user.id]
    );
  }
  
  await logActivity(req.user, 'MARK_ATTENDANCE', 'attendance', 'Marked attendance for class ID: ' + stream_id);
  res.status(201).json({ message: 'Attendance saved successfully' });
}`,
  'controllers/examController.js': `import { pool } from '../config/db.js';

export async function getExamsList(req, res) {
  const [rows] = await pool.query('SELECT id, name, term, academic_year FROM exams ORDER BY academic_year DESC, term ASC');
  res.json(rows);
}

export async function getExamRankings(req, res) {
  const examId = req.params.examId;
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
  'routes/index.js': `import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { getProfile, updateProfile } from '../controllers/schoolController.js';
import { getStats } from '../controllers/dashboardController.js';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, addFeePayment, addExamResult, deleteExamResult, importStudents } from '../controllers/studentController.js';
import { getTeachers, createTeacher } from '../controllers/teacherController.js';
import { getGrades, getStreams, getSubjects } from '../controllers/metadataController.js';
import { assignClassTeacher, getClassTeachers } from '../controllers/classTeacherController.js';
import { assignTeacherSubject, getAssignments } from '../controllers/assignmentController.js';
import { getExamRankings, getExamsList } from '../controllers/examController.js';
import { getTimetable, addTimetableEntry } from '../controllers/timetableController.js';
import { getExpenses, addExpense, deleteExpense } from '../controllers/expenseController.js';
import { getFinanceOverview, getTransactions } from '../controllers/financeController.js';
import { getAttendance, markAttendance } from '../controllers/attendanceController.js';
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

export default router;`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Backend updated for Attendance & Academic Years!');