import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../lib/token';
import EmergencySidebar from './EmergencySidebar';

export default function EmergencyIncidentLog() {
  const user = getUser();
  const navigate = useNavigate();

  const userFullName = user?.fullName || 'Emergency Officer';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Emergency Officer';
  const userVessel = user?.vessel || 'MV Ocean Explorer';
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=e63946&color=fff`;

  const [filters, setFilters] = useState({ status: 'All Incidents', severity: 'All Severities', date: 'Last 24 Hours', q: '' });

  const incidents = useMemo(() => ([
    {
      id: 'inc-2023-087',
      title: 'Cardiac Emergency - John Davis',
      icon: 'fas fa-heartbeat',
      type: 'critical',
      person: 'John Davis (CREW-045)',
      location: 'Engine Room → Medical Bay',
      started: '10:24 AM',
      desc: 'Critical cardiac anomaly detected. HR 145 bpm with irregular rhythm. Moved to medical bay.',
      progress: 65,
      lastUpdate: '10:45 AM',
      status: 'IN PROGRESS',
    },
    {
      id: 'inc-2023-086',
      title: 'Respiratory Distress - Maria Rodriguez',
      icon: 'fas fa-lungs',
      type: 'warning',
      person: 'Maria Rodriguez (CREW-128)',
      location: 'Medical Bay',
      started: '09:45 AM',
      desc: 'SpO2 88%. Oxygen administered and monitoring closely.',
      progress: 40,
      lastUpdate: '10:15 AM',
      status: 'IN PROGRESS',
    },
    {
      id: 'inc-2023-085',
      title: 'Elevated Temperature - Robert Chen',
      icon: 'fas fa-thermometer-full',
      type: 'info',
      person: 'Robert Chen (CREW-312)',
      location: 'Crew Quarters B → Medical Bay',
      started: '08:15 AM',
      desc: 'High fever detected (39.2°C). Administered antipyretics. Temperature normalized.',
      progress: 100,
      lastUpdate: '09:30 AM',
      status: 'RESOLVED',
    },
  ]), []);

  const filtered = incidents.filter((i) => {
    if (filters.status !== 'All Incidents' && !i.status.toLowerCase().includes(filters.status.toLowerCase().replace(' ', '-'))) return false;
    if (filters.severity !== 'All Severities') {
      if (filters.severity === 'Critical' && i.type !== 'critical') return false;
      if (filters.severity === 'Major' && i.type !== 'warning') return false; // map demo
      if (filters.severity === 'Minor' && i.type !== 'info') return false;
    }
    if (filters.q && !(`${i.title} ${i.person} ${i.location}`.toLowerCase().includes(filters.q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="dashboard-container emergency-dashboard">
      <style>{`
        .header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding:18px 22px; background:#fff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .header h2{ color:#e63946; font-size:24px; font-weight:700; margin:0; }
        .user-info{ display:flex; align-items:center; gap:10px; }
        .user-info img{ width:40px; height:40px; border-radius:50%; margin-right:8px; }
        .user-info .meta{ display:flex; flex-direction:column; }
        .user-info .name{ color:#343a40; font-weight:600; line-height:1.2; }
        .user-info small{ color:#6c757d; }
        .status-badge{ padding:6px 12px; border-radius:9999px; font-size:12px; font-weight:600; margin-left:10px; border:1px solid rgba(230,57,70,.35); background:rgba(230,57,70,.12); color:#e63946; }

        .incident-controls{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:20px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:15px; align-items:center; }
        .filter-group{ display:flex; flex-direction:column; }
        .filter-label{ font-size:14px; margin-bottom:5px; color:#666; font-weight:500; }
        .filter-select{ padding:8px 12px; border:1px solid #ddd; border-radius:4px; background:#fff; min-width:150px; }
        .search-box{ display:flex; align-items:center; background:#fff; border:1px solid #ddd; border-radius:4px; padding:0 10px; flex:1; max-width:300px; }
        .search-box input{ border:none; padding:8px 10px; width:100%; outline:none; }
        .btn{ padding:8px 15px; border:none; border-radius:4px; cursor:pointer; font-weight:500; transition:.3s; display:inline-flex; align-items:center; }
        .btn i{ margin-right:5px; }
        .btn-primary{ background:#e63946; color:#fff; }
        .btn-success{ background:#2a9d8f; color:#fff; }

        .incident-stats{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px; }
        .stat-card{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:20px; text-align:center; transition:.3s; }
        .stat-card:hover{ transform: translateY(-5px); }
        .stat-icon{ width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; margin:0 auto 15px; color:#fff; }
        .stat-icon.critical{ background:#e63946; } .stat-icon.warning{ background:#f4a261; } .stat-icon.active{ background:#e63946; } .stat-icon.resolved{ background:#2a9d8f; }
        .stat-value{ font-size:32px; font-weight:700; margin-bottom:5px; }
        .stat-label{ font-size:14px; color:#777; }

        .incident-list{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); overflow:hidden; margin-bottom:30px; }
        .incident-list-header{ display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:#f8f9fa; border-bottom:1px solid #eee; }
        .incident-list-title{ font-weight:600; color:#e63946; }
        .incident-actions{ display:flex; gap:10px; }
        .incident-item{ display:flex; padding:20px; border-bottom:1px solid #eee; transition:.3s; cursor:pointer; }
        .incident-item:hover{ background:#f8f9fa; }
        .incident-item.active{ background:rgba(230,57,70,.1); border-left:4px solid #e63946; }
        .incident-icon{ width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; margin-right:15px; color:#fff; }
        .incident-icon.critical{ background:#e63946; } .incident-icon.warning{ background:#f4a261; } .incident-icon.info{ background:#3a86ff; }
        .incident-content{ flex:1; }
        .incident-title{ font-weight:600; font-size:18px; margin-bottom:5px; }
        .incident-meta{ display:flex; flex-wrap:wrap; gap:15px; margin-bottom:10px; }
        .incident-meta-item{ display:flex; align-items:center; font-size:14px; color:#666; }
        .incident-meta-item i{ margin-right:5px; color:#e63946; }
        .incident-description{ font-size:14px; color:#777; margin-bottom:10px; }
        .incident-progress{ display:flex; align-items:center; margin-bottom:10px; }
        .progress-bar{ flex:1; height:6px; background:#e9ecef; border-radius:3px; overflow:hidden; margin-right:10px; }
        .progress-fill{ height:100%; background:#e63946; border-radius:3px; }
        .progress-text{ font-size:12px; color:#666; }
        .incident-footer{ display:flex; justify-content:space-between; align-items:center; margin-top:10px; }
        .incident-time{ font-size:12px; color:#999; }
        .incident-status{ padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; }
        .status-new{ background:rgba(230,57,70,.2); color:#e63946; } .status-in-progress{ background:rgba(244,162,97,.2); color:#f4a261; } .status-resolved{ background:rgba(42,157,143,.2); color:#2a9d8f; }

        .incident-detail{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; margin-bottom:30px; }
        .detail-header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; padding-bottom:15px; border-bottom:1px solid #eee; }
        .detail-main{ flex:1; }
        .detail-title{ font-size:24px; font-weight:600; margin-bottom:10px; }
        .detail-meta{ display:flex; flex-wrap:wrap; gap:15px; margin-bottom:10px; }
        .detail-meta-item{ display:flex; align-items:center; font-size:14px; color:#666; }
        .detail-meta-item i{ margin-right:5px; color:#e63946; }
        .detail-actions{ display:flex; gap:10px; }
        .tabs{ display:flex; border-bottom:1px solid #eee; margin-bottom:20px; }
        .tab{ padding:12px 20px; cursor:pointer; border-bottom:3px solid transparent; font-weight:500; }
        .tab.active{ border-bottom:3px solid #e63946; color:#e63946; }
        .tab-content{ display:none; }
        .tab-content.active{ display:block; }
        .info-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px; margin-bottom:25px; }
        .info-card{ background:#f8f9fa; border-radius:8px; padding:15px; }
        .info-card-title{ font-size:16px; font-weight:600; margin-bottom:10px; color:#e63946; }
        .info-item{ display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; }
        .info-item:last-child{ border-bottom:none; }
        .info-label{ font-weight:500; color:#666; }
        .info-value{ font-weight:500; }
        .timeline{ margin-bottom:25px; }
        .timeline-item{ display:flex; padding:15px 0; border-bottom:1px solid #eee; }
        .timeline-item:last-child{ border-bottom:none; }
        .timeline-time{ width:100px; font-weight:600; color:#e63946; font-size:14px; }
        .timeline-content{ flex:1; }
        .timeline-title{ font-weight:600; margin-bottom:5px; }
        .timeline-desc{ font-size:14px; color:#666; }
        .action-log{ margin-bottom:25px; }
        .log-item{ padding:12px 0; border-bottom:1px solid #eee; }
        .log-item:last-child{ border-bottom:none; }
        .log-header{ display:flex; justify-content:space-between; margin-bottom:5px; }
        .log-officer{ font-weight:600; }
        .log-time{ font-size:12px; color:#999; }
        .log-action{ font-size:14px; color:#666; }

        @media (max-width:992px){ .dashboard-container{flex-direction:column;} .sidebar{width:100%; height:auto;} .sidebar-menu{display:flex; overflow-x:auto;} .sidebar-menu li{margin-bottom:0; margin-right:10px;} .sidebar-menu a{padding:10px 15px; border-left:none; border-bottom:3px solid transparent;} .sidebar-menu a:hover, .sidebar-menu a.active{border-left:none; border-bottom:3px solid #fff;} }
        @media (max-width:768px){ .header{flex-direction:column; align-items:flex-start;} .user-info{margin-top:15px;} .incident-controls{flex-direction:column; align-items:flex-start;} .filter-group, .filter-select{width:100%;} .search-box{max-width:100%; width:100%;} .incident-stats{grid-template-columns:repeat(2, 1fr);} .incident-item{flex-direction:column;} .incident-icon{margin-right:0; margin-bottom:15px;} .detail-header{flex-direction:column;} .detail-actions{margin-top:15px; width:100%; justify-content:flex-start;} .tabs{overflow-x:auto;} }
        @media (max-width:480px){ .incident-stats{grid-template-columns:1fr;} .incident-meta{flex-direction:column; gap:5px;} .incident-footer{flex-direction:column; align-items:flex-start; gap:10px;} .info-grid{grid-template-columns:1fr;} }
      `}</style>

      {/* Sidebar */}
      <EmergencySidebar onLogout={() => navigate('/')} />

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h2>Incident Log & Case Management</h2>
          <div className="user-info">
            <img src={userAvatarUrl} alt="User" />
            <div className="meta">
              <div className="name">{userFullName}</div>
              <small>{`${userRole} | ${userVessel}`}</small>
            </div>
            <div className="status-badge status-active">On Duty</div>
          </div>
        </div>

        {/* Incident Controls */}
        <div className="incident-controls">
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select className="filter-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option>All Incidents</option>
              <option>New</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Severity</label>
            <select className="filter-select" value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}>
              <option>All Severities</option>
              <option>Critical</option>
              <option>Major</option>
              <option>Minor</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <select className="filter-select" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}>
              <option>Last 24 Hours</option>
              <option>Last 48 Hours</option>
              <option>Last Week</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="search-box">
            <i className="fas fa-search" />
            <input type="text" placeholder="Search incidents..." value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={() => alert('Filters applied')}><i className="fas fa-filter" /> Apply Filters</button>
          <button className="btn btn-success" onClick={() => alert('Open new incident form')}><i className="fas fa-plus" /> New Incident</button>
        </div>

        {/* Incident Stats */}
        <div className="incident-stats">
          <div className="stat-card"><div className="stat-icon critical"><i className="fas fa-exclamation-triangle" /></div><div className="stat-value">3</div><div className="stat-label">Critical Incidents</div></div>
          <div className="stat-card"><div className="stat-icon warning"><i className="fas fa-clock" /></div><div className="stat-value">5</div><div className="stat-label">Active Incidents</div></div>
          <div className="stat-card"><div className="stat-icon active"><i className="fas fa-tasks" /></div><div className="stat-value">12</div><div className="stat-label">Total Today</div></div>
          <div className="stat-card"><div className="stat-icon resolved"><i className="fas fa-check-circle" /></div><div className="stat-value">8</div><div className="stat-label">Resolved Today</div></div>
        </div>

        {/* Incident List */}
        <div className="incident-list">
          <div className="incident-list-header">
            <div className="incident-list-title">Active Incidents</div>
            <div className="incident-actions">
              <button className="btn"><i className="fas fa-sync-alt" /> Refresh</button>
              <button className="btn"><i className="fas fa-download" /> Export</button>
            </div>
          </div>
          {filtered.map((i, idx) => (
            <div key={i.id} className={`incident-item ${idx===0 ? 'active' : ''}`}>
              <div className={`incident-icon ${i.type}`}><i className={i.icon} /></div>
              <div className="incident-content">
                <div className="incident-title">{i.title}</div>
                <div className="incident-meta">
                  <div className="incident-meta-item"><i className="fas fa-user" /><span>{i.person}</span></div>
                  <div className="incident-meta-item"><i className="fas fa-map-marker-alt" /><span>{i.location}</span></div>
                  <div className="incident-meta-item"><i className="fas fa-clock" /><span>Started: {i.started}</span></div>
                </div>
                <div className="incident-description">{i.desc}</div>
                <div className="incident-progress"><div className="progress-bar"><div className="progress-fill" style={{width: `${i.progress}%`}} /></div><div className="progress-text">{i.progress}% Complete</div></div>
                <div className="incident-footer">
                  <div className="incident-time">Last updated: {i.lastUpdate}</div>
                  <div className={`incident-status ${i.status==='RESOLVED'?'status-resolved': i.status==='IN PROGRESS'?'status-in-progress':'status-new'}`}>{i.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Incident Detail (static sample) */}
        <div className="incident-detail" id="incident-detail">
          <div className="detail-header">
            <div className="detail-main">
              <div className="detail-title">Cardiac Emergency - John Davis</div>
              <div className="detail-meta">
                <div className="detail-meta-item"><i className="fas fa-hashtag" /><span>INC-2023-087</span></div>
                <div className="detail-meta-item"><i className="fas fa-user" /><span>John Davis (CREW-045)</span></div>
                <div className="detail-meta-item"><i className="fas fa-map-marker-alt" /><span>Engine Room → Medical Bay</span></div>
                <div className="detail-meta-item"><i className="fas fa-clock" /><span>Started: 10:24 AM | Last Update: 10:45 AM</span></div>
              </div>
              <div className="incident-status status-in-progress">IN PROGRESS</div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary"><i className="fas fa-edit" /> Edit</button>
              <button className="btn btn-success"><i className="fas fa-check" /> Resolve</button>
              <button className="btn"><i className="fas fa-print" /> Print</button>
            </div>
          </div>

          <div className="tabs">
            {['overview','timeline','actions','attachments'].map((t, i) => (
              <div key={t} className={`tab ${i===0 ? 'active' : ''}`} data-tab={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>
            ))}
          </div>

          <div className="tab-content active" id="overview">
            <div className="info-grid">
              <div className="info-card">
                <div className="info-card-title">Patient Information</div>
                <div className="info-item"><div className="info-label">Name</div><div className="info-value">John Davis</div></div>
                <div className="info-item"><div className="info-label">Crew ID</div><div className="info-value">CREW-045</div></div>
                <div className="info-item"><div className="info-label">Position</div><div className="info-value">Engine Technician</div></div>
                <div className="info-item"><div className="info-label">Age</div><div className="info-value">42</div></div>
                <div className="info-item"><div className="info-label">Blood Type</div><div className="info-value">A+</div></div>
              </div>
              <div className="info-card">
                <div className="info-card-title">Incident Details</div>
                <div className="info-item"><div className="info-label">Severity</div><div className="info-value">Critical</div></div>
                <div className="info-item"><div className="info-label">Category</div><div className="info-value">Cardiac Emergency</div></div>
                <div className="info-item"><div className="info-label">Location</div><div className="info-value">Engine Room</div></div>
                <div className="info-item"><div className="info-label">Reported By</div><div className="info-value">Auto Alert System</div></div>
                <div className="info-item"><div className="info-label">Assigned To</div><div className="info-value">Dr. Sarah Johnson</div></div>
              </div>
              <div className="info-card">
                <div className="info-card-title">Vital Signs</div>
                <div className="info-item"><div className="info-label">Heart Rate</div><div className="info-value">145 bpm <span style={{color:'#e63946'}}>(High)</span></div></div>
                <div className="info-item"><div className="info-label">Blood Pressure</div><div className="info-value">165/95 mmHg <span style={{color:'#e63946'}}>(High)</span></div></div>
                <div className="info-item"><div className="info-label">Temperature</div><div className="info-value">37.1°C <span style={{color:'#2a9d8f'}}>(Normal)</span></div></div>
                <div className="info-item"><div className="info-label">Oxygen Saturation</div><div className="info-value">92% <span style={{color:'#f4a261'}}>(Low)</span></div></div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-title">Incident Description</div>
              <p>Critical cardiac anomaly detected at 10:24 AM. Patient was working in the engine room when his wearable device detected elevated heart rate (145 bpm) with irregular rhythm. Emergency protocol activated immediately. Patient was moved to medical bay for emergency treatment. Dr. Sarah Johnson is leading the medical response.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
