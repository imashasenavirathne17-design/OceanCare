import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthExamination() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('upcoming');
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Stats
  const stats = useMemo(() => ([
    { icon: 'fas fa-calendar-check', value: 12, label: 'Scheduled Exams', bg: 'var(--primary)' },
    { icon: 'fas fa-clock', value: 5, label: 'Pending Results', bg: 'var(--warning)' },
    { icon: 'fas fa-exclamation-circle', value: 3, label: 'Overdue Exams', bg: 'var(--danger)' },
    { icon: 'fas fa-check-circle', value: 28, label: 'Completed This Month', bg: 'var(--success)' },
  ]), []);

  // Sample data
  const upcoming = useMemo(() => ([
    { id: 1, crew: 'John Doe (CD12345)', type: 'Routine Check-up', date: 'Oct 30, 2023', status: 'scheduled' },
    { id: 2, crew: 'Maria Rodriguez (CD12346)', type: 'Post-Treatment Follow-up', date: 'Oct 28, 2023', status: 'scheduled' },
    { id: 3, crew: 'James Wilson (CD12347)', type: 'Chronic Condition Review', date: 'Oct 25, 2023', status: 'overdue' },
    { id: 4, crew: 'Lisa Chen (CD12348)', type: 'Pre-Voyage Assessment', date: 'Nov 2, 2023', status: 'scheduled' },
  ]), []);

  const completed = useMemo(() => ([
    { id: 5, crew: 'Michael Brown (CD12349)', type: 'Respiratory Infection', date: 'Oct 20, 2023', findings: 'Mild infection, prescribed antibiotics' },
    { id: 6, crew: 'Anna Kowalski (CD12350)', type: 'Mental Health Assessment', date: 'Oct 18, 2023', findings: 'Anxiety symptoms, recommended counseling' },
    { id: 7, crew: 'Robert Smith (CD12351)', type: 'Injury Assessment', date: 'Oct 15, 2023', findings: 'Minor laceration, cleaned and dressed' },
  ]), []);

  // Forms state (minimal for demo)
  const [scheduleForm, setScheduleForm] = useState({ crew: '', type: '', date: '', time: '', notes: '' });
  const [examForm, setExamForm] = useState({ crew: 'John Doe (CD12345)', bp: '', hr: '', temp: '', rr: '', height: '', weight: '', findings: '', recs: '', files: [] });

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  // Modal helpers
  const openModal = (key) => {
    if (key === 'exam') setExamModalOpen(true);
    if (key === 'schedule') setScheduleModalOpen(true);
  };
  const closeModal = (key) => {
    if (key === 'exam') setExamModalOpen(false);
    if (key === 'schedule') setScheduleModalOpen(false);
  };

  // Actions
  const startExam = (id) => {
    setExamForm((f) => ({ ...f, crew: upcoming.find(u => u.id === id)?.crew || f.crew }));
    openModal('exam');
  };
  const rescheduleExam = (id) => {
    setScheduleForm((f) => ({ ...f, crew: upcoming.find(u => u.id === id)?.crew || f.crew }));
    openModal('schedule');
  };
  const viewExam = (id) => {
    alert(`Viewing examination details for ID: ${id}`);
  };
  const editExam = (id) => {
    setExamForm((f) => ({ ...f, crew: completed.find(c => c.id === id)?.crew || f.crew }));
    openModal('exam');
  };

  // Form handlers
  const onScheduleChange = (e) => setScheduleForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  const onExamChange = (e) => setExamForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  const onExamFiles = (e) => setExamForm((s) => ({ ...s, files: Array.from(e.target.files || []) }));

  const submitSchedule = (e) => {
    e.preventDefault();
    alert('Examination scheduled successfully!');
    setScheduleModalOpen(false);
  };

  const submitExam = (e) => {
    e.preventDefault();
    alert('Examination recorded successfully!');
    setExamModalOpen(false);
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Examination Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Examination Stats */}
          <section className="dashboard-stats">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: s.bg }}>
                  <i className={s.icon}></i>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Tabs */}
          <div className="dashboard-section">
            <div className="tabs">
              <div className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')} role="button" tabIndex={0}>Upcoming Examinations</div>
              <div className={`tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')} role="button" tabIndex={0}>Completed Examinations</div>
              <div className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')} role="button" tabIndex={0}>Schedule New Examination</div>
            </div>

            {/* Upcoming Tab */}
            {activeTab === 'upcoming' && (
              <div className="tab-content active" id="upcoming">
                <div className="section-header">
                  <div className="section-title">Upcoming Examinations</div>
                  <div className="section-actions">
                    <button className="btn btn-primary" onClick={() => openModal('schedule')}>
                      <i className="fas fa-plus"></i> Schedule New
                    </button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Exam Type</th>
                        <th>Scheduled Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map(u => (
                        <tr key={u.id}>
                          <td>{u.crew}</td>
                          <td>{u.type}</td>
                          <td>{u.date}</td>
                          <td>
                            <span className={`status-indicator ${u.status === 'overdue' ? 'status-overdue' : 'status-pending'}`}></span>
                            {u.status === 'overdue' ? ' Overdue' : ' Scheduled'}
                          </td>
                          <td>
                            <button className="btn btn-outline" onClick={() => startExam(u.id)}>Start Exam</button>{' '}
                            <button className="btn btn-outline" onClick={() => rescheduleExam(u.id)}>Reschedule</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Completed Tab */}
            {activeTab === 'completed' && (
              <div className="tab-content active" id="completed">
                <div className="section-header">
                  <div className="section-title">Completed Examinations</div>
                  <div className="section-actions">
                    <button className="btn btn-outline">
                      <i className="fas fa-download"></i> Export
                    </button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Exam Type</th>
                        <th>Exam Date</th>
                        <th>Findings</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completed.map(c => (
                        <tr key={c.id}>
                          <td>{c.crew}</td>
                          <td>{c.type}</td>
                          <td>{c.date}</td>
                          <td>{c.findings}</td>
                          <td>
                            <button className="btn btn-outline" onClick={() => viewExam(c.id)}>View</button>{' '}
                            <button className="btn btn-outline" onClick={() => editExam(c.id)}>Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="tab-content active" id="schedule">
                <div className="section-header">
                  <div className="section-title">Schedule New Examination</div>
                </div>
                <form onSubmit={submitSchedule}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Crew Member</label>
                      <select className="form-control" name="crew" value={scheduleForm.crew} onChange={onScheduleChange} required>
                        <option value="">Select crew member</option>
                        <option value="CD12345">John Doe (CD12345)</option>
                        <option value="CD12346">Maria Rodriguez (CD12346)</option>
                        <option value="CD12347">James Wilson (CD12347)</option>
                        <option value="CD12348">Lisa Chen (CD12348)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Examination Type</label>
                      <select className="form-control" name="type" value={scheduleForm.type} onChange={onScheduleChange} required>
                        <option value="">Select type</option>
                        <option value="routine">Routine Check-up</option>
                        <option value="pre_voyage">Pre-Voyage Assessment</option>
                        <option value="follow_up">Follow-up Examination</option>
                        <option value="chronic_review">Chronic Condition Review</option>
                        <option value="injury">Injury Assessment</option>
                        <option value="mental_health">Mental Health Assessment</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Scheduled Date</label>
                      <input type="date" className="form-control" name="date" value={scheduleForm.date} onChange={onScheduleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Scheduled Time</label>
                      <input type="time" className="form-control" name="time" value={scheduleForm.time} onChange={onScheduleChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea className="form-control" name="notes" rows={3} value={scheduleForm.notes} onChange={onScheduleChange} placeholder="Any special instructions or notes..."></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">Schedule Examination</button>
                </form>
              </div>
            )}
          </div>

          {/* Examination Calendar */}
          <div className="dashboard-section">
            <div className="section-header">
              <div className="section-title">Examination Calendar</div>
              <div className="section-actions">
                <button className="btn btn-outline">
                  <i className="fas fa-print"></i> Print Schedule
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginTop: 15 }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontWeight: 600, padding: 10, background: '#f8f9fa' }}>{d}</div>
              ))}
              {/* Static cells to match provided design */}
              {[22,23,24,'25*','26',27,'28*',29,'30*',31,1,'2*',3].map((v, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '15px 5px', border: '1px solid #eee' }}>
                  {String(v).replace('*','')}
                  {String(v).includes('25') && (
                    <div style={{ fontSize: 10, color: 'var(--danger)' }}>James Wilson</div>
                  )}
                  {String(v) === '28*' && (
                    <div style={{ fontSize: 10, color: 'var(--warning)' }}>Maria Rodriguez</div>
                  )}
                  {String(v) === '30*' && (
                    <div style={{ fontSize: 10, color: 'var(--info)' }}>John Doe</div>
                  )}
                  {String(v) === '2*' && (
                    <div style={{ fontSize: 10, color: 'var(--primary)' }}>Lisa Chen</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Exam Modal */}
          {examModalOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal('exam')}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Record Examination</h3>
                  <button className="close-modal" onClick={() => closeModal('exam')}>&times;</button>
                </div>
                <form onSubmit={submitExam}>
                  <div className="form-group">
                    <label className="form-label">Crew Member</label>
                    <input type="text" className="form-control" value={examForm.crew} readOnly />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Blood Pressure</label>
                      <input type="text" className="form-control" name="bp" value={examForm.bp} onChange={onExamChange} placeholder="e.g., 120/80" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Heart Rate (BPM)</label>
                      <input type="number" className="form-control" name="hr" value={examForm.hr} onChange={onExamChange} placeholder="e.g., 72" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Temperature (°C)</label>
                      <input type="number" step="0.1" className="form-control" name="temp" value={examForm.temp} onChange={onExamChange} placeholder="e.g., 36.6" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Respiratory Rate</label>
                      <input type="number" className="form-control" name="rr" value={examForm.rr} onChange={onExamChange} placeholder="Breaths per minute" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Height (cm)</label>
                      <input type="number" className="form-control" name="height" value={examForm.height} onChange={onExamChange} placeholder="e.g., 175" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weight (kg)</label>
                      <input type="number" step="0.1" className="form-control" name="weight" value={examForm.weight} onChange={onExamChange} placeholder="e.g., 70.5" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Examination Findings</label>
                    <textarea className="form-control" name="findings" rows={4} value={examForm.findings} onChange={onExamChange} placeholder="Detailed examination findings..."></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Recommendations</label>
                    <textarea className="form-control" name="recs" rows={3} value={examForm.recs} onChange={onExamChange} placeholder="Treatment recommendations, follow-up instructions..."></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Upload Files (Optional)</label>
                    <input type="file" className="form-control" multiple onChange={onExamFiles} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Examination</button>
                    <button type="button" className="btn btn-outline" onClick={() => closeModal('exam')} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Schedule Modal */}
          {scheduleModalOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal('schedule')}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Schedule Examination</h3>
                  <button className="close-modal" onClick={() => closeModal('schedule')}>&times;</button>
                </div>
                <form onSubmit={submitSchedule}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Crew Member</label>
                      <select className="form-control" name="crew" value={scheduleForm.crew} onChange={onScheduleChange} required>
                        <option value="">Select crew member</option>
                        <option value="CD12345">John Doe (CD12345)</option>
                        <option value="CD12346">Maria Rodriguez (CD12346)</option>
                        <option value="CD12347">James Wilson (CD12347)</option>
                        <option value="CD12348">Lisa Chen (CD12348)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Examination Type</label>
                      <select className="form-control" name="type" value={scheduleForm.type} onChange={onScheduleChange} required>
                        <option value="">Select type</option>
                        <option value="routine">Routine Check-up</option>
                        <option value="pre_voyage">Pre-Voyage Assessment</option>
                        <option value="follow_up">Follow-up Examination</option>
                        <option value="chronic_review">Chronic Condition Review</option>
                        <option value="injury">Injury Assessment</option>
                        <option value="mental_health">Mental Health Assessment</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Scheduled Date</label>
                      <input type="date" className="form-control" name="date" value={scheduleForm.date} onChange={onScheduleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Scheduled Time</label>
                      <input type="time" className="form-control" name="time" value={scheduleForm.time} onChange={onScheduleChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea className="form-control" name="notes" rows={3} value={scheduleForm.notes} onChange={onScheduleChange} placeholder="Any special instructions or notes..."></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Schedule Examination</button>
                    <button type="button" className="btn btn-outline" onClick={() => closeModal('schedule')} style={{ flex: 1 }}>Cancel</button>
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
