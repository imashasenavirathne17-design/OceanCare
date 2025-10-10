import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import { listMyExaminations } from '../../lib/healthApi';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewExaminations() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const useMocks = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true';

  // UI state to match Health officer page style
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [queryUpcoming, setQueryUpcoming] = useState('');
  const [typeUpcoming, setTypeUpcoming] = useState('All Types');
  const [statusUpcoming, setStatusUpcoming] = useState('All Status');
  const [queryPast, setQueryPast] = useState('');
  const [rangePast, setRangePast] = useState('Last 30 Days');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listMyExaminations(user?.crewId);
        const items = Array.isArray(data) ? data : (data?.items || []);
        if (!mounted) return;
        const now = new Date();
        const u = [], p = [];
        items.forEach((it) => {
          const dateStr = it.date || it.scheduledAt || it.performedAt;
          const d = dateStr ? new Date(dateStr) : null;
          const status = String(it.status || '').toLowerCase();
          if (status !== 'completed' && d && d >= now) u.push(it);
          else p.push(it);
        });
        // Sort: upcoming by soonest, past by most recent
        u.sort((a,b)=> new Date(a.date||a.scheduledAt||0) - new Date(b.date||b.scheduledAt||0));
        p.sort((a,b)=> new Date(b.date||b.performedAt||0) - new Date(a.date||a.performedAt||0));
        setUpcoming(u);
        setPast(p);
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load examinations');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openDetails = (exam) => { setSelectedExam(exam); setDetailsOpen(true); };
  const closeDetails = () => { setDetailsOpen(false); setSelectedExam(null); };

  // Derive filter options from data
  const allTypes = Array.from(new Set([...upcoming, ...past].map((x) => x.type).filter(Boolean)));
  const allStatuses = Array.from(new Set([...upcoming, ...past].map((x) => x.status).filter(Boolean)));

  // Apply filters
  const upcomingFiltered = upcoming.filter((r) => {
    const q = queryUpcoming.trim().toLowerCase();
    const matchesQ = !q || (r.type || '').toLowerCase().includes(q) || (r.notes || '').toLowerCase().includes(q);
    const matchesType = typeUpcoming === 'All Types' || r.type === typeUpcoming;
    const matchesStatus = statusUpcoming === 'All Status' || r.status === statusUpcoming;
    return matchesQ && matchesType && matchesStatus;
  });

  const pastFiltered = past.filter((r) => {
    const q = queryPast.trim().toLowerCase();
    const matchesQ = !q || (r.type || '').toLowerCase().includes(q) || (r.notes || '').toLowerCase().includes(q);
    // very light date range filter for demo
    const d = new Date(r.date || r.performedAt || 0);
    const now = new Date();
    let inRange = true;
    if (rangePast === 'Last 7 Days') {
      const seven = new Date(now); seven.setDate(now.getDate() - 7); inRange = d >= seven;
    } else if (rangePast === 'Last 30 Days') {
      const thirty = new Date(now); thirty.setDate(now.getDate() - 30); inRange = d >= thirty;
    } else if (rangePast === 'Last 3 Months') {
      const three = new Date(now); three.setMonth(now.getMonth() - 3); inRange = d >= three;
    }
    return matchesQ && inRange;
  });

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Examinations</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
            </div>
          </div>

          {useMocks && (
            <div style={{
              background: '#e8f2ff',
              border: '1px solid #bcd4ff',
              color: '#1a4fb3',
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 12
            }}>
              Mock data enabled (VITE_USE_MOCKS=true). Showing sample examinations while backend is offline.
            </div>
          )}

          <section className="health-records">
            <h3 className="form-title">Scheduled and Past Examinations</h3>
            {loading ? (
              <div className="empty"><div className="desc">Loading...</div></div>
            ) : error ? (
              <div className="empty"><div className="title" style={{ color: 'var(--danger)' }}>{error}</div></div>
            ) : (
              <>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, margin: '6px 0 14px' }}>
                  <button className={`btn ${activeTab==='upcoming'?'btn-primary':'btn-outline'}`} onClick={() => setActiveTab('upcoming')}>Upcoming</button>
                  <button className={`btn ${activeTab==='past'?'btn-primary':'btn-outline'}`} onClick={() => setActiveTab('past')}>Completed</button>
                </div>

                {/* Upcoming tab */}
                {activeTab === 'upcoming' && (
                  <div>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                      <input className="form-control" style={{ flex: 2, minWidth: 220 }} placeholder="Search by type or notes..." value={queryUpcoming} onChange={(e)=>setQueryUpcoming(e.target.value)} />
                      <select className="form-control" style={{ flex: 1, minWidth: 160 }} value={typeUpcoming} onChange={(e)=>setTypeUpcoming(e.target.value)}>
                        <option>All Types</option>
                        {allTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                      </select>
                      <select className="form-control" style={{ flex: 1, minWidth: 160 }} value={statusUpcoming} onChange={(e)=>setStatusUpcoming(e.target.value)}>
                        <option>All Status</option>
                        {allStatuses.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>

                    {upcomingFiltered.length === 0 ? (
                      <div className="empty"><div className="desc">No upcoming examinations</div></div>
                    ) : (
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Notes</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {upcomingFiltered.map((r, idx) => (
                              <tr key={`u-${idx}`}>
                                <td>{r.type || '—'}</td>
                                <td>{r.date || r.scheduledAt || '—'}</td>
                                <td><span className={`chip chip-info`}>{r.status || 'Scheduled'}</span></td>
                                <td>{r.notes || '—'}</td>
                                <td>
                                  <button className="btn btn-outline btn-sm" onClick={() => openDetails(r)}>View</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Past tab */}
                {activeTab === 'past' && (
                  <div>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                      <input className="form-control" style={{ flex: 2, minWidth: 220 }} placeholder="Search completed exams..." value={queryPast} onChange={(e)=>setQueryPast(e.target.value)} />
                      <select className="form-control" style={{ flex: 1, minWidth: 160 }} value={rangePast} onChange={(e)=>setRangePast(e.target.value)}>
                        <option>Last 30 Days</option>
                        <option>Last 7 Days</option>
                        <option>Last 3 Months</option>
                        <option>All Time</option>
                      </select>
                    </div>

                    {pastFiltered.length === 0 ? (
                      <div className="empty"><div className="desc">No past examinations</div></div>
                    ) : (
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Notes</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pastFiltered.map((r, idx) => (
                              <tr key={`p-${idx}`}>
                                <td>{r.type || '—'}</td>
                                <td>{r.date || r.performedAt || '—'}</td>
                                <td><span className={`chip ${String(r.status).toLowerCase()==='completed'?'chip-success':'chip-info'}`}>{r.status || 'Completed'}</span></td>
                                <td>{r.notes || '—'}</td>
                                <td>
                                  <button className="btn btn-outline btn-sm" onClick={() => openDetails(r)}>View</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Details Modal */}
          {detailsOpen && (
            <div
              onClick={(e)=> e.currentTarget===e.target && closeDetails()}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            >
              <div style={{ background: '#fff', borderRadius: 10, width: 'min(720px, 92vw)', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                  <h3 style={{ margin: 0 }}>Examination Details</h3>
                  <button className="close-modal" onClick={closeDetails} style={{ fontSize: 20, background: 'transparent', border: 'none', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#666' }}>Type</div>
                      <div style={{ fontWeight: 600 }}>{selectedExam?.type || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#666' }}>Date</div>
                      <div style={{ fontWeight: 600 }}>{selectedExam?.date || selectedExam?.scheduledAt || selectedExam?.performedAt || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#666' }}>Status</div>
                      <div><span className={`chip ${String(selectedExam?.status||'').toLowerCase()==='completed'?'chip-success':'chip-info'}`}>{selectedExam?.status || '—'}</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#666' }}>Notes</div>
                      <div>{selectedExam?.notes || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

