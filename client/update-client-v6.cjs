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
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/transport" element={<Transport />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUser, FiBook, FiAward, FiCalendar, FiTruck, FiTrendingDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/students', label: 'Students', icon: FiUsers },
  { to: '/teachers', label: 'Teachers', icon: FiUser },
  { to: '/classes', label: 'Classes', icon: FiBook },
  { to: '/exams', label: 'Exams & Rankings', icon: FiAward },
  { to: '/timetable', label: 'Timetable', icon: FiCalendar },
  { to: '/transport', label: 'Transport', icon: FiTruck },
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
      <aside className={\`\${sidebarOpen ? 'w-64' : 'w-16'} transition-all bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-4 flex flex-col\`}>
        <div className="flex items-center justify-between mb-6">
          {sidebarOpen && <h1 className="text-xl font-bold">EAGLE HEIGHT ACADEMY</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            <FiMenu />
          </button>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
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
  'src/pages/Dashboard.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiUsers, FiUserCheck, FiDollarSign, FiTrendingDown, FiBookOpen, FiWallet } from 'react-icons/fi';

export default function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Students', value: stats.students ?? '—', icon: FiUsers, color: 'bg-blue-500' },
    { label: 'Total Teachers', value: stats.teachers ?? '—', icon: FiBookOpen, color: 'bg-green-500' },
    { label: 'Present Today', value: stats.present_today ?? '—', icon: FiUserCheck, color: 'bg-purple-500' },
    { label: 'Total Fees Collected', value: stats.fees_collected ? 'KES ' + Number(stats.fees_collected).toLocaleString() : '—', icon: FiDollarSign, color: 'bg-orange-500' },
    { label: 'Total Expenses', value: stats.total_expenses ? 'KES ' + Number(stats.total_expenses).toLocaleString() : '—', icon: FiTrendingDown, color: 'bg-red-500' },
    { label: 'Net Balance', value: (stats.fees_collected - stats.total_expenses) ? 'KES ' + Number(stats.fees_collected - stats.total_expenses).toLocaleString() : '—', icon: FiWallet, color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow flex items-center gap-4">
            <div className={\`\${c.color} p-3 rounded-lg text-white\`}><c.icon size={24} /></div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{c.label}</div>
              <div className="text-2xl font-bold mt-1">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'src/pages/AddStudent.jsx': `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AddStudent() {
  const [form, setForm] = useState({ full_name: '', gender: 'Male', date_of_birth: '', current_grade_id: '', guardian_name: '', guardian_phone: '', medical_conditions: '', uses_transport: false });
  const [grades, setGrades] = useState([]);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/grades').then(r => setGrades(r.data)).catch(() => {});
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', form);
      setMsg('Student registered! Admission No: ' + res.data.admission_number);
      setTimeout(() => navigate('/students'), 2000);
    } catch (err) {
      setMsg('Registration failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Register New Student</h1>
      {msg && <div className="p-3 bg-blue-100 text-blue-700 rounded">{msg}</div>}
      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
          <option>Male</option>
          <option>Female</option>
        </select>
        <input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <select value={form.current_grade_id} onChange={e => setForm({...form, current_grade_id: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
          <option value="">Select Class/Grade</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input placeholder="Guardian Name" value={form.guardian_name} onChange={e => setForm({...form, guardian_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input required placeholder="Guardian Phone" value={form.guardian_phone} onChange={e => setForm({...form, guardian_phone: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input placeholder="Medical Conditions" value={form.medical_conditions} onChange={e => setForm({...form, medical_conditions: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-3 rounded">
          <input type="checkbox" id="uses_transport" checked={form.uses_transport} onChange={e => setForm({...form, uses_transport: e.target.checked})} className="w-5 h-5" />
          <label htmlFor="uses_transport" className="font-medium">Uses School Transport (Adds KES 5,000 to Fees)</label>
        </div>
        
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Register Student</button>
      </form>
    </div>
  );
}`,
  'src/pages/Transport.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Transport() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.get('/students').then(r => setStudents(r.data.filter(s => s.uses_transport === 1))).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transport Module</h1>
      <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl text-blue-700 dark:text-blue-400">
        Students using transport are charged an additional KES 5,000 on their fee account.
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Admission No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Class</th>
              <th className="p-4">Transport Status</th>
              <th className="p-4">Transport Charge</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b dark:border-slate-700">
                <td className="p-4">{s.admission_number}</td>
                <td className="p-4">{s.full_name}</td>
                <td className="p-4">{s.grade_name || 'Unassigned'}</td>
                <td className="p-4 text-green-500 font-bold">Active</td>
                <td className="p-4 font-mono">KES 5,000</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="5" className="p-4 text-center text-slate-500">No students are registered for transport yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
  'src/pages/Expenses.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiPlus } from 'react-icons/fi';

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

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">School Expenses (Money Out)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-100 dark:bg-red-900/30 p-5 rounded-xl shadow text-red-700 dark:text-red-400 md:col-span-3">
          <div className="text-sm">Total Recorded Expenses</div>
          <div className="text-3xl font-bold">KES {totalExpenses.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Record New Expense</h3>
          <form onSubmit={addExpense} className="space-y-4">
            <input required placeholder="Description (e.g. Bought Chalk)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <input required type="number" placeholder="Amount (KES)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option>General</option>
              <option>Salaries</option>
              <option>Maintenance</option>
              <option>Supplies</option>
              <option>Utilities</option>
            </select>
            <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 flex items-center gap-2"><FiPlus /> Record Expense</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow overflow-hidden">
          <h3 className="font-bold text-lg mb-4">Expense History</h3>
          <div className="overflow-y-auto max-h-96">
            <ul className="space-y-2">
              {expenses.map(exp => (
                <li key={exp.id} className="flex justify-between border-b dark:border-slate-700 pb-2">
                  <div>
                    <span className="font-medium">{exp.description}</span>
                    <span className="block text-xs text-slate-400">{exp.category} - {new Date(exp.expense_date).toLocaleDateString()}</span>
                  </div>
                  <span className="font-mono text-red-500">KES {Number(exp.amount).toLocaleString()}</span>
                </li>
              ))}
              {expenses.length === 0 && <li className="text-slate-500">No expenses recorded yet</li>}
            </ul>
          </div>
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