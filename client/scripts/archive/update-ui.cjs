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

/* Custom Soft Shadow */
.shadow-soft {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* Skeleton Loader Animation */
.skeleton {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 0.5rem;
}
.dark .skeleton {
  background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
  background-size: 200% 100%;
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media print {
  body * { visibility: hidden; }
  #printable-report, #printable-report * { visibility: visible; }
  #printable-report { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}`,
  'src/components/Breadcrumb.jsx': `import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

export default function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(x => x);

  return (
    <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
      <Link to="/" className="hover:text-blue-500">Home</Link>
      {paths.map((p, i) => {
        const path = '/' + paths.slice(0, i + 1).join('/');
        const isLast = i === paths.length - 1;
        return (
          <div key={i} className="flex items-center">
            <FiChevronRight className="mx-2 text-xs" />
            {isLast ? (
              <span className="text-slate-800 dark:text-slate-200 font-medium capitalize">{p}</span>
            ) : (
              <Link to={path} className="hover:text-blue-500 capitalize">{p}</Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUser, FiBook, FiAward, FiCalendar, FiTruck, FiTrendingDown } from 'react-icons/fi';
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
  'src/pages/Students.jsx': `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPlus, FiSearch, FiTrash } from 'react-icons/fi';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filterGrade, setFilterGrade] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStudents = () => {
    setLoading(true);
    api.get('/students').then(r => {
      setStudents(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Students</h1>
        <Link to="/students/add" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
          <FiPlus /> Register Student
        </Link>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="font-semibold text-sm block mb-1 text-slate-600 dark:text-slate-300">Search Student</label>
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" />
            <input type="text" placeholder="Search by name or admission no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
        </div>
        <div className="w-full md:w-64">
          <label className="font-semibold text-sm block mb-1 text-slate-600 dark:text-slate-300">Filter by Class</label>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
            <option value="">All Classes</option>
            {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
            <tr>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Admission No</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Name</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Gender</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Class</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Status</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b dark:border-slate-700">
                  <td className="p-5"><div className="skeleton h-4 w-24"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-40"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-16"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-20"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-16"></div></td>
                  <td className="p-5"><div className="skeleton h-4 w-24"></div></td>
                </tr>
              ))
            ) : (
              filteredStudents.map(s => (
                <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.admission_number}</td>
                  <td className="p-5 font-medium text-slate-800 dark:text-slate-100">{s.full_name}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.gender}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{s.grade_name || 'Unassigned'}</td>
                  <td className="p-5 capitalize">
                    <span className={\`px-2 py-1 rounded-lg text-xs font-medium \${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}\`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-5 flex gap-4">
                    <Link to={\`/students/\${s.id}\`} className="text-blue-500 hover:text-blue-600 transition-colors font-medium">View/Edit</Link>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-medium"><FiTrash /> Delete</button>
                  </td>
                </tr>
              ))
            )}
            
            {!loading && filteredStudents.length === 0 && (
              <tr><td colSpan="6" className="p-10 text-center text-slate-500">No students found.</td></tr>
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
console.log('UI updated successfully!');