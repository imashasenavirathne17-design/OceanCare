import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';
import { listExaminations, saveExamination, updateExamination, deleteExamination, listCrewMembers } from '../../lib/healthApi';

export default function HealthExamination() {
  const navigate = useNavigate();
  const user = getUser();
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
  const UPLOADS_BASE = API_BASE.replace(/\/api$/, '') + '/uploads/exams/';

  const [activeTab, setActiveTab] = useState('upcoming');
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewExamId, setViewExamId] = useState(null);

  // Filters
  const [queryUpcoming, setQueryUpcoming] = useState('');
  const [typeUpcoming, setTypeUpcoming] = useState('All Types');
  const [statusUpcoming, setStatusUpcoming] = useState('All Status');
  const [queryCompleted, setQueryCompleted] = useState('');
  const [rangeCompleted, setRangeCompleted] = useState('Last 30 Days');

  // API-driven data
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crewOptions, setCrewOptions] = useState([]);
  const crewNameById = useMemo(() => {
    const m = {};
    (crewOptions || []).forEach((c) => { if (c?.crewId) m[c.crewId] = c.fullName || ''; });
    return m;
  }, [crewOptions]);

  const typeLabel = (v) => {
    const m = {
      'routine': 'Routine Check-up',
      'pre-voyage': 'Pre-Voyage',
      'post-treatment': 'Post-Treatment Follow-up',
      'chronic': 'Chronic Condition Review',
      'emergency': 'Emergency Examination',
    };
    return m[v] || v || '—';
  };

  const mapExamToUpcomingRow = (e) => ({
    id: e._id,
    crew: `${e.crewId}`,
    type: typeLabel(e.examType),
    date: new Date(e.examDate).toLocaleString(),
    status: e.status || 'Scheduled',
    priority: e.priority || 'Medium',
    raw: e,
  });
  const mapExamToCompletedRow = (e) => ({
    id: e._id,
    crew: `${e.crewId}`,
    type: typeLabel(e.examType),
    date: new Date(e.examDate).toISOString().slice(0, 10),
    findings: e.findings || '—',
    officer: e.createdByName || '—',
    raw: e,
  });

  const loadExams = async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const data = await listExaminations(params);
      const upcomingList = (data || []).filter((d) => d.status !== 'Completed');
      const completedList = (data || []).filter((d) => d.status === 'Completed');
      setUpcoming(upcomingList.map(mapExamToUpcomingRow));
      setCompleted(completedList.map(mapExamToCompletedRow));
    } catch (e) {
      setError('Failed to load examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExams(); }, []);

  // Reload from backend when filters change
  useEffect(() => {
    if (activeTab === 'upcoming') {
      const q = queryUpcoming.trim();
      const status = statusUpcoming === 'All Status' ? undefined : statusUpcoming;
      const type = typeUpcoming === 'All Types' ? undefined : queryUpcoming ? undefined : undefined; // keep type filtering client label-free
      loadExams({ q: q || undefined, status });
    } else if (activeTab === 'completed') {
      const q = queryCompleted.trim();
      // Date range mapping
      let from, to;
      const today = new Date();
      if (rangeCompleted === 'Last 7 Days') {
        const d = new Date(); d.setDate(d.getDate() - 7); from = d.toISOString(); to = today.toISOString();
      } else if (rangeCompleted === 'Last 30 Days') {
        const d = new Date(); d.setDate(d.getDate() - 30); from = d.toISOString(); to = today.toISOString();
      } else if (rangeCompleted === 'Last 3 Months') {
        const d = new Date(); d.setMonth(d.getMonth() - 3); from = d.toISOString(); to = today.toISOString();
      }
      loadExams({ q: q || undefined, status: 'Completed', from, to });
    }
  }, [activeTab, queryUpcoming, statusUpcoming, typeUpcoming, queryCompleted, rangeCompleted]);

  // Load crew directory for select
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listCrewMembers('');
        if (!mounted) return;
        setCrewOptions(Array.isArray(data) ? data : (data?.items || []));
      } catch (_) {
        // ignore; keep list empty on failure
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredUpcoming = upcoming.filter((u) => {
    const q = queryUpcoming.trim().toLowerCase();
    const matchesQ = !q || u.crew.toLowerCase().includes(q) || u.type.toLowerCase().includes(q);
    const matchesType = typeUpcoming === 'All Types' || u.type === typeUpcoming;
    const matchesStatus = statusUpcoming === 'All Status' || u.status === statusUpcoming;
    return matchesQ && matchesType && matchesStatus;
  });

  const filteredCompleted = completed.filter((c) => {
    const q = queryCompleted.trim().toLowerCase();
    return !q || c.crew.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.findings.toLowerCase().includes(q);
  });

  // Modal form state
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultDateTime = now.toISOString().slice(0, 16);
  const [form, setForm] = useState({ crewId: '', examType: '', examDate: defaultDateTime, reason: '', vitals: { temp: '', bp: '', hr: '', spo2: '' }, findings: '', recommendations: '', files: [] });

  const onLogout = () => { clearSession(); navigate('/login'); };
  const openExam = (prefillCrewId) => {
    setForm((f) => ({ ...f, crewId: prefillCrewId || f.crewId }));
    setExamModalOpen(true);
  };
  const closeExam = () => setExamModalOpen(false);

  const handleFormChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const handleVitalsChange = (key, value) => setForm((f) => ({ ...f, vitals: { ...f.vitals, [key]: value } }));

  const startExam = async (id) => {
    try {
      await updateExamination(id, { status: 'In Progress' });
      await loadExams();
    } catch (e) {
      alert('Failed to start exam');
    }
  };
  const rescheduleExam = async (id) => {
    const addHours = 48;
    const row = upcoming.find((x) => x.id === id);
    const base = row?.raw?.examDate ? new Date(row.raw.examDate) : new Date();
    base.setHours(base.getHours() + addHours);
    try {
      await updateExamination(id, { examDate: base.toISOString() });
      await loadExams();
    } catch (e) {
      alert('Failed to reschedule');
    }
  };
  const viewExam = (id) => { setViewExamId(id); setViewOpen(true); };
  const editExam = (id) => {
    const r = [...upcoming, ...completed].find((x) => x.id === id)?.raw;
    if (r) {
      setForm({
        id: r._id,
        crewId: r.crewId || '',
        examType: r.examType || '',
        examDate: r.examDate ? new Date(r.examDate).toISOString().slice(0,16) : defaultDateTime,
        reason: r.reason || '',
        vitals: { temp: r.vitals?.temp || '', bp: r.vitals?.bp || '', hr: r.vitals?.hr || '', spo2: r.vitals?.spo2 || '' },
        findings: r.findings || '',
        recommendations: r.recommendations || '',
        files: [],
      });
      setExamModalOpen(true);
    } else {
      openExam();
    }
  };

  const submitExam = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        crewId: form.crewId,
        examType: form.examType,
        examDate: form.examDate,
        reason: form.reason,
        temp: form.vitals?.temp,
        bp: form.vitals?.bp,
        hr: form.vitals?.hr,
        spo2: form.vitals?.spo2,
        findings: form.findings,
        recommendations: form.recommendations,
      };
      if (form.id) {
        await updateExamination(form.id, payload, []);
      } else {
        await saveExamination(payload, form.files || []);
      }
      await loadExams();
      alert('Examination saved successfully');
      setExamModalOpen(false);
      setForm({ crewId: '', examType: '', examDate: defaultDateTime, reason: '', vitals: { temp: '', bp: '', hr: '', spo2: '' }, findings: '', recommendations: '', files: [] });
    } catch (err) {
      alert('Failed to save examination');
    }
  };

  const removeExam = async (id) => {
    if (!confirm('Delete this examination?')) return;
    try {
      await deleteExamination(id);
      await loadExams();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <HealthSidebar onLogout={onLogout} />

        {/* Main Content */}
        <main className="main-content">
          <style>{`
            /* Scoped styles for neat tables on this page */
            .health-dashboard .search-box input::placeholder { color: #9aa3af; opacity: 1; font-weight: 500; }
            .health-dashboard .search-box input::-webkit-input-placeholder { color: #9aa3af; opacity: 1; font-weight: 500; }
            .health-dashboard .search-box input:-ms-input-placeholder { color: #9aa3af; opacity: 1; font-weight: 500; }
            .health-dashboard table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
            .health-dashboard thead th { font-weight: 600; color: #4b5563; padding: 8px 12px; }
            .health-dashboard tbody td { background: #fff; padding: 12px; vertical-align: middle; border-top: 1px solid #f0f2f5; border-bottom: 1px solid #f0f2f5; }
            .health-dashboard tbody tr td:first-child { border-left: 1px solid #f0f2f5; border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
            .health-dashboard tbody tr td:last-child { border-right: 1px solid #f0f2f5; border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
            .health-dashboard .crew-cell { display: flex; flex-direction: column; max-width: 260px; }
            .health-dashboard .crew-cell .name { font-weight: 600; color: #111827; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .health-dashboard .crew-cell .id { color: #6b7280; font-size: 12px; line-height: 1.2; margin-top: 2px; }
            .health-dashboard td.nowrap, .health-dashboard th.nowrap { white-space: nowrap; }
            .health-dashboard .action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
          `}</style>
          <div className="header">
            <h2>Medical Examinations</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName}</div>
                <small>Health Officer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Crew Medical Examinations</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-calendar"></i> Schedule Exam</button>
                <button className="btn btn-primary" onClick={() => openExam()}><i className="fas fa-plus"></i> New Examination</button>
              </div>
            </div>

            <div className="tabs">
              <div className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming Exams</div>
              <div className={`tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>Completed Exams</div>
              <div className={`tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>Exam Templates</div>
            </div>

            {/* Upcoming */}
            {activeTab === 'upcoming' && (
              <div className="tab-content active" id="upcoming-tab">
                <div className="search-filter" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap' }}>
                  <div className="search-box" style={{ flex: 1, minWidth: 260, maxWidth: 420, display: 'flex', alignItems: 'center' }}>
                    <input type="text" placeholder="Search by crew name or exam type..." value={queryUpcoming} onChange={(e) => setQueryUpcoming(e.target.value)} />
                  </div>
                  <select className="filter-select" value={typeUpcoming} onChange={(e) => setTypeUpcoming(e.target.value)} style={{ width: 180, flex: '0 0 auto' }}>
                    <option>All Types</option>
                    <option>Routine Check-up</option>
                    <option>Pre-Voyage</option>
                    <option>Post-Treatment Follow-up</option>
                    <option>Chronic Condition Review</option>
                  </select>
                  <select className="filter-select" value={statusUpcoming} onChange={(e) => setStatusUpcoming(e.target.value)} style={{ width: 180, flex: '0 0 auto' }}>
                    <option>All Status</option>
                    <option>Scheduled</option>
                    <option>In Progress</option>
                    <option>Overdue</option>
                  </select>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Exam Type</th>
                        <th>Scheduled Date</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUpcoming.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div>{crewNameById[u.raw?.crewId] || '—'}</div>
                            <small style={{ color: '#777' }}>{u.raw?.crewId || u.crew}</small>
                          </td>
                          <td>{u.type}</td>
                          <td>{u.date}</td>
                          <td>
                            {u.status === 'Overdue' ? (
                              <span style={{ color: 'var(--danger)' }}>Overdue</span>
                            ) : (
                              <span className="status-badge status-active">{u.status}</span>
                            )}

          {/* View Examination Modal */}
          {viewOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setViewOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Examination Details</h3>
                  <button className="close-modal" onClick={() => setViewOpen(false)}>&times;</button>
                </div>
                {(() => {
                  const rec = [...upcoming, ...completed].find((x) => x.id === viewExamId)?.raw || null;
                  if (!rec) return <div style={{ padding: 10 }}>Not found</div>;
                  return (
                    <div style={{ padding: 10 }}>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: 10 }}>Summary</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div><strong>Crew:</strong> {rec.crewId}</div>
                          <div><strong>Type:</strong> {typeLabel(rec.examType)}</div>
                          <div><strong>Date:</strong> {new Date(rec.examDate).toLocaleString()}</div>
                          <div><strong>Status:</strong> {rec.status}</div>
                          <div><strong>Priority:</strong> {rec.priority}</div>
                        </div>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: 10 }}>Vitals</h4>
                        <div>Temp: {rec.vitals?.temp || '—'}, BP: {rec.vitals?.bp || '—'}, HR: {rec.vitals?.hr || '—'}, SpO2: {rec.vitals?.spo2 || '—'}</div>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: 10 }}>Findings</h4>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{rec.findings || '—'}</div>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: 10 }}>Recommendations</h4>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{rec.recommendations || '—'}</div>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: 10 }}>Attachments</h4>
                        <ul>
                          {(rec.files || []).length === 0 && <li style={{ color: '#777' }}>No attachments</li>}
                          {(rec.files || []).map((f, i) => (
                            <li key={i}>
                              <a href={`${UPLOADS_BASE}${f.fileName}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                                {f.originalName || f.fileName}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-outline" onClick={() => setViewOpen(false)}>Close</button>
                        <button className="btn btn-primary" onClick={() => { setViewOpen(false); editExam(viewExamId); }}>Edit</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
                          </td>
                          <td>{u.priority}</td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm" onClick={() => startExam(u.id)}>Start</button>
                            <button className="btn btn-outline btn-sm" onClick={() => rescheduleExam(u.id)}>Reschedule</button>
                            <button className="btn btn-outline btn-sm" onClick={() => editExam(u.id)}>Edit</button>
                            <button className="btn btn-outline btn-sm" onClick={() => removeExam(u.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Completed */}
            {activeTab === 'completed' && (
              <div className="tab-content active" id="completed-tab">
                <div className="search-filter" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap' }}>
                  <div className="search-box" style={{ flex: 1, minWidth: 260, maxWidth: 420, display: 'flex', alignItems: 'center' }}>
                    <input type="text" placeholder="Search completed exams..." value={queryCompleted} onChange={(e) => setQueryCompleted(e.target.value)} />
                  </div>
                  <select className="filter-select" value={rangeCompleted} onChange={(e) => setRangeCompleted(e.target.value)} style={{ width: 200, flex: '0 0 auto' }}>
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Last 3 Months</option>
                    <option>All Time</option>
                  </select>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Exam Type</th>
                        <th>Exam Date</th>
                        <th>Findings</th>
                        <th>Health Officer</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompleted.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="crew-cell">
                              <div className="name">{crewNameById[c.raw?.crewId] || '—'}</div>
                              <div className="id">{c.raw?.crewId || c.crew}</div>
                            </div>
                          </td>
                          <td className="nowrap">{c.type}</td>
                          <td className="nowrap">{c.date}</td>
                          <td>{c.findings}</td>
                          <td className="nowrap">{c.officer}</td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm" onClick={() => viewExam(c.id)}>View</button>
                            <button className="btn btn-outline btn-sm" onClick={() => editExam(c.id)}>Edit</button>
                            <button className="btn btn-outline btn-sm" onClick={() => removeExam(c.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Templates */}
            {activeTab === 'templates' && (
              <div className="tab-content active" id="templates-tab">
                <div className="page-header">
                  <div className="page-title">Examination Templates</div>
                  <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => alert('Create new template')}><i className="fas fa-plus"></i> New Template</button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Template Name</th>
                        <th>Type</th>
                        <th>Last Modified</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Standard Pre-Voyage Assessment</td>
                        <td>Pre-Voyage</td>
                        <td>2023-09-15</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Use</button>
                          <button className="btn btn-outline btn-sm">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Chronic Condition Review</td>
                        <td>Chronic</td>
                        <td>2023-08-22</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Use</button>
                          <button className="btn btn-outline btn-sm">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Post-Treatment Follow-up</td>
                        <td>Follow-up</td>
                        <td>2023-10-01</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Use</button>
                          <button className="btn btn-outline btn-sm">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* New Examination Modal */}
          {examModalOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeExam()}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">New Medical Examination</h3>
                  <button className="close-modal" onClick={closeExam}>&times;</button>
                </div>
                <form onSubmit={submitExam}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="crewMember">Crew Member *</label>
                      <select id="crewMember" className="form-control" required value={form.crewId} onChange={(e) => handleFormChange('crewId', e.target.value)}>
                        <option value="">Select crew member</option>
                        {crewOptions.map((u) => (
                          <option key={u._id || u.crewId} value={u.crewId}>{`${u.fullName || u.email || u.crewId} (${u.crewId || 'N/A'})`}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="examType">Examination Type *</label>
                      <select id="examType" className="form-control" required value={form.examType} onChange={(e) => handleFormChange('examType', e.target.value)}>
                        <option value="">Select type</option>
                        <option value="routine">Routine Check-up</option>
                        <option value="pre-voyage">Pre-Voyage Assessment</option>
                        <option value="post-treatment">Post-Treatment Follow-up</option>
                        <option value="chronic">Chronic Condition Review</option>
                        <option value="emergency">Emergency Examination</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="examDate">Examination Date *</label>
                      <input type="datetime-local" id="examDate" className="form-control" required value={form.examDate} onChange={(e) => handleFormChange('examDate', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reason">Reason for Examination</label>
                    <textarea id="reason" className="form-control" rows={3} placeholder="Brief reason for this examination..." value={form.reason} onChange={(e) => handleFormChange('reason', e.target.value)}></textarea>
                  </div>

                  <h4 style={{ color: 'var(--primary)', margin: '20px 0 15px' }}>Vital Signs</h4>
                  <div className="vitals-grid">
                    <div className="vital-item">
                      <div className="vital-label">Temperature</div>
                      <input type="number" className="form-control" placeholder="°C" step="0.1" min="35" max="42" value={form.vitals.temp} onChange={(e) => handleVitalsChange('temp', e.target.value)} />
                    </div>
                    <div className="vital-item">
                      <div className="vital-label">Blood Pressure</div>
                      <input type="text" className="form-control" placeholder="Systolic/Diastolic" value={form.vitals.bp} onChange={(e) => handleVitalsChange('bp', e.target.value)} />
                    </div>
                    <div className="vital-item">
                      <div className="vital-label">Heart Rate</div>
                      <input type="number" className="form-control" placeholder="BPM" min="40" max="200" value={form.vitals.hr} onChange={(e) => handleVitalsChange('hr', e.target.value)} />
                    </div>
                    <div className="vital-item">
                      <div className="vital-label">Oxygen Saturation</div>
                      <input type="number" className="form-control" placeholder="%" min="70" max="100" value={form.vitals.spo2} onChange={(e) => handleVitalsChange('spo2', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="findings">Clinical Findings</label>
                    <textarea id="findings" className="form-control" rows={4} placeholder="Detailed clinical findings..." value={form.findings} onChange={(e) => handleFormChange('findings', e.target.value)}></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="recommendations">Recommendations</label>
                    <textarea id="recommendations" className="form-control" rows={3} placeholder="Treatment recommendations and follow-up..." value={form.recommendations} onChange={(e) => handleFormChange('recommendations', e.target.value)}></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="attachments">Attach Files</label>
                    <input type="file" id="attachments" className="form-control" multiple onChange={(e) => handleFormChange('files', Array.from(e.target.files || []))} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button type="button" className="btn btn-outline" onClick={closeExam} style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Examination</button>
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
