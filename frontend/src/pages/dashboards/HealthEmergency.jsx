import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HealthSidebar from './HealthSidebar';
import './healthOfficerDashboard.css';
import './healthEmergency.css';
import { clearSession, getUser } from '../../lib/token';
import {
  listHealthEmergencies,
  createHealthEmergency,
  updateHealthEmergency,
  deleteHealthEmergency,
  acknowledgeHealthEmergency,
  resolveHealthEmergency,
  listCrewMembers,
} from '../../lib/healthApi';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'reported', label: 'Reported' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const EMERGENCY_TYPE_OPTIONS = ['Medical', 'Trauma', 'Respiratory', 'Cardiac', 'Allergic Reaction', 'Neurological', 'Other'];

const RECIPIENT_OPTIONS = [
  { key: 'captain', label: 'Captain' },
  { key: 'first-officer', label: 'First Officer' },
  { key: 'emergency-team', label: 'Emergency Team' },
  { key: 'all-hands', label: 'All Hands' },
];

const defaultRecipients = () => ({
  captain: true,
  'first-officer': true,
  'emergency-team': true,
  'all-hands': false,
});

const defaultForm = () => ({
  patientName: '',
  crewId: '',
  emergencyType: 'Medical',
  severity: 'high',
  priority: 'high',
  status: 'reported',
  location: '',
  description: '',
  immediateActions: '',
  reportedAt: new Date().toISOString(),
  expectedArrival: '',
  notifyCaptain: true,
  notifyEmergencyTeam: true,
  recipients: defaultRecipients(),
  notes: '',
});

const toLocalInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 16);
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const formatLabel = (value) => {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const severityBadgeClass = (value) => {
  switch (value) {
    case 'critical':
      return 'status-danger';
    case 'high':
      return 'status-warning';
    case 'moderate':
      return 'status-active';
    case 'low':
    default:
      return 'status-active';
  }
};

const priorityBadgeClass = (value) => {
  switch (value) {
    case 'high':
      return 'status-danger';
    case 'medium':
      return 'status-warning';
    default:
      return 'status-active';
  }
};

const statusBadgeClass = (value) => {
  switch (value) {
    case 'reported':
      return 'status-warning';
    case 'acknowledged':
      return 'status-warning';
    case 'in_progress':
      return 'status-warning';
    case 'resolved':
    case 'closed':
      return 'status-active';
    default:
      return 'status-active';
  }
};

const severityIconClass = (value) => {
  switch (value) {
    case 'critical':
      return 'fas fa-heartbeat';
    case 'high':
      return 'fas fa-exclamation-triangle';
    case 'moderate':
      return 'fas fa-notes-medical';
    case 'low':
    default:
      return 'fas fa-info-circle';
  }
};

const statusAlertClass = (value) => {
  switch (value) {
    case 'reported':
      return 'status-new';
    case 'acknowledged':
      return 'status-acknowledged';
    case 'resolved':
    case 'closed':
      return 'status-resolved';
    default:
      return 'status-new';
  }
};

export default function HealthEmergency() {
  const navigate = useNavigate();
  const user = getUser();

  const [emergencies, setEmergencies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState('');
  const [rowProcessing, setRowProcessing] = useState('');
  const [crewMembers, setCrewMembers] = useState([]);
  const [crewLoading, setCrewLoading] = useState(false);
  const [crewError, setCrewError] = useState('');

  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    priority: 'all',
    q: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [editingEmergency, setEditingEmergency] = useState(null);
  const [selectedCrewMemberId, setSelectedCrewMemberId] = useState('');

  const actionsDisabled = Boolean(processing);

  const loadCrewMembers = async () => {
    try {
      setCrewLoading(true);
      setCrewError('');
      const data = await listCrewMembers();
      setCrewMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load crew members', err);
      setCrewError('Failed to load crew members');
    } finally {
      setCrewLoading(false);
    }
  };

  const loadEmergencies = async (opts = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: opts.page || page,
        limit: 25,
      };
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.severity && filters.severity !== 'all') params.severity = filters.severity;
      if (filters.priority && filters.priority !== 'all') params.priority = filters.priority;
      if (filters.q) params.q = filters.q;

      const data = await listHealthEmergencies(params);
      setEmergencies(Array.isArray(data?.items) ? data.items : []);
      setSummary(data?.summary || null);
      setRecent(Array.isArray(data?.recent) ? data.recent : []);
      setTotal(data?.total || 0);
      setPages(data?.pages || 0);
      setPage(data?.page || 1);
    } catch (err) {
      console.error('Failed to load emergencies', err);
      setError('Failed to load emergencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencies({ page: 1 });
    loadCrewMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!editingEmergency || !crewMembers.length) return;
    const match = crewMembers.find((member) => member.crewId === editingEmergency.crewId);
    if (match) {
      setSelectedCrewMemberId(match._id);
    }
  }, [editingEmergency, crewMembers]);

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    const statusBreakdown = summary?.statusBreakdown || {};
    return [
      {
        key: 'active',
        icon: 'fas fa-ambulance',
        tone: 'danger',
        title: 'Active Emergencies',
        value: summary.activeCount || 0,
        note: `${statusBreakdown.reported || 0} reported • ${statusBreakdown.in_progress || 0} in progress`,
      },
      {
        key: 'severity',
        icon: 'fas fa-exclamation-triangle',
        tone: 'warning',
        title: 'Critical / High',
        value: (summary.severityBreakdown?.critical || 0) + (summary.severityBreakdown?.high || 0),
        note: `${summary.severityBreakdown?.moderate || 0} moderate, ${summary.severityBreakdown?.low || 0} low`,
      },
      {
        key: 'resolved',
        icon: 'fas fa-check-circle',
        tone: 'inventory',
        title: 'Resolved / Closed',
        value: summary.resolvedCount || 0,
        note: `${summary.total || 0} total logged`,
      },
    ];
  }, [summary]);

  const openCreateModal = () => {
    setForm(defaultForm());
    setEditingEmergency(null);
    setSelectedCrewMemberId('');
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    if (!record) return;
    setEditingEmergency(record);
    const recipientsRecord = defaultRecipients();
    if (Array.isArray(record.recipients)) {
      record.recipients.forEach((r) => {
        if (r?.role) recipientsRecord[r.role] = r.notified !== false;
      });
    }
    setForm({
      patientName: record.patientName || '',
      crewId: record.crewId || '',
      emergencyType: record.emergencyType || 'Medical',
      severity: record.severity || 'high',
      priority: record.priority || 'high',
      status: record.status || 'reported',
      location: record.location || '',
      description: record.description || '',
      immediateActions: record.immediateActions || '',
      reportedAt: record.reportedAt || record.createdAt || new Date().toISOString(),
      expectedArrival: record.expectedArrival || '',
      notifyCaptain: Boolean(record.notifyCaptain),
      notifyEmergencyTeam: record.notifyEmergencyTeam !== false,
      recipients: recipientsRecord,
      notes: record.notes || '',
    });
    setSelectedCrewMemberId('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(defaultForm());
    setEditingEmergency(null);
    setProcessing('');
    setSelectedCrewMemberId('');
  };

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRecipientToggle = (key) => {
    setForm((prev) => ({
      ...prev,
      recipients: { ...prev.recipients, [key]: !prev.recipients[key] },
    }));
  };

  const handleCrewSelection = (memberId) => {
    setSelectedCrewMemberId(memberId);
    const member = crewMembers.find((item) => item._id === memberId);
    if (member) {
      setForm((prev) => ({
        ...prev,
        patientName: member.fullName || prev.patientName,
        crewId: member.crewId || prev.crewId,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const mode = editingEmergency ? 'update' : 'create';
      setProcessing(mode);
      const recipients = Object.entries(form.recipients)
        .filter(([, checked]) => checked)
        .map(([role]) => ({ role, notified: true }));
      const payload = {
        patientName: form.patientName,
        crewId: form.crewId || undefined,
        emergencyType: form.emergencyType,
        severity: form.severity,
        priority: form.priority,
        status: form.status,
        location: form.location,
        description: form.description,
        immediateActions: form.immediateActions,
        reportedAt: form.reportedAt || undefined,
        expectedArrival: form.expectedArrival || undefined,
        recipients,
        notifyCaptain: form.notifyCaptain,
        notifyEmergencyTeam: form.notifyEmergencyTeam,
        notes: form.notes,
      };

      if (editingEmergency?._id) {
        await updateHealthEmergency(editingEmergency._id, payload);
      } else {
        await createHealthEmergency(payload);
      }

      closeModal();
      await loadEmergencies({ page: editingEmergency ? page : 1 });
    } catch (err) {
      console.error('Failed to save emergency', err);
      setError('Failed to save emergency');
    } finally {
      setProcessing('');
    }
  };

  const runRowAction = async (id, action, fn) => {
    try {
      setRowProcessing(`${id}-${action}`);
      setError('');
      await fn();
      await loadEmergencies({ page });
    } catch (err) {
      console.error(`Failed to ${action} emergency`, err);
      setError(`Failed to ${action} emergency`);
    } finally {
      setRowProcessing('');
    }
  };

  const handleAcknowledge = (id) => runRowAction(id, 'acknowledge', () => acknowledgeHealthEmergency(id));

  const handleResolve = (id) => {
    const summaryInput = window.prompt('Resolution summary (optional):', '');
    return runRowAction(id, 'resolve', () => resolveHealthEmergency(id, { resolutionSummary: summaryInput || '' }));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this emergency record?')) return;
    runRowAction(id, 'delete', () => deleteHealthEmergency(id));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    setPage(1);
    await loadEmergencies({ page: 1 });
  };

  const resetFilters = async () => {
    setFilters({ status: 'all', severity: 'all', priority: 'all', q: '' });
    setPage(1);
    await loadEmergencies({ page: 1 });
  };

  const handlePageChange = async (nextPage) => {
    if (nextPage < 1 || (pages && nextPage > pages)) return;
    setPage(nextPage);
    await loadEmergencies({ page: nextPage });
  };

  const isRowBusy = (id, action) => rowProcessing === `${id}-${action}`;

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          <div className="header">
            <h2>Health Emergency Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Health Officer'}</div>
                <small>Health Officer {user?.vessel ? `| ${user.vessel}` : '| MV Ocean Explorer'}</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {summaryCards.length > 0 && (
            <div className="cards-container" style={{ marginBottom: 20 }}>
              {summaryCards.map((card) => (
                <div className="card" key={card.key}>
                  <div className="card-header">
                    <div className="card-title">{card.title}</div>
                    <div className={`card-icon ${card.tone}`}><i className={card.icon}></i></div>
                  </div>
                  <div className="card-content">
                    <div className="card-item" style={{ fontSize: 28, fontWeight: 700 }}>{card.value}</div>
                    <div className="card-details">{card.note}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Emergency Log</div>
              <div className="page-actions">
                <button className="btn btn-outline" onClick={resetFilters}><i className="fas fa-undo"></i> Reset</button>
                <button className="btn btn-alert" onClick={openCreateModal}><i className="fas fa-plus"></i> New Emergency</button>
              </div>
            </div>

            <div className="filter-toolbar">
              <div className="filter-group">
                <label>Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Severity</label>
                <select value={filters.severity} onChange={(e) => handleFilterChange('severity', e.target.value)}>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Priority</label>
                <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ flex: 1 }}>
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search by patient, crew ID, location, type..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                />
              </div>
              <div className="filter-actions">
                <button className="btn btn-outline" onClick={applyFilters} disabled={loading}><i className="fas fa-filter"></i> Apply</button>
              </div>
            </div>

            {error && (
              <div className="alert-panel" style={{ background: '#fdecea', borderColor: '#f5c6cb', color: '#b71c1c', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className="alert-list">
              {loading && (
                <div className="alert-empty">Loading emergencies...</div>
              )}
              {!loading && !emergencies.length && (
                <div className="alert-empty">No health emergencies found.</div>
              )}
              {!loading && emergencies.map((emergency) => {
                const canAcknowledge = emergency.status === 'reported';
                const canResolve = emergency.status !== 'resolved' && emergency.status !== 'closed';
                const severityClass = emergency.severity || 'moderate';
                return (
                  <div key={emergency._id} className={`alert-item ${severityClass}`}>
                    <div className={`alert-icon ${severityClass}`}>
                      <i className={severityIconClass(emergency.severity)}></i>
                    </div>
                    <div className="alert-content">
                      <div className="alert-title">{emergency.patientName || 'Unknown Patient'}</div>
                      <div className="alert-meta">
                        <div className="alert-meta-item"><i className="fas fa-user"></i>{formatLabel(emergency.emergencyType)}</div>
                        {emergency.crewId && (
                          <div className="alert-meta-item"><i className="fas fa-id-badge"></i>{emergency.crewId}</div>
                        )}
                        <div className="alert-meta-item"><i className="fas fa-map-marker-alt"></i>{emergency.location || '—'}</div>
                        <div className="alert-meta-item"><i className="fas fa-clock"></i>{formatDateTime(emergency.reportedAt || emergency.createdAt)}</div>
                      </div>
                      {emergency.description && (
                        <div className="alert-description">{emergency.description}</div>
                      )}
                      {emergency.expectedArrival && (
                        <div className="alert-description">ETA: {formatDateTime(emergency.expectedArrival)}</div>
                      )}
                      <div className="alert-footer">
                        <div className="alert-footer-left">
                          <span className={`alert-status ${statusAlertClass(emergency.status)}`}>
                            {formatLabel(emergency.status)}
                          </span>
                          <span className={`alert-badge ${severityClass}`}>
                            {formatLabel(emergency.severity)}
                          </span>
                          <span className={`alert-badge ${emergency.priority || 'medium'}`}>
                            Priority: {formatLabel(emergency.priority)}
                          </span>
                        </div>
                        <div className="alert-actions">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEditModal(emergency)}
                            disabled={actionsDisabled || Boolean(rowProcessing)}
                          >
                            <i className="fas fa-edit"></i>
                            Edit
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            disabled={actionsDisabled || !canAcknowledge || isRowBusy(emergency._id, 'acknowledge')}
                            onClick={() => handleAcknowledge(emergency._id)}
                          >
                            <i className="fas fa-check"></i>
                            {isRowBusy(emergency._id, 'acknowledge') ? 'Acknowledging...' : 'Acknowledge'}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            disabled={actionsDisabled || !canResolve || isRowBusy(emergency._id, 'resolve')}
                            onClick={() => handleResolve(emergency._id)}
                          >
                            <i className="fas fa-flag"></i>
                            {isRowBusy(emergency._id, 'resolve') ? 'Resolving...' : 'Resolve'}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            disabled={actionsDisabled || isRowBusy(emergency._id, 'delete')}
                            onClick={() => handleDelete(emergency._id)}
                          >
                            <i className="fas fa-trash"></i>
                            {isRowBusy(emergency._id, 'delete') ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {pages > 1 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Page {page} of {pages} · {total} emergencies
                </div>
                <div className="pagination-controls">
                  <button className="btn" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>Previous</button>
                  <span className="page-badge">{page}</span>
                  <button className="btn" onClick={() => handlePageChange(page + 1)} disabled={pages && page >= pages}>Next</button>
                </div>
              </div>
            )}
          </div>

          {recent.length > 0 && (
            <div className="page-content">
              <div className="page-header">
                <div className="page-title">Recent Emergency Activity</div>
              </div>
              <div className="history-container">
                {recent.map((item) => (
                  <div className="history-item" key={item._id}>
                    <div className="history-info">
                      <div className="history-item-name">{item.patientName || 'Unknown Patient'}</div>
                      <div className="history-item-details">
                        {formatLabel(item.emergencyType)} • {formatLabel(item.status)}
                      </div>
                    </div>
                    <div className="history-status status-active">{formatDateTime(item.reportedAt || item.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEmergency ? 'Update Health Emergency' : 'Log New Health Emergency'}</h3>
              <button className="close-modal" onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Existing Crew Member</label>
                <select
                  className="form-control"
                  value={selectedCrewMemberId}
                  onChange={(e) => handleCrewSelection(e.target.value)}
                  disabled={crewLoading || !crewMembers.length}
                >
                  <option value="">Select crew member</option>
                  {crewMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.fullName || member.crewId || 'Unnamed Crew'}
                      {member.crewId ? ` (${member.crewId})` : ''}
                    </option>
                  ))}
                </select>
                {crewLoading && <small>Loading crew directory...</small>}
                {!crewLoading && crewError && <small style={{ color: '#b4232c' }}>{crewError}</small>}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Emergency Type</label>
                  <select
                    className="form-control"
                    value={form.emergencyType}
                    onChange={(e) => handleFormChange('emergencyType', e.target.value)}
                  >
                    {EMERGENCY_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Severity</label>
                  <select
                    className="form-control"
                    value={form.severity}
                    onChange={(e) => handleFormChange('severity', e.target.value)}
                  >
                    {SEVERITY_OPTIONS.filter((opt) => opt.value !== 'all').map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-control"
                    value={form.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                  >
                    {PRIORITY_OPTIONS.filter((opt) => opt.value !== 'all').map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  >
                    {STATUS_OPTIONS.filter((opt) => opt.value !== 'all').map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    id="location"
                    className="form-control"
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reportedAt">Reported At</label>
                  <input
                    id="reportedAt"
                    type="datetime-local"
                    className="form-control"
                    value={toLocalInputValue(form.reportedAt)}
                    onChange={(e) => handleFormChange('reportedAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="expectedArrival">Expected Arrival</label>
                  <input
                    id="expectedArrival"
                    type="datetime-local"
                    className="form-control"
                    value={toLocalInputValue(form.expectedArrival)}
                    onChange={(e) => handleFormChange('expectedArrival', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Emergency Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="immediateActions">Immediate Actions Taken</label>
                <textarea
                  id="immediateActions"
                  className="form-control"
                  rows={3}
                  value={form.immediateActions}
                  onChange={(e) => handleFormChange('immediateActions', e.target.value)}
                ></textarea>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Notify Captain</label>
                  <div>
                    <label>
                      <input
                        type="checkbox"
                        checked={form.notifyCaptain}
                        onChange={(e) => handleFormChange('notifyCaptain', e.target.checked)}
                      />{' '}
                      Enabled
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Notify Emergency Team</label>
                  <div>
                    <label>
                      <input
                        type="checkbox"
                        checked={form.notifyEmergencyTeam}
                        onChange={(e) => handleFormChange('notifyEmergencyTeam', e.target.checked)}
                      />{' '}
                      Enabled
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Alert Recipients</label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {RECIPIENT_OPTIONS.map((option) => (
                    <label key={option.key}>
                      <input
                        type="checkbox"
                        checked={form.recipients[option.key]}
                        onChange={() => handleRecipientToggle(option.key)}
                      />{' '}
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  className="form-control"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal} disabled={actionsDisabled || Boolean(rowProcessing)}>Cancel</button>
                <button type="submit" className="btn btn-alert" style={{ flex: 1 }} disabled={Boolean(processing)}>
                  {processing === 'create' ? 'Creating...' : processing === 'update' ? 'Saving...' : editingEmergency ? 'Save Changes' : 'Create Emergency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
