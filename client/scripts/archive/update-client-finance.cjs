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
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/finance" element={<Finance />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUser, FiBook, FiAward, FiCalendar, FiTruck, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';

const nav = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/students', label: 'Students', icon: FiUsers },
  { to: '/teachers', label: 'Teachers', icon: FiUser },
  { to: '/classes', label: 'Classes', icon: FiBook },
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
              isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'\`}>
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
  'src/pages/Finance.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiSearch } from 'react-icons/fi';

export default function Finance() {
  const [overview, setOverview] = useState({ collected: 0, expected: 0, outstanding: 0 });
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/finance/overview').then(r => setOverview(r.data)).catch(() => {});
    api.get('/finance/transactions').then(r => {
      setTransactions(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredTx = transactions.filter(t => 
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.receipt_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Fees & Finance Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border-l-4 border-green-500">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Collected</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">KES {Number(overview.collected).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border-l-4 border-blue-500">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Expected</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">KES {Number(overview.expected).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border-l-4 border-red-500">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Outstanding</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">KES {Number(overview.outstanding).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Transactions</h2>
          <div className="relative w-64">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search receipt or name..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-11 pr-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
              <tr>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Receipt No</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Student Name</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Adm No</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Term</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Method</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="p-4 text-center text-slate-500">Loading transactions...</td></tr>
              ) : (
                filteredTx.map(t => (
                  <tr key={t.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{t.receipt_no}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{t.full_name}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{t.admission_number}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">Term {t.paid_for_term}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 capitalize">{t.payment_method}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{new Date(t.payment_date).toLocaleDateString()}</td>
                    <td className="p-4 text-right font-mono font-bold text-green-600">KES {Number(t.amount).toLocaleString()}</td>
                  </tr>
                ))
              )}
              {!loading && filteredTx.length === 0 && (
                <tr><td colSpan="7" className="p-8 text-center text-slate-500">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
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
console.log('Frontend updated for Finance Page!');