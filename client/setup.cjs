const fs = require('fs');
const path = require('path');

// 1. Clean up any nested folders
['client', 'src'].forEach(d => {
  if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
});

// 2. Create correct folder structure
['src', 'src/pages', 'src/layouts', 'src/context', 'src/services'].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

const files = {
  'package.json': JSON.stringify({
    "name": "eagle-height-academy-client",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "axios": "^1.7.2",
      "chart.js": "^4.4.3",
      "framer-motion": "^11.3.8",
      "react": "^18.3.1",
      "react-chartjs-2": "^5.2.0",
      "react-dom": "^18.3.1",
      "react-hook-form": "^7.52.1",
      "react-icons": "^5.2.1",
      "react-router-dom": "^6.25.1"
    },
    "devDependencies": {
      "@vitejs/plugin-react": "^4.3.1",
      "autoprefixer": "^10.4.19",
      "postcss": "^8.4.39",
      "tailwindcss": "^3.4.6",
      "vite": "^5.3.4"
    }
  }, null, 2),
  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>School Management System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
  'vite.config.js': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});`,
  'tailwind.config.js': `export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};`,
  'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`,
  'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
  'src/App.jsx': `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import SchoolProfile from './pages/SchoolProfile';

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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}`,
  'src/services/api.js': `import axios from 'axios';

const api = axios.create({ baseURL: '', withCredentials: false });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;`,
  'src/context/AuthContext.jsx': `import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common.Authorization = \`Bearer \${token}\`;
      api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => logout());
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    api.defaults.headers.common.Authorization = \`Bearer \${data.token}\`;
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}`,
  'src/layouts/MainLayout.jsx': `import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiSettings, FiUsers, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/students', label: 'Students', icon: FiUsers },
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
  'src/pages/Login.jsx': `import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [err, setErr] = useState('');

  const onSubmit = async (data) => {
    try {
      await login(data.username, data.password);
      navigate('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow w-96 space-y-4">
        <h1 className="text-2xl font-bold text-center">EAGLE HEIGHT ACADEMY Login</h1>
        {err && <div className="text-red-500 text-sm text-center">{err}</div>}
        <div>
          <label className="text-sm block mb-1">Username</label>
          <input {...register('username')} placeholder="admin" className="w-full px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
        </div>
        <div>
          <label className="text-sm block mb-1">Password</label>
          <input type="password" {...register('password')} placeholder="••••••••" className="w-full px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign in</button>
      </form>
    </div>
  );
}`,
  'src/pages/Dashboard.jsx': `import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiUsers, FiUserCheck, FiDollarSign, FiBookOpen } from 'react-icons/fi';

export default function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Students', value: stats.students ?? '—', icon: FiUsers, color: 'bg-blue-500' },
    { label: 'Total Teachers', value: stats.teachers ?? '—', icon: FiBookOpen, color: 'bg-green-500' },
    { label: 'Present Today', value: stats.present_today ?? '—', icon: FiUserCheck, color: 'bg-purple-500' },
    { label: 'Fees Collected (KES)', value: stats.fees_collected ?? '—', icon: FiDollarSign, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
  'src/pages/SchoolProfile.jsx': `import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';

export default function SchoolProfile() {
  const { register, handleSubmit, reset } = useForm();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/school').then((r) => reset(r.data)).catch(() => {});
  }, [reset]);

  const onSubmit = async (data) => {
    setMsg(''); setErr('');
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      const logo = document.querySelector('input[name=logo]')?.files[0];
      const stamp = document.querySelector('input[name=stamp]')?.files[0];
      if (logo) fd.append('logo', logo);
      if (stamp) fd.append('stamp', stamp);
      await api.put('/school', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Saved successfully');
    } catch (e) {
      setErr(e.response?.data?.error || 'Save failed');
    }
  };

  const inputCls = 'px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">School Profile</h1>
      {msg && <div className="text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded">{msg}</div>}
      {err && <div className="text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">{err}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <div className="md:col-span-2"><label className="text-sm block mb-1">School Name</label><input {...register('school_name')} className={\`w-full \${inputCls}\`} /></div>
        <div className="md:col-span-2"><label className="text-sm block mb-1">Motto</label><input {...register('motto')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">Vision</label><input {...register('vision')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">Mission</label><input {...register('mission')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">Address</label><input {...register('address')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">County</label><input {...register('county')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">Email</label><input type="email" {...register('email')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">Phone</label><input {...register('phone_primary')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">Principal</label><input {...register('principal_name')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">Academic Year</label><input {...register('academic_year')} className={\`w-full \${inputCls}\`} /></div>
        <div><label className="text-sm block mb-1">Logo</label><input type="file" name="logo" accept="image/*" className="w-full" /></div>
        <div><label className="text-sm block mb-1">Stamp</label><input type="file" name="stamp" accept="image/*" className="w-full" /></div>
        <div className="md:col-span-2"><button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save Profile</button></div>
      </form>
    </div>
  );
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
  console.log('Created: ' + filePath);
});

console.log('All client files created successfully!');