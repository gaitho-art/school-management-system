const fs = require('fs');
const path = require('path');

const files = {
  'src/pages/Exams.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Exams() {
  const [rankings, setRankings] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selGrade, setSelGrade] = useState('');

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
  }, []);

  const loadRankings = (gradeId) => {
    const url = gradeId ? \`/exams/rankings/1?grade_id=\${gradeId}\` : '/exams/rankings/1';
    api.get(url).then(r => setRankings(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadRankings('');
  }, []);

  const handleGradeChange = (e) => {
    const val = e.target.value;
    setSelGrade(val);
    loadRankings(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exam Rankings (Term 1)</h1>
        <select value={selGrade} onChange={handleGradeChange} className="px-3 py-2 border rounded dark:bg-slate-700">
          <option value="">All Grades</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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
              <tr><td colSpan="7" className="p-4 text-center text-slate-500">No exam marks recorded for this grade yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
  'src/pages/Students.jsx': `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPlus, FiSearch, FiTrash } from 'react-icons/fi';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filterGrade, setFilterGrade] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadStudents = () => {
    api.get('/students').then(r => setStudents(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
    loadStudents();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      await api.delete('/students/' + id);
      loadStudents();
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesGrade = filterGrade ? s.grade_name === filterGrade : true;
    const matchesSearch = searchTerm ? 
      (s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())) 
      : true;
    return matchesGrade && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Students</h1>
        <Link to="/students/add" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <FiPlus /> Register Student
        </Link>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="font-semibold block mb-1">Search Student</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input type="text" placeholder="Search by name or admission no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded dark:bg-slate-700" />
          </div>
        </div>
        <div className="w-full md:w-64">
          <label className="font-semibold block mb-1">Filter by Class</label>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
            <option value="">All Classes</option>
            {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Admission No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Gender</th>
              <th className="p-4">Class</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(s => (
              <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="p-4">{s.admission_number}</td>
                <td className="p-4">{s.full_name}</td>
                <td className="p-4">{s.gender}</td>
                <td className="p-4">{s.grade_name || 'Unassigned'}</td>
                <td className="p-4 capitalize">{s.status}</td>
                <td className="p-4 flex gap-4">
                  <Link to={\`/students/\${s.id}\`} className="text-blue-500 hover:underline">View/Edit</Link>
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline flex items-center gap-1"><FiTrash /> Delete</button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr><td colSpan="6" className="p-4 text-center text-slate-500">No students found.</td></tr>
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
  const [grades, setGrades] = useState([]);
  const [streams, setStreams] = useState([]);
  
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('1');
  const [marks, setMarks] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [remark, setRemark] = useState('');

  // Edit form state
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
    await api.post('/exams/results', { student_id: id, exam_id: 1, subject_id: subjectId, marks: Number(marks), teacher_comment: remark });
    setMarks(''); setSubjectId(''); setRemark('');
    loadStudent();
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
          <div className="mt-4 text-right font-bold">Total Marks: {student.totalMarks}</div>
        </div>
      </div>

      {/* Controls Area */}
      <div className="no-print bg-white dark:bg-slate-800 p-6 rounded-xl shadow flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{student.full_name}</h1>
          <p className="text-slate-500">Adm: {student.admission_number} | Class: {student.grade_name || 'Unassigned'} | Guardian: {student.guardian_name} ({student.guardian_phone})</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900">Print Transcript Only</button>
      </div>

      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-100 dark:bg-red-900/30 p-5 rounded-xl shadow text-red-700 dark:text-red-400"><div className="text-sm">Total Billed</div><div className="text-2xl font-bold">KES {student.totalBilled.toLocaleString()}</div></div>
        <div className="bg-green-100 dark:bg-green-900/30 p-5 rounded-xl shadow text-green-700 dark:text-green-400"><div className="text-sm">Total Paid</div><div className="text-2xl font-bold">KES {student.totalPaid.toLocaleString()}</div></div>
        <div className="bg-orange-100 dark:bg-orange-900/30 p-5 rounded-xl shadow text-orange-700 dark:text-orange-400"><div className="text-sm">Balance</div><div className="text-2xl font-bold">KES {student.balance.toLocaleString()}</div></div>
        <div className="bg-purple-100 dark:bg-purple-900/30 p-5 rounded-xl shadow text-purple-700 dark:text-purple-400"><div className="text-sm">Total Marks</div><div className="text-2xl font-bold">{student.totalMarks}</div></div>
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Edit Student Details</h3>
          <form onSubmit={updateStudentInfo} className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Class/Grade</label>
              <select value={editGrade} onChange={e => setEditGrade(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
                <option value="">Select Grade...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1">Stream</label>
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
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Record Exam Mark</h3>
          <form onSubmit={addExam} className="space-y-4">
            <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" min="0" max="100" required value={marks} onChange={e => setMarks(e.target.value)} placeholder="Marks (0-100)" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <input type="text" value={remark} onChange={e => setRemark(e.target.value)} placeholder="Teacher's Remark" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Add Mark</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Payment History</h3>
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
}`,
  'src/pages/Expenses.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiPlus, FiTrash } from 'react-icons/fi';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'General' });

  const loadExpenses = () => api.get('/expenses').then(r => setExpenses(r.data));

  useEffect(() => { loadExpenses(); }, []);

  const addExpense = async (e) => {
    e.preventDefault();
    await api.post('/expenses', { ...form, amount: Number(form.amount) });
    setForm({ description: '', amount: '', category: 'General' });
    loadExpenses();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense record?')) {
      await api.delete('/expenses/' + id);
      loadExpenses();
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">School Expenses (Money Out)</h1>
      <div className="bg-red-100 dark:bg-red-900/30 p-5 rounded-xl shadow text-red-700 dark:text-red-400">
        <div className="text-sm">Total Recorded Expenses</div>
        <div className="text-3xl font-bold">KES {totalExpenses.toLocaleString()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Record New Expense</h3>
          <form onSubmit={addExpense} className="space-y-4">
            <input required placeholder="Description (e.g. Bought Chalk)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <input required type="number" placeholder="Amount (KES)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option>General</option><option>Salaries</option><option>Maintenance</option><option>Supplies</option><option>Utilities</option>
            </select>
            <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 flex items-center gap-2"><FiPlus /> Record Expense</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Expense History</h3>
          <ul className="space-y-2">
            {expenses.map(exp => (
              <li key={exp.id} className="flex justify-between border-b dark:border-slate-700 pb-2">
                <div>
                  <span className="font-medium">{exp.description}</span>
                  <span className="block text-xs text-slate-400">{exp.category} - {new Date(exp.expense_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-red-500">KES {Number(exp.amount).toLocaleString()}</span>
                  <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700"><FiTrash /></button>
                </div>
              </li>
            ))}
            {expenses.length === 0 && <li className="text-slate-500">No expenses recorded yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}`,
  'src/pages/Timetable.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Timetable() {
  const [entries, setEntries] = useState([]);
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterStream, setFilterStream] = useState('');
  const [form, setForm] = useState({ stream_id: '', day_of_week: 'Mon', period: 1, start_time: '08:00', end_time: '08:40', subject_id: '', room: '' });

  const loadData = () => {
    let url = '/timetable';
    if (filterStream) url += '?stream_id=' + filterStream;
    api.get(url).then(r => setEntries(r.data));
  };

  useEffect(() => {
    api.get('/streams').then(r => setStreams(r.data));
    api.get('/subjects').then(r => setSubjects(r.data));
  }, []);

  useEffect(() => {
    loadData();
  }, [filterStream]);

  const addEntry = async (e) => {
    e.preventDefault();
    await api.post('/timetable', form);
    setForm({ ...form, subject_id: '', room: '' });
    loadData();
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Weekly Timetable</h1>
        <select value={filterStream} onChange={e => setFilterStream(e.target.value)} className="px-3 py-2 border rounded dark:bg-slate-700">
          <option value="">All Classes</option>
          {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
        </select>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h3 className="font-bold text-lg mb-4">Add Lesson</h3>
        <form onSubmit={addEntry} className="grid grid-cols-2 md:grid-cols-7 gap-4 items-end">
          <div className="col-span-2 md:col-span-1">
            <label className="text-sm block mb-1">Class</label>
            <select required value={form.stream_id} onChange={e => setForm({...form, stream_id: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select...</option>
              {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name}</option>)}
            </select>
          </div>
          <div><label className="text-sm block mb-1">Day</label><select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">{days.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="text-sm block mb-1">Period</label><input type="number" min="1" max="8" value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" /></div>
          <div><label className="text-sm block mb-1">Start</label><input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" /></div>
          <div><label className="text-sm block mb-1">End</label><input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" /></div>
          <div className="col-span-2 md:col-span-1"><label className="text-sm block mb-1">Subject</label><select value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700"><option value="">N/A</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow overflow-x-auto">
        <h3 className="font-bold text-lg mb-4">Current Schedule</h3>
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr><th className="p-4">Day</th><th className="p-4">Period</th><th className="p-4">Time</th><th className="p-4">Class</th><th className="p-4">Subject</th><th className="p-4">Room</th></tr>
          </thead>
          <tbody>
            {entries.map(t => (
              <tr key={t.id} className="border-b dark:border-slate-700">
                <td className="p-4">{t.day_of_week}</td><td className="p-4">{t.period}</td><td className="p-4">{t.start_time} - {t.end_time}</td><td className="p-4">{t.grade_name}</td><td className="p-4">{t.subject_name || 'N/A'}</td><td className="p-4">{t.room || 'N/A'}</td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">No timetable entries found.</td></tr>}
          </tbody>
        </table>
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