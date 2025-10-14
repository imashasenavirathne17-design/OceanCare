import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import CrewSidebar from './CrewSidebar';
import './crewDashboard.css';
import {
  listMyMedicalRecords,
  getMyMedicalRecord,
  createMyMedicalRecord,
  updateMyMedicalRecord,
  deleteMyMedicalRecord,
} from '../../lib/crewMedicalRecordsApi';

const TYPE_OPTIONS = [
  { value: 'medical-history', label: 'Medical History' },
  { value: 'examination', label: 'Examination' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'chronic', label: 'Chronic Condition' },
  { value: 'health-check', label: 'Health Check' },
  { value: 'mental-health', label: 'Mental Wellness' },
  { value: 'appointment', label: 'Medical Appointment' },
  { value: 'emergency', label: 'Emergency Report' },
];

const TYPE_LABELS = TYPE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const defaultMetrics = () => ({
  temperature: '',
  heartRate: '',
  bpSystolic: '',
  bpDiastolic: '',
  oxygen: '',
  respiratoryRate: '',
  glucose: '',
  weight: '',
  peakFlow: '',
  mentalScore: '',
  wellnessLevel: '',
});

const defaultMetadata = () => ({
  provider: '',
  officer: '',
  location: '',
  chronicType: '',
  vaccineName: '',
  doseNumber: '',
  followUp: '',
  sessionType: '',
});

const sanitizeObject = (obj = {}) => {
  const clean = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') {
      if (value.trim() === '') return;
      clean[key] = value.trim();
      return;
    }
    clean[key] = value;
  });
  return clean;
};

const METADATA_LABELS = {
  provider: 'Provider',
  officer: 'Officer',
  location: 'Location',
  chronicType: 'Chronic Condition',
  vaccineName: 'Vaccine',
  doseNumber: 'Dose #',
  followUp: 'Follow-up Notes',
  sessionType: 'Session Type',
};

const METRIC_LABELS = {
  temperature: 'Temperature (°C)',
  heartRate: 'Heart Rate (BPM)',
  bpSystolic: 'Blood Pressure Systolic',
  bpDiastolic: 'Blood Pressure Diastolic',
  oxygen: 'Oxygen Saturation (%)',
  respiratoryRate: 'Respiratory Rate',
  glucose: 'Glucose (mg/dL)',
  weight: 'Weight (kg)',
  peakFlow: 'Peak Flow (L/min)',
  mentalScore: 'Mental Health Score',
  wellnessLevel: 'Wellness Level',
};

const STATUS_TO_CLASS = {
  open: 'chip-info',
  scheduled: 'chip-info',
  monitoring: 'chip-warning',
  completed: 'chip-success',
  overdue: 'chip-warning',
};

const extractEntries = (source, labels) => {
  const sanitized = sanitizeObject(source || {});
  return Object.entries(labels)
    .map(([key, label]) => (sanitized[key] !== undefined ? { key, label, value: sanitized[key] } : null))
    .filter(Boolean);
};

const getMetadataEntries = (metadata) => extractEntries(metadata, METADATA_LABELS);
const getMetricEntries = (metrics) => extractEntries(metrics, METRIC_LABELS);

