import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import BloodDashboard from './pages/BloodDashboard';

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
            <Route path="/" element={<BloodDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}