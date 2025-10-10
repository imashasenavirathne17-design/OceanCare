import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthMental() {
  const navigate = useNavigate();
  const user = getUser();

  // Tabs: observations | sessions | resources
  const [tab, setTab] = useState('observations');
  const [newSessionOpen, setNewSessionOpen] = useState(false);

  const onLogout = () => { clearSession(); navigate('/login'); };

  useEffect(() => {
    if (newSessionOpen) {
      const input = document.getElementById('sessionDate');
      if (input) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        input.value = now.toISOString().slice(0, 16);
      }
    }
  }, [newSessionOpen]);

  // Stub handlers
  const viewDetails = (id) => alert(`Viewing details for observation ID: ${id}`);
  const scheduleSession = (id) => { setNewSessionOpen(true); };
  const editObservation = (id) => alert(`Editing observation ID: ${id}`);
  const viewSession = (id) => alert(`Viewing session ID: ${id}`);
  const editSession = (id) => alert(`Editing session ID: ${id}`);

  const submitSession = (e) => {
    e.preventDefault();
    alert('Counseling session recorded successfully!');
    setNewSessionOpen(false);
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Mental Health Observations</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Wellness Overview */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Crew Mental Wellness Overview</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-file-export"></i> Export Data</button>
                <button className="btn btn-mental" onClick={() => setNewSessionOpen(true)}><i className="fas fa-plus"></i> New Session</button>
              </div>
            </div>

            <div className="wellness-container">
              <div className="wellness-item">
                <div className="wellness-value">78%</div>
                <div className="wellness-label">Overall Wellness Score</div>
              </div>
              <div className="wellness-item">
                <div className="wellness-value">5</div>
                <div className="wellness-label">Under Observation</div>
              </div>
              <div className="wellness-item">
                <div className="wellness-value">12</div>
                <div className="wellness-label">Sessions This Month</div>
              </div>
              <div className="wellness-item">
                <div className="wellness-value">2</div>
                <div className="wellness-label">High Risk Cases</div>
              </div>
            </div>

            <div className="scale-container">
              <div className="scale-header">
                <div className="scale-title">Crew Stress Levels</div>
                <div>Average: Moderate</div>
              </div>
              <div className="scale-bar">
                <div className="scale-fill" style={{ width: '65%' }}></div>
              </div>
              <div className="scale-labels">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Severe</span>
              </div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Mental Health Management</div>
            </div>

            <div className="tabs">
              <div className={`tab ${tab === 'observations' ? 'active' : ''}`} onClick={() => setTab('observations')} role="button" tabIndex={0}>Observations</div>
              <div className={`tab ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')} role="button" tabIndex={0}>Counseling Sessions</div>
              <div className={`tab ${tab === 'resources' ? 'active' : ''}`} onClick={() => setTab('resources')} role="button" tabIndex={0}>Resources</div>
            </div>

            {/* Observations Tab */}
            {tab === 'observations' && (
              <div className="tab-content active" id="observations-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search crew or observations..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Status</option>
                      <option>Under Observation</option>
                      <option>Referred</option>
                      <option>Resolved</option>
                    </select>
                    <select className="filter-select">
                      <option>All Risk Levels</option>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card urgent">
                    <div className="card-header">
                      <div className="card-title">High Risk Case</div>
                      <div className="card-icon danger"><i className="fas fa-exclamation-triangle"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">Robert Kim (CD12350)</div>
                      <div className="card-details">Anger management issues, isolation</div>
                      <div className="card-details">Last observation: 2023-10-22</div>
                      <div className="card-risk risk-high">High Risk - Requires immediate attention</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => viewDetails(1)}>View Details</button>
                      <button className="btn btn-outline btn-sm" onClick={() => scheduleSession(1)}>Schedule Session</button>
                    </div>
                  </div>

                  <div className="card warning">
                    <div className="card-header">
                      <div className="card-title">Moderate Concern</div>
                      <div className="card-icon warning"><i className="fas fa-eye"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">Michael Brown (CD12349)</div>
                      <div className="card-details">Anxiety, Sleep disturbances</div>
                      <div className="card-details">Last observation: 2023-10-20</div>
                      <div className="card-risk risk-medium">Medium Risk - Monitor closely</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => viewDetails(2)}>View Details</button>
                      <button className="btn btn-outline btn-sm" onClick={() => scheduleSession(2)}>Schedule Session</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Stable Case</div>
                      <div className="card-icon mental"><i className="fas fa-brain"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">Lisa Chen (CD12348)</div>
                      <div className="card-details">Homesickness, Mild depression</div>
                      <div className="card-details">Last observation: 2023-10-15</div>
                      <div className="card-risk risk-low">Low Risk - Regular monitoring</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => viewDetails(3)}>View Details</button>
                      <button className="btn btn-outline btn-sm" onClick={() => scheduleSession(3)}>Schedule Session</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Observation Date</th>
                        <th>Concerns</th>
                        <th>Risk Level</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Robert Kim (CD12350)</td>
                        <td>2023-10-22</td>
                        <td>Anger management issues, isolation from crew</td>
                        <td><span className="status-badge status-danger">High</span></td>
                        <td><span className="status-badge status-mental">Referred to Specialist</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewDetails(1)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editObservation(1)}>Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Michael Brown (CD12349)</td>
                        <td>2023-10-20</td>
                        <td>Anxiety, Sleep disturbances</td>
                        <td><span className="status-badge status-warning">Medium</span></td>
                        <td><span className="status-badge status-mental">Under Observation</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewDetails(2)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editObservation(2)}>Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Lisa Chen (CD12348)</td>
                        <td>2023-10-15</td>
                        <td>Homesickness, Mild depression</td>
                        <td><span className="status-badge status-active">Low</span></td>
                        <td><span className="status-badge status-mental">Under Observation</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewDetails(3)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editObservation(3)}>Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>James Wilson (CD12347)</td>
                        <td>2023-10-10</td>
                        <td>Work-related stress</td>
                        <td><span className="status-badge status-active">Low</span></td>
                        <td><span className="status-badge status-mental">Resolved</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewDetails(4)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editObservation(4)}>Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sessions Tab */}
            {tab === 'sessions' && (
              <div className="tab-content active" id="sessions-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search sessions..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Sessions</option>
                      <option>Individual</option>
                      <option>Group</option>
                      <option>Crisis</option>
                    </select>
                    <select className="filter-select">
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Last 6 Months</option>
                      <option>All Time</option>
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Patient</th>
                        <th>Session Type</th>
                        <th>Duration</th>
                        <th>Focus Areas</th>
                        <th>Health Officer</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2023-10-24</td>
                        <td>Michael Brown</td>
                        <td>Individual</td>
                        <td>45 min</td>
                        <td>Anxiety management, Sleep hygiene</td>
                        <td>Dr. Johnson</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewSession(1)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editSession(1)}>Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>2023-10-22</td>
                        <td>Robert Kim</td>
                        <td>Crisis</td>
                        <td>60 min</td>
                        <td>Anger management, Conflict resolution</td>
                        <td>Dr. Johnson</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewSession(2)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editSession(2)}>Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>2023-10-20</td>
                        <td>Lisa Chen</td>
                        <td>Individual</td>
                        <td>30 min</td>
                        <td>Homesickness, Coping strategies</td>
                        <td>Dr. Johnson</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewSession(3)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editSession(3)}>Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>2023-10-18</td>
                        <td>Group Session</td>
                        <td>Group</td>
                        <td>90 min</td>
                        <td>Stress management, Team building</td>
                        <td>Dr. Johnson</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewSession(4)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editSession(4)}>Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {tab === 'resources' && (
              <div className="tab-content active" id="resources-tab">
                <div className="page-header"><div className="page-title">Mental Health Resources</div></div>
                <div className="resources-grid">
                  {[
                    { icon: 'fas fa-book', title: 'Coping Strategies Guide', desc: 'Practical techniques for managing stress and anxiety during long voyages' },
                    { icon: 'fas fa-hand-holding-heart', title: 'Crisis Intervention Protocol', desc: 'Step-by-step guide for mental health emergencies' },
                    { icon: 'fas fa-users', title: 'Group Session Materials', desc: 'Templates and activities for mental wellness groups' },
                    { icon: 'fas fa-phone-alt', title: 'Emergency Contacts', desc: '24/7 mental health support lines and resources' },
                  ].map((r, i) => (
                    <div key={i} className="resource-card">
                      <div className="resource-icon"><i className={r.icon}></i></div>
                      <div className="resource-title">{r.title}</div>
                      <div className="resource-desc">{r.desc}</div>
                      <button className="btn btn-outline btn-sm">Open</button>
                    </div>
                  ))}
                </div>

                <div className="page-content" style={{ marginTop: 30 }}>
                  <div className="page-header"><div className="page-title">Self-Assessment Tools</div></div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Assessment Tool</th>
                          <th>Purpose</th>
                          <th>Last Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>PHQ-9 Depression Scale</td>
                          <td>Screen for depression severity</td>
                          <td>2023-09-15</td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm">Use Tool</button>
                            <button className="btn btn-outline btn-sm">View Guide</button>
                          </td>
                        </tr>
                        <tr>
                          <td>GAD-7 Anxiety Scale</td>
                          <td>Measure anxiety symptoms</td>
                          <td>2023-08-22</td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm">Use Tool</button>
                            <button className="btn btn-outline btn-sm">View Guide</button>
                          </td>
                        </tr>
                        <tr>
                          <td>PSS Stress Scale</td>
                          <td>Assess perceived stress levels</td>
                          <td>2023-10-01</td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm">Use Tool</button>
                            <button className="btn btn-outline btn-sm">View Guide</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Session Modal */}
      {newSessionOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setNewSessionOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3 className="modal-title">Record New Counseling Session</h3>
              <button className="close-modal" onClick={() => setNewSessionOpen(false)}>&times;</button>
            </div>
            <form onSubmit={submitSession} id="sessionForm">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sessionPatient">Crew Member *</label>
                  <select id="sessionPatient" className="form-control" required defaultValue="">
                    <option value="">Select crew member</option>
                    <option value="CD12345">John Doe (CD12345)</option>
                    <option value="CD12346">Maria Rodriguez (CD12346)</option>
                    <option value="CD12347">James Wilson (CD12347)</option>
                    <option value="CD12348">Lisa Chen (CD12348)</option>
                    <option value="CD12349">Michael Brown (CD12349)</option>
                    <option value="CD12350">Robert Kim (CD12350)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="sessionType">Session Type *</label>
                  <select id="sessionType" className="form-control" required defaultValue="">
                    <option value="">Select type</option>
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                    <option value="crisis">Crisis Intervention</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="sessionDate">Session Date *</label>
                  <input type="datetime-local" id="sessionDate" className="form-control" required />
                </div>
                <div className="form-group">
                  <label htmlFor="sessionDuration">Duration (minutes) *</label>
                  <input type="number" id="sessionDuration" className="form-control" min="15" max="180" defaultValue={45} required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sessionFocus">Focus Areas *</label>
                <textarea id="sessionFocus" className="form-control" rows={3} placeholder="Primary issues discussed and focus areas..." required></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="sessionNotes">Session Notes</label>
                <textarea id="sessionNotes" className="form-control" rows={4} placeholder="Detailed notes from the session..."></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="sessionRecommendations">Recommendations & Follow-up</label>
                <textarea id="sessionRecommendations" className="form-control" rows={3} placeholder="Recommendations and next steps..."></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="sessionAssessment">Risk Assessment</label>
                <select id="sessionAssessment" className="form-control" defaultValue="low">
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setNewSessionOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-mental" style={{ flex: 1 }}>Save Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
