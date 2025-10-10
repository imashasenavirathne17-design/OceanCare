import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import { listVaccinations } from '../../lib/healthApi';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewVaccinations() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [vaccineFilter, setVaccineFilter] = useState('All Vaccines');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const useMocks = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listVaccinations('all');
        if (!mounted) return;
        const items = Array.isArray(data) ? data : (data?.items || []);
        setRows(items);
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load vaccinations');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const allVaccines = Array.from(new Set(rows.map(r => r.vaccine || r.name).filter(Boolean)));
  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    const vaccine = (r.vaccine || r.name || '').toLowerCase();
    const notes = (r.notes || '').toLowerCase();
    const status = (r.status || '').toLowerCase();
    const qOk = !q || vaccine.includes(q) || notes.includes(q);
    const vOk = vaccineFilter === 'All Vaccines' || (r.vaccine || r.name) === vaccineFilter;
    const sOk = statusFilter === 'All Status' || status === statusFilter.toLowerCase();
    return qOk && vOk && sOk;
  });

  const openDetails = (r) => { setSelected(r); setDetailsOpen(true); };
  const closeDetails = () => { setDetailsOpen(false); setSelected(null); };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Vaccinations</h2>
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
              background: '#fff7e6', border: '1px solid #ffd591', color: '#ad6800',
              padding: '10px 12px', borderRadius: 8, marginBottom: 12
            }}>
              Mock data enabled (VITE_USE_MOCKS=true). Showing sample vaccination records while backend is offline.
            </div>
          )}

          <section className="health-records">
            <h3 className="form-title">Your Vaccination Records</h3>
            {/* Overview */}
            {!loading && !error && rows.length > 0 && (
              <div className="overview" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div className="card" style={{ padding: 12, borderRadius: 8, flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 12, color: '#777' }}>Total Records</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{rows.length}</div>
                </div>
                <div className="card" style={{ padding: 12, borderRadius: 8, flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 12, color: '#777' }}>Up to Date</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{rows.filter(r => (r.status||'').toLowerCase()==='completed').length}</div>
                </div>
                <div className="card" style={{ padding: 12, borderRadius: 8, flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 12, color: '#777' }}>Due Soon</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{rows.filter(r => (r.status||'').toLowerCase()==='due-soon').length}</div>
                </div>
                <div className="card" style={{ padding: 12, borderRadius: 8, flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 12, color: '#777' }}>Overdue</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>{rows.filter(r => (r.status||'').toLowerCase()==='overdue').length}</div>
                </div>
              </div>
            )}

            {/* Filters */}
            {!loading && !error && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2, minWidth: 220 }}>
                  <i className="fas fa-search" style={{ color: '#999' }}></i>
                  <input className="form-control" placeholder="Search vaccine or notes..." value={query} onChange={(e)=>setQuery(e.target.value)} />
                </div>
                <select className="form-control" style={{ flex: 1, minWidth: 160 }} value={vaccineFilter} onChange={(e)=>setVaccineFilter(e.target.value)}>
                  <option>All Vaccines</option>
                  {allVaccines.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <select className="form-control" style={{ flex: 1, minWidth: 160 }} value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                  <option>All Status</option>
                  <option>Completed</option>
                  <option>Due-Soon</option>
                  <option>Overdue</option>
                </select>
              </div>
            )}

            {loading ? (
              <div className="empty"><div className="desc">Loading...</div></div>
            ) : error ? (
              <div className="empty"><div className="title" style={{ color: 'var(--danger)' }}>{error}</div></div>
            ) : filtered.length === 0 ? (
              <div className="empty">
                <div className="title">No vaccination records</div>
                <div className="desc">When vaccinations are recorded by the Health Officer, they will appear here.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Vaccine</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.vaccine || r.name || '—'}</td>
                        <td>
                          <span className={`chip ${r.status === 'completed' ? 'chip-success' : 'chip-info'}`}>
                            {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—'}
                          </span>
                        </td>
                        <td>{r.date || r.completedAt || r.scheduledAt || '—'}</td>
                        <td>{r.notes || '—'}</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => openDetails(r)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Details Modal */}
          {detailsOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeDetails()}>
              <div className="modal-content" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                  <h3 className="modal-title">Vaccination Details</h3>
                  <button className="close-modal" onClick={closeDetails}>&times;</button>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Vaccine</label>
                    <div>{selected?.vaccine || selected?.name || '—'}</div>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <div><span className={`chip ${String(selected?.status).toLowerCase()==='completed'?'chip-success':'chip-info'}`}>{selected?.status || '—'}</span></div>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <div>{selected?.date || selected?.completedAt || selected?.scheduledAt || '—'}</div>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <div>{selected?.notes || '—'}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, textAlign: 'right' }}>
                  <button className="btn btn-primary" onClick={closeDetails}>Close</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

