import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const DEFAULT_PASSWORD = 'Demo@2026';

const RESET_TABLES = [
  'messages',
  'announcements',
  'timetable',
  'inventory_transactions',
  'inventory_items',
  'library_borrowing',
  'library_books',
  'fee_payments',
  'fee_discounts',
  'fee_structures',
  'exam_results',
  'exams',
  'exam_types',
  'attendance',
  'students',
  'parents',
  'class_teachers',
  'teachers',
  'users',
  'roles',
  'streams',
  'grades',
  'subjects',
  'departments',
  'school_profile',
  'settings',
];

const roleNames = [
  'admin',
  'principal',
  'deputy',
  'teacher',
  'class_teacher',
  'bursar',
  'librarian',
  'store_keeper',
  'admissions',
  'parent',
];

const departmentNames = [
  'Primary',
  'Mathematics',
  'Sciences',
  'Languages',
  'Humanities',
  'ICT',
  'Arts',
];

const gradeRows = [
  { code: 'PP1', name: 'Pre-Primary 1', level_order: 1 },
  { code: 'PP2', name: 'Pre-Primary 2', level_order: 2 },
  { code: 'G1', name: 'Grade 1', level_order: 3 },
  { code: 'G2', name: 'Grade 2', level_order: 4 },
  { code: 'G3', name: 'Grade 3', level_order: 5 },
  { code: 'G4', name: 'Grade 4', level_order: 6 },
  { code: 'G5', name: 'Grade 5', level_order: 7 },
  { code: 'G6', name: 'Grade 6', level_order: 8 },
  { code: 'G7', name: 'Grade 7', level_order: 9 },
  { code: 'G8', name: 'Grade 8', level_order: 10 },
];

const streamRows = [
  { gradeCode: 'PP1', name: 'Sunrise', capacity: 35 },
  { gradeCode: 'PP1', name: 'Twilight', capacity: 35 },
  { gradeCode: 'PP2', name: 'Sunrise', capacity: 35 },
  { gradeCode: 'PP2', name: 'Twilight', capacity: 35 },
  { gradeCode: 'G1', name: 'Ruby', capacity: 40 },
  { gradeCode: 'G1', name: 'Jade', capacity: 40 },
  { gradeCode: 'G2', name: 'Oak', capacity: 40 },
  { gradeCode: 'G2', name: 'Maple', capacity: 40 },
  { gradeCode: 'G3', name: 'Coral', capacity: 42 },
  { gradeCode: 'G3', name: 'Lily', capacity: 42 },
  { gradeCode: 'G4', name: 'Cedar', capacity: 42 },
  { gradeCode: 'G4', name: 'Pine', capacity: 42 },
  { gradeCode: 'G5', name: 'Aster', capacity: 45 },
  { gradeCode: 'G5', name: 'Willow', capacity: 45 },
  { gradeCode: 'G6', name: 'Hawthorn', capacity: 45 },
  { gradeCode: 'G6', name: 'Elm', capacity: 45 },
  { gradeCode: 'G7', name: 'Atlas', capacity: 48 },
  { gradeCode: 'G7', name: 'Nile', capacity: 48 },
  { gradeCode: 'G8', name: 'Venture', capacity: 48 },
  { gradeCode: 'G8', name: 'Summit', capacity: 48 },
];

const subjectRows = [
  { code: 'ENG', name: 'English', is_cbc: 1 },
  { code: 'KIS', name: 'Kiswahili', is_cbc: 1 },
  { code: 'MATH', name: 'Mathematics', is_cbc: 1 },
  { code: 'SCI', name: 'Science', is_cbc: 1 },
  { code: 'SOC', name: 'Social Studies', is_cbc: 1 },
  { code: 'COMP', name: 'Computer Studies', is_cbc: 1 },
  { code: 'ART', name: 'Art & Craft', is_cbc: 1 },
  { code: 'MUSIC', name: 'Music', is_cbc: 1 },
  { code: 'PE', name: 'Physical Education', is_cbc: 1 },
  { code: 'REL', name: 'Religious Education', is_cbc: 1 },
];

const teacherSeedRows = [
  { teacher_number: 'T-1001', full_name: 'Jane Waweru', email: 'jane.waweru@demo.school', phone: '+254700100101', department: 'Primary', qualification: 'B.Ed. Early Childhood', salary: 45000 },
  { teacher_number: 'T-1002', full_name: 'Daniel Njoroge', email: 'daniel.njoroge@demo.school', phone: '+254700100102', department: 'Mathematics', qualification: 'B.Sc. Mathematics', salary: 52000 },
  { teacher_number: 'T-1003', full_name: 'Alice Kariuki', email: 'alice.kariuki@demo.school', phone: '+254700100103', department: 'Sciences', qualification: 'B.Sc. Biology', salary: 57000 },
  { teacher_number: 'T-1004', full_name: 'Joseph Muiruri', email: 'joseph.muiruri@demo.school', phone: '+254700100104', department: 'Languages', qualification: 'B.A. English', salary: 49000 },
  { teacher_number: 'T-1005', full_name: 'Grace Kimani', email: 'grace.kimani@demo.school', phone: '+254700100105', department: 'Humanities', qualification: 'B.A. History', salary: 51000 },
  { teacher_number: 'T-1006', full_name: 'Peter Mugo', email: 'peter.mugo@demo.school', phone: '+254700100106', department: 'ICT', qualification: 'BSc. IT', salary: 60000 },
  { teacher_number: 'T-1007', full_name: 'Njeri Wambui', email: 'njeri.wambui@demo.school', phone: '+254700100107', department: 'Primary', qualification: 'B.Ed. Lower Primary', salary: 47000 },
  { teacher_number: 'T-1008', full_name: 'Stephen Otieno', email: 'stephen.otieno@demo.school', phone: '+254700100108', department: 'Sciences', qualification: 'M.Sc. Chemistry', salary: 61000 },
  { teacher_number: 'T-1009', full_name: 'Mercy Akinyi', email: 'mercy.akinyi@demo.school', phone: '+254700100109', department: 'Languages', qualification: 'B.A. Kiswahili', salary: 50000 },
  { teacher_number: 'T-1010', full_name: 'Victor Karanja', email: 'victor.karanja@demo.school', phone: '+254700100110', department: 'ICT', qualification: 'B.Sc. Computer Science', salary: 65000 },
  { teacher_number: 'T-1011', full_name: 'Rose Nduta', email: 'rose.nduta@demo.school', phone: '+254700100111', department: 'Arts', qualification: 'Dip. Arts Education', salary: 43000 },
  { teacher_number: 'T-1012', full_name: 'Martin Chege', email: 'martin.chege@demo.school', phone: '+254700100112', department: 'Humanities', qualification: 'B.A. CRE', salary: 52000 },
];

