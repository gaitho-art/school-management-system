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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu, FiUserPlus, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/students', label: 'Students', icon: FiUsers },
  { to: '/teachers', label: 'Teachers', icon: FiUser },
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

  useEffect(() => {
    api.get('/students').then(r => setStudents(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Students</h1>
        <Link to="/students/add" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <FiPlus /> Register Student
        </Link>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Admission No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Gender</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="p-4">{s.admission_number}</td>
                <td className="p-4">{s.full_name}</td>
                <td className="p-4">{s.gender}</td>
                <td className="p-4 capitalize">{s.status}</td>
                <td className="p-4">
                  <Link to={\`/students/\${s.id}\`} className="text-blue-500 hover:underline">View Profile & Fees</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
  'src/pages/AddStudent.jsx': `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AddStudent() {
  const [form, setForm] = useState({ full_name: '', gender: 'Male', date_of_birth: '', medical_conditions: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

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
        <div>
          <label className="text-sm block mb-1">Full Name</label>
          <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        </div>
        <div>
          <label className="text-sm block mb-1">Gender</label>
          <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1">Date of Birth</label>
          <input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        </div>
        <div>
          <label className="text-sm block mb-1">Medical Conditions (Optional)</label>
          <input value={form.medical_conditions} onChange={e => setForm({...form, medical_conditions: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Register Student</button>
      </form>
    </div>
  );
}`,
  'src/pages/StudentProfile.jsx': `import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');

  const loadStudent = () => api.get(\`/students/\${id}\`).then(r => setStudent(r.data));

  useEffect(() => { loadStudent(); }, []);

  const payFee = async (e) => {
    e.preventDefault();
    await api.post('/fees/payment', { student_id: id, amount: Number(amount), payment_method: method });
    setAmount('');
    loadStudent();
  };

  if (!student) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
        <p className="text-slate-500">Adm: {student.admission_number} | Gender: {student.gender}</p>
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
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="cheque">Cheque</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
            <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Record Payment</button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold text-lg mb-4">Payment History</h3>
          <ul className="space-y-2">
            {student.payments.map(p => (
              <li key={p.id} className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>{p.receipt_no}</span>
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
  'src/pages/Teachers.jsx': `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPlus } from 'react-icons/fi';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    api.get('/teachers').then(r => setTeachers(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <Link to="/teachers/add" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <FiPlus /> Register Teacher
        </Link>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 border-b dark:border-slate-600">
            <tr>
              <th className="p-4">Teacher No</th>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Email</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="p-4">{t.teacher_number}</td>
                <td className="p-4">{t.full_name}</td>
                <td className="p-4">{t.phone}</td>
                <td className="p-4">{t.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
  'src/pages/AddTeacher.jsx': `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AddTeacher() {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', qualification: '', tsc_number: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teachers', form);
      navigate('/teachers');
    } catch (err) {
      setMsg('Registration failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Register New Teacher</h1>
      {msg && <div className="p-3 bg-red-100 text-red-700 rounded">{msg}</div>}
      <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input required placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input placeholder="Qualification (e.g. BEd Maths)" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <input placeholder="TSC Number" value={form.tsc_number} onChange={e => setForm({...form, tsc_number: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700" />
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Register Teacher</button>
      </form>
    </div>
  );
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Created/Updated: ' + filePath);
});

console.log('Frontend modules added successfully!');