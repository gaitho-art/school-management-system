const fs = require('fs');
const path = require('path');

const files = {
  'src/pages/StudentProfile.jsx': `import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { FiTrash, FiEdit } from 'react-icons/fi';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [streams, setStreams] = useState([]);
  
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('1');
  const [marks, setMarks] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [remark, setRemark] = useState('');
  const [examTerm, setExamTerm] = useState('1');

  const [editGrade, setEditGrade] = useState('');
  const [editStream, setEditStream] = useState('');
  const [editGuardian, setEditGuardian] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTransport, setEditTransport] = useState(false);

  const loadStudent = () => api.get(\`/students/\${id}\`).then(r => {
    setStudent(r.data);
    setEditGrade(r.data.current_grade_id || '');
    setEditStream(r.data.current_stream_id || '');
    setEditGuardian(r.data.guardian_name || '');
    setEditPhone(r.data.guardian_phone || '');
    setEditTransport(r.data.uses_transport === 1);
  });

  useEffect(() => { 
    loadStudent(); 
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
    api.get('/streams').then(r => setStreams(r.data)).catch(() => {});
  }, []);

  const payFee = async (e) => {
    e.preventDefault();
    await api.post('/fees/payment', { student_id: id, amount: Number(amount), payment_method: 'cash', paid_for_term: Number(term) });
    setAmount('');
    loadStudent();
  };

  const addExam = async (e) => {
    e.preventDefault();
    if (!subjectId) return alert('Please select a subject');
    if (Number(marks) > 100 || Number(marks) < 0) return alert('Marks must be between 0 and 100');
    await api.post('/exams/results', { 
      student_id: id, 
      exam_id: Number(examTerm), 
      subject_id: subjectId, 
      marks: Number(marks), 
      teacher_comment: remark 
    });
    setMarks(''); setSubjectId(''); setRemark('');
    loadStudent();
  };

  const handleDeleteExam = async (resultId) => {
    if (window.confirm('Delete this exam mark?')) {
      await api.delete('/exams/results/' + resultId);
      loadStudent();
    }
  };

  const handleEditExam = (ex) => {
    setExamTerm(ex.exam_id);
    setSubjectId(ex.subject_id); // Note: subject_id isn't returned, we'd need to map it or just re-select. For now, just re-select.
    setMarks(ex.marks);
    setRemark(ex.teacher_comment || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStudentInfo = async (e) => {
    e.preventDefault();
    await api.put('/students/' + id, {
      current_grade_id: editGrade,
      current_stream_id: editStream,
      guardian_name: editGuardian,
      guardian_phone: editPhone,
      uses_transport: editTransport
    });
    loadStudent();
    alert('Student details updated!');
  };

  if (!student) return <div className="p-10">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Printable Report Card Area */}
      <div id="printable-report" className="bg-white p-8 text-black shadow-lg rounded-xl">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase">Provisional Report Card</h1>
          <p className="text-lg">Student: <span className="font-bold">{student.full_name}</span> | Adm: {student.admission_number}</p>
          <p>Class: {student.grade_name || 'Unassigned'}</p>
        </div>
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Exam Performance</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="p-2">Subject</th>
                <th className="p-2">Marks</th>
                <th className="p-2">Grade</th>
                <th className="p-2">Teacher's Remark</th>
                <th className="p-2 no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {student.exams.map((ex, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="p-2">{ex.subject_name}</td>
                  <td className="p-2 font-mono">{ex.marks}</td>
                  <td className="p-2 font-bold">{ex.grade}</td>
                  <td className="p-2 italic">{ex.teacher_comment || 'No remark'}</td>
                  <td className="p-2 no-print flex gap-2">
                    <button onClick={() => handleEditExam(ex)} className="text-blue-500 hover:text-blue-700"><FiEdit /></button>
                    <button onClick={() => handleDeleteExam(ex.result_id)} className="text-red-500 hover:text-red-700"><FiTrash /></button>
                  </td>
                </tr>
              ))}
              {student.exams.length === 0 && <tr><td colSpan="5" className="p-2 text-center">No exam records yet</td></tr>}
            </tbody>
          </table>
          <div className="mt-4 text-right font-bold">Total Marks: {student.totalMarks}</div>
        </div>
      </div>

      {/* Controls Area */}
      <div className="no-print bg-white dark:bg-slate-800 p-6 rounded-xl shadow flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{student.full_name}</h1>
          <p className="text-slate-500">Adm: {student.admission_number} | Class: {student.grade_name || 'Unassigned'} | Guardian: {student.guardian_name} ({student.guardian_phone})</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900">Print Transcript Only</button>
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-5 rounded-xl shadow text-blue-700 dark:text-blue-400">
          <div className="text-sm font-bold mb-2">Term 1 Fees</div>
          <div className="text-xs">Expected: KES {student.finances.term1.expected.toLocaleString()}</div>
          <div className="text-xs">Paid: KES {student.finances.term1.paid.toLocaleString()}</div>
          <div className="text-sm font-bold mt-1">Balance: KES {student.finances.term1.balance.toLocaleString()}</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 p-5 rounded-xl shadow text-green-700 dark:text-green-400">
          <div className="text-sm font-bold mb-2">Term 2 Fees</div>
          <div className="text-xs">Expected: KES {student.finances.term2.expected.toLocaleString()}</div>
          <div className="text-xs">Paid: KES {student.finances.term2.paid.toLocaleString()}</div>
          <div className="text-sm font-bold mt-1">Balance: KES {student.finances.term2.balance.toLocaleString()}</div>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 p-5 rounded-xl shadow text-orange-700 dark:text-orange-400">
          <div className="text-sm font-bold mb-2">Term 3 Fees</div>
          <div className="text-xs">Expected: KES {student.finances.term3.expected.toLocaleString()}</div>
          <div className="text-xs">Paid: KES {student.finances.term3.paid.toLocaleString()}</div>
          <div className="text-sm font-bold mt-1">Balance: KES {student.finances.term3.balance.toLocaleString()}</div>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Edit Student Details</h3>
          <form onSubmit={updateStudentInfo} className="space-y-4">
            <div>
              <label className="text-sm block mb-1 text-slate-600 dark:text-slate-300">Class/Grade</label>
              <select value={editGrade} onChange={e => setEditGrade(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
                <option value="">Select Grade...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1 text-slate-600 dark:text-slate-300">Stream</label>
              <select value={editStream} onChange={e => setEditStream(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
                <option value="">Select Stream...</option>
                {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
              </select>
            </div>
            <input value={editGuardian} onChange={e => setEditGuardian(e.target.value)} placeholder="Guardian Name" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Guardian Phone" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit_transport" checked={editTransport} onChange={e => setEditTransport(e.target.checked)} className="w-5 h-5" />
              <label htmlFor="edit_transport">Uses Transport (+KES 5,000)</label>
            </div>
            <button className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700">Update Details</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Record Payment</h3>
          <form onSubmit={payFee} className="space-y-4">
            <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (KES)" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <select value={term} onChange={e => setTerm(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
            <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Record Payment</button>
          </form>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Record Exam Mark</h3>
          <form onSubmit={addExam} className="space-y-4">
            <div>
              <label className="text-sm block mb-1 text-slate-600 dark:text-slate-300">Select Term</label>
              <select value={examTerm} onChange={e => setExamTerm(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
                <option value="1">Term 1 Exam</option>
                <option value="2">Term 2 Exam</option>
                <option value="3">Term 3 Exam</option>
              </select>
            </div>
            <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" min="0" max="100" required value={marks} onChange={e => setMarks(e.target.value)} placeholder="Marks (0-100)" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <input type="text" value={remark} onChange={e => setRemark(e.target.value)} placeholder="Teacher's Remark" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Add/Update Mark</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Payment History</h3>
          <ul className="space-y-2">
            {student.payments.map(p => (
              <li key={p.id} className="flex justify-between border-b dark:border-slate-700 pb-2">
                <div>
                  <span className="font-medium">{p.receipt_no}</span>
                  <span className="block text-xs text-slate-400">Term {p.paid_for_term} | {new Date(p.payment_date).toLocaleDateString()}</span>
                </div>
                <span className="font-mono">KES {Number(p.amount).toLocaleString()}</span>
              </li>
            ))}
            {student.payments.length === 0 && <li className="text-slate-500">No payments recorded yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Frontend updated successfully!');