import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import { canAccessRoute, routeAccess } from './utils/roleAccess';
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

function RoleProtected({ children, allowedRoles, routeKey }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessRoute(user.role, allowedRoles || routeAccess[routeKey] || [])) {
    return <div className="p-10 text-red-600">You do not have permission to view this page.</div>;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><MainLayout /></Protected>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/school-profile" element={<RoleProtected routeKey="school-profile"><SchoolProfile /></RoleProtected>} />
            <Route path="/students" element={<RoleProtected routeKey="students"><Students /></RoleProtected>} />
            <Route path="/students/add" element={<RoleProtected routeKey="students"><AddStudent /></RoleProtected>} />
            <Route path="/students/:id" element={<RoleProtected routeKey="students"><StudentProfile /></RoleProtected>} />
            <Route path="/teachers" element={<RoleProtected routeKey="teachers"><Teachers /></RoleProtected>} />
            <Route path="/teachers/add" element={<RoleProtected routeKey="teachers"><AddTeacher /></RoleProtected>} />
            <Route path="/classes" element={<RoleProtected routeKey="classes"><Classes /></RoleProtected>} />
            <Route path="/attendance" element={<RoleProtected routeKey="attendance"><Attendance /></RoleProtected>} />
            <Route path="/exams" element={<RoleProtected routeKey="exams"><Exams /></RoleProtected>} />
            <Route path="/timetable" element={<RoleProtected routeKey="timetable"><Timetable /></RoleProtected>} />
            <Route path="/transport" element={<RoleProtected routeKey="transport"><Transport /></RoleProtected>} />
            <Route path="/finance" element={<RoleProtected routeKey="finance"><Finance /></RoleProtected>} />
            <Route path="/expenses" element={<RoleProtected routeKey="expenses"><Expenses /></RoleProtected>} />
            <Route path="/inventory" element={<RoleProtected routeKey="inventory"><Inventory /></RoleProtected>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}