import { Outlet } from 'react-router-dom';
import { FiDroplet, FiLogOut, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Redline home"><span className="brand-mark"><FiDroplet /></span>redline</a>
        <div className="topbar-actions">
          <span className="account-chip"><FiMapPin /> {user?.locationLabel || 'Location not set'}</span>
          <span className="account-name">{user?.name}</span>
          <button className="icon-button" onClick={logout} aria-label="Sign out" title="Sign out"><FiLogOut /></button>
        </div>
        </header>
      <main className="page-content">
          <Outlet />
      </main>
    </div>
  );
}