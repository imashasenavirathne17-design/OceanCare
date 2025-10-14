import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencySidebar from './EmergencySidebar';
import { getUser, clearSession } from '../../lib/token';
import { listCrewEmergencyAlerts } from '../../lib/crewEmergencyAlertApi';

export default function EmergencyDashboard() {
  const user = getUser();
  const navigate = useNavigate();
  // Live alerts from backend
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inactivity timer refs
  const inactivityTimerRef = useRef(null);
  const resetInactivity = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      alert('You have been logged out due to inactivity.');
    }, 30 * 60 * 1000); // 30 minutes
  };

  useEffect(() => {
    // Initialize inactivity timer and listeners
    resetInactivity();
    const onMove = () => resetInactivity();
    const onKey = () => resetInactivity();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keypress', onKey);
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keypress', onKey);
    };
  }, []);

  // Fetch crew emergency alerts and poll periodically
  useEffect(() => {
    let mounted = true;
    let intervalId;

    const urgencyToType = (urgency) => {
      const u = String(urgency || 'high').toLowerCase();
      if (u === 'high') return 'danger';
      if (u === 'medium') return 'warning';
      return 'info';
    };

    const typeToIcon = (t) => {
      const v = String(t || '').toLowerCase();
      if (v === 'medical' || v === 'symptoms') return 'fas fa-heartbeat';
      if (v === 'accident') return 'fas fa-user-injured';
      if (v === 'safety') return 'fas fa-exclamation-triangle';
      return 'fas fa-thermometer-half';
    };

    const fmtTime = (dt) => {
      try {
        const d = new Date(dt);
        return `Triggered: ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | ${d.toLocaleDateString()}`;
      } catch {
        return 'Triggered: —';
      }
    };

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listCrewEmergencyAlerts({ limit: 100 });
        if (!mounted) return;
        const items = (data || []).map((a) => ({
          id: a._id || a.id,
          type: urgencyToType(a.urgency),
          icon: typeToIcon(a.type),
          person: `${a.crewName || 'Crew Member'} - ${String(a.type || 'Emergency').charAt(0).toUpperCase() + String(a.type || 'Emergency').slice(1)}`,
          location: a.location ? `${a.location}` : 'Location: —',
          time: fmtTime(a.reportedAt || a.createdAt),
          status: a.status || 'reported',
        }));
        setAlerts(items);
        const active = (data || []).filter((a) => ['reported', 'acknowledged'].includes(String(a.status || '').toLowerCase())).length;
        setActiveAlerts(active);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load crew emergency alerts', err);
        if (mounted) setError('Failed to load alerts. Please ensure you are logged in and the API is reachable.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    intervalId = setInterval(load, 10000); // poll every 10s

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const navigateTo = (page) => {
    const map = {
      alerts: '/dashboard/emergency/alerts',
      dashboard: '/dashboard/emergency',
      protocols: '/dashboard/emergency/protocols',
    };
    if (map[page]) return navigate(map[page]);
    alert(`Navigating to ${page} page...`);
  };

  const handleManualRefresh = async () => {
    // Small helper to trigger an immediate refresh
    try {
      setLoading(true);
      setError('');
      const data = await listCrewEmergencyAlerts({ limit: 100 });
      const items = (data || []).map((a) => ({
        id: a._id || a.id,
        type: String(a.urgency || 'high').toLowerCase() === 'high' ? 'danger' : (String(a.urgency || 'low').toLowerCase() === 'medium' ? 'warning' : 'info'),
        icon: 'fas fa-exclamation-circle',
        person: `${a.crewName || 'Crew Member'} - ${String(a.type || 'Emergency').charAt(0).toUpperCase() + String(a.type || 'Emergency').slice(1)}`,
        location: a.location ? `${a.location}` : 'Location: —',
        time: (a.reportedAt || a.createdAt) ? `Triggered: ${new Date(a.reportedAt || a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Triggered: —',
        status: a.status || 'reported',
      }));
      setAlerts(items);
      const active = (data || []).filter((a) => ['reported', 'acknowledged'].includes(String(a.status || '').toLowerCase())).length;
      setActiveAlerts(active);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Manual refresh failed', err);
      setError('Refresh failed. Check your connection or login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container emergency-dashboard">
      {/* Inline styles to match the provided template exactly */}
      <style>{`
        :root { --primary:#e63946; --primary-dark:#b3202c; --primary-light:#ff7b86; --secondary:#3a86ff; --accent:#f4a261; --light:#f8f9fa; --dark:#343a40; --danger:#e63946; --success:#2a9d8f; --warning:#f4a261; --info:#3a86ff; }
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color:#f5f7fb; color:#333; line-height:1.6; }
        .dashboard-container { display:flex; min-height:100vh; }
        .sidebar { width:280px; background:linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color:#fff; padding:20px 0; transition:all .3s; }
        .logo { display:flex; align-items:center; padding:0 20px 20px; border-bottom:1px solid rgba(255,255,255,.1); margin-bottom:20px; }
        .logo i { font-size:28px; margin-right:10px; }
        .logo h1 { font-size:20px; font-weight:700; }
        .sidebar-menu { list-style:none; }
        .sidebar-menu li { margin-bottom:5px; }
        .sidebar-menu a { display:flex; align-items:center; padding:12px 20px; color:rgba(255,255,255,.9); text-decoration:none; transition:all .3s; }
        .sidebar-menu a:hover, .sidebar-menu a.active { background-color:rgba(255,255,255,.1); color:#fff; border-left:4px solid #fff; }
        .sidebar-menu i { margin-right:10px; font-size:18px; }
        .main-content { flex:1; padding:20px; overflow-y:auto; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding-bottom:15px; border-bottom:1px solid #eee; }
        .header h2 { color:var(--primary); font-size:24px; }
        .user-info { display:flex; align-items:center; }
        .user-info img { width:40px; height:40px; border-radius:50%; margin-right:10px; }
        .status-badge { padding:5px 10px; border-radius:20px; font-size:12px; font-weight:600; margin-left:10px; }
        .status-active { background-color:rgba(42,157,143,.15); color:var(--success); }
        .status-warning { background-color:rgba(244,162,97,.2); color:var(--warning); }
        .status-danger { background-color:rgba(230,57,70,.2); color:var(--danger); }
        .stats-container { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:20px; margin-bottom:30px; }
        .stat-card { background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; display:flex; align-items:center; transition:transform .3s; }
        .stat-card:hover { transform:translateY(-5px); }
        .stat-icon { width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; margin-right:20px; }
        .stat-icon.primary { background-color:rgba(230,57,70,.15); color:var(--primary); }
        .stat-icon.warning { background-color:rgba(244,162,97,.2); color:var(--warning); }
        .stat-icon.danger { background-color:rgba(230,57,70,.2); color:var(--danger); }
        .stat-icon.info { background-color:rgba(58,134,255,.2); color:var(--info); }
        .stat-content { flex:1; }
        .stat-value { font-size:28px; font-weight:700; margin-bottom:5px; }
        .stat-label { font-size:14px; color:#777; }
        .alert-banner { background:linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color:#fff; padding:15px 20px; border-radius:8px; margin-bottom:20px; display:flex; align-items:center; animation:pulse 2s infinite; }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(255,107,107,.7);} 70%{box-shadow:0 0 0 10px rgba(255,107,107,0);} 100%{box-shadow:0 0 0 0 rgba(255,107,107,0);} }
        .alert-banner i { font-size:24px; margin-right:15px; }
        .alert-content { flex:1; }
        .alert-title { font-weight:600; margin-bottom:5px; }
        .quick-actions { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:30px; }
        .action-card { background:#fff; border-radius:8px; box-shadow:0 3px 10px rgba(0,0,0,.08); padding:20px; text-align:center; transition:all .3s; cursor:pointer; }
        .action-card:hover { transform:translateY(-5px); box-shadow:0 5px 15px rgba(0,0,0,.1); }
        .action-icon { width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; margin:0 auto 15px; background-color:rgba(42,157,143,.1); color:var(--primary); }
        .action-title { font-size:16px; font-weight:600; margin-bottom:5px; }
        .action-desc { font-size:12px; color:#777; }
        .activity-container { background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; margin-bottom:30px; }
        .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .section-title { font-size:20px; font-weight:600; color:var(--primary); }
        .activity-list { list-style:none; }
        .activity-item { display:flex; padding:15px 0; border-bottom:1px solid #eee; }
        .activity-item:last-child { border-bottom:none; }
        .activity-icon { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; margin-right:15px; background-color:#f8f9fa; }
        .activity-content { flex:1; }
        .activity-title { font-weight:600; margin-bottom:5px; }
        .activity-desc { font-size:14px; color:#777; margin-bottom:5px; }
        .activity-time { font-size:12px; color:#999; }
        .schedule-container { background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; }
        .schedule-list { list-style:none; }
        .schedule-item { display:flex; padding:15px 0; border-bottom:1px solid #eee; }
        .schedule-item:last-child { border-bottom:none; }
        .schedule-time { width:80px; font-weight:600; color:var(--primary); }
        .schedule-content { flex:1; }
        .schedule-title { font-weight:600; margin-bottom:5px; }
        .schedule-desc { font-size:14px; color:#777; }
        .schedule-status { padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; }
        .status-upcoming { background-color:rgba(42,157,143,.2); color:var(--success); }
        .status-urgent { background-color:rgba(244,162,97,.2); color:var(--warning); }
        .emergency-alerts { margin-bottom:30px; }
        .alert-item { background:#fff; border-radius:8px; box-shadow:0 3px 10px rgba(0,0,0,.08); padding:15px; margin-bottom:15px; border-left:4px solid var(--danger); display:flex; align-items:center; }
        .alert-item.warning { border-left-color:var(--warning); }
        .alert-item.info { border-left-color:var(--info); }
        .alert-icon { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; margin-right:15px; color:#fff; }
        .alert-icon.danger { background-color:var(--danger); }
        .alert-icon.warning { background-color:var(--warning); }
        .alert-icon.info { background-color:var(--info); }
        .alert-details { flex:1; }
        .alert-person { font-weight:600; margin-bottom:5px; }
        .alert-location { font-size:14px; color:#777; margin-bottom:5px; }
        .alert-time { font-size:12px; color:#999; }
        .alert-actions { display:flex; gap:10px; }
        .btn { padding:8px 15px; border:none; border-radius:4px; cursor:pointer; font-weight:500; transition:all .3s; display:inline-flex; align-items:center; }
        .btn i { margin-right:5px; }
        .btn-primary { background-color:var(--primary); color:#fff; }
        .btn-danger { background-color:var(--danger); color:#fff; }
        .btn-warning { background-color:var(--warning); color:#fff; }
        .two-col-grid { display:grid; grid-template-columns:1fr 1fr; gap:30px; }
        @media (max-width: 992px) {
          .dashboard-container { flex-direction:column; }
          .sidebar { width:100%; height:auto; }
          .sidebar-menu { display:flex; overflow-x:auto; }
          .sidebar-menu li { margin-bottom:0; margin-right:10px; }
          .sidebar-menu a { padding:10px 15px; border-left:none; border-bottom:3px solid transparent; }
          .sidebar-menu a:hover, .sidebar-menu a.active { border-left:none; border-bottom:3px solid #fff; }
        }
        @media (max-width: 768px) {
          .header { flex-direction:column; align-items:flex-start; }
          .user-info { margin-top:15px; }
          .stats-container { grid-template-columns:1fr; }
          .quick-actions { grid-template-columns:repeat(2,1fr); }
          .main-content > div { grid-template-columns:1fr; }
          .two-col-grid { grid-template-columns:1fr; }
        }
        @media (max-width: 480px) {
          .quick-actions { grid-template-columns:1fr; }
          .alert-item { flex-direction:column; text-align:center; }
          .alert-icon { margin-right:0; margin-bottom:10px; }
          .alert-actions { justify-content:center; margin-top:10px; }
        }
      `}</style>

      {/* Sidebar */}
      <EmergencySidebar onLogout={() => { clearSession(); navigate('/login'); }} />

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h2>Emergency Officer Dashboard</h2>
          <div className="user-info">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Emergency Officer')}&background=e63946&color=fff`}
              alt="User"
            />
            <div>
              <div>{user?.fullName || 'Emergency Officer'}</div>
              <small>
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Emergency Officer'}
                {user?.vessel ? ` | ${user.vessel}` : ''}
              </small>
            </div>
            <div className="status-badge status-active">Online</div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon danger"><i className="fas fa-exclamation-circle"></i></div>
            <div className="stat-content">
              <div className="stat-value">{activeAlerts}</div>
              <div className="stat-label">Active Alerts</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><i className="fas fa-heartbeat"></i></div>
            <div className="stat-content">
              <div className="stat-value">1</div>
              <div className="stat-label">Critical Cases</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon primary"><i className="fas fa-user-injured"></i></div>
            <div className="stat-content">
              <div className="stat-value">45</div>
              <div className="stat-label">Crew Monitored</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info"><i className="fas fa-check-circle"></i></div>
            <div className="stat-content">
              <div className="stat-value">12</div>
              <div className="stat-label">Resolved Today</div>
            </div>
          </div>
        </div>

        {/* Emergency Alerts */}
        <div className="emergency-alerts">
          <div className="section-header">
            <div className="section-title">Active Emergency Alerts</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleManualRefresh} disabled={loading}>
                <i className="fas fa-sync-alt"></i> {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 14 }}>View All Alerts</a>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(230,57,70,.1)', color: '#b3202c', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              {error}
            </div>
          )}

          {loading && alerts.length === 0 && (
            <div className="alert-item info">
              <div className="alert-details" style={{ width: '100%' }}>
                Loading alerts…
              </div>
            </div>
          )}

          {!loading && alerts.length === 0 && !error && (
            <div className="alert-item info">
              <div className="alert-details" style={{ width: '100%' }}>
                No active alerts yet.
              </div>
            </div>
          )}

          {alerts.map((a, idx) => (
            <div key={a.id || idx} className={`alert-item ${a.type === 'warning' ? 'warning' : a.type === 'info' ? 'info' : ''}`}>
              <div className={`alert-icon ${a.type}`}>
                <i className={a.icon}></i>
              </div>
              <div className="alert-details">
                <div className="alert-person">{a.person}</div>
                <div className="alert-location">{a.location}</div>
                <div className="alert-time">{a.time} {a.status ? `| Status: ${a.status}` : ''}</div>
              </div>
              <div className="alert-actions">
                <button className="btn btn-primary"><i className="fas fa-eye"></i> Details</button>
                <button className="btn btn-danger"><i className="fas fa-play"></i> Protocol</button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="action-card" onClick={() => navigateTo('alerts')}>
            <div className="action-icon"><i className="fas fa-bell"></i></div>
            <div className="action-title">Health Alerts</div>
            <div className="action-desc">View and manage alerts</div>
          </div>
          <div className="action-card" onClick={() => navigateTo('protocols')}>
            <div className="action-icon"><i className="fas fa-play-circle"></i></div>
            <div className="action-title">Emergency Protocols</div>
            <div className="action-desc">Activate response plans</div>
          </div>
          <div className="action-card" onClick={() => navigateTo('profiles')}>
            <div className="action-icon"><i className="fas fa-user-injured"></i></div>
            <div className="action-title">Crew Profiles</div>
            <div className="action-desc">Access medical records</div>
          </div>
          <div className="action-card" onClick={() => navigateTo('locator')}>
            <div className="action-icon"><i className="fas fa-map-marker-alt"></i></div>
            <div className="action-title">Crew Locator</div>
            <div className="action-desc">Track crew locations</div>
          </div>
          <div className="action-card" onClick={() => navigateTo('messaging')}>
            <div className="action-icon"><i className="fas fa-comments"></i></div>
            <div className="action-title">Emergency Messaging</div>
            <div className="action-desc">Notify medical staff</div>
          </div>
          <div className="action-card" onClick={() => navigateTo('reports')}>
            <div className="action-icon"><i className="fas fa-chart-bar"></i></div>
            <div className="action-title">Incident Reports</div>
            <div className="action-desc">Generate emergency reports</div>
          </div>
        </div>

        <div className="two-col-grid">
          {/* Recent Activity */}
          <div className="activity-container">
            <div className="section-header">
              <div className="section-title">Recent Emergency Activity</div>
              <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 14 }}>View All</a>
            </div>
            <ul className="activity-list">
              <li className="activity-item">
                <div className="activity-icon"><i className="fas fa-bell"></i></div>
                <div className="activity-content">
                  <div className="activity-title">Cardiac Alert Triggered</div>
                  <div className="activity-desc">John Davis - Elevated heart rate detected</div>
                  <div className="activity-time">10:24 AM • Today</div>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-icon"><i className="fas fa-play-circle"></i></div>
                <div className="activity-content">
                  <div className="activity-title">Emergency Protocol Activated</div>
                  <div className="activity-desc">Respiratory distress - Maria Rodriguez</div>
                  <div className="activity-time">09:50 AM • Today</div>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-icon"><i className="fas fa-comments"></i></div>
                <div className="activity-content">
                  <div className="activity-title">Emergency Message Sent</div>
                  <div className="activity-desc">Medical team notified of critical case</div>
                  <div className="activity-time">09:45 AM • Today</div>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-icon"><i className="fas fa-map-marker-alt"></i></div>
                <div className="activity-content">
                  <div className="activity-title">Crew Location Updated</div>
                  <div className="activity-desc">John Davis moved to Medical Bay</div>
                  <div className="activity-time">09:30 AM • Today</div>
                </div>
              </li>
              <li className="activity-item">
                <div className="activity-icon"><i className="fas fa-check-circle"></i></div>
                <div className="activity-content">
                  <div className="activity-title">Alert Resolved</div>
                  <div className="activity-desc">Robert Chen - Temperature normalized</div>
                  <div className="activity-time">Yesterday • 4:15 PM</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Upcoming Schedule */}
          <div className="schedule-container">
            <div className="section-header">
              <div className="section-title">Emergency Response Schedule</div>
              <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 14 }}>View Calendar</a>
            </div>
            <ul className="schedule-list">
              <li className="schedule-item">
                <div className="schedule-time">11:00 AM</div>
                <div className="schedule-content">
                  <div className="schedule-title">Emergency Drill - Cardiac Arrest</div>
                  <div className="schedule-desc">Medical team training session</div>
                </div>
                <div className="schedule-status status-urgent">Mandatory</div>
              </li>
              <li className="schedule-item">
                <div className="schedule-time">02:30 PM</div>
                <div className="schedule-content">
                  <div className="schedule-title">Equipment Check</div>
                  <div className="schedule-desc">Defibrillator and emergency kit inspection</div>
                </div>
                <div className="schedule-status status-upcoming">Scheduled</div>
              </li>
              <li className="schedule-item">
                <div className="schedule-time">04:00 PM</div>
                <div className="schedule-content">
                  <div className="schedule-title">Team Briefing</div>
                  <div className="schedule-desc">Daily emergency response update</div>
                </div>
                <div className="schedule-status status-upcoming">Scheduled</div>
              </li>
              <li className="schedule-item">
                <div className="schedule-time">05:30 PM</div>
                <div className="schedule-content">
                  <div className="schedule-title">System Maintenance</div>
                  <div className="schedule-desc">Health monitoring system update</div>
                </div>
                <div className="schedule-status status-upcoming">Scheduled</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}



