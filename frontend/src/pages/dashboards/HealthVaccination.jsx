import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import './healthVaccination.css';
import HealthSidebar from './HealthSidebar';
import {
  createVaccination,
  deleteVaccination,
  listCrewMembers,
  listVaccinations,
  updateVaccination,
} from '../../lib/healthApi';

const todayStr = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const isPast = (val) => {
  if (!val) return false;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  d.setHours(0,0,0,0); t.setHours(0,0,0,0);
  return d.getTime() < t.getTime();
};

const statusLabels = {
  'up-to-date': 'Up to Date',
  'due-soon': 'Due Soon',
  overdue: 'Overdue',
  completed: 'Completed',
  scheduled: 'Scheduled',
};

const statusClasses = {
  'up-to-date': 'status-active',
  'due-soon': 'status-warning',
  overdue: 'status-danger',
  completed: 'status-success',
  scheduled: 'status-info',
};

const alertTypeLabels = {
  overdue: 'Overdue',
  'due-soon': 'Due Soon',
  booster: 'Booster Required',
};

const alertStatusClasses = {
  active: 'status-active',
  snoozed: 'status-warning',
  resolved: 'status-success',
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const deriveAlertsFromRecords = (items = []) =>
  items
    .filter((item) => ['overdue', 'due-soon'].includes(item.status))
    .map((item) => ({
      id: item._id || item.id,
      alertDate: formatDate(item.nextDoseAt || item.administeredAt),
      crew: item.crewName || item.crewId,
      vaccine: item.vaccine,
      type: item.status,
      dueDate: formatDate(item.nextDoseAt || item.validUntil),
      status: 'active',
    }));

const deriveCertificatesFromRecords = (items = []) =>
  items
    .filter((item) => item.certificate)
    .map((item) => ({
      id: item._id || item.id,
      crew: item.crewName || item.crewId,
      vaccine: item.vaccine,
      issueDate: formatDate(item.certificate?.issueDate),
      validUntil: formatDate(item.certificate?.validUntil),
      status: item.status === 'completed' ? 'valid' : 'pending',
    }));

const deriveScheduleFromRecords = (items = []) => {
  const byVaccine = new Map();
  items.forEach((item) => {
    if (!item?.vaccine) return;
    const key = item.vaccine;
    const existing = byVaccine.get(key) || {
      id: key,
      vaccine: key,
      initialDose: '',
      booster: '',
      validity: '',
      required: true,
    };

    if (!existing.initialDose) {
      if (item.doseNumber) {
        existing.initialDose = `Dose ${item.doseNumber}`;
      } else if (item.administeredAt) {
        existing.initialDose = `Recorded ${formatDate(item.administeredAt)}`;
      } else {
        existing.initialDose = 'Recorded';
      }
    }

    if (!existing.booster && item.nextDoseAt) {
      existing.booster = `Next dose ${formatDate(item.nextDoseAt)}`;
    }

    if (!existing.validity && item.validUntil) {
      existing.validity = formatDate(item.validUntil);
    }

    byVaccine.set(key, existing);
  });
  return Array.from(byVaccine.values());
};

const createEmptyVaccinationForm = () => ({
  crewId: '',
  vaccine: '',
  administeredAt: '',
  batchNumber: '',
  doseNumber: '',
  nextDoseAt: '',
  validUntil: '',
  notes: '',
  generateCertificate: true,
});

const toDateInputValue = (value) => {
  if (!value) return '';
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsedString = new Date(trimmed);
    if (!Number.isNaN(parsedString.getTime())) {
      return parsedString.toISOString().slice(0, 10);
    }
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return '';
};

export default function HealthVaccination() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('records');
  const [newVaccinationOpen, setNewVaccinationOpen] = useState(false);
  const [filters, setFilters] = useState({ query: '', vaccine: 'all', status: 'all' });
  const [alertFilters, setAlertFilters] = useState({ type: 'all', status: 'all' });
  const [records, setRecords] = useState([]);
  const [crewOptions, setCrewOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [editingRecord, setEditingRecord] = useState(null);
  const [vaccinationForm, setVaccinationForm] = useState(() => createEmptyVaccinationForm());

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  const loadVaccinations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [vaccinationData, crewData] = await Promise.all([
        listVaccinations(),
        listCrewMembers(),
      ]);

      const vaccinationList = Array.isArray(vaccinationData)
        ? vaccinationData
        : vaccinationData?.items || [];
      const crewList = Array.isArray(crewData) ? crewData : crewData?.items || [];

      setRecords(vaccinationList);
      setCrewOptions(crewList);
    } catch (err) {
      console.error('loadVaccinations error', err);
      setRecords([]);
      setCrewOptions([]);
      setError(err?.response?.data?.message || 'Failed to load vaccination data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVaccinations();
  }, [loadVaccinations]);

  const vaccineOptions = useMemo(() => {
    return Array.from(new Set(records.map((rec) => rec.vaccine))).sort();
  }, [records]);

  const overviewStats = useMemo(() => {
    const total = records.length;
    const upToDate = records.filter((rec) => rec.status === 'up-to-date').length;
    const dueSoon = records.filter((rec) => rec.status === 'due-soon').length;
    const overdue = records.filter((rec) => rec.status === 'overdue').length;
    return { total, upToDate, dueSoon, overdue };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return records.filter((rec) => {
      const crewName = (rec.crewName || rec.crewId || '').toLowerCase();
      const vaccine = (rec.vaccine || '').toLowerCase();
      const matchQuery =
        !query ||
        crewName.includes(query) ||
        vaccine.includes(query) ||
        (rec.notes || '').toLowerCase().includes(query);
      const matchVaccine = filters.vaccine === 'all' || rec.vaccine === filters.vaccine;
      const matchStatus = filters.status === 'all' || rec.status === filters.status;
      return matchQuery && matchVaccine && matchStatus;
    });
  }, [filters, records]);

  const alerts = useMemo(() => deriveAlertsFromRecords(records), [records]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchType = alertFilters.type === 'all' || alert.type === alertFilters.type;
      const matchStatus = alertFilters.status === 'all' || alert.status === alertFilters.status;
      return matchType && matchStatus;
    });
  }, [alertFilters, alerts]);

  const schedule = useMemo(() => deriveScheduleFromRecords(records), [records]);

  const certificates = useMemo(() => deriveCertificatesFromRecords(records), [records]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAlertFilterChange = (key, value) => {
    setAlertFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormChange = (key, value) => {
    // Enforce today or future dates
    if (['administeredAt', 'nextDoseAt', 'validUntil'].includes(key)) {
      if (isPast(value)) {
        setError('Date cannot be in the past. Please select today or a future date.');
        return;
      }
      setError('');
    }
    setVaccinationForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateModal = () => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    setModalMode('create');
    setEditingRecord(null);
    setVaccinationForm({
      ...createEmptyVaccinationForm(),
      administeredAt: toDateInputValue(today),
      nextDoseAt: toDateInputValue(nextYear),
      validUntil: toDateInputValue(nextYear),
      generateCertificate: true,
    });
    setError('');
    setNewVaccinationOpen(true);
  };

  const handleEditRecord = (record) => {
    if (!record) return;
    const recordId = record._id || record.id;
    if (!recordId) return;
    setModalMode('edit');
    setEditingRecord(record);
    setVaccinationForm({
      ...createEmptyVaccinationForm(),
      crewId: record.crewId || '',
      vaccine: record.vaccine || '',
      administeredAt: toDateInputValue(record.administeredAt),
      batchNumber: record.batchNumber || '',
      doseNumber: record.doseNumber || '',
      nextDoseAt: toDateInputValue(record.nextDoseAt || record.validUntil),
      validUntil: toDateInputValue(record.validUntil),
      notes: record.notes || '',
      generateCertificate: Boolean(record.certificate),
    });
    setError('');
    setNewVaccinationOpen(true);
  };

  const closeVaccinationModal = () => {
    setNewVaccinationOpen(false);
    setModalMode('create');
    setEditingRecord(null);
    setVaccinationForm(createEmptyVaccinationForm());
  };

  const submitVaccination = async (event) => {
    event.preventDefault();
    if (saving) return;

    const crewId = String(vaccinationForm.crewId || '').trim();
    const vaccine = String(vaccinationForm.vaccine || '').trim();
    const administeredAt = String(vaccinationForm.administeredAt || '').trim();

    if (!crewId || !vaccine || !administeredAt) {
      setError('crewId, vaccine and administered date are required.');
      return;
    }

    const crew = crewOptions.find((option) => option.crewId === crewId);
    const payload = {
      crewId,
      crewName: crew?.fullName,
      vaccine,
      doseNumber: String(vaccinationForm.doseNumber || '').trim() || undefined,
      batchNumber: String(vaccinationForm.batchNumber || '').trim() || undefined,
      administeredAt,
      nextDoseAt: String(vaccinationForm.nextDoseAt || '').trim() || undefined,
      validUntil: String(vaccinationForm.validUntil || '').trim() || undefined,
      notes: String(vaccinationForm.notes || '').trim() || undefined,
    };

    if (vaccinationForm.generateCertificate) {
      payload.certificate = {
        issueDate: administeredAt,
        validUntil: payload.validUntil,
      };
    }

    setSaving(true);
    setError('');
    try {
      if (modalMode === 'edit' && (editingRecord?._id || editingRecord?.id)) {
        const recordId = editingRecord._id || editingRecord.id;
        await updateVaccination(recordId, payload);
      } else {
        await createVaccination(payload);
      }
      await loadVaccinations();
      closeVaccinationModal();
    } catch (err) {
      console.error('submitVaccination error', err);
      setError(err?.response?.data?.message || 'Failed to save vaccination record');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    const recordId = record?._id || record?.id;
    if (!recordId) return;
    const crewDisplay = record.crewName || record.crewId || 'this record';
    if (!window.confirm(`Delete vaccination record for ${crewDisplay}?`)) return;
    setDeletingId(recordId);
    setError('');
    try {
      await deleteVaccination(recordId);
      await loadVaccinations();
    } catch (err) {
      console.error('deleteVaccination error', err);
      setError(err?.response?.data?.message || 'Failed to delete vaccination record');
    } finally {
      setDeletingId(null);
    }
  };

  const tabButton = (key, label) => (
    <div
      key={key}
      className={`tab ${activeTab === key ? 'active' : ''}`}
      onClick={() => setActiveTab(key)}
      role="button"
      tabIndex={0}
    >
      {label}
    </div>
  );

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          <div className="header">
            <h2>Vaccination Records & Alerts</h2>
            <div className="user-info">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`}
                alt="User"
              />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {error && (
            <div
              style={{
                margin: '12px 0',
                padding: '12px 14px',
                borderRadius: 10,
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Vaccination Overview</div>
              <div className="page-actions">
                <button className="btn btn-outline">
                  <i className="fas fa-file-import"></i> Import Records
                </button>
                <button className="btn btn-vaccination" onClick={openCreateModal}>
                  <i className="fas fa-plus"></i> New Vaccination
                </button>
              </div>
            </div>

            <div className="vaccination-overview">
              <div className="overview-card">
                <div className="label">Total Records</div>
                <div className="value">{overviewStats.total}</div>
              </div>
              <div className="overview-card">
                <div className="label">Up to Date</div>
                <div className="value">{overviewStats.upToDate}</div>
              </div>
              <div className="overview-card">
                <div className="label">Due Soon</div>
                <div className="value">{overviewStats.dueSoon}</div>
              </div>
              <div className="overview-card">
                <div className="label">Overdue</div>
                <div className="value overdue">{overviewStats.overdue}</div>
              </div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Vaccination Management</div>
            </div>

            <div className="tabs tabs-vaccination">
              {tabButton('records', 'Vaccination Records')}
              {tabButton('alerts', 'Alerts')}
              {tabButton('schedule', 'Vaccination Schedule')}
              {tabButton('certificates', 'Certificates')}
            </div>

            {activeTab === 'records' && (
              <div className="tab-content active">
                <div className="search-filter vaccination-inline">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                      type="text"
                      placeholder="Search crew, vaccine, or notes..."
                      value={filters.query}
                      onChange={(e) => handleFilterChange('query', e.target.value)}
                    />
                  </div>
                  <select
                    className="filter-select"
                    value={filters.vaccine}
                    onChange={(e) => handleFilterChange('vaccine', e.target.value)}
                  >
                    <option value="all">All Vaccines</option>
                    {vaccineOptions.map((vaccine) => (
                      <option key={vaccine} value={vaccine}>
                        {vaccine}
                      </option>
                    ))}
                  </select>
                  <select
                    className="filter-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="up-to-date">Up to Date</option>
                    <option value="due-soon">Due Soon</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Vaccine</th>
                        <th>Date Administered</th>
                        <th>Next Due</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                            Loading vaccination records...
                          </td>
                        </tr>
                      ) : filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                            No vaccination records match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((rec) => {
                          const key = rec._id || rec.id;
                          const crewDisplay = rec.crewName || rec.crewId || '—';
                          return (
                            <tr key={key}>
                              <td>{crewDisplay}</td>
                              <td>{rec.vaccine || '—'}</td>
                              <td>{formatDate(rec.administeredAt)}</td>
                              <td>{formatDate(rec.nextDoseAt || rec.validUntil)}</td>
                              <td>
                                <span className={`status-badge ${statusClasses[rec.status] || 'status-info'}`}>
                                  {statusLabels[rec.status] || (rec.status ? rec.status.toString() : '—')}
                                </span>
                              </td>
                              <td>{rec.notes || '—'}</td>
                              <td className="action-buttons">
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleEditRecord(rec)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleDeleteRecord(rec)}
                                  disabled={deletingId === key}
                                >
                                  {deletingId === key ? 'Deleting…' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="tab-content active">
                <div className="search-filter alert-inline">
                  <select
                    className="filter-select"
                    value={alertFilters.type}
                    onChange={(e) => handleAlertFilterChange('type', e.target.value)}
                  >
                    <option value="all">All Alert Types</option>
                    <option value="overdue">Overdue</option>
                    <option value="due-soon">Due Soon</option>
                    <option value="booster">Booster Required</option>
                  </select>
                  <select
                    className="filter-select"
                    value={alertFilters.status}
                    onChange={(e) => handleAlertFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="snoozed">Snoozed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Alert Date</th>
                        <th>Crew Member</th>
                        <th>Vaccine</th>
                        <th>Alert Type</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                            Loading alerts...
                          </td>
                        </tr>
                      ) : filteredAlerts.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                            No alerts match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredAlerts.map((alert) => (
                          <tr key={alert.id}>
                            <td>{alert.alertDate}</td>
                            <td>{alert.crew}</td>
                            <td>{alert.vaccine}</td>
                            <td>{alertTypeLabels[alert.type] || alert.type}</td>
                            <td>{alert.dueDate}</td>
                            <td>
                              <span className={`status-badge ${alertStatusClasses[alert.status] || 'status-info'}`}>
                                {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="tab-content active">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Vaccine</th>
                        <th>Initial Dose</th>
                        <th>Booster Schedule</th>
                        <th>Validity Period</th>
                        <th>Required for Voyage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                            Loading vaccination schedule...
                          </td>
                        </tr>
                      ) : schedule.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                            No vaccination schedule configured yet. Add records with upcoming boosters to populate this view.
                          </td>
                        </tr>
                      ) : (
                        schedule.map((row) => (
                          <tr key={row.id}>
                            <td>{row.vaccine}</td>
                            <td>{row.initialDose}</td>
                            <td>{row.booster || '—'}</td>
                            <td>{row.validity || '—'}</td>
                            <td>
                              {row.required ? (
                                <i className="fas fa-check" style={{ color: 'var(--success)' }}></i>
                              ) : (
                                <i className="fas fa-minus" style={{ color: '#94a3b8' }}></i>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className="tab-content active">
                <div className="certificate-preview">
                  <div className="certificate-logo">
                    <i className="fas fa-syringe"></i>
                  </div>
                  <div className="certificate-title">Vaccination Certificates</div>
                  <div className="certificate-details">
                    <div className="certificate-row">
                      <span><strong>Status</strong></span>
                      <span>{certificates.length === 0 ? 'No certificates generated yet.' : `${certificates.length} certificate(s) available.`}</span>
                    </div>
                    <div className="certificate-row">
                      <span><strong>Next Step</strong></span>
                      <span>Generate certificates once vaccination records are synced.</span>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Vaccine</th>
                        <th>Certificate Issue Date</th>
                        <th>Valid Until</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                            Loading certificates...
                          </td>
                        </tr>
                      ) : certificates.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                            Certificates will appear here once generated.
                          </td>
                        </tr>
                      ) : (
                        certificates.map((row) => (
                          <tr key={row.id}>
                            <td>{row.crew}</td>
                            <td>{row.vaccine}</td>
                            <td>{row.issueDate}</td>
                            <td>{row.validUntil}</td>
                            <td>
                              <span className={`status-badge ${row.status === 'valid' ? 'status-active' : 'status-warning'}`}>
                                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {newVaccinationOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeVaccinationModal()}>
          <div className="modal-content" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3 className="modal-title">{modalMode === 'edit' ? 'Update Vaccination Record' : 'Record New Vaccination'}</h3>
              <button className="close-modal" onClick={closeVaccinationModal}>&times;</button>
            </div>
            <form onSubmit={submitVaccination} id="vaccinationForm">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="vaccinationPatient">Crew Member *</label>
                  <select
                    name="crewId"
                    id="vaccinationPatient"
                    className="form-control"
                    required
                    value={vaccinationForm.crewId}
                    onChange={(e) => handleFormChange('crewId', e.target.value)}
                  >
                    <option value="">Select crew member</option>
                    {crewOptions.map((crew) => (
                      <option key={crew.crewId} value={crew.crewId}>
                        {crew.fullName ? `${crew.fullName} (${crew.crewId})` : crew.crewId}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="vaccineType">Vaccine *</label>
                  <select
                    name="vaccine"
                    id="vaccineType"
                    className="form-control"
                    required
                    value={vaccinationForm.vaccine}
                    onChange={(e) => handleFormChange('vaccine', e.target.value)}
                  >
                    <option value="">Select vaccine</option>
                    <option value="covid">COVID-19</option>
                    <option value="influenza">Influenza</option>
                    <option value="yellow-fever">Yellow Fever</option>
                    <option value="tetanus">Tetanus</option>
                    <option value="hepatitis-a">Hepatitis A</option>
                    <option value="hepatitis-b">Hepatitis B</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="vaccinationDate">Date Administered *</label>
                  <input
                    type="date"
                    name="administeredAt"
                    id="vaccinationDate"
                    className="form-control"
                    required
                    value={vaccinationForm.administeredAt}
                    onChange={(e) => handleFormChange('administeredAt', e.target.value)}
                    min={todayStr()}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="batchNumber">Batch Number *</label>
                  <input
                    type="text"
                    name="batchNumber"
                    id="batchNumber"
                    className="form-control"
                    placeholder="Vaccine batch number"
                    required
                    value={vaccinationForm.batchNumber}
                    onChange={(e) => handleFormChange('batchNumber', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="doseNumber">Dose Number</label>
                  <select
                    name="doseNumber"
                    id="doseNumber"
                    className="form-control"
                    value={vaccinationForm.doseNumber}
                    onChange={(e) => handleFormChange('doseNumber', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="1">1st Dose</option>
                    <option value="2">2nd Dose</option>
                    <option value="booster">Booster</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="nextDoseDate">Next Dose Date</label>
                  <input
                    type="date"
                    name="nextDoseAt"
                    id="nextDoseDate"
                    className="form-control"
                    value={vaccinationForm.nextDoseAt}
                    onChange={(e) => handleFormChange('nextDoseAt', e.target.value)}
                    min={todayStr()}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="validUntil">Valid Until</label>
                  <input
                    type="date"
                    name="validUntil"
                    id="validUntil"
                    className="form-control"
                    value={vaccinationForm.validUntil}
                    onChange={(e) => handleFormChange('validUntil', e.target.value)}
                    min={todayStr()}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="administeringOfficer">Administering Officer</label>
                  <input type="text" id="administeringOfficer" className="form-control" value={user?.fullName || 'Dr. Sarah Johnson'} readOnly />
                </div>
              </div>

              <div className="form-group">
                  <label htmlFor="vaccinationNotes">Notes</label>
                  <textarea
                    name="notes"
                    id="vaccinationNotes"
                    className="form-control"
                    rows={3}
                    placeholder="Any reactions or additional information..."
                    value={vaccinationForm.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                  ></textarea>
              </div>

              <div className="form-group">
                  <label htmlFor="certificateGenerate">Generate Certificate</label>
                  <div>
                  <input
                    type="checkbox"
                    name="generateCertificate"
                    id="certificateGenerate"
                    checked={vaccinationForm.generateCertificate}
                    onChange={(e) => handleFormChange('generateCertificate', e.target.checked)}
                  /> Generate vaccination certificate
                  </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={closeVaccinationModal} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-vaccination" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : modalMode === 'edit' ? 'Update Vaccination Record' : 'Save Vaccination Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