const userSeedRows = [
  { role: 'admin', full_name: 'System Admin', email: 'admin@demo.school', username: 'admin', phone: '+254700000001', password: 'admin123' },
  { role: 'principal', full_name: 'Mary Kamau', email: 'principal@demo.school', username: 'principal', phone: '+254700000002', password: 'Demo@2026' },
  { role: 'deputy', full_name: 'Samuel Otieno', email: 'deputy@demo.school', username: 'deputy', phone: '+254700000003', password: 'Demo@2026' },
  { role: 'bursar', full_name: 'Lucy Achieng', email: 'bursar@demo.school', username: 'bursar', phone: '+254700000004', password: 'Demo@2026' },
  { role: 'teacher', full_name: 'Jane Waweru', email: 'teacher@demo.school', username: 'teacher', phone: '+254700000008', password: 'Demo@2026' },
  { role: 'admissions', full_name: 'Rahab Ndungu', email: 'admissions@demo.school', username: 'admissions', phone: '+254700000005', password: 'Demo@2026' },
  { role: 'librarian', full_name: 'James Kibet', email: 'librarian@demo.school', username: 'librarian', phone: '+254700000006', password: 'Demo@2026' },
  { role: 'store_keeper', full_name: 'Naomi Chebet', email: 'store@demo.school', username: 'store', phone: '+254700000007', password: 'Demo@2026' },
  { role: 'class_teacher', full_name: 'Jane Waweru', email: 'jane.waweru@demo.school', username: 'classteacher1', phone: '+254700100101', password: 'Demo@2026' },
  { role: 'parent', full_name: 'John Kariuki', email: 'john.kariuki@demo.school', username: 'parent1', phone: '+254700200201', password: 'Demo@2026' },
  { role: 'parent', full_name: 'Faith Muthoni', email: 'faith.muthoni@demo.school', username: 'parent2', phone: '+254700200202', password: 'Demo@2026' },
];

const parentSeedRows = [
  { full_name: 'John Kariuki', relationship: 'Father', phone: '+254700200201', email: 'john.kariuki@demo.school', address: 'Nairobi West', occupation: 'Engineer' },
  { full_name: 'Faith Muthoni', relationship: 'Mother', phone: '+254700200202', email: 'faith.muthoni@demo.school', address: 'Ruiru', occupation: 'Nurse' },
  { full_name: 'Peter Otieno', relationship: 'Father', phone: '+254700200203', email: 'peter.otieno@demo.school', address: 'Kisumu', occupation: 'Teacher' },
  { full_name: 'Grace Ngigi', relationship: 'Mother', phone: '+254700200204', email: 'grace.ngigi@demo.school', address: 'Thika', occupation: 'Businesswoman' },
];

