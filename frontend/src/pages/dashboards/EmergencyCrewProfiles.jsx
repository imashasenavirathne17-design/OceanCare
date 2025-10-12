import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencySidebar from './EmergencySidebar';
import { getUser } from '../../lib/token';
import './emergencyOfficerDashboard.css';
import { listCrewProfiles, getCrewProfile } from '../../lib/emergencyCrewApi';

const RISK_OPTIONS = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'critical', label: 'Critical' },
  { value: 'elevated', label: 'Elevated' },
  { value: 'stable', label: 'Stable' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const riskLabel = (risk) => {
  const match = RISK_OPTIONS.find((r) => r.value === risk);
  return match ? match.label : 'Unknown';
};

const statusLabel = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function EmergencyCrewProfiles() {
  const navigate = useNavigate();
  const user = getUser();

  const [filters, setFilters] = useState({ q: '', risk: 'all', status: 'all' });
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          q: filters.q || undefined,
          risk: filters.risk,
          status: filters.status,
        };
        const data = await listCrewProfiles(params);
        if (!ignore) setCrew(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('listCrewProfiles error', err);
        if (!ignore) setError('Failed to load crew profiles');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [filters.q, filters.risk, filters.status]);

  useEffect(() => {
    if (!selectedId) return;
    let ignore = false;
    const load = async () => {
      setProfileLoading(true);
      try {
        const data = await getCrewProfile(selectedId);
        if (!ignore) {
          setSelectedProfile(data);
          setActiveTab('overview');
        }
      } catch (err) {
        console.error('getCrewProfile error', err);
        if (!ignore) setSelectedProfile(null);
      } finally {
        if (!ignore) setProfileLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return crew.filter((item) => {
      if (filters.risk !== 'all' && item.riskLevel !== filters.risk) return false;
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (!needle) return true;
      const haystack = `${item.fullName} ${item.crewId} ${item.email} ${item.position} ${item.department}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [crew, filters]);

  const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Emergency Officer')}&background=e63946&color=fff`;

  const openDetail = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedId(null);
    setSelectedProfile(null);
    setActiveTab('overview');
  };

  return (
    <div className="dashboard-container emergency-dashboard">
      <style>{`
        .crew-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:24px; align-items:stretch; }
        .crew-card { display:flex; flex-direction:column; padding:22px; border-radius:16px; border:1px solid #f5ccd1; background:#fff; box-shadow:0 16px 28px rgba(230,57,70,0.08); transition:transform .2s ease, box-shadow .2s ease; }
        .crew-card:hover { transform:translateY(-6px); box-shadow:0 22px 36px rgba(230,57,70,0.14); }
        .crew-card-header { display:flex; align-items:center; gap:16px; margin-bottom:18px; }
        .crew-avatar { width:60px; height:60px; border-radius:18px; object-fit:cover; box-shadow:0 6px 12px rgba(0,0,0,0.08); }
        .crew-heading { display:flex; flex-direction:column; gap:4px; }
        .crew-name { font-size:18px; font-weight:700; color:#343a40; }
        .crew-position { font-size:13px; color:#6c757d; }
        .crew-card-body { flex:1; display:flex; flex-direction:column; gap:18px; }
        .crew-meta { display:grid; grid-template-columns:repeat(2, minmax(110px, 1fr)); gap:12px; }
        .crew-meta-item { background:#fff7f7; border-radius:12px; padding:12px; font-size:13px; color:#495057; border:1px solid #fde1e5; }
        .crew-meta-label { display:block; font-size:11px; letter-spacing:0.5px; text-transform:uppercase; color:#b98991; margin-bottom:6px; }
        .crew-risk { display:flex; justify-content:space-between; align-items:center; }
        .crew-risk span { font-size:12px; color:#6c757d; }
        .risk-chip { display:inline-flex; align-items:center; padding:6px 12px; border-radius:999px; font-size:12px; font-weight:600; text-transform:capitalize; box-shadow:0 4px 8px rgba(0,0,0,0.05); }
        .risk-critical { background:rgba(230,57,70,0.15); color:#c32835; }
        .risk-elevated { background:rgba(244,162,97,0.18); color:#b5632e; }
        .risk-stable { background:rgba(42,157,143,0.18); color:#1c7d6d; }
        .crew-card-footer { display:flex; gap:12px; margin-top:24px; }
        .crew-card-footer .btn { flex:1; display:inline-flex; justify-content:center; align-items:center; padding:12px 0; border-radius:999px; font-size:13px; font-weight:600; letter-spacing:0.3px; }
        .crew-view-btn { background:linear-gradient(135deg, #e63946 0%, #b3202c 100%); border:none; color:#fff; box-shadow:0 10px 18px rgba(230,57,70,0.25); }
        .crew-view-btn:hover { box-shadow:0 14px 24px rgba(230,57,70,0.32); transform:translateY(-1px); }
        .crew-action-secondary { background:#fff; color:#b3202c; border:1px solid #f3c2c5; }
        .crew-action-secondary:hover { background:#fff0f1; }
        .profile-section { margin-top:32px; }
        .info-list { list-style:none; padding:0; margin:0; }
        .info-list li { padding:10px 0; border-bottom:1px solid #f1d4d6; display:flex; justify-content:space-between; font-size:14px; color:#495057; }
        .info-list li:last-child { border-bottom:none; }
        .records-table { width:100%; border-collapse:collapse; }
        .records-table th, .records-table td { padding:12px 14px; border-bottom:1px solid #f1d4d6; text-align:left; font-size:13px; color:#495057; }
        .records-table th { background:#fff0f1; font-weight:600; color:#b3202c; }
        .scroll-container { max-height:320px; overflow-y:auto; border:1px solid #f6dfe1; border-radius:12px; }
        .detail-modal { position:fixed; inset:0; background:rgba(17,24,39,0.52); display:flex; justify-content:center; align-items:center; padding:32px; z-index:999; backdrop-filter:blur(4px); }
        .detail-card { position:relative; background:#fff; border-radius:22px; width:min(960px, 95vw); max-height:90vh; overflow:hidden; box-shadow:0 30px 60px rgba(15,23,42,0.28); display:flex; flex-direction:column; }
        .detail-header { padding:26px 32px; border-bottom:1px solid #f3c2c5; display:flex; justify-content:space-between; align-items:center; gap:20px; background:linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(255,240,241,0.8) 100%); }
        .detail-title { display:flex; flex-direction:column; gap:6px; }
        .detail-title h3 { margin:0; font-size:24px; font-weight:700; color:#b3202c; }
        .detail-subtitle { font-size:13px; color:#6c757d; letter-spacing:0.3px; }
        .detail-close { background:transparent; border:none; color:#b3202c; font-size:18px; cursor:pointer; padding:8px; }
        .detail-body { padding:28px 32px; overflow-y:auto; }
        .detail-pill-row { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px; }
        .detail-pill { background:#fff7f7; border:1px solid #fde1e5; border-radius:14px; padding:12px 18px; font-size:13px; font-weight:600; color:#b3202c; display:flex; align-items:center; gap:8px; box-shadow:0 8px 16px rgba(255,189,199,0.25); }
        .detail-columns { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:24px; }
        .detail-card-section { background:#fff7f7; border:1px solid #fde1e5; border-radius:16px; padding:20px; }
        .detail-card-section h4 { margin:0 0 12px; font-size:16px; font-weight:600; color:#c32835; }
        .detail-info-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; font-size:13px; color:#495057; }
        .detail-info-item { display:flex; justify-content:space-between; gap:12px; }
        .detail-info-item span:first-child { font-weight:600; color:#c32835; }
        .detail-tabs { display:flex; gap:18px; margin:26px 0 16px; border-bottom:1px solid #f3c2c5; }
        .detail-tab { padding:10px 2px; font-size:13px; font-weight:600; color:#b98991; cursor:pointer; border-bottom:3px solid transparent; text-transform:uppercase; letter-spacing:0.4px; }
        .detail-tab.active { color:#b3202c; border-color:#b3202c; }
        .latest-summary { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:16px; margin-top:16px; }
        .latest-tile { background:#fff; border:1px dashed #f3c2c5; border-radius:14px; padding:16px; font-size:13px; color:#495057; }
        .latest-tile span { display:block; font-weight:600; color:#b3202c; margin-bottom:6px; }
        @media (max-width: 768px) {
          .detail-card { padding-bottom:16px; }
          .detail-body { padding:22px 20px; }
        }
      `}</style>

      <EmergencySidebar onLogout={() => navigate('/')} />

      <div className="main-content">
        <div className="dash-header">
          <h2>Crew Health Profiles</h2>
          <div className="user-info">
            <img src={userAvatar} alt="Emergency Officer" />
            <div>
              <div>{user?.fullName || 'Emergency Officer'}</div>
              <small>{user?.vessel || 'MV Ocean Explorer'}</small>
            </div>
            <div className="status-badge status-active">On Duty</div>
          </div>
        </div>

        <section className="panel">
          <div className="form-grid">
            <div className="form-group">
              <label>Search crew</label>
              <input
                className="form-control"
                placeholder="Search by name, crew ID, position..."
                value={filters.q}
                onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Risk level</label>
              <select
                className="form-control"
                value={filters.risk}
                onChange={(e) => setFilters((prev) => ({ ...prev, risk: e.target.value }))}
              >
                {RISK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Account status</label>
              <select
                className="form-control"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="error-message" style={{ marginTop: 12 }}>{error}</div>}
        </section>

        <section className="panel">
          <div className="section-header">
            <div className="section-title">Crew Overview</div>
            <div className="section-subtitle">{loading ? 'Loading crew roster…' : `${filtered.length} crew members`}</div>
          </div>
          {loading ? (
            <div className="empty"><div className="desc">Loading crew profiles...</div></div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="title">No crew members found</div>
              <div className="desc">Adjust search or filters to broaden results.</div>
            </div>
          ) : (
            <div className="crew-grid">
              {filtered.map((c) => {
                const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.fullName || 'Crew')}&background=e63946&color=fff`;
                return (
                  <div key={c.id || c.crewId} className="crew-card">
                    <div className="crew-card-header">
                      <img src={avatar} alt={c.fullName} className="crew-avatar" />
                      <div className="crew-heading">
                        <div className="crew-name">{c.fullName}</div>
                        <div className="crew-position">{c.position || 'Role not set'}</div>
                      </div>
                    </div>
                    <div className="crew-card-body">
                      <div className="crew-meta">
                        <div className="crew-meta-item">
                          <span className="crew-meta-label">Crew ID</span>
                          <span>{c.crewId || '—'}</span>
                        </div>
                        <div className="crew-meta-item">
                          <span className="crew-meta-label">Department</span>
                          <span>{c.department || '—'}</span>
                        </div>
                        <div className="crew-meta-item">
                          <span className="crew-meta-label">Blood Group</span>
                          <span>{c.bloodGroup || 'Unknown'}</span>
                        </div>
                        <div className="crew-meta-item">
                          <span className="crew-meta-label">Records</span>
                          <span>{c.recordCount ?? 0}</span>
                        </div>
                      </div>
                      <div className="crew-risk">
                        <span>Risk assessment</span>
                        <span className={`risk-chip risk-${c.riskLevel || 'stable'}`}>{riskLabel(c.riskLevel)}</span>
                      </div>
                    </div>
                    <div className="crew-card-footer">
                      <button className="btn crew-view-btn" onClick={() => openDetail(c.crewId || c.id)}>
                        <i className="fas fa-eye" /> View
                      </button>
                      <button className="btn crew-action-secondary" onClick={() => openDetail(c.crewId || c.id)}>
                        <i className="fas fa-heartbeat" /> Monitor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {detailOpen && (
          <div className="detail-modal" onClick={closeDetail}>
            <div className="detail-card" onClick={(e) => e.stopPropagation()}>
              <div className="detail-header">
                <div className="detail-title">
                  <h3>{selectedProfile?.personal?.fullName || 'Crew Member'}</h3>
                  <div className="detail-subtitle">
                    {selectedProfile?.personal?.crewId ? `Crew ID ${selectedProfile.personal.crewId}` : 'No Crew ID'}
                    {selectedProfile?.personal?.department ? ` • ${selectedProfile.personal.department}` : ''}
                  </div>
                </div>
                <button className="detail-close" onClick={closeDetail} aria-label="Close detail">
                  <i className="fas fa-times" />
                </button>
              </div>

              <div className="detail-body">
                {profileLoading ? (
                  <div className="empty"><div className="desc">Fetching crew details…</div></div>
                ) : !selectedProfile ? (
                  <div className="empty"><div className="desc">Unable to load crew information.</div></div>
                ) : (
                  <>
                    <div className="detail-pill-row">
                      <div className="detail-pill"><i className="fas fa-heartbeat" /> Risk: {riskLabel(selectedProfile.medical?.riskLevel)}</div>
                      <div className="detail-pill"><i className="fas fa-notes-medical" /> Records: {selectedProfile.medical?.recordCount ?? 0}</div>
                      <div className="detail-pill"><i className="fas fa-user-clock" /> Status: {statusLabel(selectedProfile.personal?.status)}</div>
                      {selectedProfile.personal?.age !== null && selectedProfile.personal?.age !== undefined && (
                        <div className="detail-pill"><i className="fas fa-birthday-cake" /> Age: {selectedProfile.personal.age}</div>
                      )}
                    </div>

                    <div className="detail-columns">
                      <div className="detail-card-section">
                        <h4>Personal Information</h4>
                        <ul className="detail-info-list">
                          <li className="detail-info-item"><span>Full Name</span><span>{selectedProfile.personal?.fullName || '—'}</span></li>
                          <li className="detail-info-item"><span>Crew ID</span><span>{selectedProfile.personal?.crewId || '—'}</span></li>
                          <li className="detail-info-item"><span>Role</span><span>{selectedProfile.personal?.role || '—'}</span></li>
                          <li className="detail-info-item"><span>Department</span><span>{selectedProfile.personal?.department || '—'}</span></li>
                          <li className="detail-info-item"><span>Vessel</span><span>{selectedProfile.personal?.vessel || '—'}</span></li>
                          <li className="detail-info-item"><span>Nationality</span><span>{selectedProfile.personal?.nationality || '—'}</span></li>
                          <li className="detail-info-item"><span>Gender</span><span>{selectedProfile.personal?.gender || '—'}</span></li>
                        </ul>
                      </div>

                      <div className="detail-card-section">
                        <h4>Medical Information</h4>
                        <ul className="detail-info-list">
                          <li className="detail-info-item"><span>Blood Group</span><span>{selectedProfile.medical?.bloodGroup || 'Unknown'}</span></li>
                          <li className="detail-info-item"><span>Risk Level</span><span>{riskLabel(selectedProfile.medical?.riskLevel)}</span></li>
                          <li className="detail-info-item"><span>Emergency Contact</span><span>{selectedProfile.medical?.emergencyContact?.name ? `${selectedProfile.medical.emergencyContact.name}${selectedProfile.medical.emergencyContact.phone ? ' • ' + selectedProfile.medical.emergencyContact.phone : ''}` : '—'}</span></li>
                          <li className="detail-info-item"><span>Total Records</span><span>{selectedProfile.medical?.recordCount ?? 0}</span></li>
                        </ul>
                      </div>
                    </div>

                    <div className="detail-tabs">
                      {['overview', 'records'].map((tab) => (
                        <div
                          key={tab}
                          className={`detail-tab ${activeTab === tab ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab === 'overview' ? 'Overview' : 'Medical Records'}
                        </div>
                      ))}
                    </div>

                    {activeTab === 'overview' && (
                      <div>
                        <div className="detail-card-section" style={{ borderStyle: 'dashed', marginBottom: 24 }}>
                          <h4>Latest Medical Summary</h4>
                          {selectedProfile.medical?.latestRecord ? (
                            <div className="latest-summary">
                              <div className="latest-tile"><span>Date</span>{selectedProfile.medical.latestRecord.date || '—'}</div>
                              <div className="latest-tile"><span>Type</span>{selectedProfile.medical.latestRecord.recordType || '—'}</div>
                              <div className="latest-tile"><span>Condition</span>{selectedProfile.medical.latestRecord.condition || '—'}</div>
                              <div className="latest-tile"><span>Notes</span>{selectedProfile.medical.latestRecord.notes || 'No notes recorded.'}</div>
                            </div>
                          ) : (
                            <div className="empty"><div className="desc">No recent medical records available.</div></div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'records' && (
                      <div className="detail-card-section" style={{ background:'#fff', borderColor:'#f3c2c5' }}>
                        <h4>Medical Record History</h4>
                        {selectedProfile.timeline?.records?.length ? (
                          <div className="scroll-container">
                            <table className="records-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Type</th>
                                  <th>Condition</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProfile.timeline.records.map((rec) => (
                                  <tr key={rec.id}>
                                    <td>{rec.date || '—'}</td>
                                    <td>{rec.recordType || '—'}</td>
                                    <td>{rec.condition || '—'}</td>
                                    <td>{rec.notes ? rec.notes.slice(0, 100) + (rec.notes.length > 100 ? '…' : '') : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty"><div className="desc">No records logged yet.</div></div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
