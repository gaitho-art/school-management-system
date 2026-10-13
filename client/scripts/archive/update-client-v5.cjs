const fs = require('fs');
const path = require('path');

const files = {
  'src/App.jsx': `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import SchoolProfile from './pages/SchoolProfile';
import Students from './pages/Students';
import AddStudent from './pages/AddStudent';
import StudentProfile from './pages/StudentProfile';
import Teachers from './pages/Teachers';
import AddTeacher from './pages/AddTeacher';
import Classes from './pages/Classes';
import Exams from './pages/Exams';
import Timetable from './pages/Timetable';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><MainLayout /></Protected>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/school-profile" element={<SchoolProfile />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/add" element={<AddStudent />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/add" element={<AddTeacher />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/timetable" element={<Timetable />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUser, FiBook, FiAward, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/students', label: 'Students', icon: FiUsers },
  { to: '/teachers', label: 'Teachers', icon: FiUser },
  { to: '/classes', label: 'Classes', icon: FiBook },
  { to: '/exams', label: 'Exams & Rankings', icon: FiAward },
  { to: '/timetable', label: 'Timetable', icon: FiCalendar },
  { to: '/school-profile', label: 'School Profile', icon: FiSettings },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(localStorage.theme === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <aside className={\`\${sidebarOpen ? 'w-64' : 'w-16'} transition-all bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-4 flex flex-col\`}>
        <div className="flex items-center justify-between mb-6">
          {sidebarOpen && <h1 className="text-xl font-bold">EAGLE HEIGHT ACADEMY</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            <FiMenu />
          </button>
        </div>
        <nav className="space-y-1 flex-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => \`flex items-center gap-3 px-3 py-2 rounded-lg \${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}\`}>
              <n.icon />
              {sidebarOpen && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">Welcome, {user?.name}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setDark((d) => !d)} className="px-3 py-1 text-sm rounded bg-slate-200 dark:bg-slate-700">
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={logout} className="text-red-500 flex items-center gap-1 text-sm">
              <FiLogOut /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
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
    await api.post('/exams/results', { student_id: id, exam_id: 1, subject_id: subjectId, marks: Number(marks), grade: 'A' });
    setMarks('');
    setSubjectId('');
    loadStudent();
  };

  if (!student) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow flex justify-between items-start no-print">
        <div>
          <h1 className="text-2xl font-bold">{student.full_name}</h1>
          <p className="text-slate-500">Adm: {student.admission_number} | Class: {student.grade_name || 'Unassigned'} | Guardian: {student.guardian_name} ({student.guardian_phone})</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 flex items-center gap-2">
          Print Report Card
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
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

      <div className="hidden print:block">
        <h1 className="text-3xl text-center font-bold mb-2">PROVISIONAL REPORT CARD</h1>
        <p className="text-center mb-4">Student: {student.full_name} | Adm: {student.admission_number}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
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
            <input type="number" required value={marks} onChange={e => setMarks(e.target.value)} placeholder="Marks (0-100)" className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Add Mark</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Exam Performance</h3>
          <ul className="space-y-2">
            {student.exams.map((ex, i) => (
              <li key={i} className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>{ex.exam_name} - {ex.subject_name}</span>
                <span className="font-mono">{ex.marks} ({ex.grade})</span>
              </li>
            ))}
            {student.exams.length === 0 && <li className="text-slate-500">No exam records yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}`,
  'src/pages/Exams.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Exams() {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    // Fetch rankings for Exam ID 1 (Term 1 Exam)
    api.get('/exams/rankings/1').then(r => setRankings(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Exam Rankings (Term 1)</h1>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Position</th>
              <th className="p-4">Admission No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Class</th>
              <th className="p-4">Subjects Taken</th>
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
                <td className="p-4">{s.grade_name || 'N/A'}</td>
                <td className="p-4">{s.subjects_taken}</td>
                <td className="p-4 font-mono font-bold">{s.total_marks}</td>
                <td className="p-4 font-mono">{Number(s.average_marks).toFixed(1)}</td>
              </tr>
            ))}
            {rankings.length === 0 && (
              <tr><td colSpan="7" className="p-4 text-center text-slate-500">No exam marks recorded yet.</td></tr>
            )}
          </tbody>
        </table>
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
  const [form, setForm] = useState({ stream_id: '', day_of_week: 'Mon', period: 1, start_time: '08:00', end_time: '08:40', subject_id: '', room: '' });

  const loadData = () => {
    api.get('/timetable').then(r => setEntries(r.data));
    api.get('/streams').then(r => setStreams(r.data));
    api.get('/subjects').then(r => setSubjects(r.data));
  };

  useEffect(() => { loadData(); }, []);

  const addEntry = async (e) => {
    e.preventDefault();
    await api.post('/timetable', form);
    setForm({ ...form, subject_id: '', room: '' });
    loadData();
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Weekly Timetable</h1>
      
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
          <div>
            <label className="text-sm block mb-1">Day</label>
            <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              {days.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Period</label>
            <input type="number" min="1" max="8" value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          </div>
          <div>
            <label className="text-sm block mb-1">Start</label>
            <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          </div>
          <div>
            <label className="text-sm block mb-1">End</label>
            <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="text-sm block mb-1">Subject</label>
            <select value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">N/A</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow overflow-x-auto">
        <h3 className="font-bold text-lg mb-4">Current Schedule</h3>
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Day</th>
              <th className="p-4">Period</th>
              <th className="p-4">Time</th>
              <th className="p-4">Class</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Room</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(t => (
              <tr key={t.id} className="border-b dark:border-slate-700">
                <td className="p-4">{t.day_of_week}</td>
                <td className="p-4">{t.period}</td>
                <td className="p-4">{t.start_time} - {t.end_time}</td>
                <td className="p-4">{t.grade_name}</td>
                <td className="p-4">{t.subject_name || 'N/A'}</td>
                <td className="p-4">{t.room || 'N/A'}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan="6" className="p-4 text-center text-slate-500">No timetable entries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

@media print {
  .no-print {
    display: none !important;
  }
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Updated: ' + filePath);
});
console.log('Frontend updated successfully!');