import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { getProfile, updateProfile } from '../controllers/schoolController.js';
import { getStats } from '../controllers/dashboardController.js';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, addFeePayment, addStudentCharge, addExamResult, deleteExamResult, importStudents } from '../controllers/studentController.js';
import { getTeachers, createTeacher, createTeacherAccount } from '../controllers/teacherController.js';
import { getGrades, getStreams, getSubjects } from '../controllers/metadataController.js';
import { assignClassTeacher, getClassTeachers } from '../controllers/classTeacherController.js';
import { assignTeacherSubject, getAssignments } from '../controllers/assignmentController.js';
import { getExamRankings, getExamsList } from '../controllers/examController.js';
import { getTimetable, addTimetableEntry } from '../controllers/timetableController.js';
import { getExpenses, addExpense, deleteExpense } from '../controllers/expenseController.js';
import { getFinanceOverview, getTransactions } from '../controllers/financeController.js';
import { getAttendance, getAttendanceReport, markAttendance } from '../controllers/attendanceController.js';
import { getItems, addItem, updateItem, deleteItem } from '../controllers/inventoryController.js';
import { authenticate, allow } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { registerBloodUser, loginBloodUser, getBloodProfile, updateBloodProfile, getNearby, createBloodRequest, getMyRequests, respondToRequest, getRequestResponses, updateRequestStatus } from '../controllers/bloodController.js';

const router = Router();

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const requireBloodAccount = (req, res, next) => {
	if (!['donor', 'recipient', 'hospital'].includes(req.user?.accountType) || req.user.role !== req.user.accountType) {
		return res.status(403).json({ error: 'A blood-service account is required' });
	}
	return next();
};

router.post('/blood/auth/register', asyncRoute(registerBloodUser));
router.post('/blood/auth/login', asyncRoute(loginBloodUser));
router.get('/blood/auth/me', authenticate, requireBloodAccount, asyncRoute(getBloodProfile));
router.put('/blood/profile', authenticate, requireBloodAccount, asyncRoute(updateBloodProfile));
router.get('/blood/nearby', authenticate, requireBloodAccount, asyncRoute(getNearby));
router.post('/blood/requests', authenticate, requireBloodAccount, asyncRoute(createBloodRequest));
router.get('/blood/requests/mine', authenticate, requireBloodAccount, asyncRoute(getMyRequests));
router.post('/blood/requests/:id/respond', authenticate, requireBloodAccount, asyncRoute(respondToRequest));
router.get('/blood/requests/:id/responses', authenticate, requireBloodAccount, asyncRoute(getRequestResponses));
router.patch('/blood/requests/:id', authenticate, requireBloodAccount, asyncRoute(updateRequestStatus));

router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);
router.get('/dashboard/stats', authenticate, getStats);

router.get('/school', authenticate, getProfile);
router.put('/school', authenticate, allow('admin'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'stamp', maxCount: 1 }]), updateProfile);

router.get('/grades', authenticate, getGrades);
router.get('/streams', authenticate, getStreams);
router.get('/subjects', authenticate, getSubjects);

router.get('/students', authenticate, allow('admin', 'director', 'head_master', 'headmaster', 'admissions', 'teacher', 'class_teacher'), getStudents);
router.get('/students/:id', authenticate, allow('admin', 'director', 'head_master', 'headmaster', 'admissions', 'teacher', 'class_teacher'), getStudentById);
router.post('/students', authenticate, allow('admin', 'admissions'), upload.single('photo'), createStudent);
router.post('/students/import', authenticate, allow('admin', 'admissions'), upload.single('file'), importStudents);
router.put('/students/:id', authenticate, allow('admin', 'admissions'), updateStudent);
router.delete('/students/:id', authenticate, allow('admin'), deleteStudent);
router.post('/fees/payment', authenticate, allow('admin', 'director', 'head_master', 'headmaster', 'bursar'), addFeePayment);
router.post('/students/charge', authenticate, allow('admin', 'director', 'head_master', 'headmaster', 'bursar'), addStudentCharge);
router.post('/exams/results', authenticate, allow('admin', 'director', 'head_master', 'headmaster', 'teacher'), addExamResult);
router.delete('/exams/results/:id', authenticate, allow('admin', 'director', 'head_master', 'headmaster', 'teacher'), deleteExamResult);

router.get('/teachers', authenticate, getTeachers);
router.post('/teachers', authenticate, allow('admin'), upload.single('photo'), createTeacher);
router.post('/teachers/:id/account', authenticate, allow('admin'), createTeacherAccount);

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

router.get('/finance/overview', authenticate, allow('admin', 'director', 'head_master', 'headmaster', 'bursar'), getFinanceOverview);
router.get('/finance/transactions', authenticate, allow('admin', 'director', 'head_master', 'headmaster', 'bursar'), getTransactions);

router.get('/attendance', authenticate, getAttendance);
router.get('/attendance/report', authenticate, getAttendanceReport);
router.post('/attendance/mark', authenticate, allow('admin', 'teacher'), markAttendance);

router.get('/inventory', authenticate, getItems);
router.post('/inventory', authenticate, allow('admin', 'store_keeper'), addItem);
router.put('/inventory/:id', authenticate, allow('admin', 'store_keeper'), updateItem);
router.delete('/inventory/:id', authenticate, allow('admin', 'store_keeper'), deleteItem);

export default router;