import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../lib/token';
import EmergencySidebar from './EmergencySidebar';

export default function EmergencyCrewProfiles() {
  const user = getUser();
  const navigate = useNavigate();

  const userFullName = user?.fullName || 'Emergency Officer';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Emergency Officer';
  const userVessel = user?.vessel || 'MV Ocean Explorer';
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=e63946&color=fff`;

  const [filters, setFilters] = useState({
    q: '',
    risk: 'All Risk Levels',
    dept: 'All Departments',
  });

  const crew = useMemo(() => ([
    {
      id: 'CREW-045',
      name: 'John Davis',
      position: 'Engine Technician',
      status: 'CRITICAL',
      statusClass: 'status-critical',
      avatarBg: 'e63946',
      details: {
        age: 42,
        blood: 'A+',
        lastCheck: 'Today, 10:24 AM',
      },
      risks: ['Hypertension', 'Cardiac History', 'High Stress'],
    },
    {
      id: 'CREW-128',
      name: 'Maria Rodriguez',
      position: 'Deck Officer',
      status: 'MONITORING',
      statusClass: 'status-monitoring',
      avatarBg: '3a86ff',
      details: {
        age: 35,
        blood: 'O-',
        lastCheck: 'Today, 10:15 AM',
      },
      risks: ['Asthma', 'Seasonal Allergies'],
    },
    {
      id: 'CREW-312',
      name: 'Robert Chen',
      position: 'Cook',
      status: 'STABLE',
      statusClass: 'status-stable',
      avatarBg: 'f4a261',
      details: {
        age: 28,
        blood: 'B+',
        lastCheck: 'Today, 09:45 AM',
      },
      risks: ['Mild Hypertension'],
    },
  ]), []);

  const [selected, setSelected] = useState(null); // selected crew for detail view
  const [activeTab, setActiveTab] = useState('overview');

  const filtered = crew.filter((c) => {
    if (filters.q && !(`${c.name} ${c.position} ${c.id}`.toLowerCase().includes(filters.q.toLowerCase()))) return false;
    if (filters.risk !== 'All Risk Levels') {
      if (filters.risk === 'Critical' && c.status !== 'CRITICAL') return false;
      if (filters.risk === 'High' && c.status !== 'MONITORING') return false; // mapping demo
      if (filters.risk === 'Low' && c.status !== 'STABLE') return false;
    }
    if (filters.dept !== 'All Departments') {
      // demo – no real dept field, accept all
    }
    return true;
  });

  return (
    <div className="dashboard-container emergency-dashboard">
      {/* Small inline style block to mirror Alerts/Protocols card UX */}
      <style>{`
        .main-content { padding: 20px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding:18px 22px; background:#fff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .header h2 { color:#e63946; font-size:24px; font-weight:700; margin:0; }
        .user-info { display:flex; align-items:center; gap:10px; }
        .user-info img { width:40px; height:40px; border-radius:50%; margin-right:8px; }
        .user-info .meta { display:flex; flex-direction:column; }
        .user-info .meta .name { color:#343a40; font-weight:600; line-height:1.2; }
        .user-info .meta small { color:#6c757d; line-height:1.2; }
        .status-badge { padding:6px 12px; border-radius:9999px; font-size:12px; font-weight:600; margin-left:10px; border:1px solid rgba(230,57,70,.35); background:rgba(230,57,70,.12); color:#e63946; }

        .search-filters { background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:20px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:15px; align-items:center; }
        .search-box { display:flex; align-items:center; background:#fff; border:1px solid #ddd; border-radius:4px; padding:0 10px; flex:1; max-width:300px; }
        .search-box input { border:none; padding:8px 10px; width:100%; outline:none; }
        .filter-group { display:flex; flex-direction:column; }
        .filter-label { font-size:14px; margin-bottom:5px; color:#666; font-weight:500; }
        .filter-select { padding:8px 12px; border:1px solid #ddd; border-radius:4px; background:#fff; min-width:150px; }
        .btn { padding:8px 15px; border:none; border-radius:4px; cursor:pointer; font-weight:500; transition:.3s; display:inline-flex; align-items:center; }
        .btn i { margin-right:5px; }
        .btn-primary { background:#e63946; color:#fff; }

        .crew-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:25px; margin-bottom:30px; }
        .crew-card { background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); overflow:hidden; transition:transform .3s; }
        .crew-card:hover { transform: translateY(-5px); }
        .crew-header { padding:20px; display:flex; align-items:center; border-bottom:1px solid #eee; }
        .crew-avatar { width:70px; height:70px; border-radius:50%; margin-right:15px; object-fit:cover; }
        .crew-info { flex:1; }
        .crew-name { font-size:18px; font-weight:600; margin-bottom:5px; }
        .crew-position { font-size:14px; color:#777; margin-bottom:5px; }
        .crew-status { padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; }
        .status-critical { background:rgba(230,57,70,.2); color:#e63946; }
        .status-monitoring { background:rgba(244,162,97,.2); color:#f4a261; }
        .status-stable { background:rgba(42,157,143,.2); color:#2a9d8f; }
        .crew-body { padding:20px; }
        .crew-details { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px; }
        .detail-item { display:flex; flex-direction:column; }
        .detail-label { font-size:12px; color:#777; margin-bottom:3px; }
        .detail-value { font-size:14px; font-weight:500; }
        .risk-factors { margin-bottom:15px; }
        .risk-title { font-size:14px; font-weight:600; margin-bottom:8px; color:#343a40; }
        .risk-tags { display:flex; flex-wrap:wrap; gap:5px; }
        .risk-tag { padding:3px 8px; background:#fff5f5; border-radius:12px; font-size:11px; color:#e63946; }
        .risk-tag.warning { background:#fff4e5; color:#f4a261; }
        .risk-tag.info { background:#e3f2fd; color:#3a86ff; }
        .crew-footer { display:flex; justify-content:space-between; padding:15px 20px; border-top:1px solid #eee; }

        .profile-detail { background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; margin-bottom:30px; }
        .profile-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; }
        .profile-main { display:flex; align-items:flex-start; }
        .profile-avatar { width:100px; height:100px; border-radius:50%; margin-right:20px; object-fit:cover; }
        .profile-name { font-size:24px; font-weight:600; margin-bottom:5px; }
        .profile-meta { display:flex; flex-wrap:wrap; gap:15px; margin-bottom:10px; }
        .profile-meta-item { display:flex; align-items:center; font-size:14px; color:#666; }
        .profile-meta-item i { margin-right:5px; color:#e63946; }
        .profile-actions { display:flex; gap:10px; }
        .tabs { display:flex; border-bottom:1px solid #eee; margin-bottom:20px; }
        .tab { padding:12px 20px; cursor:pointer; border-bottom:3px solid transparent; font-weight:500; }
        .tab.active { border-bottom:3px solid #e63946; color:#e63946; }
        .info-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:20px; margin-bottom:25px; }
        .info-card { background:#f8f9fa; border-radius:8px; padding:15px; }
        .info-card-title { font-size:16px; font-weight:600; margin-bottom:10px; color:#e63946; }
        .info-item { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; }
        .info-item:last-child { border-bottom:none; }
        .vitals-chart { height:200px; background:#f8f9fa; border-radius:8px; margin-bottom:25px; display:flex; align-items:center; justify-content:center; color:#777; }

        @media (max-width: 992px) {
          .dashboard-container { flex-direction: column; }
          .sidebar { width: 100%; height: auto; }
          .sidebar-menu { display:flex; overflow-x:auto; }
          .sidebar-menu li { margin-bottom:0; margin-right:10px; }
          .sidebar-menu a { padding:10px 15px; border-left:none; border-bottom:3px solid transparent; }
          .sidebar-menu a:hover, .sidebar-menu a.active { border-left:none; border-bottom:3px solid #fff; }
        }
        @media (max-width: 768px) {
          .header { flex-direction:column; align-items:flex-start; }
          .user-info { margin-top:15px; }
          .search-filters { flex-direction:column; align-items:flex-start; }
          .search-box { max-width:100%; width:100%; }
          .filter-group, .filter-select { width:100%; }
          .crew-grid { grid-template-columns:1fr; }
          .profile-header { flex-direction:column; }
          .profile-actions { margin-top:15px; width:100%; justify-content:flex-start; }
          .tabs { overflow-x:auto; }
        }
        @media (max-width: 480px) {
          .crew-details { grid-template-columns:1fr; }
          .crew-footer { flex-direction:column; gap:10px; }
          .profile-main { flex-direction:column; text-align:center; }
          .profile-avatar { margin-right:0; margin-bottom:15px; }
          .info-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* Sidebar */}
      <EmergencySidebar onLogout={() => navigate('/')} />

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h2>Crew Health Profiles</h2>
          <div className="user-info">
            <img src={userAvatarUrl} alt="User" />
            <div className="meta">
              <div className="name">{userFullName}</div>
              <small>{`${userRole} | ${userVessel}`}</small>
            </div>
            <div className="status-badge status-active">On Duty</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search crew members..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Risk Level</label>
            <select
              className="filter-select"
              value={filters.risk}
              onChange={(e) => setFilters((f) => ({ ...f, risk: e.target.value }))}
            >
              <option>All Risk Levels</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Department</label>
            <select
              className="filter-select"
              value={filters.dept}
              onChange={(e) => setFilters((f) => ({ ...f, dept: e.target.value }))}
            >
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Deck</option>
              <option>Medical</option>
              <option>Catering</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={() => alert('Filters applied successfully')}>
            <i className="fas fa-filter" /> Apply Filters
          </button>
          <button className="btn" onClick={() => alert('Refreshing crew data...')}>
            <i className="fas fa-sync-alt" /> Refresh
          </button>
        </div>

        {/* Crew Grid */}
        <div className="crew-grid">
          {filtered.map((c) => (
            <div className="crew-card" key={c.id}>
              <div className="crew-header">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=70&background=${c.avatarBg}&color=fff`}
                  alt={c.name}
                  className="crew-avatar"
                />
                <div className="crew-info">
                  <div className="crew-name">{c.name}</div>
                  <div className="crew-position">{c.position}</div>
                  <div className={`crew-status ${c.statusClass}`}>{c.status}</div>
                </div>
              </div>
              <div className="crew-body">
                <div className="crew-details">
                  <div className="detail-item">
                    <div className="detail-label">ID</div>
                    <div className="detail-value">{c.id}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Age</div>
                    <div className="detail-value">{c.details.age}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Blood Type</div>
                    <div className="detail-value">{c.details.blood}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Last Check</div>
                    <div className="detail-value">{c.details.lastCheck}</div>
                  </div>
                </div>
                <div className="risk-factors">
                  <div className="risk-title">Risk Factors</div>
                  <div className="risk-tags">
                    {c.risks.map((r, i) => (
                      <div key={i} className={`risk-tag ${r.includes('High') || r.includes('Asthma') ? 'warning' : r.includes('Mild') ? 'info' : ''}`}>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="crew-footer">
                <button className="btn btn-primary btn-sm" onClick={() => { setSelected(c); setActiveTab('overview'); }}>
                  <i className="fas fa-eye" /> View Profile
                </button>
                <button className="btn btn-warning btn-sm" onClick={() => alert('Monitoring enabled') }>
                  <i className="fas fa-heartbeat" /> Monitor
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Profile View */}
        {selected && (
          <div className="profile-detail">
            <div className="profile-header">
              <div className="profile-main">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selected.name)}&size=100&background=e63946&color=fff`}
                  alt={selected.name}
                  className="profile-avatar"
                />
                <div className="profile-info">
                  <div className="profile-name">{selected.name}</div>
                  <div className="profile-meta">
                    <div className="profile-meta-item"><i className="fas fa-id-badge" /><span>{selected.id}</span></div>
                    <div className="profile-meta-item"><i className="fas fa-briefcase" /><span>{selected.position}</span></div>
                    <div className="profile-meta-item"><i className="fas fa-map-marker-alt" /><span>Medical Bay</span></div>
                    <div className="profile-meta-item"><i className="fas fa-phone" /><span>Ext. 245</span></div>
                  </div>
                  <div className={`crew-status ${selected.statusClass}`}>{selected.status} CONDITION</div>
                </div>
              </div>
              <div className="profile-actions">
                <button className="btn btn-primary" onClick={() => window.print()}><i className="fas fa-print" /> Print</button>
                <button className="btn" onClick={() => setSelected(null)}><i className="fas fa-times" /> Close</button>
              </div>
            </div>

            <div className="tabs">
              {['overview','medical','vitals','medications','contacts'].map(t => (
                <div
                  key={t}
                  className={`tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="tab-content active" id="overview">
                <div className="info-grid">
                  <div className="info-card">
                    <div className="info-card-title">Personal Information</div>
                    <div className="info-item"><div className="info-label">Age</div><div className="info-value">{selected.details.age}</div></div>
                    <div className="info-item"><div className="info-label">Date of Birth</div><div className="info-value">June 15, 1981</div></div>
                    <div className="info-item"><div className="info-label">Nationality</div><div className="info-value">American</div></div>
                    <div className="info-item"><div className="info-label">Blood Type</div><div className="info-value">{selected.details.blood}</div></div>
                  </div>
                  <div className="info-card">
                    <div className="info-card-title">Medical Information</div>
                    <div className="info-item"><div className="info-label">Primary Condition</div><div className="info-value">Hypertension</div></div>
                    <div className="info-item"><div className="info-label">Allergies</div><div className="info-value">Penicillin, Shellfish</div></div>
                    <div className="info-item"><div className="info-label">Last Physical</div><div className="info-value">Oct 10, 2023</div></div>
                    <div className="info-item"><div className="info-label">Vaccination Status</div><div className="info-value">Up to date</div></div>
                  </div>
                  <div className="info-card">
                    <div className="info-card-title">Risk Assessment</div>
                    <div className="info-item"><div className="info-label">Overall Risk</div><div className="info-value">High</div></div>
                    <div className="info-item"><div className="info-label">Cardiac Risk</div><div className="info-value">Critical</div></div>
                    <div className="info-item"><div className="info-label">Respiratory Risk</div><div className="info-value">Low</div></div>
                    <div className="info-item"><div className="info-label">Stress Level</div><div className="info-value">High</div></div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-card-title">Current Health Status</div>
                  <div className="vitals-chart">[Vital Signs Chart Would Appear Here]</div>
                  <div className="info-grid">
                    <div className="info-item"><div className="info-label">Heart Rate</div><div className="info-value">145 bpm <span style={{color:'#e63946'}}>(High)</span></div></div>
                    <div className="info-item"><div className="info-label">Blood Pressure</div><div className="info-value">165/95 mmHg <span style={{color:'#e63946'}}>(High)</span></div></div>
                    <div className="info-item"><div className="info-label">Temperature</div><div className="info-value">37.1°C <span style={{color:'#2a9d8f'}}>(Normal)</span></div></div>
                    <div className="info-item"><div className="info-label">Oxygen Saturation</div><div className="info-value">92% <span style={{color:'#f4a261'}}>(Low)</span></div></div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder content for other tabs */}
            {activeTab !== 'overview' && (
              <div className="tab-content active" id={activeTab}>
                <div style={{padding:'20px', color:'#777'}}>Content for the "{activeTab}" tab would appear here.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
