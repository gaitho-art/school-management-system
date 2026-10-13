import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUser, FiBook, FiAward, FiCalendar, FiTruck, FiTrendingDown, FiDollarSign, FiCheckCircle, FiBox } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import { canAccessRoute, routeAccess } from '../utils/roleAccess';

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
  { to: '/inventory', label: 'Inventory', icon: FiBox },
  { to: '/school-profile', label: 'School Profile', icon: FiSettings },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(localStorage.theme === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const visibleNav = nav.filter((item) => canAccessRoute(user?.role, routeAccess[item.to.replace('/', '') || 'dashboard'] || []));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-4 flex flex-col shadow-soft z-10`}>
        <div className="flex items-center justify-between mb-8">
          {sidebarOpen && <h1 className="text-xl font-bold text-blue-600">EAGLE HEIGHT ACADEMY</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <FiMenu />
          </button>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {visibleNav.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
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
}