import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

/*
  Sidebar for Administrator Dashboard
*/
export default function AdminSidebar({ onLogout }) {
  const { pathname, hash } = useLocation();

  const initialActive = useMemo(() => {
    // Prefer pathname for routed pages
    if (pathname.includes('/dashboard/admin/users')) return 'users';
    if (pathname.includes('/dashboard/admin/permissions')) return 'permissions';
    if (pathname.includes('/dashboard/admin/system-config')) return 'config';
    if (pathname.includes('/dashboard/admin/compliance')) return 'compliance';
    if (pathname.includes('/dashboard/admin/integrations')) return 'integrations';
    if (pathname.includes('/dashboard/admin/reports')) return 'reports';
    // Fallback to hashes for in-page sections
    if (hash && hash !== '#') {
      if (hash.includes('permissions')) return 'permissions';
      if (hash.includes('config')) return 'config';
      if (hash.includes('compliance')) return 'compliance';
      if (hash.includes('integrations')) return 'integrations';
      if (hash.includes('reports')) return 'reports';
    }
    return 'dashboard';
  }, [pathname, hash]);

  const [active, setActive] = useState(initialActive);

  useEffect(() => {
    setActive(initialActive);
  }, [pathname, hash, initialActive]);

  return (
    <aside className="sidebar">
      <div className="logo">
        <i className="fas fa-user-cog" aria-hidden="true"></i>
        <h1>OCEANCARE ADMIN</h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard/admin" className={active === 'dashboard' ? 'active' : ''} onClick={() => setActive('dashboard')}>
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/dashboard/admin/users" className={active === 'users' ? 'active' : ''} onClick={() => setActive('users')}>
            <i className="fas fa-users-cog"></i> User Management
          </Link>
        </li>
        <li>
          <Link to="/dashboard/admin/permissions" className={active === 'permissions' ? 'active' : ''} onClick={() => setActive('permissions')}>
            <i className="fas fa-user-lock"></i> Permissions
          </Link>
        </li>
        <li>
          <Link to="/dashboard/admin/system-config" className={active === 'config' ? 'active' : ''} onClick={() => setActive('config')}>
            <i className="fas fa-cogs"></i> System Configuration
          </Link>
        </li>
        <li>
          <Link to="/dashboard/admin/integrations" className={active === 'integrations' ? 'active' : ''} onClick={() => setActive('integrations')}>
            <i className="fas fa-plug"></i> Integrations
          </Link>
        </li>
        <li>
          <Link to="/dashboard/admin/compliance" className={active === 'compliance' ? 'active' : ''} onClick={() => setActive('compliance')}>
            <i className="fas fa-clipboard-check"></i> Compliance & Audit
          </Link>
        </li>
        <li>
          <Link to="/dashboard/admin/reports" className={active === 'reports' ? 'active' : ''} onClick={() => setActive('reports')}>
            <i className="fas fa-chart-bar"></i> Reports
          </Link>
        </li>
        <li>
          <button className="linklike" onClick={onLogout}>
            <i className="fas fa-power-off"></i> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
