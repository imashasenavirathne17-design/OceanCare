import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../../lib/token';
import {
  listCrewEmergencyAlerts,
  createCrewEmergencyAlert,
  updateCrewEmergencyAlert,
  deleteCrewEmergencyAlert,
} from '../../lib/crewEmergencyAlertApi';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

const STATUS_LABELS = {
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

const TYPE_OPTIONS = [
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'safety', label: 'Safety Concern' },
  { value: 'symptoms', label: 'Severe Symptoms' },
  { value: 'accident', label: 'Accident / Injury' },
  { value: 'other', label: 'Other' },
];

const URGENCY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return 'Unknown';
  }
};

export default function CrewEmergency() {
  const navigate = useNavigate();
  const user = getUser();
  const role = (user?.role || '').toLowerCase();
  const isCrewUser = role === 'crew';

  const buildInitialForm = useCallback(() => ({
    type: '',
    location: '',
    description: '',
    urgency: 'high',
    status: 'reported',
  }), []);

  const [form, setForm] = useState(buildInitialForm);
  const [editingId, setEditingId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [modalState, setModalState] = useState({ open: false, title: '', message: '' });

  const openModal = useCallback((title, message) => {
    setModalState({ open: true, title, message });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ open: false, title: '', message: '' });
  }, []);

  const resetForm = useCallback(() => {
    setForm(buildInitialForm());
    setEditingId('');
    setFormError('');
  }, [buildInitialForm]);

  const loadAlerts = useCallback(async () => {
    try {
      setLoadingAlerts(true);
      setAlertsError('');
      const data = await listCrewEmergencyAlerts();
      const normalized = (data || []).map((item) => ({
        ...item,
        id: item.id || item._id || item.alertId || '',
      }));
      setAlerts(normalized);
    } catch (err) {
      console.error('listCrewEmergencyAlerts error:', err);
      setAlertsError('Failed to load emergency alerts.');
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const scrollToForm = useCallback(() => {
    resetForm();
    setShowForm(true);
    window.requestAnimationFrame(() => {
      const el = document.getElementById('crewEmergencyForm');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [resetForm]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.type || !form.description.trim()) {
      setFormError('Emergency type and description are required.');
      return;
    }

    const payload = {
      type: form.type,
      location: form.location,
      description: form.description.trim(),
      urgency: form.urgency,
    };

    if (editingId && form.status) {
      payload.status = form.status;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateCrewEmergencyAlert(editingId, payload);
        openModal('Emergency alert updated', 'Your emergency alert has been updated successfully.');
      } else {
        await createCrewEmergencyAlert(payload);
        openModal('Emergency alert reported', 'Emergency and medical officers have been notified.');
      }
      await loadAlerts();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('handleSubmit error:', err);
      setFormError('Failed to save emergency alert. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (alert) => {
    setForm({
      type: alert.type || '',
      location: alert.location || '',
      description: alert.description || '',
      urgency: alert.urgency || 'high',
      status: alert.status || 'reported',
    });
    setEditingId(alert.id || alert._id || '');
    setFormError('');
    setShowForm(true);
    const el = document.getElementById('crewEmergencyForm');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDelete = async (alert) => {
    const confirmed = window.confirm('Delete this emergency alert? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteCrewEmergencyAlert(alert.id || alert._id || '');
      if (editingId && (alert.id === editingId || alert._id === editingId)) {
        resetForm();
        setShowForm(false);
      }
      openModal('Emergency alert deleted', 'The emergency alert has been removed.');
      await loadAlerts();
    } catch (err) {
      console.error('handleDelete error:', err);
      setAlertsError('Failed to delete the alert.');
    }
  };

  const filteredAlerts = useMemo(() => alerts.filter((alert) => {
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    return true;
  }), [alerts, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const total = alerts.length;
    const active = alerts.filter((a) => a.status === 'reported' || a.status === 'acknowledged').length;
    const resolved = alerts.filter((a) => a.status === 'resolved').length;
    return { total, active, resolved };
  }, [alerts]);

  const statusOptionsForEdit = isCrewUser ? ['reported', 'cancelled'] : Object.keys(STATUS_LABELS);
  const isEditing = Boolean(editingId);

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />

        <main className="main-content">
          <div className="dash-header">
            <h2>Emergency Assistance</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || '—'}</small>
              </div>
              <div className="status-badge status-active">On Duty</div>
            </div>
          </div>

          <section style={{ marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, var(--danger) 0%, #c1121f 100%)', color: '#fff', borderRadius: 12, padding: 32, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', boxShadow: '0 16px 30px rgba(193, 18, 31, 0.3)' }}>
              <div style={{ flex: '1 1 260px' }}>
                <h3 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Emergency Alert Centre</h3>
                <p style={{ opacity: 0.9, lineHeight: 1.6, marginTop: 12 }}>
                  Report incidents immediately. Emergency and medical officers receive alerts in real time
                  and can acknowledge or resolve them within the operations dashboard.
                </p>
                <button className="btn btn-light" onClick={scrollToForm} style={{ marginTop: 18, padding: '12px 22px', fontWeight: 600 }}>
                  <i className="fas fa-plus-circle" /> New Emergency
                </button>
              </div>
              <div style={{ display: 'flex', gap: 16, flex: '1 1 240px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 16, minWidth: 140 }}>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.75 }}>Active</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.active}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 16, minWidth: 140 }}>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.75 }}>Resolved</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.resolved}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 16, minWidth: 140 }}>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.75 }}>Total</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.total}</div>
                </div>
              </div>
            </div>
          </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: showForm ? 'minmax(0, 420px) minmax(0, 1fr)' : 'minmax(0, 1fr)',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          {showForm && (
            <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 10px 24px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{isEditing ? 'Update emergency alert' : 'Report emergency situation'}</h3>
              <p style={{ color: '#6c757d', marginTop: 8 }}>
                Provide as much detail as possible so the response team can reach you quickly.
              </p>
              <form id="crewEmergencyForm" onSubmit={handleSubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label>Emergency Type *</label>
                  <select name="type" className="form-control" value={form.type} onChange={onChange} required>
                    <option value="">Select emergency type</option>
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Your current location</label>
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    placeholder="Deck, cabin number, or area"
                    value={form.location}
                    onChange={onChange}
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    className="form-control"
                    placeholder="Describe the emergency situation in detail..."
                    value={form.description}
                    onChange={onChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Urgency level</label>
                  <select name="urgency" className="form-control" value={form.urgency} onChange={onChange}>
                    <option value="high">High – immediate response needed</option>
                    <option value="medium">Medium – response within 30 minutes</option>
                    <option value="low">Low – monitor and assist</option>
                  </select>
                </div>

                {isEditing && (
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" className="form-control" value={form.status} onChange={onChange}>
                      {statusOptionsForEdit.map((value) => (
                        <option key={value} value={value}>{STATUS_LABELS[value]}</option>
                      ))}
                    </select>
                    <small style={{ color: '#6c757d' }}>Crew can mark alerts as reported or cancelled if situation resolves.</small>
                  </div>
                )}

                {formError && (
                  <div style={{ color: 'var(--danger)', fontSize: 14 }}>{formError}</div>
                )}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-danger" disabled={submitting}>
                    {submitting ? 'Saving…' : isEditing ? 'Update alert' : 'Submit emergency report'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                      disabled={submitting}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
              </section>
            )}

            <section style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 10px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Your emergency alerts</h3>
                  <p style={{ color: '#6c757d', marginTop: 8 }}>Track acknowledgement and resolution progress in real time.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    {Object.keys(STATUS_LABELS).map((value) => (
                      <option key={value} value={value}>{STATUS_LABELS[value]}</option>
                    ))}
                  </select>
                  <select className="form-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="all">All types</option>
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                {loadingAlerts ? (
                  <div className="empty-state">Loading alerts…</div>
                ) : alertsError ? (
                  <div className="empty-state" style={{ color: 'var(--danger)' }}>{alertsError}</div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="empty-state">No emergency alerts found for the selected filters.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Location</th>
                          <th>Urgency</th>
                          <th>Status</th>
                          <th>Reported</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAlerts.map((alert) => (
                          <tr key={alert.id}>
                            <td style={{ textTransform: 'capitalize' }}>{alert.type}</td>
                            <td style={{ maxWidth: 260, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                              <div style={{ fontWeight: 600, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{alert.description}</div>
                              {alert.notes && <small style={{ color: '#6c757d' }}>{alert.notes}</small>}
                            </td>
                            <td>{alert.location || '—'}</td>
                            <td>
                              <span className={`badge badge-${alert.urgency || 'high'}`}>
                                {URGENCY_LABELS[alert.urgency] || alert.urgency}
                              </span>
                            </td>
                            <td>
                              <span className={`badge status-${alert.status || 'reported'}`}>
                                {STATUS_LABELS[alert.status] || alert.status}
                              </span>
                            </td>
                            <td>{formatDateTime(alert.reportedAt || alert.createdAt)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className="btn btn-sm" onClick={() => handleEdit(alert)}>
                                  <i className="fas fa-edit" /> Edit
                                </button>
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(alert)}>
                                  <i className="fas fa-trash" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      {modalState.open && (
        <div className="modal" onClick={(event) => event.target.classList.contains('modal') && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">{modalState.title}</h3>
              <button className="close-modal" onClick={closeModal}>&times;</button>
            </div>
            <div style={{ padding: '16px 0', color: '#2c3e50' }}>{modalState.message}</div>
            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={closeModal}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
