import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencySidebar from './EmergencySidebar';
import { getUser, clearSession } from '../../lib/token';
import {
  listCrewEmergencyAlerts,
  getCrewEmergencyAlert,
  updateCrewEmergencyAlert,
} from '../../lib/crewEmergencyAlertApi';

export default function EmergencyDashboard() {
  const user = getUser();
  const navigate = useNavigate();
  // Live alerts from backend
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [criticalCases, setCriticalCases] = useState(0);
  const [crewMonitored, setCrewMonitored] = useState(0);
  const [resolvedToday, setResolvedToday] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  const quickActions = useMemo(
    () => [
      { key: 'alerts', icon: 'fas fa-bullhorn', title: 'Live Alerts', desc: 'Review all incident feeds', target: 'alerts', tint: 'rgba(230,57,70,0.15)' },
      { key: 'protocols', icon: 'fas fa-route', title: 'Run Protocols', desc: 'Launch emergency playbooks', target: 'protocols', tint: 'rgba(244,162,97,0.18)' },
      { key: 'reports', icon: 'fas fa-file-medical', title: 'Incident Reports', desc: 'Generate situational reports', target: 'reports', tint: 'rgba(58,134,255,0.18)' },
      { key: 'messaging', icon: 'fas fa-headset', title: 'Command Channel', desc: 'Notify responders immediately', target: 'messaging', tint: 'rgba(42,157,143,0.18)' },
      { key: 'crew-profiles', icon: 'fas fa-user-md', title: 'Crew Profiles', desc: 'Review medical dossiers', target: 'crew-profiles', tint: 'rgba(106,76,147,0.16)' },
      { key: 'crew-locator', icon: 'fas fa-map-marker-alt', title: 'Crew Locator', desc: 'Track crew positions', target: 'crew-locator', tint: 'rgba(255,214,102,0.22)' },
    ],
    [],
  );

  const dayLabels = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], []);
  const mockAlertTrend = useMemo(() => [9, 14, 18, 22, 17, 25, 21], []);
  const responseTrend = useMemo(() => [74, 82, 88, 86, 91, 94, 89], []);

  const maxAlertTrend = useMemo(() => Math.max(...mockAlertTrend, 1), [mockAlertTrend]);
  const maxResponseTrend = useMemo(() => Math.max(...responseTrend, 1), [responseTrend]);

  const averageResponse = useMemo(() => {
    if (!responseTrend.length) return 0;
    const total = responseTrend.reduce((sum, value) => sum + value, 0);
    return Math.round(total / responseTrend.length);
  }, [responseTrend]);

  const latestAlertVolume = useMemo(
    () => (mockAlertTrend.length ? mockAlertTrend[mockAlertTrend.length - 1] : 0),
    [mockAlertTrend],
  );
  const bestResponse = useMemo(() => Math.max(...responseTrend, 0), [responseTrend]);
  const latestResponse = useMemo(
    () => (responseTrend.length ? responseTrend[responseTrend.length - 1] : 0),
    [responseTrend],
  );
  const summaryMetrics = useMemo(
    () => [
      { key: 'alerts', label: 'Active Alerts', value: activeAlerts, icon: 'fas fa-bell', tone: 'danger', descriptor: 'Live monitoring' },
      { key: 'critical', label: 'Critical Cases', value: criticalCases, icon: 'fas fa-exclamation-circle', tone: 'warning', descriptor: 'Require priority' },
      { key: 'crew', label: 'Crew Monitored', value: crewMonitored, icon: 'fas fa-users', tone: 'info', descriptor: 'Under observation' },
      { key: 'resolved', label: 'Resolved Today', value: resolvedToday, icon: 'fas fa-clipboard-check', tone: 'success', descriptor: 'Closed incidents' },
    ],
    [activeAlerts, criticalCases, crewMonitored, resolvedToday],
  );

  // Inactivity timer refs
  const inactivityTimerRef = useRef(null);
  const resetInactivity = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      alert('You have been logged out due to inactivity.');
    }, 30 * 60 * 1000); // 30 minutes
  };

  const urgencyToType = useCallback((urgency) => {
    const u = String(urgency || 'high').toLowerCase();
    if (u === 'high') return 'danger';
    if (u === 'medium') return 'warning';
    return 'info';
  }, []);

  const typeToIcon = useCallback((t) => {
    const v = String(t || '').toLowerCase();
    if (v === 'medical' || v === 'symptoms') return 'fas fa-heartbeat';
    if (v === 'accident') return 'fas fa-user-injured';
    if (v === 'safety') return 'fas fa-exclamation-triangle';
    return 'fas fa-thermometer-half';
  }, []);

  const fmtTime = useCallback((dt) => {
    try {
      const d = new Date(dt);
      return `Triggered: ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | ${d.toLocaleDateString()}`;
    } catch {
      return 'Triggered: —';
    }
  }, []);

  const statusToActivityIcon = useCallback((status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'resolved') return 'fas fa-check-circle';
    if (value === 'acknowledged') return 'fas fa-eye';
    return 'fas fa-exclamation-triangle';
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listCrewEmergencyAlerts({ limit: 100 });
      const critical = (data || []).filter((a) => String(a.urgency || '').toLowerCase() === 'high').length;
      const crewSet = new Set((data || []).map((a) => a.crewMemberId || a.crewId || a.crewName || a._id || a.id));
      const today = new Date().toDateString();
      const resolved = (data || []).filter((a) => {
        if (String(a.status || '').toLowerCase() !== 'resolved') return false;
        if (!a.resolvedAt) return false;
        const date = new Date(a.resolvedAt);
        if (Number.isNaN(date.getTime())) return false;
        return date.toDateString() === today;
      }).length;

      const items = (data || []).map((a) => ({
        id: a._id || a.id,
        type: urgencyToType(a.urgency),
        icon: typeToIcon(a.type),
        person: `${a.crewName || 'Crew Member'} - ${String(a.type || 'Emergency').charAt(0).toUpperCase() + String(a.type || 'Emergency').slice(1)}`,
        location: a.location ? `${a.location}` : 'Location: —',
        time: fmtTime(a.reportedAt || a.createdAt),
        status: a.status || 'reported',
        title: a.title || `${String(a.type || 'Emergency').charAt(0).toUpperCase() + String(a.type || 'Emergency').slice(1)} alert`,
        description: a.description || a.notes || 'No additional details provided.',
        occurredAt: a.reportedAt || a.createdAt || null,
      }));
      setAlerts(items);
      const active = (data || []).filter((a) => ['reported', 'acknowledged'].includes(String(a.status || '').toLowerCase())).length;
      setActiveAlerts(active);
      setCriticalCases(critical);
      setCrewMonitored(crewSet.size);
      setResolvedToday(resolved);

      const recent = [...items]
        .filter((entry) => entry.occurredAt)
        .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
        .slice(0, 6)
        .map((entry) => ({
          id: entry.id,
          icon: statusToActivityIcon(entry.status),
          title: entry.person,
          desc: entry.description,
          time: fmtTime(entry.occurredAt).replace('Triggered: ', ''),
        }));

      if (recent.length === 0) {
        setRecentActivities([
          { id: 'empty-1', icon: 'fas fa-info-circle', title: 'No recent activity', desc: 'Live updates will appear here as alerts are received.', time: '' },
        ]);
      } else {
        setRecentActivities(recent);
      }
    } catch (err) {
      console.error('Failed to load crew emergency alerts', err);
      setError('Failed to load alerts. Please ensure you are logged in and the API is reachable.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenDetails = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await getCrewEmergencyAlert(id);
      if (!data) return;
      const summary = [
        `Type: ${data.type}`,
        `Urgency: ${data.urgency}`,
        data.location ? `Location: ${data.location}` : null,
        data.description ? `Description: ${data.description}` : null,
        data.notes ? `Notes: ${data.notes}` : null,
        `Status: ${data.status}`,
      ].filter(Boolean).join('\n');
      alert(summary || 'No additional details available.');
    } catch (err) {
      console.error('Failed to fetch alert details', err);
      alert('Unable to load alert details right now.');
    }
  }, []);

  const handleTriggerProtocol = useCallback(async (alert) => {
    if (!alert?.id) return;
    try {
      const timestamp = new Date().toLocaleString();
      await updateCrewEmergencyAlert(alert.id, { status: 'resolved', notes: `Protocol executed at ${timestamp}` });
      await fetchAlerts();
      alert(`Emergency protocol executed for ${alert.person}.`);
    } catch (err) {
      console.error('Failed to trigger protocol', err);
      alert('Failed to execute protocol. Please try again.');
    }
  }, [fetchAlerts]);

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

    const load = async () => {
      if (!mounted) return;
      await fetchAlerts();
    };

    load();
    intervalId = setInterval(load, 10000); // poll every 10s

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchAlerts]);

  const navigateTo = (page) => {
    const map = {
      alerts: '/dashboard/emergency/alerts',
      dashboard: '/dashboard/emergency',
      protocols: '/dashboard/emergency/protocols',
      reports: '/dashboard/emergency/reports',
      messaging: '/dashboard/emergency/messaging',
      'crew-profiles': '/dashboard/emergency/crew-profiles',
      'crew-locator': '/dashboard/emergency/crew-locator',
    };
    if (map[page]) return navigate(map[page]);
    alert(`Navigating to ${page} page...`);
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
        .stat-icon.primary { background-color:rgba(230,57,70,.18); color:var(--primary); }
        .stat-icon.warning { background-color:rgba(244,162,97,.2); color:var(--warning); }
        .stat-icon.danger { background-color:rgba(230,57,70,.2); color:var(--danger); }
        .stat-icon.info { background-color:rgba(58,134,255,.2); color:var(--info); }
        .stat-content { flex:1; }
        .stat-value { font-size:28px; font-weight:700; margin-bottom:5px; }
        .stat-label { font-size:14px; color:#777; }
        .feed-badge { padding:6px 12px; border-radius:999px; background:rgba(230,57,70,.12); color:var(--danger); font-size:12px; font-weight:600; }
        .feed-badge.success { background:rgba(42,157,143,.18); color:var(--success); }
        .feed-badge.soft { background:rgba(255,214,102,.22); color:#c98a00; }
        .insight-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:28px; margin-bottom:36px; }
        .chart-card { background:#fff; border-radius:20px; padding:28px 30px 26px; box-shadow:0 18px 40px rgba(0,0,0,.06); display:flex; flex-direction:column; gap:24px; border:1px solid rgba(230,57,70,.06); }
        .chart-header { display:flex; justify-content:space-between; align-items:flex-start; gap:18px; }
        .chart-title { font-size:20px; font-weight:700; color:var(--primary); }
        .chart-subtitle { font-size:13px; color:#9aa0a6; margin-top:6px; }
        .chart-summary { display:flex; align-items:center; gap:16px; }
        .chart-metric { font-size:26px; font-weight:700; color:var(--dark); line-height:1; }
        .chart-legend { font-size:13px; color:#adb5bd; }
        .chart-bars { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; height:200px; padding:0 4px 8px; }
        .chart-bars .bar-wrap { flex:1; display:flex; flex-direction:column; align-items:center; gap:12px; height:100%; }
        .bar-track { flex:1; width:100%; display:flex; align-items:flex-end; justify-content:center; padding:0 8px; }
        .chart-bar { width:68%; border-radius:16px 16px 8px 8px; background:linear-gradient(180deg, rgba(230,57,70,0.85) 0%, rgba(230,57,70,0.55) 70%, rgba(230,57,70,0.15) 100%); box-shadow:0 10px 18px rgba(230,57,70,0.18); }
        .chart-bar.secondary { background:linear-gradient(180deg, rgba(58,134,255,0.9) 0%, rgba(58,134,255,0.6) 70%, rgba(58,134,255,0.18) 100%); box-shadow:0 10px 18px rgba(58,134,255,0.18); }
        .bar-value { font-size:13px; font-weight:600; color:#495057; }
        .bar-label { font-size:11px; color:#adb5bd; letter-spacing:.5px; text-transform:uppercase; }
        .summary-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:30px; }
        .summary-card { background:#fff; border-radius:16px; padding:24px; box-shadow:0 12px 28px rgba(0,0,0,.05); display:flex; align-items:center; gap:18px; position:relative; overflow:hidden; }
        .summary-icon { width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:22px; }
        .summary-content { flex:1; }
        .summary-label { font-size:13px; color:#6c757d; text-transform:uppercase; letter-spacing:.6px; margin-bottom:6px; }
        .summary-value { font-size:30px; font-weight:700; color:var(--dark); line-height:1; }
        .summary-descriptor { font-size:13px; color:#adb5bd; margin-top:6px; }
        .summary-card.danger .summary-icon { background:rgba(230,57,70,.14); color:var(--danger); }
        .summary-card.warning .summary-icon { background:rgba(244,162,97,.16); color:var(--warning); }
        .summary-card.info .summary-icon { background:rgba(58,134,255,.15); color:var(--info); }
        .summary-card.success .summary-icon { background:rgba(42,157,143,.15); color:var(--success); }
        .quick-actions { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:18px; margin-bottom:32px; }
        .action-card { background:#fff; border-radius:14px; padding:22px; transition:transform .3s, box-shadow .3s; cursor:pointer; border-top:4px solid transparent; display:flex; flex-direction:column; gap:12px; align-items:flex-start; }
        .action-card:hover { transform:translateY(-6px); }
        .action-icon { width:52px; height:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:20px; color:var(--primary-dark); }
        .action-title { font-size:17px; font-weight:700; color:var(--dark); }
        .action-desc { font-size:13px; color:#666; line-height:1.4; }
        .activity-container { background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; margin-bottom:30px; }
        .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .section-title { font-size:20px; font-weight:600; color:var(--primary); }
        .section-subtitle { font-size:12px; color:#9aa0a6; margin-top:4px; }
        .activity-list { list-style:none; }
        .activity-item { display:flex; padding:15px 0; border-bottom:1px solid #eee; }
        .activity-item:last-child { border-bottom:none; }
        .activity-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-right:15px; background-color:rgba(230,57,70,.12); color:var(--primary); box-shadow:0 6px 16px rgba(230,57,70,.18); }
        .activity-content { flex:1; }
        .activity-title { font-weight:600; margin-bottom:5px; }
        .activity-desc { font-size:14px; color:#777; margin-bottom:5px; }
        .activity-time { font-size:12px; color:#999; }
        .schedule-container { background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; }
        .schedule-list { list-style:none; }
        .schedule-item { display:flex; padding:15px 0; border-bottom:1px solid rgba(230,57,70,.12); }
        .schedule-item:last-child { border-bottom:none; }
        .schedule-time { width:80px; font-weight:600; color:var(--primary); }
        .schedule-content { flex:1; }
        .schedule-title { font-weight:600; margin-bottom:5px; }
        .schedule-desc { font-size:14px; color:#777; }
        .schedule-status { padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; }
        .status-upcoming { background-color:rgba(42,157,143,.2); color:var(--success); }
        .status-urgent { background-color:rgba(244,162,97,.2); color:var(--warning); }
        .emergency-alerts { margin-bottom:30px; }
        .alert-item { background:linear-gradient(155deg, rgba(230,57,70,.18), rgba(230,57,70,.05)); border-radius:16px; box-shadow:0 12px 28px rgba(230,57,70,.18); padding:20px; margin-bottom:20px; border-left:4px solid var(--primary); display:flex; align-items:center; border:1px solid rgba(230,57,70,.22); }
        .alert-item.warning { border-left-color:var(--warning); }
        .alert-item.info { border-left-color:var(--info); }
        .alert-icon { width:52px; height:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-right:20px; color:#fff; box-shadow:0 10px 24px rgba(230,57,70,.22); }
        .alert-icon.danger { background:linear-gradient(135deg, var(--primary), var(--primary-dark)); }
        .alert-icon.warning { background:linear-gradient(135deg, rgba(244,162,97,1), rgba(214,124,55,1)); }
        .alert-icon.info { background:linear-gradient(135deg, rgba(58,134,255,1), rgba(32,94,201,1)); }
        .alert-details { flex:1; }
        .alert-person { font-weight:600; margin-bottom:5px; }
        .alert-location { font-size:14px; color:#777; margin-bottom:5px; }
        .alert-time { font-size:12px; color:#999; }
        .alert-actions { display:flex; gap:12px; }
        .btn { padding:10px 18px; border:none; border-radius:10px; cursor:pointer; font-weight:600; transition:all .3s; display:inline-flex; align-items:center; box-shadow:0 6px 16px rgba(230,57,70,.18); }
        .btn i { margin-right:5px; }
        .btn-primary { background:linear-gradient(135deg, var(--primary), var(--primary-dark)); color:#fff; border:1px solid rgba(179,32,44,.7); }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 24px rgba(230,57,70,.25); }
        .btn-danger { background:linear-gradient(135deg, rgba(230,57,70,1), rgba(180,32,44,1)); color:#fff; border:1px solid rgba(198,40,52,.7); box-shadow:0 6px 16px rgba(230,57,70,.25); }
        .btn-danger:hover { transform:translateY(-2px); box-shadow:0 12px 26px rgba(230,57,70,.32); }
        .btn-warning { background:linear-gradient(135deg, rgba(244,162,97,1), rgba(214,124,55,1)); color:#fff; border:1px solid rgba(214,124,55,.7); }
        .btn-warning:hover { transform:translateY(-2px); box-shadow:0 10px 24px rgba(244,162,97,.25); }
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
          .summary-grid { grid-template-columns:repeat(2,1fr); }
          .insight-grid { grid-template-columns:1fr; }
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
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Emergency Officer')}&background=2a9d8f&color=fff`}
              alt="User"
            />
            <div>
              <div>{user?.fullName || 'Emergency Officer'}</div>
              <small>
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Emergency Officer'}
                {user?.vessel ? ` | ${user.vessel}` : ''}
              </small>
            </div>
          </div>
        </div>

        <div className="summary-grid">
          {summaryMetrics.map((metric) => (
            <div key={metric.key} className={`summary-card ${metric.tone}`}>
              <div className="summary-icon">
                <i className={metric.icon}></i>
              </div>
              <div className="summary-content">
                <div className="summary-label">{metric.label}</div>
                <div className="summary-value">{metric.value}</div>
                <div className="summary-descriptor">{metric.descriptor}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="emergency-alerts">
          <div className="section-header">
            <div>
              <div className="section-title">Live Emergency Feed</div>
              <div className="section-subtitle">Automatically refreshed every 10 seconds</div>
            </div>
            <div className="feed-badge">{activeAlerts} active</div>
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
                <button className="btn btn-primary" onClick={() => handleOpenDetails(a.id)}><i className="fas fa-eye"></i> Details</button>
                <button className="btn btn-danger" onClick={() => handleTriggerProtocol(a)}><i className="fas fa-play"></i> Protocol</button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          {quickActions.map((action) => (
            <div
              key={action.key}
              className="action-card"
              style={{ boxShadow: `0 14px 30px ${action.tint}`, borderTopColor: action.tint }}
              onClick={() => navigateTo(action.target)}
            >
              <div className="action-icon" style={{ backgroundColor: action.tint }}>
                <i className={action.icon}></i>
              </div>
              <div className="action-title">{action.title}</div>
              <div className="action-desc">{action.desc}</div>
            </div>
          ))}
        </div>

        <div className="insight-grid">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Alert Volume (7d)</div>
                <div className="chart-subtitle">Latest count {latestAlertVolume} cases</div>
              </div>
              <div className="feed-badge soft">{criticalCases} high urgency</div>
            </div>
            <div className="chart-bars">
              {mockAlertTrend.map((value, idx) => (
                <div key={`alert-${idx}`} className="bar-wrap">
                  <div className="bar-track">
                    <div className="chart-bar" style={{ height: `${Math.max(Math.round((value / maxAlertTrend) * 100), 6)}%` }}></div>
                  </div>
                  <div className="bar-value">{value}</div>
                  <div className="bar-label">{dayLabels[idx] || `D${idx + 1}`}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Response Efficiency</div>
                <div className="chart-subtitle">Average performance {averageResponse}%</div>
              </div>
              <div className="feed-badge success">{bestResponse}% best</div>
            </div>
            <div className="chart-bars">
              {responseTrend.map((value, idx) => (
                <div key={`resp-${idx}`} className="bar-wrap">
                  <div className="bar-track">
                    <div className="chart-bar secondary" style={{ height: `${Math.max(Math.round((value / maxResponseTrend) * 100), 6)}%` }}></div>
                  </div>
                  <div className="bar-value">{value}%</div>
                  <div className="bar-label">{dayLabels[idx] || `D${idx + 1}`}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="activity-container">
          <div className="section-header">
            <div>
              <div className="section-title">Recent Emergency Activity</div>
              <div className="section-subtitle">Latest command updates</div>
            </div>
            <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 14 }}>View All</a>
          </div>
          <ul className="activity-list">
            {recentActivities.map((item) => (
              <li key={item.id} className="activity-item">
                <div className="activity-icon"><i className={item.icon}></i></div>
                <div className="activity-content">
                  <div className="activity-title">{item.title}</div>
                  <div className="activity-desc">{item.desc}</div>
                  <div className="activity-time">{item.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}



