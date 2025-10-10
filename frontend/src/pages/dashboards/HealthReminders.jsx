import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthReminders() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('medication');
  const [newReminderOpen, setNewReminderOpen] = useState(false);
  const [reminderType, setReminderType] = useState('');

  const onLogout = () => { clearSession(); navigate('/login'); };

  useEffect(() => {
    // Set default follow-up date to today in modal when opened
    if (newReminderOpen) {
      const input = document.getElementById('followupDate');
      if (input) input.valueAsDate = new Date();
    }
  }, [newReminderOpen]);

  // Stub actions
  const markAsTaken = (id) => alert(`Medication marked as taken for reminder ID: ${id}`);
  const snoozeReminder = (id) => alert(`Reminder ID: ${id} snoozed`);
  const logUsage = (id) => alert(`Logging usage for reminder ID: ${id}`);
  const editReminder = (id) => alert(`Editing reminder ID: ${id}`);
  const scheduleFollowup = (id) => alert(`Rescheduling follow-up ID: ${id}`);
  const completeFollowup = (id) => alert(`Marking follow-up ID: ${id} as complete`);

  const submitNewReminder = (e) => {
    e.preventDefault();
    alert('Reminder created successfully!');
    setNewReminderOpen(false);
    setReminderType('');
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        {/* Main Content */}
        <main className="main-content">
          <div className="header">
            <h2>Medication & Follow-up Reminders</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Medication & Follow-up Reminders</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-bell-slash"></i> Dismiss All</button>
                <button className="btn btn-primary" onClick={() => setNewReminderOpen(true)}><i className="fas fa-plus"></i> New Reminder</button>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <div className={`tab ${activeTab === 'medication' ? 'active' : ''}`} onClick={() => setActiveTab('medication')} role="button" tabIndex={0}>Medication</div>
              <div className={`tab ${activeTab === 'followup' ? 'active' : ''}`} onClick={() => setActiveTab('followup')} role="button" tabIndex={0}>Follow-up</div>
              <div className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} role="button" tabIndex={0}>Settings</div>
            </div>

            {/* Medication Tab */}
            {activeTab === 'medication' && (
              <div className="tab-content active" id="medication-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search medications or patients..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Status</option>
                      <option>Pending</option>
                      <option>Completed</option>
                      <option>Missed</option>
                    </select>
                    <select className="filter-select">
                      <option>Today</option>
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>All</option>
                    </select>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card urgent">
                    <div className="card-header">
                      <div className="card-title">Missed Medication</div>
                      <div className="card-icon danger"><i className="fas fa-pills"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">John Doe (CD12345)</div>
                      <div className="card-details">Lisinopril 10mg - Daily</div>
                      <div className="card-details">Last taken: 2023-10-24</div>
                      <div className="card-due overdue">MISSED: Today, 08:00</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => markAsTaken(1)}>Mark as Taken</button>
                      <button className="btn btn-outline btn-sm" onClick={() => snoozeReminder(1)}>Snooze</button>
                    </div>
                  </div>

                  <div className="card warning">
                    <div className="card-header">
                      <div className="card-title">Due Soon</div>
                      <div className="card-icon warning"><i className="fas fa-clock"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">Maria Rodriguez (CD12346)</div>
                      <div className="card-details">Metformin 500mg - Twice Daily</div>
                      <div className="card-details">Last taken: Today, 08:00</div>
                      <div className="card-due today">DUE: Today, 20:00</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => markAsTaken(2)}>Mark as Taken</button>
                      <button className="btn btn-outline btn-sm" onClick={() => snoozeReminder(2)}>Snooze 1hr</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Regular Medication</div>
                      <div className="card-icon primary"><i className="fas fa-prescription-bottle"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">James Wilson (CD12347)</div>
                      <div className="card-details">Ventolin Inhaler - As Needed</div>
                      <div className="card-details">Last used: 2023-10-23</div>
                      <div className="card-due">No fixed schedule</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => logUsage(3)}>Log Usage</button>
                      <button className="btn btn-outline btn-sm" onClick={() => editReminder(3)}>Edit</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Schedule</th>
                        <th>Next Due</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>John Doe (CD12345)</td>
                        <td>Lisinopril</td>
                        <td>10mg</td>
                        <td>Daily</td>
                        <td>Today, 08:00</td>
                        <td><span className="status-badge status-danger">Missed</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => markAsTaken(1)}>Mark Done</button>
                          <button className="btn btn-outline btn-sm" onClick={() => snoozeReminder(1)}>Snooze</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Maria Rodriguez (CD12346)</td>
                        <td>Metformin</td>
                        <td>500mg</td>
                        <td>Twice Daily</td>
                        <td>Today, 20:00</td>
                        <td><span className="status-badge status-active">Pending</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => markAsTaken(2)}>Mark Done</button>
                          <button className="btn btn-outline btn-sm" onClick={() => snoozeReminder(2)}>Snooze</button>
                        </td>
                      </tr>
                      <tr>
                        <td>James Wilson (CD12347)</td>
                        <td>Ventolin Inhaler</td>
                        <td>2 puffs</td>
                        <td>As Needed</td>
                        <td>-</td>
                        <td><span className="status-badge status-active">Active</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => logUsage(3)}>Log Usage</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(3)}>Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Lisa Chen (CD12348)</td>
                        <td>Levothyroxine</td>
                        <td>50mcg</td>
                        <td>Daily</td>
                        <td>Tomorrow, 07:00</td>
                        <td><span className="status-badge status-active">Scheduled</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => markAsTaken(4)}>Mark Done</button>
                          <button className="btn btn-outline btn-sm" onClick={() => snoozeReminder(4)}>Snooze</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Follow-up Tab */}
            {activeTab === 'followup' && (
              <div className="tab-content active" id="followup-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search follow-ups..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Types</option>
                      <option>Chronic Review</option>
                      <option>Post-Treatment</option>
                      <option>Vaccination</option>
                      <option>Mental Health</option>
                    </select>
                    <select className="filter-select">
                      <option>All Status</option>
                      <option>Upcoming</option>
                      <option>Overdue</option>
                      <option>Completed</option>
                    </select>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card urgent">
                    <div className="card-header">
                      <div className="card-title">Overdue Follow-up</div>
                      <div className="card-icon danger"><i className="fas fa-exclamation-circle"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">John Doe (CD12345)</div>
                      <div className="card-details">Hypertension Review</div>
                      <div className="card-details">Scheduled: 2023-10-20</div>
                      <div className="card-due overdue">OVERDUE: 5 days</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(5)}>Reschedule</button>
                      <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(5)}>Mark Complete</button>
                    </div>
                  </div>

                  <div className="card warning">
                    <div className="card-header">
                      <div className="card-title">Due Today</div>
                      <div className="card-icon warning"><i className="fas fa-calendar-day"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">Maria Rodriguez (CD12346)</div>
                      <div className="card-details">Diabetes Monitoring</div>
                      <div className="card-details">Last check: 2023-10-18</div>
                      <div className="card-due today">DUE: Today</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(6)}>Reschedule</button>
                      <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(6)}>Mark Complete</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Upcoming Follow-up</div>
                      <div className="card-icon primary"><i className="fas fa-calendar-check"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">James Wilson (CD12347)</div>
                      <div className="card-details">Asthma Control Check</div>
                      <div className="card-details">Last check: 2023-10-15</div>
                      <div className="card-due">DUE: 2023-10-30</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(7)}>Reschedule</button>
                      <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(7)}>Mark Complete</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Follow-up Type</th>
                        <th>Scheduled Date</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>John Doe (CD12345)</td>
                        <td>Hypertension Review</td>
                        <td>2023-10-20</td>
                        <td><span className="status-badge status-danger">Overdue</span></td>
                        <td>High</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(5)}>Reschedule</button>
                          <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(5)}>Complete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Maria Rodriguez (CD12346)</td>
                        <td>Diabetes Monitoring</td>
                        <td>2023-10-25</td>
                        <td><span className="status-badge status-warning">Due Today</span></td>
                        <td>High</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(6)}>Reschedule</button>
                          <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(6)}>Complete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>James Wilson (CD12347)</td>
                        <td>Asthma Control Check</td>
                        <td>2023-10-30</td>
                        <td><span className="status-badge status-active">Scheduled</span></td>
                        <td>Medium</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(7)}>Reschedule</button>
                          <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(7)}>Complete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Lisa Chen (CD12348)</td>
                        <td>Thyroid Function Test</td>
                        <td>2023-11-05</td>
                        <td><span className="status-badge status-active">Scheduled</span></td>
                        <td>Medium</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(8)}>Reschedule</button>
                          <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(8)}>Complete</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="tab-content active" id="settings-tab">
                <div className="page-header">
                  <div className="page-title">Reminder Settings</div>
                </div>

                <div className="cards-container">
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Notification Preferences</div>
                      <div className="card-icon primary"><i className="fas fa-bell"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="form-group"><label><input type="checkbox" defaultChecked /> Email Notifications</label></div>
                      <div className="form-group"><label><input type="checkbox" defaultChecked /> Dashboard Alerts</label></div>
                      <div className="form-group"><label><input type="checkbox" /> SMS Notifications</label></div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-primary btn-sm">Save Preferences</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Alert Timing</div>
                      <div className="card-icon primary"><i className="fas fa-clock"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="form-group">
                        <label>Medication Reminder Lead Time</label>
                        <select className="form-control" defaultValue="2h">
                          <option value="15m">15 minutes before</option>
                          <option value="30m">30 minutes before</option>
                          <option value="1h">1 hour before</option>
                          <option value="2h">2 hours before</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Follow-up Reminder Lead Time</label>
                        <select className="form-control" defaultValue="2d">
                          <option value="1d">1 day before</option>
                          <option value="2d">2 days before</option>
                          <option value="3d">3 days before</option>
                          <option value="1w">1 week before</option>
                        </select>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-primary btn-sm">Save Settings</button>
                    </div>
                  </div>
                </div>

                <div className="page-content">
                  <div className="page-header">
                    <div className="page-title">Auto-Reminder Rules</div>
                  </div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Condition</th>
                          <th>Reminder Type</th>
                          <th>Frequency</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Diabetes</td>
                          <td>Blood Glucose Check</td>
                          <td>Weekly</td>
                          <td><span className="status-badge status-active">Active</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm">Edit</button>
                            <button className="btn btn-outline btn-sm">Disable</button>
                          </td>
                        </tr>
                        <tr>
                          <td>Hypertension</td>
                          <td>Blood Pressure Check</td>
                          <td>Weekly</td>
                          <td><span className="status-badge status-active">Active</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm">Edit</button>
                            <button className="btn btn-outline btn-sm">Disable</button>
                          </td>
                        </tr>
                        <tr>
                          <td>Asthma</td>
                          <td>Peak Flow Measurement</td>
                          <td>Monthly</td>
                          <td><span className="status-badge status-active">Active</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm">Edit</button>
                            <button className="btn btn-outline btn-sm">Disable</button>
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

      {/* New Reminder Modal */}
      {newReminderOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setNewReminderOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Reminder</h3>
              <button className="close-modal" onClick={() => setNewReminderOpen(false)}>&times;</button>
            </div>
            <form onSubmit={submitNewReminder}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="reminderType">Reminder Type *</label>
                  <select id="reminderType" className="form-control" required value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
                    <option value="">Select type</option>
                    <option value="medication">Medication</option>
                    <option value="followup">Follow-up</option>
                    <option value="test">Medical Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reminderPatient">Patient *</label>
                  <select id="reminderPatient" className="form-control" required defaultValue="">
                    <option value="">Select patient</option>
                    <option value="CD12345">John Doe (CD12345)</option>
                    <option value="CD12346">Maria Rodriguez (CD12346)</option>
                    <option value="CD12347">James Wilson (CD12347)</option>
                    <option value="CD12348">Lisa Chen (CD12348)</option>
                  </select>
                </div>
              </div>

              {/* Medication fields */}
              {reminderType === 'medication' && (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="medicationName">Medication Name *</label>
                      <input type="text" id="medicationName" className="form-control" placeholder="e.g., Metformin" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="medicationDosage">Dosage *</label>
                      <input type="text" id="medicationDosage" className="form-control" placeholder="e.g., 500mg" required />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="medicationFrequency">Frequency *</label>
                      <select id="medicationFrequency" className="form-control" defaultValue="daily" required>
                        <option value="daily">Daily</option>
                        <option value="twice-daily">Twice Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="as-needed">As Needed</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="medicationTime">Time *</label>
                      <input type="time" id="medicationTime" className="form-control" required />
                    </div>
                  </div>
                </>
              )}

              {/* Follow-up fields */}
              {reminderType === 'followup' && (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="followupType">Follow-up Type *</label>
                      <input type="text" id="followupType" className="form-control" placeholder="e.g., Diabetes Review" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="followupDate">Date *</label>
                      <input type="date" id="followupDate" className="form-control" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="followupNotes">Notes</label>
                    <textarea id="followupNotes" className="form-control" rows={3} placeholder="Additional details..."></textarea>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="reminderNotes">Additional Notes</label>
                <textarea id="reminderNotes" className="form-control" rows={3} placeholder="Any additional information..."></textarea>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setNewReminderOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
