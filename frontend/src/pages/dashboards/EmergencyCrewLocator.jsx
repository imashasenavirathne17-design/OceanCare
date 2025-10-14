import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../lib/token';
import EmergencySidebar from './EmergencySidebar';
import { listCrewLocations } from '../../lib/emergencyCrewLocatorApi';

export default function EmergencyCrewLocator() {
  const user = getUser();
  const navigate = useNavigate();

  const userFullName = user?.fullName || 'Emergency Officer';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Emergency Officer';
  const userVessel = user?.vessel || 'MV Ocean Explorer';
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=e63946&color=fff`;

  const [filters, setFilters] = useState({ status: 'All Statuses', dept: 'All Departments', q: '' });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCrewId, setActiveCrewId] = useState('');
  const [deck, setDeck] = useState('Main Deck');
  const [departments, setDepartments] = useState(['All Departments']);
  const STATUS_LABEL_TO_VALUE = useMemo(() => ({
    'All Statuses': 'all',
    'Critical Only': 'critical',
    'Warning Only': 'warning',
    'Stable Only': 'stable',
    'Offline Only': 'offline',
  }), []);
  const STATUS_VALUE_TO_LABEL = useMemo(() => ({
    critical: 'Critical Only',
    warning: 'Warning Only',
    stable: 'Stable Only',
    online: 'Stable Only',
    offline: 'Offline Only',
  }), []);
  const [statusOptions, setStatusOptions] = useState(Object.keys(STATUS_LABEL_TO_VALUE));

  const mapRef = useRef(null);

  const statusOptionToValue = (value) => STATUS_LABEL_TO_VALUE[value] || 'all';

  const clampPercent = (num) => {
    if (typeof num !== 'number' || Number.isNaN(num)) return 50;
    return Math.min(95, Math.max(5, num));
  };

  const getAvatarColor = (key) => {
    const palette = ['e63946', '3a86ff', 'f4a261', '2a9d8f', 'ffb703', '8338ec', 'ff006e'];
    if (!key) return palette[0];
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
      hash &= hash;
    }
    const index = Math.abs(hash) % palette.length;
    return palette[index];
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Unknown';
    }
  };

  const markStaleStatus = (status, lastSeenAt) => {
    if (!lastSeenAt) return 'offline';
    const diffMinutes = (Date.now() - lastSeenAt.getTime()) / (1000 * 60);
    if (diffMinutes <= 5) return status || 'stable';
    if (diffMinutes <= 15) return status === 'critical' ? 'critical' : 'warning';
    return 'offline';
  };

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCrewLocations();
      const enriched = (data || []).map((loc) => {
        const lastSeen = loc.lastSeenAt ? new Date(loc.lastSeenAt) : null;
        const status = markStaleStatus(loc.status || 'offline', lastSeen);
        let freshnessLabel = '';
        if (!lastSeen) {
          freshnessLabel = 'No recent updates';
        } else {
          const diffMinutes = Math.round((Date.now() - lastSeen.getTime()) / (1000 * 60));
          if (diffMinutes > 15) {
            freshnessLabel = `${diffMinutes} min stale`;
          } else if (diffMinutes > 5) {
            freshnessLabel = `${diffMinutes} min delay`;
          }
        }
        return ({
          id: loc.crewId || loc.crewName,
          code: loc.code || loc.crewId || loc.crewName,
          name: loc.crewName,
          dept: loc.department || 'General',
          role: loc.role || 'Crew Member',
          status,
          avatarBg: getAvatarColor(loc.crewId || loc.crewName),
          location: loc.location || 'Unknown',
          deck: loc.deck || 'Main Deck',
          time: formatTime(loc.lastSeenAt),
          lastSeenAt: lastSeen,
          freshnessLabel,
          pos: {
            top: `${clampPercent(loc.position?.top)}%`,
            left: `${clampPercent(loc.position?.left)}%`,
          },
          notes: loc.notes || '',
        });
      });
      setLocations(enriched);

      const deptSet = new Set(['All Departments']);
      enriched.forEach((item) => deptSet.add(item.dept || 'General'));
      setDepartments(Array.from(deptSet));

      const statusLabelSet = new Set(['All Statuses']);
      enriched.forEach((item) => {
        const label = STATUS_VALUE_TO_LABEL[item.status] || 'Stable Only';
        statusLabelSet.add(label);
      });
      setStatusOptions(Array.from(statusLabelSet));
      if (enriched.length && !enriched.find((c) => c.id === activeCrewId)) {
        setActiveCrewId(enriched[0].id);
      }
    } catch (err) {
      console.error('listCrewLocations error', err);
      setError('Failed to load crew locations');
    } finally {
      setLoading(false);
    }
  }, [activeCrewId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (!activeCrewId && locations.length) {
      setActiveCrewId(locations[0].id);
    }
  }, [locations, activeCrewId]);

  const crewList = useMemo(() => locations, [locations]);

  const availableDecks = useMemo(() => {
    const set = new Set(['Main Deck']);
    locations.forEach((loc) => {
      if (loc.deck) set.add(loc.deck);
    });
    return Array.from(set);
  }, [locations]);

  const filtered = useMemo(() => {
    const statusFilter = statusOptionToValue(filters.status);
    const deptFilter = filters.dept;
    const query = filters.q.trim().toLowerCase();
    return crewList.filter((c) => {
      if (deck && c.deck !== deck) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (deptFilter !== 'All Departments' && c.dept !== deptFilter) return false;
      if (query && !(c.name + c.role + c.code).toLowerCase().includes(query)) return false;
      return true;
    });
  }, [crewList, filters, deck]);

  const historyItems = useMemo(() => {
    const items = [...crewList]
      .filter((c) => c.lastSeenAt)
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .slice(0, 6)
      .map((c) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        time: formatTime(c.lastSeenAt),
        status: c.status,
      }));
    return items;
  }, [crewList]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLocations();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

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
        .deck-layout{ width:100%; height:100%; background-size:cover; position:relative; transition:background-image .3s ease; }
        .ship-map.deck-upper-deck .deck-layout{ background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23d4f1f4"/><path d="M15,15 L85,15 L75,85 L25,85 Z" fill="%2390d6e2" stroke="%235aa0ad" stroke-width="2"/><rect x="28" y="22" width="44" height="18" fill="%23ffffff" stroke="%235aa0ad" stroke-width="1"/><rect x="32" y="48" width="36" height="26" fill="%23ffffff" stroke="%235aa0ad" stroke-width="1"/></svg>'); }
        .ship-map.deck-main-deck .deck-layout{ background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23a0d2e8"/><path d="M10,10 L90,10 L80,90 L20,90 Z" fill="%2379b4d6" stroke="%235a8bad" stroke-width="2"/><rect x="30" y="20" width="40" height="20" fill="%23ffffff" stroke="%235a8bad" stroke-width="1"/><rect x="35" y="50" width="30" height="30" fill="%23ffffff" stroke="%235a8bad" stroke-width="1"/><circle cx="25" cy="65" r="5" fill="%23ffffff" stroke="%235a8bad" stroke-width="1"/><circle cx="75" cy="65" r="5" fill="%23ffffff" stroke="%235a8bad" stroke-width="1"/></svg>'); }
        .ship-map.deck-lower-deck .deck-layout{ background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%238bc6d9"/><path d="M12,12 L88,12 L78,88 L22,88 Z" fill="%2369a8bd" stroke="%234a7d8a" stroke-width="2"/><rect x="28" y="24" width="44" height="16" fill="%23ffffff" stroke="%234a7d8a" stroke-width="1"/><rect x="36" y="48" width="28" height="34" fill="%23ffffff" stroke="%234a7d8a" stroke-width="1"/></svg>'); }
        .ship-map.deck-engine-room .deck-layout{ background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%236b9ca1"/><path d="M18,18 L82,18 L74,82 L26,82 Z" fill="%234f7b80" stroke="%2338595c" stroke-width="2"/><rect x="30" y="28" width="40" height="18" fill="%23d9d9d9" stroke="%2338595c" stroke-width="1"/><rect x="34" y="52" width="32" height="26" fill="%23d9d9d9" stroke="%2338595c" stroke-width="1"/></svg>'); }

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
              {statusOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Department</label>
            <select className="filter-select" value={filters.dept} onChange={(e) => setFilters((f) => ({ ...f, dept: e.target.value }))}>
              {departments.map((deptOption) => (
                <option key={deptOption}>{deptOption}</option>
              ))}
            </select>
          </div>
          <div className="search-box">
            <i className="fas fa-search" />
            <input type="text" placeholder="Search crew members..." value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={fetchLocations} disabled={loading}>
            <i className="fas fa-sync-alt" /> {loading ? 'Refreshing…' : 'Refresh Locations'}
          </button>
          <button className="btn" onClick={() => setFilters({ status: 'All Statuses', dept: 'All Departments', q: '' })}><i className="fas fa-eye" /> Show All</button>
        </div>

        {/* Map and Crew List */}
        <div className="map-container">
          <div className="ship-map-section">
            <div className="map-header">
              <div className="map-title">MV Ocean Explorer - {deck}</div>
              <div className="deck-selector">
                {availableDecks.map((deckName) => (
                  <button
                    key={deckName}
                    className={`deck-btn ${deckName === deck ? 'active' : ''}`}
                    onClick={() => setDeck(deckName)}
                  >
                    {deckName}
                  </button>
                ))}
              </div>
            </div>
            <div className={`ship-map deck-${deck.replace(/\s+/g, '-').toLowerCase()}`} ref={mapRef}>
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
                      <div className="tooltip-details">{c.location}</div>
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
              {loading ? (
                <div className="empty" style={{ padding: 20 }}><div className="desc">Loading crew locations...</div></div>
              ) : error ? (
                <div className="empty" style={{ padding: 20, color: 'var(--danger)' }}><div className="desc">{error}</div></div>
              ) : filtered.length === 0 ? (
                <div className="empty" style={{ padding: 20 }}><div className="desc">No crew match the current filters.</div></div>
              ) : (
                filtered.map((c) => (
                  <div key={c.id} className={`crew-list-item ${activeCrewId === c.id ? 'active' : ''}`} onClick={() => setActiveCrewId(c.id)}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=40&background=${c.avatarBg}&color=fff`} alt={c.name} className="crew-avatar" />
                    <div className="crew-details">
                      <div className="crew-name">{c.name}</div>
                      <div className="crew-location">{c.location}</div>
                      <div className={`crew-time ${c.status}`}>Last update: {c.time}{c.freshnessLabel ? ` • ${c.freshnessLabel}` : ''}</div>
                    </div>
                    <div className={`crew-status status-${c.status}`}>{c.status.toUpperCase()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Location History */}
        <div className="location-history">
          <div className="section-header">
            <div className="section-title">Recent Location Updates</div>
            <button className="btn" onClick={fetchLocations}><i className="fas fa-history" /> Refresh</button>
          </div>
          <ul className="history-list">
            {historyItems.length === 0 ? (
              <li className="history-item"><div className="history-content"><div className="history-location">No recent updates recorded.</div></div></li>
            ) : (
              historyItems.map((item) => (
                <li key={item.id} className="history-item">
                  <div className="history-time">{item.time}</div>
                  <div className="history-content">
                    <div className="history-name">{item.name}</div>
                    <div className="history-location">{item.location}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
