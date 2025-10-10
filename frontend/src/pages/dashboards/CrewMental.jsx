import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewMental() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };
  const useMocks = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true';

  // Tabs: selfcheck | sessions | resources
  const [tab, setTab] = useState('selfcheck');
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessment, setAssessment] = useState({ q1: '', q2: '', q3: '' });
  const [result, setResult] = useState(null);

  const [sessions] = useState([
    { id: 1, date: '2025-10-01 14:00', type: 'Individual', focus: 'Homesickness coping', officer: 'Dr. Johnson' },
    { id: 2, date: '2025-09-20 10:00', type: 'Group', focus: 'Stress management workshop', officer: 'Dr. Johnson' },
  ]);

  useEffect(() => {
    // no-op for now
  }, []);

  const startAssessment = () => { setAssessment({ q1: '', q2: '', q3: '' }); setResult(null); setAssessmentOpen(true); };
  const closeAssessment = () => setAssessmentOpen(false);
  const onAssessChange = (e) => setAssessment((a) => ({ ...a, [e.target.name]: e.target.value }));
  const submitAssessment = (e) => {
    e.preventDefault();
    const score = ['q1','q2','q3'].reduce((s,k)=> s + (Number(assessment[k]||0)), 0);
    let level = 'Low';
    if (score >= 6) level = 'High';
    else if (score >= 3) level = 'Moderate';
    setResult({ score, level });
  };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Mental Health</h2>
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
              background: '#f0f5ff', border: '1px solid #adc6ff', color: '#1d39c4',
              padding: '10px 12px', borderRadius: 8, marginBottom: 12
            }}>
              Mock mode enabled. Data shown below is sample content while backend is offline.
            </div>
          )}

          {/* Overview */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div className="card" style={{ padding: 12, borderRadius: 8, flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12, color: '#777' }}>Wellness (self-assessed)</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{result?.level || '—'}</div>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8, flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12, color: '#777' }}>Sessions Attended</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{sessions.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 12 }}>
            <div className={`tab ${tab==='selfcheck'?'active':''}`} onClick={()=>setTab('selfcheck')}>Self-Check</div>
            <div className={`tab ${tab==='sessions'?'active':''}`} onClick={()=>setTab('sessions')}>My Sessions</div>
            <div className={`tab ${tab==='resources'?'active':''}`} onClick={()=>setTab('resources')}>Resources</div>
          </div>

          {/* Self-check tab */}
          {tab === 'selfcheck' && (
            <section className="health-check-form">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h3 className="form-title">Mental Health Self-Assessment</h3>
                <button className="btn btn-primary" onClick={startAssessment}><i className="fas fa-clipboard-check" style={{ marginRight: 6 }}></i> Start Assessment</button>
              </div>
              {result && (
                <div style={{ marginTop: 10 }}>
                  <div><strong>Score:</strong> {result.score}</div>
                  <div><strong>Level:</strong> {result.level}</div>
                  <div style={{ fontSize: 14, color: '#777', marginTop: 6 }}>
                    This informal self-check is not a diagnosis. If you feel distressed or your score is Moderate/High, please contact the Health Officer.
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Sessions tab */}
          {tab === 'sessions' && (
            <section className="health-records">
              <h3 className="form-title">Your Counseling Sessions</h3>
              {sessions.length === 0 ? (
                <div className="empty"><div className="desc">No sessions found.</div></div>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Focus</th>
                        <th>Officer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id}>
                          <td>{s.date}</td>
                          <td>{s.type}</td>
                          <td>{s.focus}</td>
                          <td>{s.officer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Resources tab */}
          {tab === 'resources' && (
            <section className="health-check-form">
              <h3 className="form-title">Resources & Self-help</h3>
              <div className="cards-container" style={{ marginTop: 6 }}>
                {[ 
                  { icon: 'fas fa-book', title: 'Coping Strategies', desc: 'Techniques for stress and anxiety during voyages' },
                  { icon: 'fas fa-moon', title: 'Sleep Hygiene', desc: 'Improve sleep quality with practical tips' },
                  { icon: 'fas fa-users', title: 'Peer Support', desc: 'Connect with trusted peers and mentors' },
                  { icon: 'fas fa-phone-alt', title: 'Emergency Contacts', desc: '24/7 support lines and on-board contacts' },
                ].map((r, i) => (
                  <div key={i} className="card">
                    <div className="card-header">
                      <div className="card-title">{r.title}</div>
                      <div className="card-icon mental"><i className={r.icon}></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-details">{r.desc}</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Open</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Self-Assessment Modal */}
          {assessmentOpen && (
            <div className="modal" onClick={(e) => e.target.classList.contains('modal') && closeAssessment()}>
              <div className="modal-content" style={{ maxWidth: 650 }}>
                <div className="modal-header">
                  <h3 className="modal-title">Mental Health Self-Assessment</h3>
                  <button className="close-modal" onClick={closeAssessment}>&times;</button>
                </div>
                <form onSubmit={submitAssessment}>
                  <div className="form-group">
                    <label>Over the last 2 weeks, how often have you felt down, depressed, or hopeless?</label>
                    <select name="q1" className="form-control" value={assessment.q1} onChange={onAssessChange} required>
                      <option value="">Select</option>
                      <option value="0">Not at all</option>
                      <option value="1">Several days</option>
                      <option value="2">More than half the days</option>
                      <option value="3">Nearly every day</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Over the last 2 weeks, how often have you felt anxious or on edge?</label>
                    <select name="q2" className="form-control" value={assessment.q2} onChange={onAssessChange} required>
                      <option value="">Select</option>
                      <option value="0">Not at all</option>
                      <option value="1">Several days</option>
                      <option value="2">More than half the days</option>
                      <option value="3">Nearly every day</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Over the last 2 weeks, how often have you had trouble sleeping?</label>
                    <select name="q3" className="form-control" value={assessment.q3} onChange={onAssessChange} required>
                      <option value="">Select</option>
                      <option value="0">Not at all</option>
                      <option value="1">Several days</option>
                      <option value="2">More than half the days</option>
                      <option value="3">Nearly every day</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn" onClick={closeAssessment} style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>See Result</button>
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

