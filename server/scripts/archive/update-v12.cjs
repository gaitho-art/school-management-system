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

  console.log('Creating inventory_items table if not exists...');
  await conn.query(`CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 0,
    unit VARCHAR(30) DEFAULT 'pcs',
    unit_cost DECIMAL(12,2) DEFAULT 0,
    condition_status ENUM('new','good','fair','damaged') DEFAULT 'good',
    date_added DATE DEFAULT (CURRENT_DATE)
  )`);
  console.log('Inventory table ready');
  await conn.end();
}

const files = {
  'controllers/inventoryController.js': `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';

export async function getItems(req, res) {
  const [rows] = await pool.query('SELECT * FROM inventory_items ORDER BY name ASC');
  res.json(rows);
}

export async function addItem(req, res) {
  const { name, category, quantity, unit, unit_cost, condition_status } = req.body;
  const [result] = await pool.execute(
    'INSERT INTO inventory_items (name, category, quantity, unit, unit_cost, condition_status) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category || 'General', quantity || 0, unit || 'pcs', unit_cost || 0, condition_status || 'good']
  );
  await logActivity(req.user, 'ADD_INVENTORY', 'inventory', 'Added item: ' + name);
  res.status(201).json({ id: result.insertId, message: 'Item added successfully' });
}

export async function updateItem(req, res) {
  const { name, category, quantity, unit, unit_cost, condition_status } = req.body;
  await pool.execute(
    'UPDATE inventory_items SET name = ?, category = ?, quantity = ?, unit = ?, unit_cost = ?, condition_status = ? WHERE id = ?',
    [name, category, quantity, unit, unit_cost, condition_status, req.params.id]
  );
  res.json({ message: 'Item updated successfully' });
}

export async function deleteItem(req, res) {
  await pool.execute('DELETE FROM inventory_items WHERE id = ?', [req.params.id]);
  res.json({ message: 'Item deleted' });
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
import { sendSMS } from '../controllers/smsController.js';
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

router.post('/sms/send', authenticate, allow('admin', 'bursar'), sendSMS);

// Inventory Routes
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
console.log('Backend updated for Inventory!');