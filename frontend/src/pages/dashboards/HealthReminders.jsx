import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';
import {
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder as deleteReminderApi,
  markReminderCompleted,
  snoozeReminder as snoozeReminderApi,
  rescheduleReminder,
  getReminderStatusDisplay,
  formatReminderTime
} from '../../lib/reminderApi';
import { listCrewMembers } from '../../lib/healthApi';

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

  const [medicationReminders, setMedicationReminders] = useState([]);
  const [followupReminders, setFollowupReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'all', dateRange: 'all' });
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [crewOptions, setCrewOptions] = useState([]);
  const [crewLoading, setCrewLoading] = useState(false);
  const [crewError, setCrewError] = useState('');
  const [newReminderData, setNewReminderData] = useState({ crewId: '', crewName: '' });

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

  const normalizeReminder = (reminder) => {
    const normalizeType = (value) => {
      const raw = (value || '').toString().toLowerCase().trim().replace(/[\s_-]+/g, ' ');
      if (raw.includes('medication') || raw.includes('medicine') || raw === 'med') return 'medication';
      if (raw.includes('follow')) return 'followup';
      return raw || 'medication';
    };

    const normalizedType = normalizeType(reminder.type);
    const statusDetails = getReminderStatusDisplay(reminder);
    return {
      ...reminder,
      id: reminder._id,
      type: normalizedType,
      statusLabel: statusDetails.label,
      statusClass: statusDetails.class,
      displayTime: formatReminderTime(reminder)
    };
  };

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { reminders = [], pagination: pageInfo } = await listReminders({
        type: 'all',
        q: filters.search,
        status: filters.status,
        dateRange: filters.dateRange,
        page: pagination.page,
        limit: pagination.limit
      });

      const normalized = reminders.map(normalizeReminder);
      setMedicationReminders(normalized.filter((reminder) => reminder.type === 'medication'));
      setFollowupReminders(normalized.filter((reminder) => reminder.type === 'followup'));
      if (pageInfo) {
        setPagination((prev) => ({ ...prev, ...pageInfo }));
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
      setError(err.message || 'Unable to load reminders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters.search, filters.status, filters.dateRange, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    if (newReminderOpen) {
      const input = document.getElementById('followupDate');
      if (input) input.valueAsDate = new Date();
      if (!crewOptions.length) {
        loadCrewMembers();
      }
      setNewReminderData({ crewId: '', crewName: '' });
    }
  }, [newReminderOpen]);

  const loadCrewMembers = useCallback(async (search = '') => {
    setCrewLoading(true);
    setCrewError('');
    try {
      const crew = await listCrewMembers(search);
      const normalized = crew.map((member) => ({
        id: member._id || member.crewId,
        crewId: member.crewId || member.id,
        fullName: member.fullName || member.name || 'Unnamed'
      }));
      setCrewOptions(normalized);
    } catch (err) {
      console.error('Failed to load crew members:', err);
      setCrewError(err.message || 'Unable to load crew list');
    } finally {
      setCrewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrewMembers();
  }, [loadCrewMembers]);

  const handleMarkCompleted = async (reminder) => {
    try {
      await markReminderCompleted(reminder.id);
      await fetchReminders();
    } catch (err) {
      console.error('Failed to mark reminder completed:', err);
      alert(err.message || 'Failed to mark reminder as completed');
    }
  };

  const handleSnooze = async (reminder, minutes = 60) => {
    try {
      await snoozeReminderApi(reminder.id, minutes);
      await fetchReminders();
    } catch (err) {
      console.error('Failed to snooze reminder:', err);
      alert(err.message || 'Failed to snooze reminder');
    }
  };

  const handleReschedule = async (reminder) => {
    const newDate = prompt('Enter new scheduled date (YYYY-MM-DD):', reminder.scheduledDate?.slice(0, 10));
    if (!newDate) return;
    const newTime = prompt('Enter new scheduled time (HH:MM):', reminder.scheduledTime || '08:00');
    try {
      await rescheduleReminder(reminder.id, newDate, newTime);
      await fetchReminders();
    } catch (err) {
      console.error('Failed to reschedule reminder:', err);
      alert(err.message || 'Failed to reschedule reminder');
    }
  };

  const handleDelete = (reminder) => {
    setDeletingReminder(reminder);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingReminder) return;
    try {
      await deleteReminderApi(deletingReminder.id);
      setDeleteConfirmOpen(false);
      setDeletingReminder(null);
      await fetchReminders();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
      alert(err.message || 'Failed to delete reminder');
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setReminderType(reminder.type);
    setEditReminderOpen(true);
    if (!crewOptions.length) {
      loadCrewMembers();
    }
  };

  const submitNewReminder = async (e) => {
    e.preventDefault();
    try {
      if (!newReminderData.crewId) {
        alert('Please select a patient');
        return;
      }

      const form = new FormData(e.target);
      const payload = buildReminderPayload(form, newReminderData);
      await createReminder(payload);
      setNewReminderOpen(false);
      setReminderType('');
      setNewReminderData({ crewId: '', crewName: '' });
      e.target.reset();
      await fetchReminders();
    } catch (err) {
      console.error('Failed to create reminder:', err);
      alert(err.message || 'Failed to create reminder');
    }
  };

  const submitEditReminder = async (e) => {
    e.preventDefault();
    if (!editingReminder) return;
    try {
      const form = new FormData(e.target);
      const payload = buildReminderPayload(form, editingReminder, true);
      await updateReminder(editingReminder.id, payload);
      setEditReminderOpen(false);
      setEditingReminder(null);
      setReminderType('');
      await fetchReminders();
    } catch (err) {
      console.error('Failed to update reminder:', err);
      alert(err.message || 'Failed to update reminder');
    }
  };

  const buildReminderPayload = (form, baseData, isEdit = false) => {
    const rawType = (form.get(isEdit ? 'editReminderType' : 'reminderType') || baseData.type || '').trim().toLowerCase();
    const type = rawType === 'followup' ? 'followup' : 'medication';
    const crewId = form.get(isEdit ? 'editReminderPatient' : 'reminderPatient') || baseData.crewId;
    const crew = crewOptions.find((c) => c.crewId === crewId);

    const medicationDate = form.get(isEdit ? 'editMedicationDate' : 'medicationDate');
    const medicationTime = form.get(isEdit ? 'editMedicationTime' : 'medicationTime');
    const followupDate = form.get(isEdit ? 'editFollowupDate' : 'followupDate');

    const payload = {
      type,
      crewId,
      crewName: crew?.fullName || baseData.crewName || '',
      scheduledDate: type === 'medication'
        ? (medicationDate || baseData.scheduledDate)
        : (followupDate || baseData.scheduledDate),
      scheduledTime: type === 'medication'
        ? (medicationTime || baseData.scheduledTime)
        : baseData.scheduledTime,
      notes: form.get(isEdit ? 'editReminderNotes' : 'reminderNotes') || ''
    };

    if (type === 'medication') {
      const medName = form.get(isEdit ? 'editMedicationName' : 'medicationName');
      const dosage = form.get(isEdit ? 'editMedicationDosage' : 'medicationDosage');
      const frequency = form.get(isEdit ? 'editMedicationFrequency' : 'medicationFrequency');
      payload.title = medName;
      payload.medication = {
        name: medName,
        dosage,
        frequency,
        times: [medicationTime || baseData.scheduledTime].filter(Boolean)
      };
    } else {
      payload.followup = {
        followupType: form.get(isEdit ? 'editFollowupType' : 'followupType'),
        nextDueDate: followupDate,
        notes: form.get(isEdit ? 'editFollowupNotes' : 'followupNotes')
      };
      payload.title = payload.followup.followupType;
    }

    return payload;
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
                    <input
                      type="text"
                      placeholder="Search medications or patients..."
                      value={filters.search}
                      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <select
                    className="filter-select"
                    style={{ width: 180, flex: '0 0 auto' }}
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                  </select>
                  <select
                    className="filter-select"
                    style={{ width: 180, flex: '0 0 auto' }}
                    value={filters.dateRange}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Dates</option>
                  </select>
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
                      {loading && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Loading reminders…</td>
                        </tr>
                      )}
                      {!loading && medicationReminders.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>No reminders match the current filters.</td>
                        </tr>
                      )}
                      {medicationReminders.map((reminder) => (
                        <tr key={reminder.id}>
                          <td>
                            <div className="crew-cell">
                              <div className="name">{reminder.crewName}</div>
                              <div className="id">{reminder.crewId}</div>
                            </div>
                          </td>
                          <td className="nowrap">{reminder.medication?.name || '—'}</td>
                          <td className="nowrap">{reminder.medication?.dosage || '—'}</td>
                          <td className="nowrap">{reminder.medication?.frequency || '—'}</td>
                          <td className="nowrap">{reminder.displayTime}</td>
                          <td><span className={`status-badge ${reminder.statusClass}`}>{reminder.statusLabel}</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-action btn-sm" onClick={() => handleMarkCompleted(reminder)}>
                              <i className="fas fa-check"></i> Mark Done
                            </button>
                            <button className="btn btn-action btn-sm" onClick={() => handleSnooze(reminder)}>
                              <i className="fas fa-clock"></i> Snooze
                            </button>
                            <button className="btn btn-action btn-sm" onClick={() => handleReschedule(reminder)}>
                              <i className="fas fa-calendar-alt"></i> Reschedule
                            </button>
                            <button className="btn btn-action btn-sm" onClick={() => handleEdit(reminder)}>
                              <i className="fas fa-pen"></i> Edit
                            </button>
                            <button className="btn btn-action btn-sm delete" onClick={() => handleDelete(reminder)}>
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Follow-up Tab */}
            {activeTab === 'followup' && (
              <div className="tab-content active" id="followup-tab">
                <div className="search-filter" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap' }}>
                  <div className="search-box" style={{ flex: 1, minWidth: 260, maxWidth: 420, display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Search follow-ups..."
                      value={filters.search}
                      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <select
                    className="filter-select"
                    style={{ width: 180, flex: '0 0 auto' }}
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                  </select>
                  <select
                    className="filter-select"
                    style={{ width: 180, flex: '0 0 auto' }}
                    value={filters.dateRange}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Dates</option>
                  </select>
                  <div style={{ flex: '0 0 auto' }}>{renderViewToggle()}</div>
                </div>

                {/* Card View */}
                {viewMode === 'card' && (
                <div className="cards-container">
                  {loading && (
                    <div className="card">
                      <div className="card-content">
                        <div className="card-title">Loading follow-ups…</div>
                      </div>
                    </div>
                  )}
                  {!loading && followupReminders.length === 0 && (
                    <div className="card">
                      <div className="card-content">
                        <div className="card-title">No follow-up reminders</div>
                        <div className="card-details">Adjust filters or create a new reminder.</div>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => setNewReminderOpen(true)}>
                          <i className="fas fa-plus"></i> New Reminder
                        </button>
                      </div>
                    </div>
                  )}
                  {followupReminders.map((reminder) => (
                    <div className={`card ${reminder.statusClass?.includes('danger') ? 'urgent' : ''}`} key={reminder.id}>
                      <div className="card-header">
                        <div className="card-title">{reminder.followup?.followupType || reminder.title || 'Follow-up Reminder'}</div>
                        <div className="card-icon primary"><i className="fas fa-calendar-day"></i></div>
                      </div>
                      <div className="card-content">
                        <div className="card-patient">{reminder.crewName} ({reminder.crewId})</div>
                        <div className="card-details">Scheduled: {reminder.displayTime}</div>
                        {reminder.followup?.notes && <div className="card-details">Notes: {reminder.followup.notes}</div>}
                        <div className={`card-due ${reminder.statusClass}`}>{reminder.statusLabel}</div>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-action btn-sm" onClick={() => handleReschedule(reminder)}>
                          <i className="fas fa-calendar-alt"></i> Reschedule
                        </button>
                        <button className="btn btn-action btn-sm" onClick={() => handleMarkCompleted(reminder)}>
                          <i className="fas fa-check"></i> Mark Complete
                        </button>
                        <button className="btn btn-action btn-sm" onClick={() => handleEdit(reminder)}>
                          <i className="fas fa-pen"></i> Edit
                        </button>
                        <button className="btn btn-action btn-sm delete" onClick={() => handleDelete(reminder)}>
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}

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
                        {loading && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Loading reminders…</td>
                          </tr>
                        )}
                        {!loading && followupReminders.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>No reminders match the current filters.</td>
                          </tr>
                        )}
                        {followupReminders.map((reminder) => (
                          <tr key={reminder.id}>
                            <td>
                              <div className="crew-cell">
                                <div className="name">{reminder.crewName}</div>
                                <div className="id">{reminder.crewId}</div>
                              </div>
                            </td>
                            <td className="nowrap">{reminder.followup?.followupType || '—'}</td>
                            <td className="nowrap">{reminder.displayTime}</td>
                            <td><span className={`status-badge ${reminder.statusClass}`}>{reminder.statusLabel}</span></td>
                            <td className="nowrap">{reminder.followup?.priority || '—'}</td>
                            <td className="action-buttons">
                              <button className="btn btn-action btn-sm" onClick={() => handleReschedule(reminder)}>
                                <i className="fas fa-calendar-alt"></i> Reschedule
                              </button>
                              <button className="btn btn-action btn-sm" onClick={() => handleMarkCompleted(reminder)}>
                                <i className="fas fa-check"></i> Complete
                              </button>
                              <button className="btn btn-action btn-sm" onClick={() => handleEdit(reminder)}>
                                <i className="fas fa-pen"></i> Edit
                              </button>
                              <button className="btn btn-action btn-sm delete" onClick={() => handleDelete(reminder)}>
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
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
                            <button className="btn btn-action btn-sm">
                              <i className="fas fa-pen"></i> Edit
                            </button>
                            <button className="btn btn-action btn-sm delete">
                              <i className="fas fa-ban"></i> Disable
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>Hypertension</td>
                          <td>Blood Pressure Check</td>
                          <td>Weekly</td>
                          <td><span className="status-badge status-active">Active</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-action btn-sm">
                              <i className="fas fa-pen"></i> Edit
                            </button>
                            <button className="btn btn-action btn-sm delete">
                              <i className="fas fa-ban"></i> Disable
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>Asthma</td>
                          <td>Peak Flow Measurement</td>
                          <td>Monthly</td>
                          <td><span className="status-badge status-active">Active</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-action btn-sm">
                              <i className="fas fa-pen"></i> Edit
                            </button>
                            <button className="btn btn-action btn-sm delete">
                              <i className="fas fa-ban"></i> Disable
                            </button>
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
                  <select id="reminderType" name="reminderType" className="form-control" required value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
                    <option value="">Select type</option>
                    <option value="medication">Medication</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reminderPatient">Patient *</label>
                  <select
                    id="reminderPatient"
                    name="reminderPatient"
                    className="form-control"
                    required
                    value={newReminderData.crewId}
                    onChange={(e) => {
                      const crewId = e.target.value;
                      const crew = crewOptions.find((c) => c.crewId === crewId);
                      setNewReminderData({ crewId, crewName: crew?.fullName || '' });
                    }}
                    disabled={crewLoading}
                  >
                    <option value="">{crewLoading ? 'Loading crew...' : 'Select patient'}</option>
                    {crewOptions.map((crew) => (
                      <option key={crew.id} value={crew.crewId}>
                        {crew.fullName} ({crew.crewId})
                      </option>
                    ))}
                  </select>
                  {crewError && <small style={{ color: '#dc2626' }}>{crewError}</small>}
                </div>
              </div>

              {/* Medication fields */}
              {reminderType === 'medication' && (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="medicationName">Medication Name *</label>
                      <input type="text" id="medicationName" name="medicationName" className="form-control" placeholder="e.g., Metformin" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="medicationDosage">Dosage *</label>
                      <input type="text" id="medicationDosage" name="medicationDosage" className="form-control" placeholder="e.g., 500mg" required />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="medicationDate">Scheduled Date *</label>
                      <input type="date" id="medicationDate" name="medicationDate" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="medicationFrequency">Frequency *</label>
                      <select id="medicationFrequency" name="medicationFrequency" className="form-control" defaultValue="daily" required>
                        <option value="daily">Daily</option>
                        <option value="twice-daily">Twice Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="as-needed">As Needed</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="medicationTime">Time *</label>
                      <input type="time" id="medicationTime" name="medicationTime" className="form-control" required />
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
                      <input type="text" id="followupType" name="followupType" className="form-control" placeholder="e.g., Diabetes Review" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="followupDate">Date *</label>
                      <input type="date" id="followupDate" name="followupDate" className="form-control" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="followupNotes">Notes</label>
                    <textarea id="followupNotes" name="followupNotes" className="form-control" rows={3} placeholder="Additional details..."></textarea>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="reminderNotes">Additional Notes</label>
                <textarea id="reminderNotes" name="reminderNotes" className="form-control" rows={3} placeholder="Any additional information..."></textarea>
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
                  <select id="editReminderType" name="editReminderType" className="form-control" required value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
                    <option value="">Select type</option>
                    <option value="medication">Medication</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editReminderPatient">Patient *</label>
                  <select
                    id="editReminderPatient"
                    name="editReminderPatient"
                    className="form-control"
                    required
                    value={editingReminder?.crewId || ''}
                    onChange={(e) => {
                      const crewId = e.target.value;
                      const crew = crewOptions.find((c) => c.crewId === crewId);
                      setEditingReminder((prev) => (prev ? { ...prev, crewId, crewName: crew?.fullName || prev.crewName } : prev));
                    }}
                    disabled={crewLoading}
                  >
                    <option value="">{crewLoading ? 'Loading crew...' : 'Select patient'}</option>
                    {crewOptions.map((crew) => (
                      <option key={crew.id} value={crew.crewId}>
                        {crew.fullName} ({crew.crewId})
                      </option>
                    ))}
                  </select>
                  {crewError && <small style={{ color: '#dc2626' }}>{crewError}</small>}
                </div>
              </div>

              {/* Medication fields */}
              {reminderType === 'medication' && (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="editMedicationName">Medication Name *</label>
                      <input type="text" id="editMedicationName" name="editMedicationName" className="form-control" placeholder="e.g., Metformin" defaultValue={editingReminder?.medication?.name || editingReminder?.medicationName || ""} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editMedicationDosage">Dosage *</label>
                      <input type="text" id="editMedicationDosage" name="editMedicationDosage" className="form-control" placeholder="e.g., 500mg" defaultValue={editingReminder?.medication?.dosage || editingReminder?.dosage || ""} required />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="editMedicationDate">Scheduled Date *</label>
                      <input type="date" id="editMedicationDate" name="editMedicationDate" className="form-control" defaultValue={editingReminder?.scheduledDate ? new Date(editingReminder.scheduledDate).toISOString().slice(0, 10) : ''} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editMedicationFrequency">Frequency *</label>
                      <select id="editMedicationFrequency" name="editMedicationFrequency" className="form-control" defaultValue={editingReminder?.medication?.frequency || editingReminder?.frequency || "daily"} required>
                        <option value="daily">Daily</option>
                        <option value="twice-daily">Twice Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="as-needed">As Needed</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="editMedicationTime">Time *</label>
                      <input type="time" id="editMedicationTime" name="editMedicationTime" className="form-control" defaultValue={editingReminder?.scheduledTime || editingReminder?.time || ""} required />
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
                      <input type="text" id="editFollowupType" name="editFollowupType" className="form-control" placeholder="e.g., Diabetes Review" defaultValue={editingReminder?.followup?.followupType || ''} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editFollowupDate">Date *</label>
                      <input type="date" id="editFollowupDate" name="editFollowupDate" className="form-control" defaultValue={editingReminder?.followup?.nextDueDate ? new Date(editingReminder.followup.nextDueDate).toISOString().slice(0, 10) : editingReminder?.scheduledDate ? new Date(editingReminder.scheduledDate).toISOString().slice(0, 10) : ''} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editFollowupNotes">Notes</label>
                    <textarea id="editFollowupNotes" name="editFollowupNotes" className="form-control" rows={3} placeholder="Additional details..." defaultValue={editingReminder?.followup?.notes || ''}></textarea>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="editReminderNotes">Additional Notes</label>
                <textarea id="editReminderNotes" name="editReminderNotes" className="form-control" rows={3} placeholder="Any additional information..." defaultValue={editingReminder?.notes || ''}></textarea>
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
