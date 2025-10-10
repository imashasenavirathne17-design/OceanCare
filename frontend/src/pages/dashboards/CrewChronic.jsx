import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewChronic() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };

  const useMocks = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true';

  // Sample personal chronic conditions (frontend-only)
  const [conditions, setConditions] = React.useState([
    { id: 1, name: 'Hypertension', diagnosed: '2023-01-12', lastReading: 'BP: 138/84', status: 'stable', notes: 'Continue Lisinopril 10mg daily' },
    { id: 2, name: 'Asthma', diagnosed: '2021-07-04', lastReading: 'Peak Flow: 420 L/min', status: 'stable', notes: 'Inhaler as needed' },
    { id: 3, name: 'Prediabetes', diagnosed: '2024-06-20', lastReading: 'Fasting BG: 112 mg/dL', status: 'needs-review', notes: 'Monitor diet and exercise' },
  ]);

  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');

  // Log reading modal
  const [logOpen, setLogOpen] = React.useState(false);
  const [targetId, setTargetId] = React.useState(null);
  const [form, setForm] = React.useState({ date: '', systolic: '', diastolic: '', peakFlow: '', glucose: '', weight: '', notes: '' });

  React.useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setForm((f) => ({ ...f, date: now.toISOString().slice(0, 16) }));
  }, []);

  const openLog = (id) => { setTargetId(id); setLogOpen(true); };
  const closeLog = () => { setLogOpen(false); setTargetId(null); };
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onSubmit = (e) => {
    e.preventDefault();
    // Update lastReading locally for the chosen condition based on provided fields
    setConditions((cs) => cs.map(c => {
      if (c.id !== targetId) return c;
      const parts = [];
      if (form.systolic && form.diastolic) parts.push(`BP: ${form.systolic}/${form.diastolic} mmHg`);
      if (form.peakFlow) parts.push(`Peak Flow: ${form.peakFlow} L/min`);
      if (form.glucose) parts.push(`Fasting BG: ${form.glucose} mg/dL`);
      if (form.weight) parts.push(`Weight: ${form.weight} kg`);
      const lr = parts.join(', ') || c.lastReading;
      return { ...c, lastReading: lr, status: c.status };
    }));
    closeLog();
  };

  const filtered = conditions.filter(c => {
    const q = query.trim().toLowerCase();
    const qOk = !q || c.name.toLowerCase().includes(q) || (c.notes||'').toLowerCase().includes(q);
    const sOk = statusFilter === 'All' || (statusFilter === 'Stable' && c.status === 'stable') || (statusFilter === 'Needs Review' && c.status === 'needs-review');
    return qOk && sOk;
  });

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Chronic Tracking</h2>
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
              background: '#f6ffed', border: '1px solid #b7eb8f', color: '#237804',
              padding: '10px 12px', borderRadius: 8, marginBottom: 12
            }}>
              Mock data enabled (VITE_USE_MOCKS=true). Showing sample chronic conditions while backend is offline.
            </div>
          )}

          <section className="health-check-form">
            <h3 className="form-title">Your Chronic Conditions</h3>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2, minWidth: 220 }}>
                <i className="fas fa-search" style={{ color: '#999' }}></i>
                <input className="form-control" placeholder="Search condition or notes..." value={query} onChange={(e)=>setQuery(e.target.value)} />
              </div>
              <select className="form-control" style={{ flex: 1, minWidth: 160 }} value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                <option>All</option>
                <option>Stable</option>
                <option>Needs Review</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <div className="title">No chronic entries</div>
                <div className="desc">Any chronic condition logs and recommendations will appear here.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Condition</th>
                      <th>Diagnosed</th>
                      <th>Last Reading</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.diagnosed}</td>
                        <td>{c.lastReading || '—'}</td>
                        <td>
                          <span className={`chip ${c.status === 'stable' ? 'chip-success' : 'chip-warning'}`}>
                            {c.status === 'stable' ? 'Stable' : 'Needs Review'}
                          </span>
                        </td>
                        <td>{c.notes || '—'}</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => openLog(c.id)}>Log Reading</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Log Reading Modal */}
          {logOpen && (
            <div className="modal" onClick={(e) => e.target.classList.contains('modal') && closeLog()}>
              <div className="modal-content" style={{ maxWidth: 650 }}>
                <div className="modal-header">
                  <h3 className="modal-title">Log Health Reading</h3>
                  <button className="close-modal" onClick={closeLog}>&times;</button>
                </div>
                <form onSubmit={onSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Date *</label>
                      <input name="date" type="datetime-local" className="form-control" value={form.date} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                      <label>BP Systolic</label>
                      <input name="systolic" type="number" className="form-control" placeholder="mmHg" value={form.systolic} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>BP Diastolic</label>
                      <input name="diastolic" type="number" className="form-control" placeholder="mmHg" value={form.diastolic} onChange={onChange} />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Peak Flow (L/min)</label>
                      <input name="peakFlow" type="number" className="form-control" value={form.peakFlow} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>Fasting Glucose (mg/dL)</label>
                      <input name="glucose" type="number" className="form-control" value={form.glucose} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input name="weight" type="number" className="form-control" step="0.1" value={form.weight} onChange={onChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea name="notes" className="form-control" rows={3} placeholder="Additional observations..." value={form.notes} onChange={onChange}></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button type="button" className="btn" onClick={closeLog} style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Reading</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

