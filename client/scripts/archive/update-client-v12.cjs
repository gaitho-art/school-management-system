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
import Inventory from './pages/Inventory';

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
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/transport" element={<Transport />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/inventory" element={<Inventory />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUser, FiBook, FiAward, FiCalendar, FiTruck, FiTrendingDown, FiDollarSign, FiCheckCircle, FiBox } from 'react-icons/fi';
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
  { to: '/inventory', label: 'Inventory', icon: FiBox },
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
  'src/pages/Inventory.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiPlus, FiTrash, FiEdit } from 'react-icons/fi';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'General', quantity: '', unit: 'pcs', unit_cost: '', condition_status: 'good' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadItems = () => {
    setLoading(true);
    api.get('/inventory').then(r => {
      setItems(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, quantity: Number(form.quantity), unit_cost: Number(form.unit_cost) };
    if (editId) {
      await api.put('/inventory/' + editId, payload);
    } else {
      await api.post('/inventory', payload);
    }
    setForm({ name: '', category: 'General', quantity: '', unit: 'pcs', unit_cost: '', condition_status: 'good' });
    setEditId(null);
    loadItems();
  };

  const handleEdit = (item) => {
    setForm({ ...item, quantity: String(item.quantity), unit_cost: String(item.unit_cost) });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      await api.delete('/inventory/' + id);
      loadItems();
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">School Inventory</h1>
      
      <div className="bg-blue-100 dark:bg-blue-900/30 p-5 rounded-2xl shadow-soft text-blue-700 dark:text-blue-400">
        <h3 className="text-sm font-semibold">Total Inventory Value</h3>
        <p className="text-3xl font-bold mt-1">KES {totalValue.toLocaleString()}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">{editId ? 'Edit Item' : 'Add New Item'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input required placeholder="Item Name (e.g. Chalk)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Category (e.g. Supplies)" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500" />
          <input required type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Unit (e.g. boxes)" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500" />
          <input required type="number" step="0.01" placeholder="Unit Cost (KES)" value={form.unit_cost} onChange={e => setForm({...form, unit_cost: e.target.value})} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={form.condition_status} onChange={e => setForm({...form, condition_status: e.target.value})} className="px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="damaged">Damaged</option>
          </select>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2">
              {editId ? <FiEdit /> : <FiPlus />} {editId ? 'Update Item' : 'Add Item'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm({ name: '', category: 'General', quantity: '', unit: 'pcs', unit_cost: '', condition_status: 'good' }); }} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-2.5 rounded-xl">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
            <tr>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Item Name</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Category</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Qty</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Unit Cost</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Total Value</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Condition</th>
              <th className="p-5 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-10 text-center text-slate-500">Loading inventory...</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-5 font-medium text-slate-800 dark:text-slate-100">{item.name}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{item.category}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">{item.quantity} {item.unit}</td>
                  <td className="p-5 text-slate-700 dark:text-slate-300">KES {Number(item.unit_cost).toLocaleString()}</td>
                  <td className="p-5 font-mono font-bold text-slate-800 dark:text-slate-100">KES {(item.quantity * item.unit_cost).toLocaleString()}</td>
                  <td className="p-5 capitalize">
                    <span className={\`px-2 py-1 rounded-lg text-xs font-medium \${
                      item.condition_status === 'new' ? 'bg-green-100 text-green-700' : 
                      item.condition_status === 'good' ? 'bg-blue-100 text-blue-700' : 
                      item.condition_status === 'fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }\`}>
                      {item.condition_status}
                    </span>
                  </td>
                  <td className="p-5 flex gap-3">
                    <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-600"><FiEdit /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600"><FiTrash /></button>
                  </td>
                </tr>
              ))
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan="7" className="p-10 text-center text-slate-500">No inventory items found.</td></tr>
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
console.log('Frontend updated for Inventory!');