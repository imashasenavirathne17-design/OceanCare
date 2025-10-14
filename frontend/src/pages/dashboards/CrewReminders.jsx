import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import {
  listMyReminders,
  deleteMyReminder,
  markMyReminderCompleted,
  snoozeMyReminder,
  rescheduleMyReminder,
  getReminderStatusDisplay,
  formatReminderTime,
} from '../../lib/reminderApi';
import CrewSidebar from './CrewSidebar';
import './crewDashboard.css';

export default function CrewReminders() {
  const navigate = useNavigate();
  const user = getUser();
  const printRecords = () => { window.print(); };

  const onLogout = () => { clearSession(); navigate('/login'); };

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [viewMode, setViewMode] = useState('list');

  const normalizeReminder = useCallback((item) => {
    if (!item) return item;
    const statusInfo = getReminderStatusDisplay(item);
    return {
      ...item,
      id: item._id || item.id,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.class,
      displayTime: formatReminderTime(item),
    };
  }, []);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { reminders: apiReminders = [] } = await listMyReminders({ status: 'all' });
      setReminders(apiReminders.map(normalizeReminder));
    } catch (err) {
      console.error('Failed to fetch reminders', err);
      setError(err.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [normalizeReminder, user?.crewId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const showSuccess = (message) => {
    console.info(message);
  };

  // Overview counters (computed after reminders is defined)
  const counts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      active: reminders.filter((r) => ['scheduled', 'pending', 'active'].includes(r.status)).length,
      completed: reminders.filter((r) => r.status === 'completed').length,
      snoozed: reminders.filter((r) => r.status === 'snoozed').length,
      today: reminders.filter((r) => (r.scheduledDate || '').slice(0, 10) === today).length,
    };
  }, [reminders]);

  // Calendar data (computed after reminders is defined)
  const calendar = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay();
    const days = last.getDate();
    const cells = Array.from({ length: startDay }, () => null);
    for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    const map = reminders.reduce((acc, r) => {
      const k = (r.scheduledDate || '').slice(0, 10);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return { year, month, weeks, map };
  }, [reminders]);

  useEffect(() => {
    // Ensure date minimum is today for UX; handled by input attribute min if needed
  }, []);

  const tabList = [
    { key: 'active', label: 'Active Reminders' },
    { key: 'completed', label: 'Completed' },
    { key: 'snoozed', label: 'Snoozed' },
  ];

  const filteredByTab = (key) => {
    if (key === 'active') return reminders.filter((r) => r.status === 'scheduled' || r.status === 'pending' || r.status === 'active');
    return reminders.filter((r) => r.status === key);
  };

  const iconOf = (type) => {
    switch (type) {
      case 'medication': return { icon: 'fas fa-pills', color: 'var(--warning)' };
      case 'vaccination': return { icon: 'fas fa-syringe', color: 'var(--info)' };
      case 'appointment': return { icon: 'fas fa-calendar-check', color: 'var(--success)' };
      case 'checkup': return { icon: 'fas fa-heartbeat', color: 'var(--danger)' };
      default: return { icon: 'fas fa-bell', color: 'var(--primary)' };
    }
  };
  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleMarkCompleted = async (reminderId) => {
    try {
      await markMyReminderCompleted(reminderId);
      await fetchReminders();
      showSuccess('Reminder marked as completed.');
    } catch (err) {
      console.error('Failed to mark reminder completed', err);
      alert(err.message || 'Failed to mark reminder completed');
    }
  };

  const handleSnooze = async (reminderId) => {
    try {
      await snoozeMyReminder(reminderId, 60);
      await fetchReminders();
      showSuccess('Reminder snoozed for 1 hour.');
    } catch (err) {
      console.error('Failed to snooze reminder', err);
      alert(err.message || 'Failed to snooze reminder');
    }
  };

  const handleActivate = async (reminderId) => {
    try {
      const reminder = reminders.find((r) => r.id === reminderId || r._id === reminderId);
      if (!reminder) return;
      await rescheduleMyReminder(reminderId, reminder.scheduledDate, reminder.scheduledTime);
      await fetchReminders();
      showSuccess('Reminder activated.');
    } catch (err) {
      console.error('Failed to activate reminder', err);
      alert(err.message || 'Failed to activate reminder');
    }
  };

  const handleDelete = async (reminderId) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await deleteMyReminder(reminderId);
      await fetchReminders();
      showSuccess('Reminder deleted successfully.');
    } catch (err) {
      console.error('Failed to delete reminder', err);
      alert(err.message || 'Failed to delete reminder');
    }
  };

  const handleReschedule = async (reminder) => {
    const newDate = prompt('Enter new scheduled date (YYYY-MM-DD):', (reminder.scheduledDate || '').slice(0, 10));
    if (!newDate) return;
    const newTime = prompt('Enter new scheduled time (HH:MM):', reminder.scheduledTime || '08:00');
    if (!newTime) return;
    try {
      await rescheduleMyReminder(reminder.id || reminder._id, newDate, newTime);
      showSuccess('Reminder rescheduled successfully.');
      await fetchReminders();
    } catch (err) {
      console.error('Failed to reschedule reminder', err);
      alert(err.message || 'Failed to reschedule reminder');
    }
  };

  const renderReminderActions = (reminder) => {
    const id = reminder.id || reminder._id;
    const isActive = reminder.status === 'scheduled' || reminder.status === 'pending' || reminder.status === 'active';
    return (
      <div className="reminder-actions" style={{ display: 'flex', gap: 10 }}>
        {isActive && (
          <button className="btn btn-success" onClick={() => handleMarkCompleted(id)}>Complete</button>
        )}
        {isActive && (
          <button className="btn btn-warning" onClick={() => handleSnooze(id)}>Snooze</button>
        )}
        {reminder.status === 'snoozed' && (
          <button className="btn btn-primary" onClick={() => handleActivate(id)}>Activate</button>
        )}
        <button className="btn btn-outline" onClick={() => handleReschedule(reminder)}>Reschedule</button>
        <button className="btn btn-danger" onClick={() => handleDelete(id)}>Delete</button>
      </div>
    );
  };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Medication &amp; Follow-Up Reminders</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Reminders container with tabs */}
          <section className="dashboard-section reminders-container">
            <div className="section-header" style={{ flexWrap: 'wrap' }}>
              <div>
                <div className="section-title">Your Reminders</div>
                <div className="section-subtitle">Keep track of medications and follow-up actions</div>
              </div>
            </div>

            {/* Overview counters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0 16px' }}>
              <div className="card" style={{ padding: 12, borderRadius: 8, minWidth: 160, flex: 1 }}>
                <div style={{ fontSize: 12, color: '#777' }}>Active</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{counts.active}</div>
              </div>
              <div className="card" style={{ padding: 12, borderRadius: 8, minWidth: 160, flex: 1 }}>
                <div style={{ fontSize: 12, color: '#777' }}>Completed</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{counts.completed}</div>
              </div>
              <div className="card" style={{ padding: 12, borderRadius: 8, minWidth: 160, flex: 1 }}>
                <div style={{ fontSize: 12, color: '#777' }}>Snoozed</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>{counts.snoozed}</div>
              </div>
              <div className="card" style={{ padding: 12, borderRadius: 8, minWidth: 160, flex: 1 }}>
                <div style={{ fontSize: 12, color: '#777' }}>Due Today</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{counts.today}</div>
              </div>
            </div>

            <div className="reminder-tabs">
              {tabList.map(t => (
                <div key={t.key} className={`reminder-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</div>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className={`btn btn-outline btn-sm ${viewMode==='list'?'active':''}`} onClick={()=>setViewMode('list')}><i className="fas fa-list"></i> List</button>
                <button className={`btn btn-outline btn-sm ${viewMode==='calendar'?'active':''}`} onClick={()=>setViewMode('calendar')}><i className="fas fa-calendar-alt"></i> Calendar</button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 30, textAlign: 'center' }}>Loading reminders…</div>
            ) : error ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
            ) : viewMode === 'list' ? (
              tabList.map(t => (
                <div key={t.key} className={`reminder-content ${activeTab === t.key ? 'active' : ''}`} style={{ display: activeTab === t.key ? 'block' : 'none' }}>
                  {filteredByTab(t.key).length === 0 ? (
                    <p style={{ textAlign: 'center', padding: 20, color: '#777' }}>No reminders found.</p>
                  ) : (
                    filteredByTab(t.key).map((r) => {
                      const { icon, color } = iconOf(r.type);
                      const key = r.id || r._id;
                      return (
                        <div key={key} className={`reminder-item ${r.status === 'completed' ? 'completed' : ''}`}>
                          <div className="reminder-icon" style={{ backgroundColor: color }}>
                            <i className={icon}></i>
                          </div>
                          <div className="reminder-info">
                            <div className="reminder-title">{r.title}</div>
                            <div className="reminder-time">Due: {formatDate(r.scheduledDate)} at {r.scheduledTime || '—'}</div>
                            {r.notes && <div className="reminder-notes" style={{ fontSize: 14, color: '#777', marginTop: 5 }}>{r.notes}</div>}
                          </div>
                          {renderReminderActions(r)}
                        </div>
                      );
                    })
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8, color: '#666', fontSize: 12 }}>
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (<div key={d} style={{ textAlign: 'center' }}>{d}</div>))}
                </div>
                {calendar.weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                    {week.map((dt, di) => {
                      if (!dt) return <div key={di} style={{ padding: '10px 8px', background: '#f5f5f5', borderRadius: 8, minHeight: 64 }} />;
                      const key = dt.toISOString().slice(0,10);
                      const count = calendar.map[key] || 0;
                      return (
                        <div key={di} style={{ padding: '10px 8px', background: '#fff', border: '1px solid #eee', borderRadius: 8, minHeight: 64 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 600 }}>{dt.getDate()}</div>
                            {count > 0 && <span className="chip chip-info" style={{ fontSize: 12 }}>{count}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>

          </main>
      </div>
    </div>
  );
}
