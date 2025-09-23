import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewReminders() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };
  // Demo reminders dataset
  const [reminders, setReminders] = useState([
    { id: 1, type: 'medication', title: 'Vitamin D Supplement', date: new Date().toISOString().split('T')[0], time: '08:00', repeat: 'daily', notes: 'Take with breakfast', status: 'active', created: '2025-09-01' },
    { id: 2, type: 'vaccination', title: 'Influenza Booster', date: '2025-10-25', time: '14:00', repeat: 'none', notes: 'Important vaccination before winter season', status: 'active', created: '2025-09-15' },
    { id: 3, type: 'appointment', title: 'Health Officer Appointment', date: '2025-10-30', time: '10:00', repeat: 'none', notes: 'Routine check-up', status: 'active', created: '2025-10-05' },
    { id: 4, type: 'medication', title: 'Pain Reliever', date: '2025-09-14', time: '14:00', repeat: 'none', notes: 'For headache', status: 'completed', created: '2025-09-14' },
    { id: 5, type: 'checkup', title: 'Blood Pressure Check', date: new Date().toISOString().split('T')[0], time: '15:00', repeat: 'none', notes: 'Snoozed from earlier', status: 'snoozed', created: '2025-09-15' },
  ]);
  const [activeTab, setActiveTab] = useState('active'); // active | completed | snoozed
  const [form, setForm] = useState({ id: null, type: '', title: '', date: '', time: '', repeat: 'none', notes: '', crewId: user?.crewId || 'CD12345', status: 'active' });
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // Ensure date minimum is today for UX; handled by input attribute min if needed
  }, []);

  const tabList = [
    { key: 'active', label: 'Active Reminders' },
    { key: 'completed', label: 'Completed' },
    { key: 'snoozed', label: 'Snoozed' },
  ];

  const filteredByTab = (status) => reminders.filter(r => r.status === status);
  const iconOf = (type) => {
    switch (type) {
      case 'medication': return { icon: 'fas fa-pills', color: 'var(--warning)' };
      case 'vaccination': return { icon: 'fas fa-syringe', color: 'var(--info)' };
      case 'appointment': return { icon: 'fas fa-calendar-check', color: 'var(--success)' };
      case 'checkup': return { icon: 'fas fa-heartbeat', color: 'var(--danger)' };
      default: return { icon: 'fas fa-bell', color: 'var(--primary)' };
    }
  };
  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const markComplete = (id) => {
    setReminders((rs) => rs.map(r => r.id === id ? { ...r, status: 'completed' } : r));
    setSuccessMessage('Reminder marked as completed.');
    setSuccessOpen(true);
  };
  const snoozeReminder = (id) => {
    setReminders((rs) => rs.map(r => {
      if (r.id !== id) return r;
      const [h, m] = r.time.split(':').map(n => parseInt(n, 10));
      const date = new Date();
      date.setHours(h, m + 60); // +1 hour
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return { ...r, status: 'snoozed', time: `${hh}:${mm}` };
    }));
    setSuccessMessage('Reminder snoozed for 1 hour.');
    setSuccessOpen(true);
  };
  const activateReminder = (id) => {
    setReminders((rs) => rs.map(r => r.id === id ? { ...r, status: 'active' } : r));
    setSuccessMessage('Reminder activated.');
    setSuccessOpen(true);
  };
  const editReminder = (id) => {
    const r = reminders.find(x => x.id === id);
    if (!r) return;
    setForm({ ...r });
    setFormOpen(true);
  };
  const resetForm = () => setForm({ id: null, type: '', title: '', date: '', time: '', repeat: 'none', notes: '', crewId: user?.crewId || 'CD12345', status: 'active' });
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.type || !form.title || !form.date || !form.time) return;
    if (form.id) {
      setReminders((rs) => rs.map(r => r.id === form.id ? { ...form } : r));
      setSuccessMessage('Your reminder has been updated successfully.');
    } else {
      const newId = reminders.length > 0 ? Math.max(...reminders.map(r => r.id)) + 1 : 1;
      setReminders((rs) => [{ ...form, id: newId, created: new Date().toISOString().split('T')[0] }, ...rs]);
      setSuccessMessage('Your reminder has been created successfully.');
    }
    setSuccessOpen(true);
    resetForm();
    setFormOpen(false);
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
          <section className="reminders-container">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h3 className="form-title">Your Reminders</h3>
              <button className="btn btn-primary" onClick={() => { resetForm(); setFormOpen(true); }}>
                <i className="fas fa-plus" style={{ marginRight: 6 }}></i> New Reminder
              </button>
            </div>
            <div className="reminder-tabs" style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid #ddd' }}>
              {tabList.map(t => (
                <div key={t.key} className={`reminder-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)} style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: activeTab === t.key ? '3px solid var(--primary)' : '3px solid transparent' }}>{t.label}</div>
              ))}
            </div>

            {tabList.map(t => (
              <div key={t.key} className={`reminder-content ${activeTab === t.key ? 'active' : ''}`} style={{ display: activeTab === t.key ? 'block' : 'none' }}>
                {filteredByTab(t.key).length === 0 ? (
                  <p style={{ textAlign: 'center', padding: 20, color: '#777' }}>No reminders found.</p>
                ) : (
                  filteredByTab(t.key).map((r) => {
                    const { icon, color } = iconOf(r.type);
                    return (
                      <div key={r.id} className={`reminder-item ${r.status === 'completed' ? 'completed' : ''}`}>
                        <div className="reminder-icon" style={{ backgroundColor: color }}>
                          <i className={icon}></i>
                        </div>
                        <div className="reminder-info">
                          <div className="reminder-title">{r.title}</div>
                          <div className="reminder-time">Due: {formatDate(r.date)} at {r.time} {r.repeat !== 'none' ? `• Repeats: ${r.repeat}` : ''}</div>
                          {r.notes && <div className="reminder-notes" style={{ fontSize: 14, color: '#777', marginTop: 5 }}>{r.notes}</div>}
                        </div>
                        <div className="reminder-actions" style={{ display: 'flex', gap: 10 }}>
                          {(r.status === 'active' || r.status === 'snoozed') && (
                            <button className="btn btn-success" onClick={() => markComplete(r.id)}>Complete</button>
                          )}
                          {r.status === 'active' && (
                            <button className="btn btn-warning" onClick={() => snoozeReminder(r.id)}>Snooze</button>
                          )}
                          {r.status === 'snoozed' && (
                            <button className="btn btn-primary" onClick={() => activateReminder(r.id)}>Activate</button>
                          )}
                          <button className="btn btn-primary" onClick={() => editReminder(r.id)}>Edit</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </section>

          {/* New reminder form modal */}
          {formOpen && (
            <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setFormOpen(false)}>
              <div className="modal-content" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                  <h3 className="modal-title">{form.id ? 'Edit Reminder' : 'New Reminder'}</h3>
                  <button className="close-modal" onClick={() => setFormOpen(false)}>&times;</button>
                </div>
                <form onSubmit={onSubmit} id="reminderForm">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Reminder Type *</label>
                      <select name="type" className="form-control" value={form.type} onChange={onChange} required>
                        <option value="">Select type</option>
                        <option value="medication">Medication</option>
                        <option value="appointment">Appointment</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="checkup">Health Check</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Title *</label>
                      <input name="title" className="form-control" placeholder="Enter reminder title" value={form.title} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                      <label>Date *</label>
                      <input name="date" type="date" className="form-control" value={form.date} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                      <label>Time *</label>
                      <input name="time" type="time" className="form-control" value={form.time} onChange={onChange} required />
                    </div>
                    <div className="form-group">
                      <label>Repeat</label>
                      <select name="repeat" className="form-control" value={form.repeat} onChange={onChange}>
                        <option value="none">Never</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea name="notes" className="form-control" rows={3} placeholder="Additional notes..." value={form.notes} onChange={onChange}></textarea>
                  </div>
                  <input type="hidden" name="crewId" value={form.crewId} />
                  <input type="hidden" name="status" value={form.status} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" className="btn" onClick={() => setFormOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{form.id ? 'Update Reminder' : 'Create Reminder'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          </main>
      </div>
      {/* Success Modal */}
      {successOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setSuccessOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Success!</h3>
              <button className="close-modal" onClick={() => setSuccessOpen(false)}>&times;</button>
            </div>
            <p>{successMessage || 'Your reminder has been created successfully.'}</p>
            <button className="btn btn-primary" onClick={() => setSuccessOpen(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
