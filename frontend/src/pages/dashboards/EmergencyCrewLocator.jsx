import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../lib/token';
import EmergencySidebar from './EmergencySidebar';

export default function EmergencyCrewLocator() {
  const user = getUser();
  const navigate = useNavigate();

  const userFullName = user?.fullName || 'Emergency Officer';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Emergency Officer';
  const userVessel = user?.vessel || 'MV Ocean Explorer';
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=e63946&color=fff`;

  const [filters, setFilters] = useState({ status: 'All Statuses', dept: 'All Departments', q: '' });
  const [activeCrewId, setActiveCrewId] = useState('john-davis');

  const crewList = useMemo(() => ([
    { id: 'john-davis', code: 'CREW-045', name: 'John Davis', dept: 'Engineering', role: 'Engine Technician', status: 'critical', avatarBg: 'e63946', location: 'Engine Room', time: '10:28 AM', pos: { top: '30%', left: '65%' } },
    { id: 'maria-rodriguez', code: 'CREW-128', name: 'Maria Rodriguez', dept: 'Deck', role: 'Deck Officer', status: 'warning', avatarBg: '3a86ff', location: 'Medical Bay', time: '10:15 AM', pos: { top: '60%', left: '40%' } },
    { id: 'robert-chen', code: 'CREW-312', name: 'Robert Chen', dept: 'Catering', role: 'Cook', status: 'stable', avatarBg: 'f4a261', location: 'Crew Quarters B', time: '09:45 AM', pos: { top: '45%', left: '25%' } },
    { id: 'sarah-johnson', code: 'CREW-201', name: 'Sarah Johnson', dept: 'Medical', role: 'Medical Officer', status: 'stable', avatarBg: '2a9d8f', location: 'Medical Bay', time: '10:10 AM', pos: { top: '20%', left: '50%' } },
    { id: 'james-wilson', code: 'CREW-101', name: 'James Wilson', dept: 'Deck', role: 'First Officer', status: 'offline', avatarBg: '6c757d', location: 'Bridge', time: '08:30 AM', pos: { top: '70%', left: '75%' } },
  ]), []);

  const filtered = crewList.filter((c) => {
    if (filters.status !== 'All Statuses' && filters.status.toLowerCase().includes('critical') && c.status !== 'critical') return false;
    if (filters.status !== 'All Statuses' && filters.status.toLowerCase().includes('warning') && c.status !== 'warning') return false;
    if (filters.status !== 'All Statuses' && filters.status.toLowerCase().includes('stable') && c.status !== 'stable') return false;
    if (filters.status !== 'All Statuses' && filters.status.toLowerCase().includes('offline') && c.status !== 'offline') return false;
    if (filters.dept !== 'All Departments' && c.dept !== filters.dept) return false;
    if (filters.q && !(c.name + ' ' + c.role + ' ' + c.code).toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  });

  const mapRef = useRef(null);

  useEffect(() => {
    // simple real-time tick to update "Last update" demo
    const t = setInterval(() => {
      const d = new Date();
      // noop, in real app update from server
    }, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dashboard-container emergency-dashboard">
      <style>{`
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding:18px 22px; background:#fff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .header h2 { color:#e63946; font-size:24px; font-weight:700; margin:0; }
        .user-info { display:flex; align-items:center; gap:10px; }
        .user-info img{ width:40px; height:40px; border-radius:50%; margin-right:8px; }
        .user-info .meta{ display:flex; flex-direction:column; }
        .user-info .name{ color:#343a40; font-weight:600; line-height:1.2; }
        .user-info small{ color:#6c757d; }
        .status-badge{ padding:6px 12px; border-radius:9999px; font-size:12px; font-weight:600; margin-left:10px; border:1px solid rgba(230,57,70,.35); background:rgba(230,57,70,.12); color:#e63946; }

        .map-controls{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:20px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:15px; align-items:center; }
        .filter-group{ display:flex; flex-direction:column; }
        .filter-label{ font-size:14px; margin-bottom:5px; color:#666; font-weight:500; }
        .filter-select{ padding:8px 12px; border:1px solid #ddd; border-radius:4px; background:#fff; min-width:150px; }
        .search-box{ display:flex; align-items:center; background:#fff; border:1px solid #ddd; border-radius:4px; padding:0 10px; flex:1; max-width:300px; }
        .search-box input{ border:none; padding:8px 10px; width:100%; outline:none; }
        .btn{ padding:8px 15px; border:none; border-radius:4px; cursor:pointer; font-weight:500; transition:.3s; display:inline-flex; align-items:center; }
        .btn i{ margin-right:5px; }
        .btn-primary{ background:#e63946; color:#fff; }

        .map-container{ display:grid; grid-template-columns:1fr 350px; gap:25px; margin-bottom:30px; }
        .ship-map-section{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); overflow:hidden; }
        .map-header{ display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:#f8f9fa; border-bottom:1px solid #eee; }
        .map-title{ font-weight:600; color:#e63946; }
        .deck-selector{ display:flex; gap:10px; }
        .deck-btn{ padding:6px 12px; background:#fff; border:1px solid #ddd; border-radius:4px; cursor:pointer; font-size:14px; }
        .deck-btn.active{ background:#e63946; color:#fff; border-color:#e63946; }
        .ship-map{ height:500px; background:#e9ecef; position:relative; overflow:hidden; }
        .deck-layout{ width:100%; height:100%; background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23a0d2e8"/><path d="M10,10 L90,10 L80,90 L20,90 Z" fill="%2379b4d6" stroke="%235a8bad" stroke-width="2"/><rect x="30" y="20" width="40" height="20" fill="%23ffffff" stroke="%235a8bad" stroke-width="1"/><rect x="35" y="50" width="30" height="30" fill="%23ffffff" stroke="%235a8bad" stroke-width="1"/><circle cx="25" cy="65" r="5" fill="%23ffffff" stroke="%235a8bad" stroke-width="1"/><circle cx="75" cy="65" r="5" fill="%23ffffff" stroke="%235a8bad" stroke-width="1"/></svg>'); background-size:cover; position:relative; }

        .crew-marker{ position:absolute; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 5px rgba(0,0,0,.3); cursor:pointer; transition:all .3s; }
        .crew-marker.critical{ background:#e63946; animation:pulse 1.5s infinite; }
        .crew-marker.warning{ background:#f4a261; }
        .crew-marker.stable{ background:#2a9d8f; }
        .crew-marker.offline{ background:#6c757d; }
        .crew-marker:hover{ transform:scale(1.3); z-index:10; }
        @keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}

        .crew-tooltip{ position:absolute; background:#fff; border-radius:6px; padding:10px; box-shadow:0 3px 10px rgba(0,0,0,.2); font-size:14px; z-index:20; min-width:200px; display:none; }
        .tooltip-name{ font-weight:600; margin-bottom:5px; }
        .tooltip-details{ font-size:12px; color:#666; margin-bottom:5px; }
        .tooltip-status{ font-size:11px; font-weight:600; padding:2px 6px; border-radius:10px; display:inline-block; }

        .crew-list-section{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); overflow:hidden; display:flex; flex-direction:column; }
        .crew-list-header{ padding:15px 20px; background:#f8f9fa; border-bottom:1px solid #eee; }
        .crew-list-title{ font-weight:600; color:#e63946; }
        .crew-list{ flex:1; overflow-y:auto; max-height:500px; }
        .crew-list-item{ display:flex; align-items:center; padding:15px 20px; border-bottom:1px solid #eee; cursor:pointer; transition:all .3s; }
        .crew-list-item:hover{ background:#f8f9fa; }
        .crew-list-item.active{ background:rgba(230,57,70,.1); border-left:4px solid #e63946; }
        .crew-avatar{ width:40px; height:40px; border-radius:50%; margin-right:15px; object-fit:cover; }
        .crew-details{ flex:1; }
        .crew-name{ font-weight:600; margin-bottom:3px; }
        .crew-location{ font-size:13px; color:#666; margin-bottom:3px; }
        .crew-time{ font-size:11px; color:#999; }
        .crew-status{ padding:4px 8px; border-radius:12px; font-size:11px; font-weight:600; margin-left:10px; }
        .status-critical{ background:rgba(230,57,70,.2); color:#e63946; }
        .status-warning{ background:rgba(244,162,97,.2); color:#f4a261; }
        .status-stable{ background:rgba(42,157,143,.2); color:#2a9d8f; }
        .status-offline{ background:rgba(108,117,125,.2); color:#6c757d; }

        .location-history{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; }
        .section-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .section-title{ font-size:20px; font-weight:600; color:#e63946; }
        .history-list{ list-style:none; }
        .history-item{ display:flex; padding:12px 0; border-bottom:1px solid #eee; }
        .history-item:last-child{ border-bottom:none; }
        .history-time{ width:80px; font-weight:600; color:#e63946; font-size:14px; }
        .history-content{ flex:1; }
        .history-name{ font-weight:600; margin-bottom:3px; }
        .history-location{ font-size:14px; color:#777; }

        @media (max-width: 992px) {
          .dashboard-container{ flex-direction:column; }
          .sidebar{ width:100%; height:auto; }
          .sidebar-menu{ display:flex; overflow-x:auto; }
          .sidebar-menu li{ margin-bottom:0; margin-right:10px; }
          .sidebar-menu a{ padding:10px 15px; border-left:none; border-bottom:3px solid transparent; }
          .sidebar-menu a:hover, .sidebar-menu a.active{ border-left:none; border-bottom:3px solid #fff; }
          .map-container{ grid-template-columns:1fr; }
          .crew-list-section{ max-height:300px; }
        }
        @media (max-width: 768px) {
          .header{ flex-direction:column; align-items:flex-start; }
          .user-info{ margin-top:15px; }
          .map-controls{ flex-direction:column; align-items:flex-start; }
          .filter-group, .filter-select{ width:100%; }
          .search-box{ max-width:100%; width:100%; }
          .deck-selector{ flex-wrap:wrap; }
        }
        @media (max-width:480px){ .ship-map{ height:400px; } .crew-list-item{ flex-direction:column; align-items:flex-start; } .crew-avatar{ margin-right:0; margin-bottom:10px; } .crew-status{ margin-left:0; margin-top:5px; } }
      `}</style>

      {/* Sidebar */}
      <EmergencySidebar onLogout={() => navigate('/')} />

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h2>Crew Locator</h2>
          <div className="user-info">
            <img src={userAvatarUrl} alt="User" />
            <div className="meta">
              <div className="name">{userFullName}</div>
              <small>{`${userRole} | ${userVessel}`}</small>
            </div>
            <div className="status-badge status-active">On Duty</div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="map-controls">
          <div className="filter-group">
            <label className="filter-label">Status Filter</label>
            <select className="filter-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option>All Statuses</option>
              <option>Critical Only</option>
              <option>Warning Only</option>
              <option>Stable Only</option>
              <option>Offline Only</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Department</label>
            <select className="filter-select" value={filters.dept} onChange={(e) => setFilters((f) => ({ ...f, dept: e.target.value }))}>
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Deck</option>
              <option>Medical</option>
              <option>Catering</option>
            </select>
          </div>
          <div className="search-box">
            <i className="fas fa-search" />
            <input type="text" placeholder="Search crew members..." value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={() => alert('Refreshing crew locations...')}><i className="fas fa-sync-alt" /> Refresh Locations</button>
          <button className="btn" onClick={() => setFilters({ status: 'All Statuses', dept: 'All Departments', q: '' })}><i className="fas fa-eye" /> Show All</button>
        </div>

        {/* Map and Crew List */}
        <div className="map-container">
          <div className="ship-map-section">
            <div className="map-header">
              <div className="map-title">MV Ocean Explorer - Main Deck</div>
              <div className="deck-selector">
                <button className="deck-btn">Upper Deck</button>
                <button className="deck-btn active">Main Deck</button>
                <button className="deck-btn">Lower Deck</button>
                <button className="deck-btn">Engine Room</button>
              </div>
            </div>
            <div className="ship-map" ref={mapRef}>
              <div className="deck-layout">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className={`crew-marker ${c.status}`}
                    style={{ top: c.pos.top, left: c.pos.left }}
                    onMouseEnter={(e) => {
                      const tt = e.currentTarget.querySelector('.crew-tooltip');
                      if (tt) tt.style.display = 'block';
                    }}
                    onMouseLeave={(e) => {
                      const tt = e.currentTarget.querySelector('.crew-tooltip');
                      if (tt) tt.style.display = 'none';
                    }}
                    onClick={() => setActiveCrewId(c.id)}
                  >
                    <div className="crew-tooltip">
                      <div className="tooltip-name">{c.name}</div>
                      <div className="tooltip-details">{c.role} • {c.code}</div>
                      <div className="tooltip-status" style={{ background: c.status==='critical'?'rgba(230,57,70,.2)':c.status==='warning'?'rgba(244,162,97,.2)':c.status==='stable'?'rgba(42,157,143,.2)':'rgba(108,117,125,.2)', color: c.status==='critical'?'#e63946':c.status==='warning'?'#f4a261':c.status==='stable'?'#2a9d8f':'#6c757d' }}>{c.status.toUpperCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="crew-list-section">
            <div className="crew-list-header">
              <div className="crew-list-title">Crew Locations</div>
            </div>
            <div className="crew-list">
              {filtered.map((c) => (
                <div key={c.id} className={`crew-list-item ${activeCrewId === c.id ? 'active' : ''}`} onClick={() => setActiveCrewId(c.id)}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=40&background=${c.avatarBg}&color=fff`} alt={c.name} className="crew-avatar" />
                  <div className="crew-details">
                    <div className="crew-name">{c.name}</div>
                    <div className="crew-location">{c.location}</div>
                    <div className="crew-time">Last update: {c.time}</div>
                  </div>
                  <div className={`crew-status status-${c.status}`}>{c.status.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location History */}
        <div className="location-history">
          <div className="section-header">
            <div className="section-title">Recent Location Updates</div>
            <button className="btn"><i className="fas fa-history" /> View Full History</button>
          </div>
          <ul className="history-list">
            <li className="history-item"><div className="history-time">10:28 AM</div><div className="history-content"><div className="history-name">John Davis</div><div className="history-location">Moved from Engine Control Room to Engine Room</div></div></li>
            <li className="history-item"><div className="history-time">10:15 AM</div><div className="history-content"><div className="history-name">Maria Rodriguez</div><div className="history-location">Moved from Deck to Medical Bay</div></div></li>
            <li className="history-item"><div className="history-time">10:10 AM</div><div className="history-content"><div className="history-name">Sarah Johnson</div><div className="history-location">Moved from Medical Office to Medical Bay</div></div></li>
            <li className="history-item"><div className="history-time">09:45 AM</div><div className="history-content"><div className="history-name">Robert Chen</div><div className="history-location">Moved from Galley to Crew Quarters B</div></div></li>
            <li className="history-item"><div className="history-time">08:30 AM</div><div className="history-content"><div className="history-name">James Wilson</div><div className="history-location">Last known location: Bridge (Device offline)</div></div></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
