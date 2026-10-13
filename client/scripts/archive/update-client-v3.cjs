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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUser, FiBook } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/students', label: 'Students', icon: FiUsers },
  { to: '/teachers', label: 'Teachers', icon: FiUser },
  { to: '/classes', label: 'Classes', icon: FiBook },
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
  'src/pages/Students.jsx': `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPlus } from 'react-icons/fi';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filterGrade, setFilterGrade] = useState('');

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
    loadStudents();
  }, []);

  const loadStudents = (gradeId = '') => {
    let url = '/students';
    // Note: The backend currently returns all students. We will filter on frontend for simplicity.
    api.get(url).then(r => setStudents(r.data)).catch(() => {});
  };

  // Filter students locally based on selected grade
  const filteredStudents = filterGrade 
    ? students.filter(s => s.grade_name === filterGrade) 
    : students;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Students</h1>
        <Link to="/students/add" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <FiPlus /> Register Student
        </Link>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow flex items-center gap-4">
        <label className="font-semibold">Filter by Class:</label>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="px-3 py-2 border rounded dark:bg-slate-700">
          <option value="">All Classes</option>
          {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
        </select>
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
                <td className="p-4">
                  <Link to={\`/students/\${s.id}\`} className="text-blue-500 hover:underline">View Profile & Fees</Link>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr><td colSpan="6" className="p-4 text-center text-slate-500">No students found for this class.</td></tr>
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
    // Hardcoded exam_id=1 for simplicity
    await api.post('/exams/results', { student_id: id, exam_id: 1, subject_id: subjectId, marks: Number(marks), grade: 'A' });
    setMarks('');
    setSubjectId('');
    loadStudent();
  };

  if (!student) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
        <p className="text-slate-500">Adm: {student.admission_number} | Class: {student.grade_name || 'Unassigned'} | Guardian: {student.guardian_name} ({student.guardian_phone})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <span>{ex.name}</span>
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
  'src/pages/Classes.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Classes() {
  const [streams, setStreams] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selStream, setSelStream] = useState('');
  const [selTeacher, setSelTeacher] = useState('');

  const loadData = () => {
    api.get('/streams').then(r => setStreams(r.data));
    api.get('/teachers').then(r => setTeachers(r.data));
    api.get('/class-teachers').then(r => setAssignments(r.data));
  };

  useEffect(() => { loadData(); }, []);

  const assign = async (e) => {
    e.preventDefault();
    if (!selStream || !selTeacher) return alert('Please select both a class and a teacher');
    await api.post('/class-teachers', { stream_id: selStream, teacher_id: selTeacher, academic_year: '2025' });
    setSelStream(''); setSelTeacher('');
    loadData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Class Management</h1>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h3 className="font-bold text-lg mb-4">Assign Class Teacher</h3>
        <form onSubmit={assign} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm block mb-1">Select Class (Grade & Stream)</label>
            <select value={selStream} onChange={e => setSelStream(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select Class...</option>
              {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm block mb-1">Select Teacher</label>
            <select value={selTeacher} onChange={e => setSelTeacher(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="">Select Teacher...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.teacher_number})</option>)}
            </select>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Assign</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h3 className="font-bold text-lg mb-4">Current Class Teachers</h3>
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Class</th>
              <th className="p-4">Teacher Name</th>
              <th className="p-4">Teacher No</th>
              <th className="p-4">Year</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="border-b dark:border-slate-700">
                <td className="p-4">{a.grade_name} - {a.stream_name}</td>
                <td className="p-4">{a.teacher_name}</td>
                <td className="p-4">{a.teacher_number}</td>
                <td className="p-4">{a.academic_year}</td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-slate-500">No teachers assigned to classes yet.</td></tr>
            )}
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