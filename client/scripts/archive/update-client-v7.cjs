const fs = require('fs');
const path = require('path');

const files = {
  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

@media print {
  body * {
    visibility: hidden;
  }
  #printable-report, #printable-report * {
    visibility: visible;
  }
  #printable-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none !important;
  }
}`,
  'src/pages/Exams.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Exams() {
  const [rankings, setRankings] = useState([]);
  const [streams, setStreams] = useState([]);
  const [selStream, setSelStream] = useState('');

  useEffect(() => {
    api.get('/streams').then(r => setStreams(r.data)).catch(() => {});
  }, []);

  const loadRankings = (streamId) => {
    const url = streamId ? \`/exams/rankings/1?stream_id=\${streamId}\` : '/exams/rankings/1';
    api.get(url).then(r => setRankings(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadRankings('');
  }, []);

  const handleStreamChange = (e) => {
    const val = e.target.value;
    setSelStream(val);
    loadRankings(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exam Rankings (Term 1)</h1>
        <select value={selStream} onChange={handleStreamChange} className="px-3 py-2 border rounded dark:bg-slate-700">
          <option value="">All Classes</option>
          {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
        </select>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Position</th>
              <th className="p-4">Admission No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Class</th>
              <th className="p-4">Subjects</th>
              <th className="p-4">Total Marks</th>
              <th className="p-4">Average</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((s, index) => (
              <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="p-4 font-bold">{index + 1}</td>
                <td className="p-4">{s.admission_number}</td>
                <td className="p-4">{s.full_name}</td>
                <td className="p-4">{s.grade_name} {s.stream_name}</td>
                <td className="p-4">{s.subjects_taken}</td>
                <td className="p-4 font-mono font-bold">{s.total_marks}</td>
                <td className="p-4 font-mono">{Number(s.average_marks).toFixed(1)}</td>
              </tr>
            ))}
            {rankings.length === 0 && (
              <tr><td colSpan="7" className="p-4 text-center text-slate-500">No exam marks recorded for this class yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
  'src/pages/StudentProfile.jsx': `import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('1');
  const [marks, setMarks] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [remark, setRemark] = useState('');

  const loadStudent = () => api.get(\`/students/\${id}\`).then(r => setStudent(r.data));

  useEffect(() => { 
    loadStudent(); 
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
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
      exam_id: 1, 
      subject_id: subjectId, 
      marks: Number(marks), 
      teacher_comment: remark 
    });
    setMarks('');
    setSubjectId('');
    setRemark('');
    loadStudent();
  };

  if (!student) return <div>Loading...</div>;

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
              </tr>
            </thead>
            <tbody>
              {student.exams.map((ex, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="p-2">{ex.subject_name}</td>
                  <td className="p-2 font-mono">{ex.marks}</td>
                  <td className="p-2 font-bold">{ex.grade}</td>
                  <td className="p-2 italic">{ex.teacher_comment || 'No remark'}</td>
                </tr>
              ))}
              {student.exams.length === 0 && <tr><td colSpan="4" className="p-2 text-center">No exam records yet</td></tr>}
            </tbody>
          </table>
          <div className="mt-4 text-right font-bold">
            Total Marks: {student.totalMarks}
          </div>
        </div>
      </div>

      {/* Non-Printable Controls Area */}
      <div className="no-print bg-white dark:bg-slate-800 p-6 rounded-xl shadow flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{student.full_name}</h1>
          <p className="text-slate-500">Adm: {student.admission_number} | Class: {student.grade_name || 'Unassigned'} | Guardian: {student.guardian_name} ({student.guardian_phone})</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 flex items-center gap-2">
          Print Transcript Only
        </button>
      </div>

      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-100 dark:bg-red-900/30 p-5 rounded-xl shadow text-red-700 dark:text-red-400">
          <div className="text-sm">Total Billed</div>
          <div className="text-2xl font-bold">KES {student.totalBilled.toLocaleString()}</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 p-5 rounded-xl shadow text-green-700 dark:text-green-400">
          <div className="text-sm">Total Paid</div>
          <div className="text-2xl font-bold">KES {student.totalPaid.toLocaleString()}</div>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 p-5 rounded-xl shadow text-orange-700 dark:text-orange-400">
          <div className="text-sm">Balance</div>
          <div className="text-2xl font-bold">KES {student.balance.toLocaleString()}</div>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/30 p-5 rounded-xl shadow text-purple-700 dark:text-purple-400">
          <div className="text-sm">Total Marks</div>
          <div className="text-2xl font-bold">{student.totalMarks}</div>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Record Payment</h3>
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

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Record Exam Mark</h3>
          <form onSubmit={addExam} className="space-y-4">
            <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" min="0" max="100" required value={marks} onChange={e => setMarks(e.target.value)} placeholder="Marks (0-100)" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <input type="text" value={remark} onChange={e => setRemark(e.target.value)} placeholder="Teacher's Remark (Optional)" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Add Mark</button>
          </form>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Payment History</h3>
          <ul className="space-y-2">
            {student.payments.map(p => (
              <li key={p.id} className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>{p.receipt_no} (Term {p.paid_for_term})</span>
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