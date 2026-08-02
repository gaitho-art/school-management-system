const fs = require('fs');

const content = `import { pool } from '../config/db.js';
import { logActivity } from '../middleware/logActivity.js';
import * as XLSX from 'xlsx';

export async function getStudents(req, res) {
  // Fetch students along with their total payments to calculate overall balance
  const [rows] = await pool.query(\`
    SELECT s.id, s.admission_number, s.full_name, s.gender, g.name as grade_name, s.uses_transport, s.status,
           (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE student_id = s.id) as total_paid
    FROM students s 
    LEFT JOIN grades g ON s.current_grade_id = g.id
  \`);
  
  const students = rows.map(s => {
    const totalBilled = 15000 + (s.uses_transport ? 5000 : 0);
    return {
      ...s,
      total_paid: Number(s.total_paid),
      total_billed: totalBilled,
      balance: totalBilled - Number(s.total_paid)
    };
  });
  
  res.json(students);
}

export async function getStudentById(req, res) {
  const [students] = await pool.query('SELECT s.*, g.name as grade_name FROM students s LEFT JOIN grades g ON s.current_grade_id = g.id WHERE s.id = ?', [req.params.id]);
  if (students.length === 0) return res.status(404).json({ error: 'Student not found' });
  const student = students[0];
  
  const [payments] = await pool.query('SELECT * FROM fee_payments WHERE student_id = ? ORDER BY payment_date DESC', [req.params.id]);
  const [exams] = await pool.query('SELECT er.id as result_id, e.name as exam_name, sub.name as subject_name, er.subject_id, er.exam_id, er.marks, er.grade, er.teacher_comment FROM exam_results er JOIN exams e ON er.exam_id = e.id JOIN subjects sub ON er.subject_id = sub.id WHERE er.student_id = ?', [req.params.id]);
  
  const expectedPerTerm = 5000;
  const totalBilled = expectedPerTerm * 3 + (student.uses_transport ? 5000 : 0); 
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalBilled - totalPaid;
  const totalMarks = exams.reduce((sum, ex) => sum + Number(ex.marks), 0);

  // CUMULATIVE LOGIC FOR CARRY-OVERS
  // If a parent overpays Term 1, the surplus automatically reduces Term 2's balance
  const cumPaidT1 = payments.filter(p => p.paid_for_term <= 1).reduce((sum, p) => sum + Number(p.amount), 0);
  const cumPaidT2 = payments.filter(p => p.paid_for_term <= 2).reduce((sum, p) => sum + Number(p.amount), 0);
  const cumPaidT3 = payments.filter(p => p.paid_for_term <= 3).reduce((sum, p) => sum + Number(p.amount), 0);

  const term1Bal = expectedPerTerm - cumPaidT1;
  const term2Bal = (expectedPerTerm * 2) - cumPaidT2;
  const term3Bal = (expectedPerTerm * 3) - cumPaidT3;

  res.json({ 
    ...student, 
    payments, 
    exams, 
    totalPaid, 
    totalBilled, 
    balance, 
    totalMarks,
    finances: {
      term1: { expected: expectedPerTerm, paid: cumPaidT1, balance: term1Bal },
      term2: { expected: expectedPerTerm, paid: cumPaidT2 - cumPaidT1, balance: term2Bal },
      term3: { expected: expectedPerTerm, paid: cumPaidT3 - cumPaidT2, balance: term3Bal },
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
}`;

fs.writeFileSync('controllers/studentController.js', content);
console.log('Backend updated for fee carry-overs and transport finances!');