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
import Expenses from './pages/Expenses';
import Transport from './pages/Transport';
import Finance from './pages/Finance';
import Attendance from './pages/Attendance';

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
            <Route path="/transport" element={<Transport />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/attendance" element={<Attendance />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUser, FiBook, FiAward, FiCalendar, FiTruck, FiTrendingDown, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';

const nav = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/students', label: 'Students', icon: FiUsers },
  { to: '/teachers', label: 'Teachers', icon: FiUser },
  { to: '/classes', label: 'Classes', icon: FiBook },
  { to: '/attendance', label: 'Attendance', icon: FiCheckCircle },
  { to: '/exams', label: 'Exams & Rankings', icon: FiAward },
  { to: '/timetable', label: 'Timetable', icon: FiCalendar },
  { to: '/transport', label: 'Transport', icon: FiTruck },
  { to: '/finance', label: 'Fees & Finance', icon: FiDollarSign },
  { to: '/expenses', label: 'Expenses (In/Out)', icon: FiTrendingDown },
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
      <aside className={\`\${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-4 flex flex-col shadow-soft z-10\`}>
        <div className="flex items-center justify-between mb-8">
          {sidebarOpen && <h1 className="text-xl font-bold text-blue-600">EAGLE HEIGHT ACADEMY</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <FiMenu />
          </button>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => \`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 \${
              isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }\`}>
              <n.icon size={18} />
              {sidebarOpen && <span className="text-sm font-medium">{n.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-slate-800 border-b dark:border-slate-700 shadow-sm">
          <span className="text-sm text-slate-500 dark:text-slate-400">Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span></span>
          <div className="flex items-center gap-4">
            <button onClick={() => setDark((d) => !d)} className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={logout} className="text-red-500 flex items-center gap-1 text-sm hover:text-red-600 transition-colors">
              <FiLogOut /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}`,
  'src/pages/Attendance.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Attendance() {
  const [streams, setStreams] = useState([]);
  const [selStream, setSelStream] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/streams').then(r => setStreams(r.data)).catch(() => {});
  }, []);

  const loadAttendance = () => {
    if (!selStream || !date) return;
    setLoading(true);
    api.get(\`/attendance?stream_id=\${selStream}&date=\${date}\`).then(r => {
      setStudents(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleStreamChange = (e) => {
    setSelStream(e.target.value);
  };

  const setStatus = (id, status) => {
    setStudents(students.map(s => s.id === id ? { ...s, status } : s));
  };

  const saveAttendance = async () => {
    const records = students.map(s => ({ student_id: s.id, status: s.status || 'absent' }));
    await api.post('/attendance/mark', { date, stream_id: selStream, records });
    alert('Attendance saved successfully!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Attendance Register</h1>
      
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="font-semibold text-sm block mb-1 text-slate-600 dark:text-slate-300">Select Class</label>
          <select value={selStream} onChange={handleStreamChange} className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Select Class...</option>
            {streams.map(s => <option key={s.id} value={s.id}>{s.grade_name} - {s.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-64">
          <label className="font-semibold text-sm block mb-1 text-slate-600 dark:text-slate-300">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onClick={loadAttendance} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
          Load Register
        </button>
      </div>

      {students.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Mark Attendance</h2>
            <button onClick={saveAttendance} className="bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700">Save Attendance</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
              <tr>
                <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Adm No</th>
                <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                <th className="p-5 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b dark:border-slate-700">
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.admission_number}</td>
                  <td className="p-5 font-medium text-slate-800 dark:text-slate-100">{s.full_name}</td>
                  <td className="p-5 text-center">
                    <div className="inline-flex rounded-xl overflow-hidden border dark:border-slate-600">
                      <button 
                        onClick={() => setStatus(s.id, 'present')} 
                        className={\`px-4 py-2 text-sm font-medium \${
                          s.status === 'present' ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }\`}
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => setStatus(s.id, 'absent')} 
                        className={\`px-4 py-2 text-sm font-medium \${
                          s.status === 'absent' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }\`}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {students.length === 0 && !loading && selStream && (
        <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-soft text-center text-slate-500">
          Click "Load Register" to view students for this class.
        </div>
      )}
    </div>
  );
}`,
  'src/pages/Exams.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Exams() {
  const [rankings, setRankings] = useState([]);
  const [grades, setGrades] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [selGrade, setSelGrade] = useState('');
  const [selExam, setSelExam] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
    api.get('/exams/list').then(r => {
      setExamsList(r.data);
      if (r.data.length > 0) setSelExam(r.data[0].id);
    }).catch(() => {});
  }, []);

  const loadRankings = (examId, gradeId) => {
    if (!examId) return;
    setLoading(true);
    let url = \`/exams/rankings/\${examId}\`;
    if (gradeId) url += \`?grade_id=\${gradeId}\`;
    api.get(url).then(r => {
      setRankings(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadRankings(selExam, selGrade);
  }, [selExam, selGrade]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Exam Rankings</h1>
        <div className="flex gap-3">
          <select value={selExam} onChange={e => setSelExam(e.target.value)} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
            {examsList.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.academic_year})</option>)}
          </select>
          <select value={selGrade} onChange={e => setSelGrade(e.target.value)} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Grades</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
            <tr>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Position</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Admission No</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Name</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Class</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Subjects</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Total Marks</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Average</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b dark:border-slate-700">
                  <td className="p-5"><div className="skeleton h-4 w-8"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-24"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-40"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-20"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-12"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-16"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-16"></div></td>
                </tr>
              ))
            ) : (
              rankings.map((s, index) => (
                <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-5 font-bold text-slate-800 dark:text-slate-100">{index + 1}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.admission_number}</td>
                  <td className="p-5 font-medium text-slate-800 dark:text-slate-100">{s.full_name}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.grade_name} {s.stream_name}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.subjects_taken}</td>
                  <td className="p-5 font-mono font-bold text-blue-600 dark:text-blue-400">{s.total_marks}</td>
                  <td className="p-5 font-mono text-slate-700 dark:text-slate-300">{Number(s.average_marks).toFixed(1)}</td>
                </tr>
              ))
            )}
            {!loading && rankings.length === 0 && (
              <tr><td colSpan="7" className="p-10 text-center text-slate-500">No exam marks recorded for this selection yet.</td></tr>
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
console.log('Frontend updated for Attendance & Exams!');