const studentSeedRows = [
  { admission_number: 'ADM-2025-001', full_name: 'Aisha Kariuki', gender: 'Female', date_of_birth: '2017-04-15', guardian_name: 'John Kariuki', guardian_phone: '+254700200201', gradeCode: 'G1', streamName: 'Ruby', status: 'active' },
  { admission_number: 'ADM-2025-002', full_name: 'Brian Otieno', gender: 'Male', date_of_birth: '2016-09-21', guardian_name: 'Peter Otieno', guardian_phone: '+254700200203', gradeCode: 'G2', streamName: 'Oak', status: 'active' },
  { admission_number: 'ADM-2025-003', full_name: 'Mary Muthoni', gender: 'Female', date_of_birth: '2015-07-08', guardian_name: 'Faith Muthoni', guardian_phone: '+254700200202', gradeCode: 'G3', streamName: 'Coral', status: 'active' },
  { admission_number: 'ADM-2025-004', full_name: 'Ethan Ngigi', gender: 'Male', date_of_birth: '2014-02-05', guardian_name: 'Grace Ngigi', guardian_phone: '+254700200204', gradeCode: 'G4', streamName: 'Cedar', status: 'active' },
  { admission_number: 'ADM-2025-005', full_name: 'Naomi Wanjiku', gender: 'Female', date_of_birth: '2013-11-16', guardian_name: 'John Kariuki', guardian_phone: '+254700200201', gradeCode: 'G5', streamName: 'Aster', status: 'active' },
  { admission_number: 'ADM-2025-006', full_name: 'Daniel Muiru', gender: 'Male', date_of_birth: '2012-05-30', guardian_name: 'Peter Otieno', guardian_phone: '+254700200203', gradeCode: 'G6', streamName: 'Hawthorn', status: 'active' },
  { admission_number: 'ADM-2025-007', full_name: 'Sophia Njeri', gender: 'Female', date_of_birth: '2011-08-12', guardian_name: 'Faith Muthoni', guardian_phone: '+254700200202', gradeCode: 'G7', streamName: 'Atlas', status: 'active' },
  { admission_number: 'ADM-2025-008', full_name: 'Kevin Mwangi', gender: 'Male', date_of_birth: '2010-03-18', guardian_name: 'Grace Ngigi', guardian_phone: '+254700200204', gradeCode: 'G8', streamName: 'Venture', status: 'active' },
  { admission_number: 'ADM-2025-009', full_name: 'Faith Atieno', gender: 'Female', date_of_birth: '2018-01-09', guardian_name: 'John Kariuki', guardian_phone: '+254700200201', gradeCode: 'PP1', streamName: 'Sunrise', status: 'active' },
  { admission_number: 'ADM-2025-010', full_name: 'Isaac Mugambi', gender: 'Male', date_of_birth: '2017-12-11', guardian_name: 'Peter Otieno', guardian_phone: '+254700200203', gradeCode: 'PP2', streamName: 'Twilight', status: 'active' },
  { admission_number: 'ADM-2025-011', full_name: 'Lilian Waithera', gender: 'Female', date_of_birth: '2014-06-18', guardian_name: 'Grace Ngigi', guardian_phone: '+254700200204', gradeCode: 'G4', streamName: 'Pine', status: 'active' },
  { admission_number: 'ADM-2025-012', full_name: 'Samuel Kamau', gender: 'Male', date_of_birth: '2013-04-22', guardian_name: 'John Kariuki', guardian_phone: '+254700200201', gradeCode: 'G5', streamName: 'Willow', status: 'active' },
  { admission_number: 'ADM-2025-013', full_name: 'Joyce Njeri', gender: 'Female', date_of_birth: '2012-10-30', guardian_name: 'Faith Muthoni', guardian_phone: '+254700200202', gradeCode: 'G6', streamName: 'Elm', status: 'active' },
  { admission_number: 'ADM-2025-014', full_name: 'Ian Kimani', gender: 'Male', date_of_birth: '2011-02-14', guardian_name: 'Peter Otieno', guardian_phone: '+254700200203', gradeCode: 'G7', streamName: 'Nile', status: 'active' },
  { admission_number: 'ADM-2025-015', full_name: 'Cynthia Achieng', gender: 'Female', date_of_birth: '2010-09-07', guardian_name: 'Grace Ngigi', guardian_phone: '+254700200204', gradeCode: 'G8', streamName: 'Summit', status: 'active' },
];

const generatedFirstNames = [
  'Amara', 'Joel', 'Zuri', 'Malik', 'Talia', 'Noah', 'Imani', 'Elijah', 'Amani',
  'Leah', 'Baraka', 'Mila', 'Jabari', 'Wanjiru', 'Kendi',
];
const generatedLastNames = [
  'Kiptoo', 'Mutua', 'Abdi', 'Wekesa', 'Githinji', 'Maina', 'Omondi', 'Chebet', 'Muli',
];
const gradeCodes = gradeRows.map((grade) => grade.code);
const generatedGuardians = parentSeedRows;

