const fs = require('fs');
const path = require('path');

const files = {
  'controllers/examController.js': `import { pool } from '../config/db.js';

export async function getExamRankings(req, res) {
  const examId = req.params.examId || 1;
  const [rows] = await pool.query(\`
    SELECT s.id, s.admission_number, s.full_name, g.name as grade_name, 
           SUM(er.marks) as total_marks, 
           AVG(er.marks) as average_marks,
           COUNT(er.id) as subjects_taken
    FROM students s
    JOIN exam_results er ON s.id = er.student_id
    LEFT JOIN grades g ON s.current_grade_id = g.id
    WHERE er.exam_id = ?
    GROUP BY s.id
    ORDER BY total_marks DESC
  \`, [examId]);
  res.json(rows);
}`,
  'controllers/timetableController.js': `import { pool } from '../config/db.js';

export async function getTimetable(req, res) {
  const [rows] = await pool.query(\`
    SELECT t.id, t.day_of_week, t.period, t.start_time, t.end_time, 
           g.name as grade_name, s.name as stream_name, 
           sub.name as subject_name, t.room
    FROM timetable t
    JOIN streams s ON t.stream_id = s.id
    JOIN grades g ON s.grade_id = g.id
    LEFT JOIN subjects sub ON t.subject_id = sub.id
  \`);
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
import { getStudents, getStudentById, createStudent, addFeePayment, addExamResult } from '../controllers/studentController.js';
import { getTeachers, createTeacher } from '../controllers/teacherController.js';
import { getGrades, getStreams, getSubjects } from '../controllers/metadataController.js';
import { assignClassTeacher, getClassTeachers } from '../controllers/classTeacherController.js';
import { assignTeacherSubject, getAssignments } from '../controllers/assignmentController.js';
import { getExamRankings } from '../controllers/examController.js';
import { getTimetable, addTimetableEntry } from '../controllers/timetableController.js';
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

export default router;`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Backend updated successfully!');