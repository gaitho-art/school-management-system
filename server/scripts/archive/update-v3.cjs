const fs = require('fs');
const path = require('path');

const files = {
  'controllers/metadataController.js': `import { pool } from '../config/db.js';

export async function getGrades(req, res) {
  const [rows] = await pool.query('SELECT id, name FROM grades ORDER BY level_order');
  res.json(rows);
}

export async function getStreams(req, res) {
  // Join with grades so we know which grade the stream belongs to
  const [rows] = await pool.query('SELECT s.id, s.name, s.grade_id, g.name as grade_name FROM streams s JOIN grades g ON s.grade_id = g.id');
  res.json(rows);
}

export async function getSubjects(req, res) {
  const [rows] = await pool.query('SELECT id, name FROM subjects');
  res.json(rows);
}`,
  'controllers/classTeacherController.js': `import { pool } from '../config/db.js';

export async function assignClassTeacher(req, res) {
  const { stream_id, teacher_id, academic_year } = req.body;
  await pool.execute(
    'INSERT INTO class_teachers (stream_id, teacher_id, academic_year) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id)',
    [stream_id, teacher_id, academic_year || '2025']
  );
  res.status(201).json({ message: 'Class teacher assigned successfully' });
}

export async function getClassTeachers(req, res) {
  const [rows] = await pool.query(\`
    SELECT ct.id, t.full_name as teacher_name, t.teacher_number, g.name as grade_name, s.name as stream_name, ct.academic_year 
    FROM class_teachers ct 
    JOIN teachers t ON ct.teacher_id = t.id 
    JOIN streams s ON ct.stream_id = s.id 
    JOIN grades g ON s.grade_id = g.id
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
import { authenticate, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);
router.get('/dashboard/stats', authenticate, getStats);

router.get('/school', authenticate, getProfile);
router.put('/school', authenticate, allow('admin'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'stamp', maxCount: 1 }]), updateProfile);

// Metadata
router.get('/grades', authenticate, getGrades);
router.get('/streams', authenticate, getStreams);
router.get('/subjects', authenticate, getSubjects);

// Students & Fees & Exams
router.get('/students', authenticate, getStudents);
router.get('/students/:id', authenticate, getStudentById);
router.post('/students', authenticate, allow('admin', 'admissions'), createStudent);
router.post('/fees/payment', authenticate, allow('admin', 'bursar'), addFeePayment);
router.post('/exams/results', authenticate, allow('admin', 'teacher'), addExamResult);

// Teachers
router.get('/teachers', authenticate, getTeachers);
router.post('/teachers', authenticate, allow('admin'), createTeacher);

// Classes & Assignments
router.get('/class-teachers', authenticate, getClassTeachers);
router.post('/class-teachers', authenticate, allow('admin'), assignClassTeacher);

export default router;`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Backend updated successfully!');