for (let index = 0; index < 135; index += 1) {
  const gradeCode = gradeCodes[index % gradeCodes.length];
  const gradeStreams = streamRows.filter((stream) => stream.gradeCode === gradeCode);
  const guardian = generatedGuardians[index % generatedGuardians.length];
  const birthYear = 2018 - gradeCodes.indexOf(gradeCode);
  const month = (index % 12) + 1;
  const day = (index % 27) + 1;

  studentSeedRows.push({
    admission_number: `ADM-2025-${String(index + 16).padStart(3, '0')}`,
    full_name: `${generatedFirstNames[Math.floor(index / generatedLastNames.length)]} ${generatedLastNames[index % generatedLastNames.length]}`,
    gender: index % 2 === 0 ? 'Female' : 'Male',
    date_of_birth: `${birthYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    guardian_name: guardian.full_name,
    guardian_phone: guardian.phone,
    gradeCode,
    streamName: gradeStreams[Math.floor(index / gradeCodes.length) % gradeStreams.length].name,
    status: 'active',
  });
}

const attendanceRows = [
  { student: 'Aisha Kariuki', date: '2026-10-01', status: 'present', remarks: 'Participated actively' },
  { student: 'Brian Otieno', date: '2026-10-01', status: 'late', remarks: 'Arrived 15 minutes late' },
  { student: 'Mary Muthoni', date: '2026-10-01', status: 'present', remarks: 'Good focus' },
  { student: 'Ethan Ngigi', date: '2026-10-01', status: 'excused', remarks: 'Medical appointment' },
  { student: 'Naomi Wanjiku', date: '2026-10-02', status: 'present', remarks: 'Completed assigned task' },
  { student: 'Daniel Muiru', date: '2026-10-02', status: 'absent', remarks: 'Absent with prior notice' },
  { student: 'Sophia Njeri', date: '2026-10-03', status: 'present', remarks: 'Reading club participation' },
  { student: 'Kevin Mwangi', date: '2026-10-03', status: 'late', remarks: 'Traffic delay' },
  { student: 'Faith Atieno', date: '2026-10-01', status: 'present', remarks: 'Strong participation in phonics' },
  { student: 'Isaac Mugambi', date: '2026-10-01', status: 'present', remarks: 'Completed class assignment' },
  { student: 'Lilian Waithera', date: '2026-10-02', status: 'present', remarks: 'Excellent teamwork' },
  { student: 'Samuel Kamau', date: '2026-10-02', status: 'late', remarks: 'Arrived after break' },
  { student: 'Joyce Njeri', date: '2026-10-03', status: 'present', remarks: 'Active group discussion' },
  { student: 'Ian Kimani', date: '2026-10-03', status: 'excused', remarks: 'Sports meet' },
  { student: 'Cynthia Achieng', date: '2026-10-03', status: 'present', remarks: 'Top scorer in quiz' },
  { student: 'Aisha Kariuki', date: '2026-10-02', status: 'present', remarks: 'Completed reading log' },
  { student: 'Brian Otieno', date: '2026-10-02', status: 'present', remarks: 'Participated in science task' },
  { student: 'Mary Muthoni', date: '2026-10-03', status: 'absent', remarks: 'Family commitment' },
  { student: 'Ethan Ngigi', date: '2026-10-03', status: 'present', remarks: 'Focused on computer lab' },
  { student: 'Naomi Wanjiku', date: '2026-10-01', status: 'present', remarks: 'Very cooperative' },
];

const examTypeRows = ['CAT', 'MidTerm', 'EndTerm', 'Project', 'Practical'];

const examSeedRows = [
  { name: 'Term 1 CAT 1', exam_type: 'CAT', term: 1, academic_year: '2025/2026', start_date: '2026-02-12', end_date: '2026-02-16' },
  { name: 'Term 1 End Term', exam_type: 'EndTerm', term: 1, academic_year: '2025/2026', start_date: '2026-03-18', end_date: '2026-03-29' },
  { name: 'Term 2 CAT 2', exam_type: 'CAT', term: 2, academic_year: '2025/2026', start_date: '2026-06-04', end_date: '2026-06-09' },
  { name: 'Term 2 MidTerm', exam_type: 'MidTerm', term: 2, academic_year: '2025/2026', start_date: '2026-07-06', end_date: '2026-07-12' },
];

const feeStructureRows = [
  { gradeCode: 'G1', academic_year: '2025/2026', term: 1, amount: 6000 },
  { gradeCode: 'G1', academic_year: '2025/2026', term: 2, amount: 6000 },
  { gradeCode: 'G2', academic_year: '2025/2026', term: 1, amount: 6500 },
  { gradeCode: 'G3', academic_year: '2025/2026', term: 1, amount: 7000 },
  { gradeCode: 'G4', academic_year: '2025/2026', term: 1, amount: 7600 },
  { gradeCode: 'G5', academic_year: '2025/2026', term: 1, amount: 8200 },
  { gradeCode: 'G6', academic_year: '2025/2026', term: 1, amount: 8800 },
  { gradeCode: 'G7', academic_year: '2025/2026', term: 1, amount: 9400 },
  { gradeCode: 'G8', academic_year: '2025/2026', term: 1, amount: 10000 },
];

const paymentRows = [
  { student: 'Aisha Kariuki', amount: 6000, payment_method: 'mobile_money', reference_no: 'MM-10001', receipt_no: 'RCPT-1001', paid_for_year: '2025/2026', paid_for_term: 1, paid_by: 'admin' },
  { student: 'Brian Otieno', amount: 6500, payment_method: 'cash', reference_no: 'CASH-10002', receipt_no: 'RCPT-1002', paid_for_year: '2025/2026', paid_for_term: 1, paid_by: 'bursar' },
  { student: 'Mary Muthoni', amount: 7000, payment_method: 'bank', reference_no: 'BANK-10003', receipt_no: 'RCPT-1003', paid_for_year: '2025/2026', paid_for_term: 1, paid_by: 'bursar' },
  { student: 'Ethan Ngigi', amount: 7600, payment_method: 'mobile_money', reference_no: 'MM-10004', receipt_no: 'RCPT-1004', paid_for_year: '2025/2026', paid_for_term: 1, paid_by: 'admin' },
];

const libraryRows = [
  { isbn: '978-1-2345-6789-0', title: 'Reading Adventures', author: 'A. Njeri', publisher: 'Bright Books', category: 'Fiction', copies_total: 5, copies_available: 4 },
  { isbn: '978-1-2345-6789-1', title: 'Mathematics for Young Minds', author: 'K. Wambui', publisher: 'Learning Press', category: 'Mathematics', copies_total: 4, copies_available: 3 },
  { isbn: '978-1-2345-6789-2', title: 'Science in Everyday Life', author: 'M. Karanja', publisher: 'Discovery House', category: 'Science', copies_total: 3, copies_available: 2 },
  { isbn: '978-1-2345-6789-3', title: 'Kenya History Basics', author: 'S. Omondi', publisher: 'National Press', category: 'History', copies_total: 3, copies_available: 2 },
];

const inventoryRows = [
  { name: 'Whiteboard Marker', category: 'Stationery', quantity: 35, unit: 'pcs', unit_cost: 80, condition_status: 'new' },
  { name: 'Desk Chair', category: 'Furniture', quantity: 18, unit: 'pcs', unit_cost: 2200, condition_status: 'good' },
  { name: 'Science Kit', category: 'Learning Materials', quantity: 12, unit: 'set', unit_cost: 1500, condition_status: 'good' },
  { name: 'Sports Ball', category: 'Sports', quantity: 10, unit: 'pcs', unit_cost: 950, condition_status: 'good' },
  { name: 'Exercise Books', category: 'Stationery', quantity: 240, unit: 'pack', unit_cost: 300, condition_status: 'new' },
  { name: 'Laptop', category: 'ICT', quantity: 8, unit: 'pcs', unit_cost: 42000, condition_status: 'good' },
  { name: 'Projector', category: 'ICT', quantity: 2, unit: 'pcs', unit_cost: 28000, condition_status: 'good' },
  { name: 'Classroom Chair', category: 'Furniture', quantity: 54, unit: 'pcs', unit_cost: 1800, condition_status: 'good' },
  { name: 'Dustbin', category: 'Facilities', quantity: 14, unit: 'pcs', unit_cost: 700, condition_status: 'new' },
  { name: 'Science Chemicals Set', category: 'Learning Materials', quantity: 7, unit: 'set', unit_cost: 2600, condition_status: 'good' },
];

const expenseRows = [
  { description: 'School bus fuel', amount: 18000, category: 'Transport' },
  { description: 'Cleaning supplies', amount: 6500, category: 'Operations' },
  { description: 'Teacher salary advance', amount: 42000, category: 'Payroll' },
  { description: 'Water and sanitation', amount: 11000, category: 'Utilities' },
  { description: 'IT maintenance', amount: 15000, category: 'ICT' },
  { description: 'Exam printing', amount: 9000, category: 'Academics' },
  { description: 'Sports day equipment', amount: 24000, category: 'Sports' },
  { description: 'Library books', amount: 17500, category: 'Library' },
];

const timetableRows = [
  { streamKey: 'G1:Ruby', day_of_week: 'Mon', period: 1, start_time: '08:00:00', end_time: '08:40:00', subject: 'ENG', teacher: 'T-1004', room: 'R1' },
  { streamKey: 'G1:Ruby', day_of_week: 'Mon', period: 2, start_time: '08:40:00', end_time: '09:20:00', subject: 'MATH', teacher: 'T-1002', room: 'R1' },
  { streamKey: 'G1:Ruby', day_of_week: 'Mon', period: 3, start_time: '09:40:00', end_time: '10:20:00', subject: 'SCI', teacher: 'T-1003', room: 'Lab1' },
  { streamKey: 'G2:Oak', day_of_week: 'Tue', period: 1, start_time: '08:00:00', end_time: '08:40:00', subject: 'KIS', teacher: 'T-1004', room: 'R2' },
  { streamKey: 'G2:Oak', day_of_week: 'Tue', period: 2, start_time: '08:40:00', end_time: '09:20:00', subject: 'MATH', teacher: 'T-1002', room: 'R2' },
  { streamKey: 'G3:Coral', day_of_week: 'Wed', period: 1, start_time: '08:00:00', end_time: '08:40:00', subject: 'ENG', teacher: 'T-1004', room: 'R3' },
  { streamKey: 'G4:Cedar', day_of_week: 'Thu', period: 1, start_time: '08:00:00', end_time: '08:40:00', subject: 'COMP', teacher: 'T-1006', room: 'ICT1' },
  { streamKey: 'G5:Aster', day_of_week: 'Fri', period: 1, start_time: '08:00:00', end_time: '08:40:00', subject: 'SOC', teacher: 'T-1005', room: 'R5' },
];

const announcementRows = [
  { title: 'School Assembly', body: 'All learners should report to the field by 8:00 AM for the weekly assembly.', audience: 'all', posted_by: 'principal' },
  { title: 'Fee Reminder', body: 'Please ensure outstanding fees for term 1 are cleared by Friday.', audience: 'parents', posted_by: 'bursar' },
  { title: 'Library Week', body: 'Students are encouraged to participate in the reading challenge this week.', audience: 'students', posted_by: 'librarian' },
];

async function resetSeedData() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of RESET_TABLES) {
    try {
      await pool.query(`DELETE FROM \`${table}\``);
    } catch (error) {
      console.warn(`Skipping reset for ${table}: ${error.message}`);
    }
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function fetchMap(query, keyField, valueField) {
  const [rows] = await pool.query(query);
  return Object.fromEntries(rows.map((row) => [row[keyField], row[valueField]]));
}

async function upsertSchoolProfile() {
  const [existing] = await pool.query('SELECT id FROM school_profile LIMIT 1');

  if (existing.length) {
    await pool.execute(
      `UPDATE school_profile SET school_name = ?, motto = ?, vision = ?, mission = ?, address = ?, county = ?, sub_county = ?, email = ?, phone_primary = ?, principal_name = ?, academic_year = ? WHERE id = ?`,
      ['Bright Horizon Academy', 'Nurturing talent, building character.', 'To be a leading center of excellence for holistic learner development.', 'To provide quality, child-centred education that inspires confidence and excellence.', 'Nairobi, Kenya', 'Nairobi', 'Westlands', 'info@demo.school', '+254700000000', 'Mary Kamau', '2025/2026', existing[0].id]
    );
    return;
  }

  await pool.execute(
    `INSERT INTO school_profile (school_name, motto, vision, mission, address, county, sub_county, email, phone_primary, principal_name, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Bright Horizon Academy', 'Nurturing talent, building character.', 'To be a leading center of excellence for holistic learner development.', 'To provide quality, child-centred education that inspires confidence and excellence.', 'Nairobi, Kenya', 'Nairobi', 'Westlands', 'info@demo.school', '+254700000000', 'Mary Kamau', '2025/2026']
  );
}

async function upsertRoles() {
  const roleMap = {};

  for (const name of roleNames) {
    await pool.execute(
      'INSERT INTO roles (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [name]
    );
  }

  const [rows] = await pool.query('SELECT id, name FROM roles WHERE name IN (?)', [roleNames]);
  rows.forEach((row) => {
    roleMap[row.name] = row.id;
  });
  return roleMap;
}

async function upsertDepartments() {
  const departmentMap = {};

  for (const name of departmentNames) {
    await pool.execute(
      'INSERT INTO departments (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [name]
    );
  }

  const [rows] = await pool.query('SELECT id, name FROM departments WHERE name IN (?)', [departmentNames]);
  rows.forEach((row) => {
    departmentMap[row.name] = row.id;
  });
  return departmentMap;
}

async function upsertGrades() {
  const gradeMap = {};

  for (const grade of gradeRows) {
    await pool.execute(
      'INSERT INTO grades (code, name, level_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), level_order = VALUES(level_order)',
      [grade.code, grade.name, grade.level_order]
    );
  }

  const [rows] = await pool.query('SELECT id, code FROM grades WHERE code IN (?)', [gradeRows.map((grade) => grade.code)]);
  rows.forEach((row) => {
    gradeMap[row.code] = row.id;
  });
  return gradeMap;
}

async function upsertStreams(gradeMap) {
  const streamMap = {};

  for (const stream of streamRows) {
    const gradeId = gradeMap[stream.gradeCode];
    if (!gradeId) continue;

    await pool.execute(
      'INSERT INTO streams (grade_id, name, capacity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE capacity = VALUES(capacity)',
      [gradeId, stream.name, stream.capacity]
    );
  }

  const [rows] = await pool.query('SELECT s.id, s.name, g.code AS grade_code FROM streams s INNER JOIN grades g ON g.id = s.grade_id WHERE g.code IN (?)', [gradeRows.map((grade) => grade.code)]);
  rows.forEach((row) => {
    streamMap[`${row.grade_code}:${row.name}`] = row.id;
  });
  return streamMap;
}

async function upsertSubjects() {
  const subjectMap = {};

  for (const subject of subjectRows) {
    await pool.execute(
      'INSERT INTO subjects (code, name, is_cbc) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), is_cbc = VALUES(is_cbc)',
      [subject.code, subject.name, subject.is_cbc]
    );
  }

  const [rows] = await pool.query('SELECT id, code FROM subjects WHERE code IN (?)', [subjectRows.map((subject) => subject.code)]);
  rows.forEach((row) => {
    subjectMap[row.code] = row.id;
  });
  return subjectMap;
}

async function upsertUsers(roleMap) {
  const userMap = {};

  for (const user of userSeedRows) {
    const roleId = roleMap[user.role];
    if (!roleId) continue;
    const hash = await bcrypt.hash(user.password || DEFAULT_PASSWORD, 10);
    await pool.execute(
      `INSERT INTO users (role_id, full_name, email, phone, username, password_hash, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), phone = VALUES(phone), password_hash = VALUES(password_hash)`,
      [roleId, user.full_name, user.email, user.phone, user.username, hash]
    );
    userMap[user.username] = user.full_name;
  }

  const [rows] = await pool.query('SELECT id, username FROM users WHERE username IN (?)', [userSeedRows.map((user) => user.username)]);
  rows.forEach((row) => {
    userMap[row.username] = row.id;
  });
  return userMap;
}

async function upsertTeachers(departmentMap, userMap) {
  const teacherMap = {};

  for (const teacher of teacherSeedRows) {
    const departmentId = departmentMap[teacher.department];
    const teacherUserId = teacher.full_name === 'Jane Waweru' ? userMap.teacher || null : null;

    await pool.execute(
      `INSERT INTO teachers (user_id, full_name, teacher_number, tsc_number, national_id, qualification, department_id, phone, email, address, employment_date, salary, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), full_name = VALUES(full_name), qualification = VALUES(qualification), department_id = VALUES(department_id), phone = VALUES(phone), email = VALUES(email), salary = VALUES(salary)`,
      [teacherUserId, teacher.full_name, teacher.teacher_number, `TS${teacher.teacher_number.split('-')[1]}`, `NAT-${teacher.teacher_number.split('-')[1]}`, teacher.qualification, departmentId, teacher.phone, teacher.email, 'School compound, Nairobi', '2022-01-15', teacher.salary]
    );
    teacherMap[teacher.teacher_number] = teacher.teacher_number;
  }

  const [rows] = await pool.query('SELECT id, teacher_number FROM teachers WHERE teacher_number IN (?)', [teacherSeedRows.map((teacher) => teacher.teacher_number)]);
  rows.forEach((row) => {
    teacherMap[row.teacher_number] = row.id;
  });
  return teacherMap;
}

async function upsertClassTeachers(streamMap, teacherMap) {
  const academicYear = '2025/2026';
  const classTeacherAssignments = streamRows.map((stream, index) => ({
    streamKey: `${stream.gradeCode}:${stream.name}`,
    teacherNumber: teacherSeedRows[index % teacherSeedRows.length].teacher_number,
  }));

  for (const assignment of classTeacherAssignments) {
    const streamId = streamMap[assignment.streamKey];
    const teacherId = teacherMap[assignment.teacherNumber];
    if (!streamId || !teacherId) continue;

    await pool.execute(
      'INSERT INTO class_teachers (stream_id, teacher_id, academic_year) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id)',
      [streamId, teacherId, academicYear]
    );
  }
}

async function upsertParents(userMap) {
  const parentMap = {};

  for (const parent of parentSeedRows) {
    const parentUsername = parent.full_name.toLowerCase().replace(/\s+/g, '') || null;
    const parentUser = userMap[parentUsername] || null;
    const [result] = await pool.execute(
      `INSERT INTO parents (user_id, full_name, relationship, phone, email, address, occupation)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE relationship = VALUES(relationship), phone = VALUES(phone), email = VALUES(email), address = VALUES(address), occupation = VALUES(occupation)`,
      [parentUser, parent.full_name, parent.relationship, parent.phone, parent.email, parent.address, parent.occupation]
    );

    const parentId = result.insertId || (await getParentIdByName(parent.full_name));
    parentMap[parent.full_name] = parentId;
  }

  return parentMap;
}

async function getParentIdByName(fullName) {
  const [rows] = await pool.query('SELECT id FROM parents WHERE full_name = ?', [fullName]);
  return rows[0]?.id || null;
}

async function upsertStudents(parentMap, gradeMap, streamMap) {
  const studentMap = {};

  for (const [index, student] of studentSeedRows.entries()) {
    const parentId = parentMap[student.guardian_name] || null;
    const gradeId = gradeMap[student.gradeCode] || null;
    const streamId = streamMap[`${student.gradeCode}:${student.streamName}`] || null;
    const usesTransport = student.uses_transport ?? (index % 2 === 0 ? 1 : 0);

    await pool.execute(
      `INSERT INTO students (admission_number, full_name, gender, date_of_birth, guardian_name, guardian_phone, parent_id, current_grade_id, current_stream_id, uses_transport, status, admission_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), guardian_name = VALUES(guardian_name), guardian_phone = VALUES(guardian_phone), parent_id = VALUES(parent_id), current_grade_id = VALUES(current_grade_id), current_stream_id = VALUES(current_stream_id), uses_transport = VALUES(uses_transport), status = VALUES(status)`,
      [student.admission_number, student.full_name, student.gender, student.date_of_birth, student.guardian_name, student.guardian_phone, parentId, gradeId, streamId, usesTransport, student.status, '2025-01-10']
    );

    studentMap[student.full_name] = student.admission_number;
  }

  return studentMap;
}

async function getStudentIdByName(fullName) {
  const [rows] = await pool.query('SELECT id FROM students WHERE full_name = ?', [fullName]);
  return rows[0]?.id || null;
}

async function upsertAttendance(streamMap, userMap) {
  const recordedBy = userMap['admin'] || userMap['deputy'] || null;
  const [students] = await pool.query('SELECT id, full_name, current_stream_id FROM students');
  const studentStreamMap = Object.fromEntries(students.map((student) => [student.full_name, student.current_stream_id]));

  for (const attendance of attendanceRows) {
    const studentName = attendance.student;
    const studentId = await getStudentIdByName(studentName);
    const streamId = studentStreamMap[studentName] || streamMap['G1:Ruby'] || null;
    if (!studentId) continue;

    await pool.execute(
      `INSERT INTO attendance (student_id, stream_id, date, status, remarks, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), recorded_by = VALUES(recorded_by)`,
      [studentId, streamId, attendance.date, attendance.status, attendance.remarks, recordedBy]
    );
  }
}

async function upsertExamData(subjectMap, studentMap) {
  for (const examType of examTypeRows) {
    await pool.execute(
      'INSERT INTO exam_types (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [examType]
    );
  }

  const [examTypeRowsFromDb] = await pool.query('SELECT id, name FROM exam_types');
  const examTypeMap = Object.fromEntries(examTypeRowsFromDb.map((row) => [row.name, row.id]));

  for (const exam of examSeedRows) {
    const examTypeId = examTypeMap[exam.exam_type];
    await pool.execute(
      'INSERT INTO exams (name, exam_type_id, term, academic_year, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE exam_type_id = VALUES(exam_type_id), term = VALUES(term), academic_year = VALUES(academic_year)',
      [exam.name, examTypeId, exam.term, exam.academic_year, exam.start_date, exam.end_date]
    );
  }

  const [examRows] = await pool.query('SELECT id, name FROM exams');
  const examMap = Object.fromEntries(examRows.map((row) => [row.name, row.id]));

  const resultRows = [
    ['Term 1 CAT 1', 'Aisha Kariuki', 'ENG', 84, 'A', 'Exceeding', 'Strong reading comprehension'],
    ['Term 1 CAT 1', 'Aisha Kariuki', 'MATH', 86, 'A', 'Exceeding', 'Good arithmetic accuracy'],
    ['Term 1 End Term', 'Brian Otieno', 'MATH', 78, 'B', 'Meeting', 'Consistent effort'],
    ['Term 1 End Term', 'Mary Muthoni', 'ENG', 82, 'A', 'Exceeding', 'Excellent writing'],
    ['Term 2 CAT 2', 'Naomi Wanjiku', 'SCI', 74, 'B', 'Meeting', 'Needs deeper practical analysis'],
    ['Term 2 MidTerm', 'Sophia Njeri', 'COMP', 88, 'A', 'Exceeding', 'Very strong digital skills'],
  ];

  const assessedStudents = studentSeedRows.slice(0, 60);
  const assessedSubjects = ['ENG', 'MATH', 'SCI', 'KIS'];
  for (const [studentIndex, student] of assessedStudents.entries()) {
    for (const [subjectIndex, subjectCode] of assessedSubjects.entries()) {
      const marks = 55 + ((studentIndex * 7 + subjectIndex * 9) % 46);
      const grade = marks >= 80 ? 'A' : marks >= 70 ? 'B' : marks >= 60 ? 'C' : 'D';
      const cbcLevel = marks >= 80 ? 'Exceeding' : marks >= 65 ? 'Meeting' : marks >= 50 ? 'Approaching' : 'Below';
      resultRows.push([
        examSeedRows[studentIndex % examSeedRows.length].name,
        student.full_name,
        subjectCode,
        marks,
        grade,
        cbcLevel,
        'Demo assessment result',
      ]);
    }
  }

  for (const [examName, studentName, subjectCode, marks, grade, cbcLevel, comment] of resultRows) {
    const examId = examMap[examName];
    const studentId = await getStudentIdByName(studentName);
    const subjectId = subjectMap[subjectCode];
    if (!examId || !studentId || !subjectId) continue;

    await pool.execute(
      `INSERT INTO exam_results (exam_id, student_id, subject_id, marks, grade, cbc_level, teacher_comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE marks = VALUES(marks), grade = VALUES(grade), cbc_level = VALUES(cbc_level), teacher_comment = VALUES(teacher_comment)`,
      [examId, studentId, subjectId, marks, grade, cbcLevel, comment]
    );
  }
}

async function upsertFeeData(studentMap, gradeMap, userMap) {
  for (const structure of feeStructureRows) {
    const gradeId = gradeMap[structure.gradeCode];
    if (!gradeId) continue;
    await pool.execute(
      'INSERT INTO fee_structures (grade_id, academic_year, term, amount) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)',
      [gradeId, structure.academic_year, structure.term, structure.amount]
    );
  }

  const generatedPayments = studentSeedRows.slice(4, 64).flatMap((student, index) => {
    const firstPayment = {
      student: student.full_name,
      amount: 1800 + ((index * 725) % 4200),
      payment_method: ['mobile_money', 'cash', 'bank', 'cheque'][index % 4],
      reference_no: `DEMO-FEE-${String(index + 1).padStart(4, '0')}`,
      receipt_no: `DEMO-RCPT-${String(index + 1).padStart(4, '0')}`,
      paid_for_year: '2025/2026',
      paid_for_term: index % 3 + 1,
      paid_by: index % 2 === 0 ? 'bursar' : 'admin',
    };

    if (index % 5 !== 0) return [firstPayment];

    return [
      firstPayment,
      {
        ...firstPayment,
        amount: 1000 + ((index * 375) % 2500),
        reference_no: `DEMO-FEE-SECOND-${String(index + 1).padStart(4, '0')}`,
        receipt_no: `DEMO-RCPT-SECOND-${String(index + 1).padStart(4, '0')}`,
      },
    ];
  });

  for (const payment of [...paymentRows, ...generatedPayments]) {
    const studentId = await getStudentIdByName(payment.student);
    const paidByUser = userMap[payment.paid_by] || null;
    if (!studentId) continue;

    await pool.execute(
      `INSERT INTO fee_payments (student_id, amount, payment_method, reference_no, receipt_no, paid_for_year, paid_for_term, paid_by, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), payment_method = VALUES(payment_method), receipt_no = VALUES(receipt_no), paid_by = VALUES(paid_by)`,
      [studentId, payment.amount, payment.payment_method, payment.reference_no, payment.receipt_no, payment.paid_for_year, payment.paid_for_term, paidByUser]
    );
  }
}

async function upsertLibraryBooks() {
  for (const book of libraryRows) {
    await pool.execute(
      'INSERT INTO library_books (isbn, title, author, publisher, category, copies_total, copies_available) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE author = VALUES(author), publisher = VALUES(publisher), category = VALUES(category), copies_total = VALUES(copies_total), copies_available = VALUES(copies_available)',
      [book.isbn, book.title, book.author, book.publisher, book.category, book.copies_total, book.copies_available]
    );
  }
}

async function upsertInventory() {
  for (const item of inventoryRows) {
    await pool.execute(
      'INSERT INTO inventory_items (name, category, quantity, unit, unit_cost, condition_status, date_added) VALUES (?, ?, ?, ?, ?, ?, CURDATE()) ON DUPLICATE KEY UPDATE category = VALUES(category), quantity = VALUES(quantity), unit = VALUES(unit), unit_cost = VALUES(unit_cost), condition_status = VALUES(condition_status)',
      [item.name, item.category, item.quantity, item.unit, item.unit_cost, item.condition_status]
    );
  }

  const [rows] = await pool.query('SELECT id FROM inventory_items');
  for (let index = 0; index < rows.length; index += 1) {
    const itemId = rows[index].id;
    await pool.execute(
      'INSERT INTO inventory_transactions (item_id, type, quantity, remarks, trans_date) VALUES (?, ?, ?, ?, NOW())',
      [itemId, index % 2 === 0 ? 'in' : 'out', index % 2 === 0 ? 10 : 3, 'Initial stock update']
    );
  }
}

async function upsertExpenses() {
  for (const expense of expenseRows) {
    await pool.execute(
      'INSERT INTO expenses (description, amount, category, expense_date) VALUES (?, ?, ?, CURDATE()) ON DUPLICATE KEY UPDATE amount = VALUES(amount), category = VALUES(category)',
      [expense.description, expense.amount, expense.category]
    );
  }
}

async function upsertTimetable(streamMap, subjectMap, teacherMap) {
  for (const row of timetableRows) {
    const streamId = streamMap[row.streamKey];
    const subjectId = subjectMap[row.subject];
    const teacherId = teacherMap[row.teacher];
    if (!streamId) continue;

    await pool.execute(
      'INSERT INTO timetable (stream_id, day_of_week, period, start_time, end_time, subject_id, teacher_id, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE subject_id = VALUES(subject_id), teacher_id = VALUES(teacher_id), room = VALUES(room)',
      [streamId, row.day_of_week, row.period, row.start_time, row.end_time, subjectId || null, teacherId || null, row.room]
    );
  }
}

async function upsertAnnouncements(userMap) {
  for (const item of announcementRows) {
    const postedBy = userMap[item.posted_by] || null;
    await pool.execute(
      'INSERT INTO announcements (title, body, audience, posted_by) VALUES (?, ?, ?, ?)',
      [item.title, item.body, item.audience, postedBy]
    );
  }
}

async function upsertSettings() {
  await pool.execute(
    `INSERT INTO settings (id, session_timeout_minutes, enable_backups, backup_frequency_hours, school_year_active, current_term)
     VALUES (1, 30, 1, 24, '2025/2026', 1)
     ON DUPLICATE KEY UPDATE session_timeout_minutes = VALUES(session_timeout_minutes), enable_backups = VALUES(enable_backups), backup_frequency_hours = VALUES(backup_frequency_hours), school_year_active = VALUES(school_year_active), current_term = VALUES(current_term)`,
    []
  );
}

async function main() {
  try {
    if (process.argv.includes('--reset')) {
      await resetSeedData();
      console.log('Seed tables reset.');
    }

    await upsertSchoolProfile();
    const roleMap = await upsertRoles();
    const departmentMap = await upsertDepartments();
    const gradeMap = await upsertGrades();
    const streamMap = await upsertStreams(gradeMap);
    const subjectMap = await upsertSubjects();
    const userMap = await upsertUsers(roleMap);
    const teacherMap = await upsertTeachers(departmentMap, userMap);
    await upsertClassTeachers(streamMap, teacherMap);
    const parentMap = await upsertParents(userMap);
    await upsertStudents(parentMap, gradeMap, streamMap);
    await upsertAttendance(streamMap, userMap);
    await upsertExamData(subjectMap, {});
    await upsertFeeData({}, gradeMap, userMap);
    await upsertLibraryBooks();
    await upsertInventory();
    await upsertExpenses();
    await upsertTimetable(streamMap, subjectMap, teacherMap);
    await upsertAnnouncements(userMap);
    await upsertSettings();

    console.log('Dummy data seeded successfully.');
    console.log('Login details: admin / admin123');
  } catch (error) {
    console.error('Failed to seed data:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
