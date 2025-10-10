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
  const [editReminderOpen, setEditReminderOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingReminder, setDeletingReminder] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  const renderViewToggle = () => (
    <div
      className="view-toggle"
      style={{ display: 'flex', gap: '5px', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '2px' }}
    >
      <button
        className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => setViewMode('card')}
        style={{ padding: '6px 12px', fontSize: '14px' }}
        title="Card View"
        type="button"
      >
        <i className="fas fa-th-large"></i>
      </button>
      <button
        className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => setViewMode('table')}
        style={{ padding: '6px 12px', fontSize: '14px' }}
        title="Table View"
        type="button"
      >
        <i className="fas fa-list"></i>
      </button>
    </div>
  );

  const onLogout = () => { clearSession(); navigate('/login'); };

  useEffect(() => {
    // Set default follow-up date to today in modal when opened
    if (newReminderOpen) {
      const input = document.getElementById('followupDate');
      if (input) input.valueAsDate = new Date();
    }
  }, [newReminderOpen]);

  // Reminder actions
  const markAsTaken = (id) => alert(`Medication marked as taken for reminder ID: ${id}`);
  const snoozeReminderAction = (id) => alert(`Reminder ID: ${id} snoozed`);
  const logUsage = (id) => alert(`Logging usage for reminder ID: ${id}`);
  
  const editReminder = (id) => {
    // Find the reminder data (in real app, this would come from API)
    const reminderData = {
      id,
      type: 'medication',
      crewId: 'CD12345',
      crewName: 'John Doe',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      frequency: 'daily',
      time: '08:00'
    };
    setEditingReminder(reminderData);
    setReminderType(reminderData.type);
    setEditReminderOpen(true);
  };
  
  const deleteReminder = (id) => {
    setDeletingReminder(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    alert(`Reminder ID: ${deletingReminder} deleted successfully!`);
    setDeleteConfirmOpen(false);
    setDeletingReminder(null);
  };
  
  const scheduleFollowup = (id) => alert(`Rescheduling follow-up ID: ${id}`);
  const completeFollowup = (id) => alert(`Marking follow-up ID: ${id} as complete`);

  const submitNewReminder = (e) => {
    e.preventDefault();
    alert('Reminder created successfully!');
    setNewReminderOpen(false);
    setReminderType('');
  };
  
  const submitEditReminder = (e) => {
    e.preventDefault();
    alert('Reminder updated successfully!');
    setEditReminderOpen(false);
    setEditingReminder(null);
    setReminderType('');
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
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
            <h2>Health Reminders</h2>
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
              <div className="page-title">Health Reminders & Follow-ups</div>
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
                <div className="search-filter" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap' }}>
                  <div className="search-box" style={{ flex: 1, minWidth: 260, maxWidth: 420, display: 'flex', alignItems: 'center' }}>
                    <input type="text" placeholder="Search medications or patients..." />
                  </div>
                  <select className="filter-select" style={{ width: 180, flex: '0 0 auto' }}>
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Completed</option>
                    <option>Missed</option>
                  </select>
                  <select className="filter-select" style={{ width: 180, flex: '0 0 auto' }}>
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                    <option>All</option>
                  </select>
                  <div style={{ flex: '0 0 auto' }}>{renderViewToggle()}</div>
                </div>

                {/* Card View */}
                {viewMode === 'card' && (
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
                      <button className="btn btn-outline btn-sm" onClick={() => snoozeReminderAction(1)}>Snooze</button>
                      <button className="btn btn-outline btn-sm" onClick={() => editReminder(1)}>Edit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(1)}>Delete</button>
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
                )}

                {/* Table View */}
                {viewMode === 'table' && (
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
                        <td>
                          <div className="crew-cell">
                            <div className="name">John Doe</div>
                            <div className="id">CD12345</div>
                          </div>
                        </td>
                        <td className="nowrap">Lisinopril</td>
                        <td className="nowrap">10mg</td>
                        <td className="nowrap">Daily</td>
                        <td className="nowrap">Today, 08:00</td>
                        <td><span className="status-badge status-danger">Missed</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => markAsTaken(1)}>Mark Done</button>
                          <button className="btn btn-outline btn-sm" onClick={() => snoozeReminderAction(1)}>Snooze</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(1)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(1)}>Delete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="crew-cell">
                            <div className="name">Maria Rodriguez</div>
                            <div className="id">CD12346</div>
                          </div>
                        </td>
                        <td className="nowrap">Metformin</td>
                        <td className="nowrap">500mg</td>
                        <td className="nowrap">Twice Daily</td>
                        <td className="nowrap">Today, 20:00</td>
                        <td><span className="status-badge status-active">Pending</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => markAsTaken(2)}>Mark Done</button>
                          <button className="btn btn-outline btn-sm" onClick={() => snoozeReminderAction(2)}>Snooze</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(2)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(2)}>Delete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="crew-cell">
                            <div className="name">James Wilson</div>
                            <div className="id">CD12347</div>
                          </div>
                        </td>
                        <td className="nowrap">Ventolin Inhaler</td>
                        <td className="nowrap">2 puffs</td>
                        <td className="nowrap">As Needed</td>
                        <td className="nowrap">-</td>
                        <td><span className="status-badge status-active">Active</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => logUsage(3)}>Log Usage</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(3)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(3)}>Delete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="crew-cell">
                            <div className="name">Lisa Chen</div>
                            <div className="id">CD12348</div>
                          </div>
                        </td>
                        <td className="nowrap">Levothyroxine</td>
                        <td className="nowrap">50mcg</td>
                        <td className="nowrap">Daily</td>
                        <td className="nowrap">Tomorrow, 07:00</td>
                        <td><span className="status-badge status-active">Scheduled</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => markAsTaken(4)}>Mark Done</button>
                          <button className="btn btn-outline btn-sm" onClick={() => snoozeReminderAction(4)}>Snooze</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(4)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(4)}>Delete</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {/* Follow-up Tab */}
            {activeTab === 'followup' && (
              <div className="tab-content active" id="followup-tab">
                <div className="search-filter" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap' }}>
                  <div className="search-box" style={{ flex: 1, minWidth: 260, maxWidth: 420, display: 'flex', alignItems: 'center' }}>
                    <input type="text" placeholder="Search follow-ups..." />
                  </div>
                  <select className="filter-select" style={{ width: 180, flex: '0 0 auto' }}>
                    <option>All Types</option>
                    <option>Chronic Review</option>
                    <option>Post-Treatment</option>
                    <option>Vaccination</option>
                    <option>Mental Health</option>
                  </select>
                  <select className="filter-select" style={{ width: 180, flex: '0 0 auto' }}>
                    <option>All Status</option>
                    <option>Upcoming</option>
                    <option>Overdue</option>
                    <option>Completed</option>
                  </select>
                  <div style={{ flex: '0 0 auto' }}>{renderViewToggle()}</div>
                </div>

                {/* Card View */}
                {viewMode === 'card' && (
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
                )}

                {/* Table View */}
                {viewMode === 'table' && (
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
                        <td>
                          <div className="crew-cell">
                            <div className="name">John Doe</div>
                            <div className="id">CD12345</div>
                          </div>
                        </td>
                        <td className="nowrap">Hypertension Review</td>
                        <td className="nowrap">2023-10-20</td>
                        <td><span className="status-badge status-danger">Overdue</span></td>
                        <td className="nowrap">High</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(5)}>Reschedule</button>
                          <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(5)}>Complete</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(5)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(5)}>Delete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="crew-cell">
                            <div className="name">Maria Rodriguez</div>
                            <div className="id">CD12346</div>
                          </div>
                        </td>
                        <td className="nowrap">Diabetes Monitoring</td>
                        <td className="nowrap">2023-10-25</td>
                        <td><span className="status-badge status-warning">Due Today</span></td>
                        <td className="nowrap">High</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(6)}>Reschedule</button>
                          <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(6)}>Complete</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(6)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(6)}>Delete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="crew-cell">
                            <div className="name">James Wilson</div>
                            <div className="id">CD12347</div>
                          </div>
                        </td>
                        <td className="nowrap">Asthma Control Check</td>
                        <td className="nowrap">2023-10-30</td>
                        <td><span className="status-badge status-active">Scheduled</span></td>
                        <td className="nowrap">Medium</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(7)}>Reschedule</button>
                          <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(7)}>Complete</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(7)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(7)}>Delete</button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="crew-cell">
                            <div className="name">Lisa Chen</div>
                            <div className="id">CD12348</div>
                          </div>
                        </td>
                        <td className="nowrap">Thyroid Function Test</td>
                        <td className="nowrap">2023-11-05</td>
                        <td><span className="status-badge status-active">Scheduled</span></td>
                        <td className="nowrap">Medium</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => scheduleFollowup(8)}>Reschedule</button>
                          <button className="btn btn-outline btn-sm" onClick={() => completeFollowup(8)}>Complete</button>
                          <button className="btn btn-outline btn-sm" onClick={() => editReminder(8)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => deleteReminder(8)}>Delete</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                )}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

      {/* Edit Reminder Modal */}
      {editReminderOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setEditReminderOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Reminder</h3>
              <button className="close-modal" onClick={() => setEditReminderOpen(false)}>&times;</button>
            </div>
            <form onSubmit={submitEditReminder}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="editReminderType">Reminder Type *</label>
                  <select id="editReminderType" className="form-control" required value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
                    <option value="">Select type</option>
                    <option value="medication">Medication</option>
                    <option value="followup">Follow-up</option>
                    <option value="test">Medical Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editReminderPatient">Patient *</label>
                  <select id="editReminderPatient" className="form-control" required defaultValue={editingReminder?.crewId || ""}>
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
                      <label htmlFor="editMedicationName">Medication Name *</label>
                      <input type="text" id="editMedicationName" className="form-control" placeholder="e.g., Metformin" defaultValue={editingReminder?.medicationName || ""} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editMedicationDosage">Dosage *</label>
                      <input type="text" id="editMedicationDosage" className="form-control" placeholder="e.g., 500mg" defaultValue={editingReminder?.dosage || ""} required />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="editMedicationFrequency">Frequency *</label>
                      <select id="editMedicationFrequency" className="form-control" defaultValue={editingReminder?.frequency || "daily"} required>
                        <option value="daily">Daily</option>
                        <option value="twice-daily">Twice Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="as-needed">As Needed</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="editMedicationTime">Time *</label>
                      <input type="time" id="editMedicationTime" className="form-control" defaultValue={editingReminder?.time || ""} required />
                    </div>
                  </div>
                </>
              )}

              {/* Follow-up fields */}
              {reminderType === 'followup' && (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="editFollowupType">Follow-up Type *</label>
                      <input type="text" id="editFollowupType" className="form-control" placeholder="e.g., Diabetes Review" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editFollowupDate">Date *</label>
                      <input type="date" id="editFollowupDate" className="form-control" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editFollowupNotes">Notes</label>
                    <textarea id="editFollowupNotes" className="form-control" rows={3} placeholder="Additional details..."></textarea>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="editReminderNotes">Additional Notes</label>
                <textarea id="editReminderNotes" className="form-control" rows={3} placeholder="Any additional information..."></textarea>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditReminderOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setDeleteConfirmOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="close-modal" onClick={() => setDeleteConfirmOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p>Are you sure you want to delete this reminder?</p>
              <p style={{ color: '#dc3545', fontSize: '14px' }}>This action cannot be undone.</p>
              
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setDeleteConfirmOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete} style={{ flex: 1, backgroundColor: '#dc3545', borderColor: '#dc3545' }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