const formatStatus = (value) => {
  if (!value) return '—';
  if (STATUS_LABELS[value]) return STATUS_LABELS[value];
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const isWithinNextDays = (dateStr, days) => {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return false;
  const limit = days * 24 * 60 * 60 * 1000;
  return diff <= limit;
};

const MOCK_RECORDS = [
  {
    _id: 'mock-1',
    recordType: 'health-check',
    condition: 'Daily Health Check',
    date: '2025-10-15',
    notes: 'Vitals within normal range. No symptoms reported.',
    files: [],
    status: 'completed',
    nextDueDate: '2025-10-16',
    metadata: {
      provider: 'Self',
      officer: 'Dr. Johnson',
      location: 'Cabin 4',
      followUp: 'Submit tomorrow health check.',
    },
    metrics: {
      temperature: '36.8',
      heartRate: '72',
      bpSystolic: '118',
      bpDiastolic: '76',
      oxygen: '98',
      respiratoryRate: '16',
    },
  },
  {
    _id: 'mock-2',
    recordType: 'vaccination',
    condition: 'Influenza Booster',
    date: '2025-09-04',
    notes: 'No adverse reactions. Next dose due in one year.',
    files: [],
    status: 'scheduled',
    nextDueDate: '2026-09-01',
    metadata: {
      provider: 'MV Ocean Clinic',
      officer: 'Nurse Emily',
      location: 'Medical Bay',
      vaccineName: 'Influenza',
      doseNumber: '2',
      followUp: 'Schedule reminder for next season.',
    },
    metrics: {},
  },
];

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const UPLOADS_BASE = API_BASE.replace(/\/api$/, '') + '/uploads/medical-records/';

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const fileUrl = (file) => {
  if (!file) return null;
  const name = file.filename || (file.path ? file.path.split(/[\\/]/).pop() : '');
  return name ? `${UPLOADS_BASE}${name}` : null;
};

export default function CrewHealthRecords() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };
  const useMocks = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ recordType: 'all', dateFrom: '', dateTo: '', status: 'all' });
  const [revision, setRevision] = useState(0);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    id: null,
    recordType: '',
    condition: '',
    date: today(),
    notes: '',
    status: 'open',
    nextDueDate: '',
    metadata: defaultMetadata(),
    metrics: defaultMetrics(),
  });
  const [formFiles, setFormFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    const run = async () => {
      try {
        if (useMocks) {
          if (!ignore) setRecords(MOCK_RECORDS);
          return;
        }
        const params = {};
        const trimmed = query.trim();
        if (trimmed) params.q = trimmed;
        if (filters.recordType !== 'all' && filters.recordType) params.type = filters.recordType;
        if (filters.status !== 'all' && filters.status) params.status = filters.status;
        if (filters.dateFrom) params.from = filters.dateFrom;
        if (filters.dateTo) params.to = filters.dateTo;
        const data = await listMyMedicalRecords(params);
        if (!ignore) setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('listMyMedicalRecords error', err);
        if (!ignore) {
          setError('Failed to load medical records');
          if (useMocks) setRecords(MOCK_RECORDS);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, [filters.recordType, filters.status, filters.dateFrom, filters.dateTo, query, revision, useMocks]);

  const refresh = () => setRevision((v) => v + 1);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openView = async (record) => {
    const id = record?._id || record?.id;
    if (!id) return;
    setViewOpen(true);
    setViewLoading(true);
    try {
      if (useMocks) {
        const found = MOCK_RECORDS.find((item) => item._id === id);
        setViewRecord(found || record);
      } else {
        const data = await getMyMedicalRecord(id);
        setViewRecord(data);
      }
    } catch (err) {
      console.error('getMyMedicalRecord error', err);
      setViewRecord(record);
    } finally {
      setViewLoading(false);
    }
  };

  const openCreate = () => {
    setViewOpen(false);
    setForm({
      id: null,
      recordType: '',
      condition: '',
      date: today(),
      notes: '',
      status: 'open',
      nextDueDate: '',
      metadata: defaultMetadata(),
      metrics: defaultMetrics(),
    });
    setFormFiles([]);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (record) => {
    if (!record) return;
    setViewOpen(false);
    setForm({
      id: record._id || record.id,
      recordType: record.recordType || '',
      condition: record.condition || '',
      date: record.date ? String(record.date).slice(0, 10) : today(),
      notes: record.notes || '',
      status: record.status || 'open',
      nextDueDate: record.nextDueDate || '',
      metadata: { ...defaultMetadata(), ...(record.metadata || {}) },
      metrics: { ...defaultMetrics(), ...(record.metrics || {}) },
    });
    setFormFiles([]);
    setFormError('');
    setFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, metadata: { ...prev.metadata, [name]: value } }));
  };

  const handleMetricsChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, metrics: { ...prev.metrics, [name]: value } }));
  };

  const handleFileChange = (e) => {
    setFormFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recordType || !form.condition) {
      setFormError('Record type and condition are required');
      return;
    }
    setFormError('');
    setFormSubmitting(true);
    try {
      const payload = {
        recordType: form.recordType,
        condition: form.condition,
        date: form.date || today(),
        notes: form.notes || '',
        status: form.status || 'open',
        nextDueDate: form.nextDueDate || '',
        metadata: sanitizeObject(form.metadata || {}),
        metrics: sanitizeObject(form.metrics || {}),
      };
      if (useMocks) {
        if (form.id) {
          setRecords((prev) => prev.map((item) => (item._id === form.id ? { ...item, ...payload } : item)));
        } else {
          setRecords((prev) => [{ _id: `mock-${Date.now()}`, files: [], ...payload }, ...prev]);
        }
      } else if (form.id) {
        await updateMyMedicalRecord(form.id, payload, formFiles);
      } else {
        await createMyMedicalRecord(payload, formFiles);
      }
      setFormOpen(false);
      setForm({
        id: null,
        recordType: '',
        condition: '',
        date: today(),
        notes: '',
        status: 'open',
        nextDueDate: '',
        metadata: defaultMetadata(),
        metrics: defaultMetrics(),
      });
      setFormFiles([]);
      refresh();
    } catch (err) {
      console.error('save medical record error', err);
      setFormError('Failed to save medical record');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const id = record?._id || record?.id;
    if (!id) return;
    if (!window.confirm('Delete this medical record?')) return;
    setDeletingId(id);
    try {
      if (useMocks) {
        setRecords((prev) => prev.filter((item) => (item._id || item.id) !== id));
      } else {
        await deleteMyMedicalRecord(id);
      }
      refresh();
    } catch (err) {
      console.error('delete medical record error', err);
      alert('Failed to delete medical record');
    } finally {
      setDeletingId(null);
    }
  };

  const tableRows = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.map((record) => ({
      id: record._id || record.id,
      recordType: record.recordType,
      condition: record.condition,
      date: record.date,
      notes: record.notes,
      files: record.files || [],
      status: record.status,
      nextDueDate: record.nextDueDate,
      metadata: record.metadata || {},
      metrics: record.metrics || {},
      raw: record,
    }));
  }, [records]);

  const filteredRows = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return tableRows.filter((row) => {
      const typeLabel = TYPE_LABELS[row.recordType] || row.recordType || '';
      const matchesQuery = !lowered
        || typeLabel.toLowerCase().includes(lowered)
        || String(row.condition || '').toLowerCase().includes(lowered)
        || String(row.notes || '').toLowerCase().includes(lowered);
      return matchesQuery;
    });
  }, [tableRows, query]);

  const overviewCards = useMemo(() => {
    const rows = tableRows;
    const total = rows.length;
    const chronic = rows.filter((row) => row.recordType === 'chronic').length;
    const vaccinations = rows.filter((row) => row.recordType === 'vaccination').length;
    const examinations = rows.filter((row) => row.recordType === 'examination').length;
    const mental = rows.filter((row) => row.recordType === 'mental-health').length;
    const dueSoon = rows.filter((row) => isWithinNextDays(row.nextDueDate, 7)).length;
    const overdue = rows.filter((row) => String(row.status).toLowerCase() === 'overdue').length;
    return [
      { title: 'Total Records', value: total },
      { title: 'Chronic Tracking Entries', value: chronic },
      { title: 'Vaccination Records', value: vaccinations },
      { title: 'Examination Records', value: examinations },
      { title: 'Mental Health Entries', value: mental },
      { title: 'Due Within 7 Days', value: dueSoon },
      { title: 'Marked Overdue', value: overdue },
    ];
  }, [tableRows]);

  const renderFileList = (files) => {
    if (!files || files.length === 0) return null;
    return (
      <ul style={{ marginTop: 12 }}>
        {files.map((file, index) => {
          const url = fileUrl(file);
          return (
            <li key={`${file.filename || file.path || index}-${index}`}>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer">
                  {file.originalname || file.filename || 'Attachment'}
                </a>
              ) : (
                <span>{file.originalname || file.filename || 'Attachment'}</span>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Health Records</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <section className="dashboard-section">
            <div className="section-header" style={{ flexWrap: 'wrap' }}>
              <div>
                <div className="section-title">Your Health Records</div>
                <div className="section-subtitle">Access personal medical entries, examinations, and vaccinations</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={refresh}><i className="fas fa-sync"></i> Refresh</button>
                <button className="btn btn-primary" onClick={openCreate}><i className="fas fa-plus"></i> New Record</button>
              </div>
            </div>

            {error && <div className="empty" style={{ color: 'var(--danger)' }}>{error}</div>}

            {useMocks && (
              <div style={{ background: '#fff7e6', border: '1px solid #ffd591', color: '#ad6800', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>
                Mock data enabled (VITE_USE_MOCKS=true). Showing sample records while backend is offline.
              </div>
            )}

            {overviewCards.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                {overviewCards.map((card) => (
                  <div key={card.title} className="card" style={{ padding: 18, borderRadius: 12, background: '#f9fbff', border: '1px solid #dbeafe' }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{card.title}</div>
                    <div style={{ fontWeight: 600 }}>{card.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="records-filter" style={{ display: 'flex', gap: 15, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className="filter-group" style={{ flex: 2, minWidth: 240 }}>
                <label>Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by type, condition, or notes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
                <label>Record Type</label>
                <select name="recordType" className="form-control" value={filters.recordType} onChange={handleFilterChange}>
                  <option value="all">All Records</option>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 180 }}>
                <label>Status</label>
                <select name="status" className="form-control" value={filters.status} onChange={handleFilterChange}>
                  <option value="all">All Status</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 180 }}>
                <label>From Date</label>
                <input name="dateFrom" type="date" className="form-control" value={filters.dateFrom} onChange={handleFilterChange} />
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 180 }}>
                <label>To Date</label>
                <input name="dateTo" type="date" className="form-control" value={filters.dateTo} onChange={handleFilterChange} />
              </div>
            </div>

            {loading ? (
              <div className="empty"><div className="desc">Loading records...</div></div>
            ) : filteredRows.length === 0 ? (
              <div className="empty">
                <div className="title">No records found</div>
                <div className="desc">Add a record or adjust your filters.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Condition</th>
                      <th>Notes</th>
                      <th>Status</th>
                      <th>Next Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date || '—'}</td>
                        <td>{TYPE_LABELS[row.recordType] || row.recordType || '—'}</td>
                        <td>{row.condition || '—'}</td>
                        <td>{row.notes ? row.notes.slice(0, 80) + (row.notes.length > 80 ? '…' : '') : '—'}</td>
                        <td>
                          <span className={`chip ${STATUS_TO_CLASS[String(row.status || '').toLowerCase()] || 'chip-info'}`}>
                            {formatStatus(row.status)}
                          </span>
                        </td>
                        <td>{row.nextDueDate || '—'}</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => openView(row.raw)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(row.raw)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(row.raw)} disabled={deletingId === row.id}>
                            {deletingId === row.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {viewOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setViewOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">Medical Record Details</h3>
              <button className="close-modal" onClick={() => setViewOpen(false)}>&times;</button>
            </div>
            {viewLoading || !viewRecord ? (
              <div className="empty"><div className="desc">Loading record...</div></div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Date</div>
                    <div style={{ fontWeight: 600 }}>{viewRecord.date || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Record Type</div>
                    <div style={{ fontWeight: 600 }}>{TYPE_LABELS[viewRecord.recordType] || viewRecord.recordType || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Condition</div>
                    <div>{viewRecord.condition || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Notes</div>
                    <div>{viewRecord.notes || '—'}</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Status</div>
                    <span className={`chip ${STATUS_TO_CLASS[String(viewRecord.status || '').toLowerCase()] || 'chip-info'}`}>
                      {formatStatus(viewRecord.status)}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Next Due</div>
                    <div>{viewRecord.nextDueDate || '—'}</div>
                  </div>
                </div>
                {(() => {
                  const entries = getMetadataEntries(viewRecord.metadata);
                  if (entries.length === 0) return null;
                  return (
                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Additional Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {entries.map((item) => (
                          <div key={item.key} className="card" style={{ padding: 12 }}>
                            <div style={{ fontSize: 12, color: '#666' }}>{item.label}</div>
                            <div style={{ fontWeight: 600 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const entries = getMetricEntries(viewRecord.metrics);
                  if (entries.length === 0) return null;
                  return (
                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Health Metrics</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                        {entries.map((item) => (
                          <div key={item.key} className="card" style={{ padding: 12 }}>
                            <div style={{ fontSize: 12, color: '#666' }}>{item.label}</div>
                            <div style={{ fontWeight: 600 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {renderFileList(viewRecord.files)}
                <div style={{ marginTop: 20, textAlign: 'right' }}>
                  <button className="btn btn-primary" onClick={() => setViewOpen(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {formOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setFormOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{form.id ? 'Update Medical Record' : 'New Medical Record'}</h3>
              <button className="close-modal" onClick={() => setFormOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Record Type *</label>
                  <select name="recordType" className="form-control" value={form.recordType} onChange={handleFormChange} required>
                    <option value="">Select record type</option>
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Condition / Title *</label>
                  <input name="condition" className="form-control" placeholder="e.g., Blood Pressure Check" value={form.condition} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input name="date" type="date" className="form-control" value={form.date} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" className="form-control" value={form.status} onChange={handleFormChange}>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Next Due Date</label>
                <input name="nextDueDate" type="date" className="form-control" value={form.nextDueDate} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" className="form-control" rows={3} placeholder="Add notes about this record" value={form.notes} onChange={handleFormChange}></textarea>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Additional Details</div>
                <div className="form-grid">
                  {Object.entries(METADATA_LABELS).map(([key, label]) => (
                    <div key={key} className="form-group">
                      <label>{label}</label>
                      <input name={key} className="form-control" value={form.metadata?.[key] || ''} onChange={handleMetadataChange} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Health Metrics</div>
                <div className="form-grid">
                  {Object.entries(METRIC_LABELS).map(([key, label]) => (
                    <div key={key} className="form-group">
                      <label>{label}</label>
                      <input name={key} className="form-control" value={form.metrics?.[key] || ''} onChange={handleMetricsChange} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Attachments</label>
                <input type="file" multiple onChange={handleFileChange} />
                {formFiles.length > 0 && <div className="hint-message">{formFiles.length} file(s) selected</div>}
                {form.id && !useMocks && renderFileList((records.find((item) => (item._id || item.id) === form.id)?.files) || [])}
              </div>
              {formError && (
                <div className="error-message" style={{ marginBottom: 12 }}>
                  <i className="fas fa-exclamation-circle"></i> {formError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving…' : form.id ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
