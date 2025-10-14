import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HealthSidebar from './HealthSidebar';
import { clearSession, getUser } from '../../lib/token';

export default function HealthPageLayout({
  title,
  description = '',
  headerExtras = null,
  children,
}) {
  const navigate = useNavigate();
  const user = getUser();

  const onLogout = useCallback(() => {
    clearSession();
    navigate('/login');
  }, [navigate]);

  const userInfo = useMemo(() => {
    const fullName = user?.fullName || user?.name || 'Health Officer';
    const subtitle = user?.position || user?.role || 'MV Ocean Explorer';
    return { fullName, subtitle };
  }, [user]);

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="header">
            <div>
              <h2>{title}</h2>
              {description ? (
                <small style={{ color: '#6b7280' }}>{description}</small>
              ) : null}
            </div>
            <div className="user-info">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.fullName)}&background=2a9d8f&color=fff`}
                alt="User"
              />
              <div>
                <div>{userInfo.fullName}</div>
                <small>{userInfo.subtitle}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>
          {headerExtras}
          {children}
        </main>
      </div>
    </div>
  );
}
