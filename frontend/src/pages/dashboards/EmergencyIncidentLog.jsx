import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import EmergencySidebar from './EmergencySidebar';
import {
  listIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  resolveIncident,
  appendTimelineEntry,
  appendActionLogEntry,
} from '../../lib/emergencyIncidentApi';
import { listCrewProfiles } from '../../lib/emergencyCrewApi';
import './emergencyOfficerDashboard.css';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const SEVERITY_FILTERS = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
];

const severityToLabel = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

const statusToLabel = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  ARCHIVED: 'Archived',
};

const statusToBadge = {
  NEW: 'pending',
  IN_PROGRESS: 'inprogress',
  RESOLVED: 'completed',
  ARCHIVED: 'ongoing',
};

const crewOptionId = (crew) => crew?._id || crew?.id || crew?.crewId || '';

const createEmptyForm = (user) => ({
  incidentCode: '',
  title: '',
  description: '',
  severity: 'critical',
  status: 'NEW',
  category: 'Medical',
  location: '',
  reportedBy: user?.fullName || '',
  assignedTo: '',
  startedAt: '',
  notes: '',
  patientName: '',
  patientCrewId: '',
  patientRole: '',
  patientAge: '',
  patientBloodType: '',
});

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function EmergencyIncidentLog() {
  const navigate = useNavigate();
  const user = getUser();

  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'all', severity: 'all' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [formData, setFormData] = useState(createEmptyForm(user));
  const [formErrors, setFormErrors] = useState({});
  const [timelineInput, setTimelineInput] = useState({ label: '', description: '' });
  const [actionInput, setActionInput] = useState({ officer: user?.fullName || '', action: '' });
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [crewOptions, setCrewOptions] = useState([]);
  const [crewLoading, setCrewLoading] = useState(false);
  const [crewError, setCrewError] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState('');

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listIncidents();
      const normalized = Array.isArray(data) ? data : [];
      normalized.sort((a, b) => new Date(b.startedAt || b.createdAt || 0) - new Date(a.startedAt || a.createdAt || 0));
      setIncidents(normalized);
      if (normalized.length && !selectedId) {
        setSelectedId(normalized[0]._id);
      }
    } catch (err) {
      setError('Unable to load incidents. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadCrew = async () => {
      setCrewLoading(true);
      setCrewError('');
      try {
        const data = await listCrewProfiles({ status: 'active', limit: 200 });
        if (!ignore) setCrewOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!ignore) setCrewError('Unable to load crew directory.');
      } finally {
        if (!ignore) setCrewLoading(false);
      }
    };
    loadCrew();
    return () => { ignore = true; };
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (filters.status !== 'all' && incident.status !== filters.status) return false;
      if (filters.severity !== 'all' && incident.severity !== filters.severity) return false;
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const text = `${incident.incidentCode || ''} ${incident.title || ''} ${incident.patient?.name || ''} ${incident.location || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [filters, incidents]);

  useEffect(() => {
    if (!filteredIncidents.length) {
      setSelectedId(null);
      return;
    }
    if (selectedId && filteredIncidents.some((incident) => incident._id === selectedId)) {
      return;
    }
    setSelectedId(filteredIncidents[0]._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredIncidents]);

  const selectedIncident = incidents.find((incident) => incident._id === selectedId) || null;

  useEffect(() => {
    if (!selectedIncident) {
      setNotesValue('');
      setTimelineInput({ label: '', description: '' });
      setActionInput({ officer: user?.fullName || '', action: '' });
      return;
    }
    setNotesValue(selectedIncident.notes || '');
    setActionInput({ officer: selectedIncident.assignedTo || user?.fullName || '', action: '' });
  }, [selectedIncident, user]);

  const metrics = useMemo(() => {
    const total = incidents.length;
    const active = incidents.filter((incident) => incident.status !== 'RESOLVED' && incident.status !== 'ARCHIVED').length;
    const resolved = incidents.filter((incident) => incident.status === 'RESOLVED').length;
    const critical = incidents.filter((incident) => incident.severity === 'critical').length;
    return { total, active, resolved, critical };
  }, [incidents]);

  const openCreateEditor = () => {
    setEditorMode('create');
    setFormData({
      ...createEmptyForm(user),
      incidentCode: `INC-${Date.now()}`,
    });
    setFormErrors({});
    setIsEditorOpen(true);
    setSelectedCrewId('');
  };

  const openEditEditor = () => {
    if (!selectedIncident) return;
    setEditorMode('edit');
    setFormData({
      incidentCode: selectedIncident.incidentCode || '',
      title: selectedIncident.title || '',
      description: selectedIncident.description || '',
      severity: selectedIncident.severity || 'info',
      status: selectedIncident.status || 'NEW',
      category: selectedIncident.category || 'Medical',
      location: selectedIncident.location || '',
      reportedBy: selectedIncident.reportedBy || '',
      assignedTo: selectedIncident.assignedTo || '',
      startedAt: selectedIncident.startedAt ? new Date(selectedIncident.startedAt).toISOString().slice(0, 16) : '',
      notes: selectedIncident.notes || '',
      patientName: selectedIncident.patient?.name || '',
      patientCrewId: selectedIncident.patient?.crewId || '',
      patientRole: selectedIncident.patient?.role || '',
      patientAge: selectedIncident.patient?.age ?? '',
      patientBloodType: selectedIncident.patient?.bloodType || '',
    });
    setFormErrors({});
    setIsEditorOpen(true);
    const match = crewOptions.find((crew) => crew.crewId === selectedIncident.patient?.crewId);
    setSelectedCrewId(crewOptionId(match));
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSubmitting(false);
  };

  const onFormChange = (field) => (event) => {
    const value = event.target.value;
    if (['patientName', 'patientCrewId', 'patientRole', 'patientAge', 'patientBloodType'].includes(field)) {
      setSelectedCrewId('');
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.incidentCode.trim()) nextErrors.incidentCode = 'Incident code is required';
    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.reportedBy.trim()) nextErrors.reportedBy = 'Reporter is required';
    if (!formData.patientName.trim()) nextErrors.patientName = 'Patient name is required';
    if (!formData.location.trim()) nextErrors.location = 'Location is required';
    return nextErrors;
  };

  const buildPayload = () => {
    const payload = {
      incidentCode: formData.incidentCode.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      severity: (formData.severity || 'info').toLowerCase(),
      status: (formData.status || 'NEW').toUpperCase(),
      category: formData.category.trim(),
      location: formData.location.trim(),
      reportedBy: formData.reportedBy.trim(),
      assignedTo: formData.assignedTo.trim(),
      notes: formData.notes.trim(),
    };

    if (!payload.category) delete payload.category;
    if (!payload.assignedTo) delete payload.assignedTo;
    if (!payload.notes) delete payload.notes;

    if (formData.startedAt) {
      payload.startedAt = new Date(formData.startedAt);
    }

    const patient = {
      name: formData.patientName.trim(),
      crewId: formData.patientCrewId.trim(),
      role: formData.patientRole.trim(),
      bloodType: formData.patientBloodType.trim(),
    };
    if (formData.patientAge !== '' && formData.patientAge !== null && formData.patientAge !== undefined) {
      const ageNum = Number(formData.patientAge);
      if (!Number.isNaN(ageNum)) patient.age = ageNum;
    }
    Object.keys(patient).forEach((key) => {
      if (patient[key] === '') {
        delete patient[key];
      }
    });
    payload.patient = patient;
    return payload;
  };

  const submitForm = async () => {
    const validation = validateForm();
    setFormErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editorMode === 'create') {
        const created = await createIncident(payload);
        setIncidents((prev) => [created, ...prev]);
        setSelectedId(created._id);
      } else if (selectedIncident) {
        const updated = await updateIncident(selectedIncident._id, payload);
        setIncidents((prev) => prev.map((incident) => (incident._id === updated._id ? updated : incident)));
        setSelectedId(updated._id);
      }
      closeEditor();
    } catch (err) {
      setError('Unable to save incident. Please try again.');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIncident) return;
    if (!window.confirm('Delete this incident?')) return;
    try {
      await deleteIncident(selectedIncident._id);
      setIncidents((prev) => prev.filter((incident) => incident._id !== selectedIncident._id));
      setSelectedId(null);
    } catch (err) {
      setError('Failed to delete incident.');
    }
  };

  const handleResolve = async () => {
    if (!selectedIncident) return;
    try {
      const updated = await resolveIncident(selectedIncident._id, notesValue ? { notes: notesValue } : {});
      setIncidents((prev) => prev.map((incident) => (incident._id === updated._id ? updated : incident)));
      setSelectedId(updated._id);
    } catch (err) {
      setError('Failed to resolve incident.');
    }
  };

  const addTimelineEntry = async () => {
    if (!selectedIncident) return;
    if (!timelineInput.label.trim() && !timelineInput.description.trim()) return;
    try {
      const updated = await appendTimelineEntry(selectedIncident._id, {
        label: timelineInput.label.trim() || 'Update',
        description: timelineInput.description.trim(),
      });
      setIncidents((prev) => prev.map((incident) => (incident._id === updated._id ? updated : incident)));
      setTimelineInput({ label: '', description: '' });
    } catch (err) {
      setError('Failed to append timeline entry.');
    }
  };

  const addActionEntry = async () => {
    if (!selectedIncident) return;
    if (!actionInput.action.trim()) return;
    try {
      const updated = await appendActionLogEntry(selectedIncident._id, {
        officer: actionInput.officer?.trim() || user?.fullName || 'Officer',
        action: actionInput.action.trim(),
      });
      setIncidents((prev) => prev.map((incident) => (incident._id === updated._id ? updated : incident)));
      setActionInput((prev) => ({ ...prev, action: '' }));
    } catch (err) {
      setError('Failed to append action log.');
    }
  };

  const handleCrewSelect = (event) => {
    const crewId = event.target.value;
    setSelectedCrewId(crewId);
    if (!crewId) return;
    const profile = crewOptions.find((crew) => crewOptionId(crew) === crewId);
    if (!profile) return;
    setFormData((prev) => ({
      ...prev,
      patientName: profile.fullName || prev.patientName || '',
      patientCrewId: profile.crewId || prev.patientCrewId || '',
      patientRole: profile.position || profile.role || prev.patientRole || '',
      patientAge: profile.age !== undefined && profile.age !== null ? String(profile.age) : prev.patientAge,
      patientBloodType: profile.bloodType || prev.patientBloodType || '',
    }));
  };

  const saveNotes = async () => {
    if (!selectedIncident) return;
    setSavingNotes(true);
    try {
      const updated = await updateIncident(selectedIncident._id, { notes: notesValue });
      setIncidents((prev) => prev.map((incident) => (incident._id === updated._id ? updated : incident)));
    } catch (err) {
      setError('Unable to update notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const severityBadge = (severity) => {
    if (severity === 'critical') return 'badge-critical';
    if (severity === 'warning') return 'badge-pending';
    return 'badge-ongoing';
  };

  return (
    <div className="emergency-dashboard incident-log-screen">
      <EmergencySidebar active="incident-log" onLogout={onLogout} />
      <div className="dashboard-main incident-log">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Emergency Incident Log</h1>
            <div className="dashboard-meta">
              <span className="dashboard-update">Live overview of ship-wide emergencies</span>
            </div>
          </div>
          <div className="dashboard-actions">
            <button className="btn btn-outline" onClick={fetchIncidents}>
              <i className="fas fa-sync"></i> Refresh
            </button>
            <button className="btn btn-primary" onClick={openCreateEditor}>
              <i className="fas fa-plus"></i> New Incident
            </button>
          </div>
        </div>

        {error && <div className="incident-error">{error}</div>}

        <div className="incident-metrics">
          <div className="incident-metric">
            <div className="metric-icon info"><i className="fas fa-clipboard-list"></i></div>
            <div>
              <div className="metric-label">Total Incidents</div>
              <div className="metric-value">{metrics.total}</div>
            </div>
          </div>
          <div className="incident-metric">
            <div className="metric-icon danger"><i className="fas fa-heartbeat"></i></div>
            <div>
              <div className="metric-label">Critical Cases</div>
              <div className="metric-value">{metrics.critical}</div>
            </div>
          </div>
          <div className="incident-metric">
            <div className="metric-icon warning"><i className="fas fa-exclamation-triangle"></i></div>
            <div>
              <div className="metric-label">Active Responses</div>
              <div className="metric-value">{metrics.active}</div>
            </div>
          </div>
          <div className="incident-metric">
            <div className="metric-icon success"><i className="fas fa-check-circle"></i></div>
            <div>
              <div className="metric-label">Resolved</div>
              <div className="metric-value">{metrics.resolved}</div>
            </div>
          </div>
        </div>

        <div className="incident-layout">
          <aside className="incident-list-panel">
            <div className="incident-list-header">
              <h2>Incident Queue</h2>
              <span>{filteredIncidents.length} showing</span>
            </div>
            <div className="incident-list-controls">
              <input
                type="search"
                className="form-control"
                placeholder="Search code, crew, location"
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              />
              <select
                className="form-control"
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                className="form-control"
                value={filters.severity}
                onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}
              >
                {SEVERITY_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="incident-list">
              {loading && <div className="incident-empty">Loading incidents…</div>}
              {!loading && !filteredIncidents.length && (
                <div className="incident-empty">No incidents match your filters.</div>
              )}
              {!loading && filteredIncidents.map((incident) => (
                <button
                  key={incident._id}
                  type="button"
                  className={`incident-list-item ${selectedId === incident._id ? 'active' : ''}`}
                  onClick={() => setSelectedId(incident._id)}
                >
                  <div className="incident-list-row">
                    <span className="incident-code">{incident.incidentCode || 'Untracked'}</span>
                    <span className={`badge ${severityBadge(incident.severity)}`}>
                      {severityToLabel[incident.severity] || 'Info'}
                    </span>
                  </div>
                  <div className="incident-list-title">{incident.title || 'Untitled Incident'}</div>
                  <div className="incident-list-meta">
                    <span><i className="fas fa-user"></i> {incident.patient?.name || 'Unknown'}</span>
                    <span><i className="fas fa-map-marker-alt"></i> {incident.location || 'No location'}</span>
                  </div>
                  <div className="incident-list-footer">
                    <span className={`badge badge-${statusToBadge[incident.status] || 'pending'}`}>
                      {statusToLabel[incident.status] || incident.status}
                    </span>
                    <span>{formatDateTime(incident.startedAt || incident.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="incident-detail-panel">
            {!selectedIncident && (
              <div className="incident-empty large">Select an incident to review details.</div>
            )}

            {selectedIncident && (
              <>
                <div className="incident-detail-header">
                  <div>
                    <h2>{selectedIncident.title || 'Untitled Incident'}</h2>
                    <div className="incident-detail-tags">
                      <span className={`badge ${severityBadge(selectedIncident.severity)}`}>
                        {severityToLabel[selectedIncident.severity] || 'Info'}
                      </span>
                      <span className={`badge badge-${statusToBadge[selectedIncident.status] || 'pending'}`}>
                        {statusToLabel[selectedIncident.status] || selectedIncident.status}
                      </span>
                    </div>
                  </div>
                  <div className="incident-detail-actions">
                    <button className="btn btn-outline" onClick={openEditEditor}>
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button className="btn btn-success" onClick={handleResolve} disabled={selectedIncident.status === 'RESOLVED'}>
                      <i className="fas fa-check"></i> Resolve
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="incident-section">
                  <h3 className="incident-section-title">Patient Profile</h3>
                  <div className="incident-meta-grid">
                    <div className="incident-meta"><span className="label">Name</span><span className="value">{selectedIncident.patient?.name || '—'}</span></div>
                    <div className="incident-meta"><span className="label">Crew ID</span><span className="value">{selectedIncident.patient?.crewId || '—'}</span></div>
                    <div className="incident-meta"><span className="label">Role</span><span className="value">{selectedIncident.patient?.role || '—'}</span></div>
                    <div className="incident-meta"><span className="label">Age</span><span className="value">{selectedIncident.patient?.age ?? '—'}</span></div>
                    <div className="incident-meta"><span className="label">Blood Type</span><span className="value">{selectedIncident.patient?.bloodType || '—'}</span></div>
                  </div>
                </div>

                <div className="incident-section">
                  <h3 className="incident-section-title">Incident Brief</h3>
                  <div className="incident-meta-grid">
                    <div className="incident-meta"><span className="label">Incident Code</span><span className="value">{selectedIncident.incidentCode || '—'}</span></div>
                    <div className="incident-meta"><span className="label">Location</span><span className="value">{selectedIncident.location || '—'}</span></div>
                    <div className="incident-meta"><span className="label">Severity</span><span className="value">{severityToLabel[selectedIncident.severity] || 'Info'}</span></div>
                    <div className="incident-meta"><span className="label">Reported By</span><span className="value">{selectedIncident.reportedBy || '—'}</span></div>
                    <div className="incident-meta"><span className="label">Assigned To</span><span className="value">{selectedIncident.assignedTo || 'Unassigned'}</span></div>
                    <div className="incident-meta"><span className="label">Started</span><span className="value">{formatDateTime(selectedIncident.startedAt)}</span></div>
                    <div className="incident-meta"><span className="label">Last Update</span><span className="value">{formatDateTime(selectedIncident.lastUpdatedAt || selectedIncident.updatedAt)}</span></div>
                  </div>
                  {selectedIncident.description && (
                    <p className="incident-description">{selectedIncident.description}</p>
                  )}
                </div>

                <div className="incident-section">
                  <div className="section-header">
                    <h3 className="incident-section-title">Response Timeline</h3>
                    <div className="timeline-form">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Event label"
                        value={timelineInput.label}
                        onChange={(event) => setTimelineInput((prev) => ({ ...prev, label: event.target.value }))}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Details"
                        value={timelineInput.description}
                        onChange={(event) => setTimelineInput((prev) => ({ ...prev, description: event.target.value }))}
                      />
                      <button className="btn btn-outline" onClick={addTimelineEntry}>
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  <div className="incident-timeline">
                    {(!selectedIncident.timeline || !selectedIncident.timeline.length) && (
                      <div className="incident-empty">No timeline entries recorded.</div>
                    )}
                    {(selectedIncident.timeline || []).map((entry, index) => (
                      <div key={`${entry.time}-${index}`} className="timeline-entry">
                        <div className="entry-time">{formatDateTime(entry.time)}</div>
                        <div>
                          <div className="entry-title">{entry.label}</div>
                          {entry.description && <div className="entry-detail">{entry.description}</div>}
                          {entry.actor && <div className="entry-actor">Logged by {entry.actor}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="incident-section">
                  <div className="section-header">
                    <h3 className="incident-section-title">Action Log</h3>
                    <div className="timeline-form">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Officer"
                        value={actionInput.officer}
                        onChange={(event) => setActionInput((prev) => ({ ...prev, officer: event.target.value }))}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Action taken"
                        value={actionInput.action}
                        onChange={(event) => setActionInput((prev) => ({ ...prev, action: event.target.value }))}
                      />
                      <button className="btn btn-outline" onClick={addActionEntry}>
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  <div className="incident-actions">
                    {(!selectedIncident.actionLog || !selectedIncident.actionLog.length) && (
                      <div className="incident-empty">No action records yet.</div>
                    )}
                    {(selectedIncident.actionLog || []).map((entry, index) => (
                      <div key={`${entry.time}-${index}`} className="action-entry">
                        <div className="entry-head">
                          <span className="entry-officer"><i className="fas fa-user-shield"></i> {entry.officer}</span>
                          <span className="entry-time">{formatDateTime(entry.time)}</span>
                        </div>
                        <div className="entry-detail">{entry.action}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="incident-section">
                  <h3 className="incident-section-title">Incident Notes</h3>
                  <textarea
                    className="form-control incident-notes"
                    rows={5}
                    placeholder="Add summary, handover notes, or follow-up instructions"
                    value={notesValue}
                    onChange={(event) => setNotesValue(event.target.value)}
                  ></textarea>
                  <div className="notes-actions">
                    <button className="btn btn-outline" onClick={() => setNotesValue(selectedIncident.notes || '')}>Reset</button>
                    <button className="btn btn-primary" onClick={saveNotes} disabled={savingNotes}>
                      <i className="fas fa-save"></i> {savingNotes ? 'Saving…' : 'Save Notes'}
                    </button>
                  </div>
                </div>

                <div className="incident-section attachments">
                  <h3 className="incident-section-title">Attachments</h3>
                  <div className="attachment-summary">
                    <span><i className="fas fa-file-medical"></i> Reports: {(selectedIncident.attachments?.reports || []).length}</span>
                    <span><i className="fas fa-photo-video"></i> Media: {(selectedIncident.attachments?.media || []).length}</span>
                  </div>
                  <p className="attachment-hint">Upload endpoints are not implemented in this demo. Use the emergency file system to manage assets.</p>
                </div>
              </>
            )}
          </section>
        </div>

        {isEditorOpen && (
          <div className="incident-editor">
            <div className="editor-backdrop" onClick={closeEditor}></div>
            <div className="editor-card">
              <div className="editor-header">
                <h2>{editorMode === 'create' ? 'Create Incident' : 'Edit Incident'}</h2>
                <button className="editor-close" onClick={closeEditor}><i className="fas fa-times"></i></button>
              </div>
              <div className="editor-body">
                <div className="editor-grid">
                  <label>
                    <span>Incident Code</span>
                    <input type="text" value={formData.incidentCode} onChange={onFormChange('incidentCode')} />
                    {formErrors.incidentCode && <small className="error">{formErrors.incidentCode}</small>}
                  </label>
                  <label>
                    <span>Title</span>
                    <input type="text" value={formData.title} onChange={onFormChange('title')} />
                    {formErrors.title && <small className="error">{formErrors.title}</small>}
                  </label>
                  <label>
                    <span>Severity</span>
                    <select value={formData.severity} onChange={onFormChange('severity')}>
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={formData.status} onChange={onFormChange('status')}>
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </label>
                  <label>
                    <span>Category</span>
                    <input type="text" value={formData.category} onChange={onFormChange('category')} />
                  </label>
                  <label>
                    <span>Location</span>
                    <input type="text" value={formData.location} onChange={onFormChange('location')} />
                    {formErrors.location && <small className="error">{formErrors.location}</small>}
                  </label>
                  <label>
                    <span>Reported By</span>
                    <input type="text" value={formData.reportedBy} onChange={onFormChange('reportedBy')} />
                    {formErrors.reportedBy && <small className="error">{formErrors.reportedBy}</small>}
                  </label>
                  <label>
                    <span>Assigned To</span>
                    <input type="text" value={formData.assignedTo} onChange={onFormChange('assignedTo')} />
                  </label>
                  <label>
                    <span>Start Time</span>
                    <input type="datetime-local" value={formData.startedAt} onChange={onFormChange('startedAt')} />
                  </label>
                </div>

                <label className="full">
                  <span>Crew Directory</span>
                  <select value={selectedCrewId} onChange={handleCrewSelect}>
                    <option value="">Manual entry</option>
                    {crewOptions.map((crew) => (
                      <option key={crewOptionId(crew)} value={crewOptionId(crew)}>
                        {crew.fullName || crew.name || 'Unnamed Crew'}{crew.crewId ? ` • ${crew.crewId}` : ''}
                      </option>
                    ))}
                  </select>
                  {crewLoading && <small>Loading crew directory…</small>}
                  {crewError && <small className="error">{crewError}</small>}
                </label>

                <label className="full">
                  <span>Description</span>
                  <textarea rows={3} value={formData.description} onChange={onFormChange('description')}></textarea>
                </label>

                <div className="editor-grid">
                  <label>
                    <span>Patient Name</span>
                    <input type="text" value={formData.patientName} onChange={onFormChange('patientName')} />
                    {formErrors.patientName && <small className="error">{formErrors.patientName}</small>}
                  </label>
                  <label>
                    <span>Crew ID</span>
                    <input type="text" value={formData.patientCrewId} onChange={onFormChange('patientCrewId')} />
                  </label>
                  <label>
                    <span>Role</span>
                    <input type="text" value={formData.patientRole} onChange={onFormChange('patientRole')} />
                  </label>
                  <label>
                    <span>Age</span>
                    <input type="number" value={formData.patientAge} onChange={onFormChange('patientAge')} min={0} />
                  </label>
                  <label>
                    <span>Blood Type</span>
                    <input type="text" value={formData.patientBloodType} onChange={onFormChange('patientBloodType')} />
                  </label>
                </div>

                <label className="full">
                  <span>Quick Notes</span>
                  <textarea rows={2} value={formData.notes} onChange={onFormChange('notes')}></textarea>
                </label>
              </div>

              <div className="editor-footer">
                <button className="btn btn-outline" onClick={closeEditor}>Cancel</button>
                <button className="btn btn-primary" onClick={submitForm} disabled={submitting}>
                  <i className="fas fa-save"></i> {submitting ? 'Saving…' : 'Save Incident'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
