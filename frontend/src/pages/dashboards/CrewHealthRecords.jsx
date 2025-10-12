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
  { value: 'appointment', label: 'Medical Appointment' },
  { value: 'emergency', label: 'Emergency Report' },
];

const TYPE_LABELS = TYPE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const MOCK_RECORDS = [
  {
    _id: 'mock-1',
    recordType: 'health-check',
    condition: 'Daily Health Check',
    date: '2025-10-15',
    notes: 'Vitals within normal range. No symptoms reported.',
    files: [],
  },
  {
    _id: 'mock-2',
    recordType: 'vaccination',
    condition: 'Influenza Booster',
    date: '2025-09-04',
    notes: 'No adverse reactions. Next dose due in one year.',
    files: [],
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
  const [filters, setFilters] = useState({ recordType: 'all', dateFrom: '', dateTo: '' });
  const [revision, setRevision] = useState(0);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ id: null, recordType: '', condition: '', date: today(), notes: '' });
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
  }, [filters.recordType, filters.dateFrom, filters.dateTo, query, revision, useMocks]);

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
    setForm({ id: null, recordType: '', condition: '', date: today(), notes: '' });
    setFormFiles([]);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (record) => {
    if (!record) return;
    setForm({
      id: record._id || record.id,
      recordType: record.recordType || '',
      condition: record.condition || '',
      date: record.date ? String(record.date).slice(0, 10) : today(),
      notes: record.notes || '',
    });
    setFormFiles([]);
    setFormError('');
    setFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      setForm({ id: null, recordType: '', condition: '', date: today(), notes: '' });
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
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => openView(row)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(row)} disabled={deletingId === row.id}>
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
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" className="form-control" rows={3} placeholder="Add notes about this record" value={form.notes} onChange={handleFormChange}></textarea>
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
