import React, { useState, useEffect } from 'react';
import './healthOfficerDashboard.css';
import HealthPageLayout from './HealthPageLayout';
import HealthPageSection from './HealthPageSection';
import { saveMedicalRecord, listMedicalRecords, updateMedicalRecord, deleteMedicalRecord, listCrewMembers } from '../../lib/healthApi';

export default function HealthMedicalRecords() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
  const UPLOADS_BASE = API_BASE.replace(/\/api$/, '') + '/uploads/medical-records/';

  const typeLabel = (value) => {
    const map = {
      'medical-history': 'Medical History',
      'examination': 'Examination',
      'treatment': 'Treatment',
      'vaccination': 'Vaccination',
      'chronic': 'Chronic Condition',
      'Medical History': 'Medical History',
      'Examination': 'Examination',
      'Treatment': 'Treatment',
      'Vaccination': 'Vaccination',
      'Chronic Condition': 'Chronic Condition',
    };
    return map[value] || value || '—';
  };

  // Search/filter state
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All Records');
  const [status, setStatus] = useState('All Status');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRecordId, setViewRecordId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Controlled form state for modal
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ crewId: '', recordType: '', condition: '', date: today, notes: '' });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [crewOptions, setCrewOptions] = useState([]);

  // Backend records
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRecords = async (params = {}) => {
    setLoading(true);
    try {
      const data = await listMedicalRecords(params);
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('listMedicalRecords failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Reload from backend when filters change
  useEffect(() => {
    const q = query.trim();
    const typeParam = type === 'All Records' ? undefined : toDataType(type);
    loadRecords({ q: q || undefined, type: typeParam });
  }, [query, type]);

  // Load crew members when modal opens (so list is fresh)
  useEffect(() => {
    const loadCrew = async () => {
      try {
        const items = await listCrewMembers('');
        setCrewOptions(Array.isArray(items) ? items : []);
      } catch (e) {
        console.warn('listCrewMembers failed', e);
        setCrewOptions([]);
      }
    };
    if (addOpen) loadCrew();
  }, [addOpen]);

  const toDataType = (label) => {
    const map = {
      'Examinations': 'Examination',
      'Treatments': 'Treatment',
      'Vaccinations': 'Vaccination',
      'Medical History': 'Medical History',
      'Chronic Condition': 'Chronic Condition',
    };
    return map[label] || label;
  };

  const filtered = records.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (r.crewName || '').toLowerCase().includes(q) ||
      (r.crewId || '').toLowerCase().includes(q) ||
      (r.condition || '').toLowerCase().includes(q) ||
      (r.recordType || '').toLowerCase().includes(q);
    const matchesType = type === 'All Records' || (r.recordType || '') === toDataType(type);
    // No backend status for now
    const matchesStatus = status === 'All Status';
    return matchesQuery && matchesType && matchesStatus;
  });

  const openView = (id) => {
    setViewRecordId(id);
    setViewOpen(true);
  };

  const viewDetails = (record) => (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: 15 }}>Record Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <div>
            <strong>Crew Member:</strong> {record.crewName || '—'} ({record.crewId})
          </div>
          <div>
            <strong>Record Type:</strong> {typeLabel(record.recordType)}
          </div>
          <div>
            <strong>Condition:</strong> {record.condition}
          </div>
          <div>
            <strong>Date:</strong> {record.date}
          </div>
          <div>
            <strong>Status:</strong> <span className="status-badge">—</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: 10 }}>Clinical Notes</h4>
        <p style={{ whiteSpace: 'pre-wrap' }}>{record.notes || '—'}</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: 10 }}>Attachments</h4>
        <ul>
          {(record.files || []).length === 0 && <li style={{ color: '#777' }}>No attachments</li>}
          {(record.files || []).map((f, idx) => (
            <li key={idx}>
              <a href={`${UPLOADS_BASE}${f.filename}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                {f.originalname || f.filename}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-outline" onClick={() => setViewOpen(false)}>
          Close
        </button>
        <button className="btn btn-primary" onClick={() => {
          setViewOpen(false);
          if (record && record._id) {
            setEditingId(record._id);
            setForm({
              crewId: record.crewId || '',
              recordType: record.recordType || '',
              condition: record.condition || '',
              date: record.date || today,
              notes: record.notes || '',
            });
          }
          setAddOpen(true);
        }}>
          Edit Record
        </button>
      </div>
    </div>
  );

  return (
    <HealthPageLayout
      title="Medical Records"
      description="Manage crew medical history, examinations, treatments, vaccinations, and chronic conditions."
    >
      <HealthPageSection
        title="Crew Medical Records"
        actions={(
          <>
            <button className="btn btn-outline">
              <i className="fas fa-download"></i> Export
            </button>
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <i className="fas fa-plus"></i> Add New Record
            </button>
          </>
        )}
      >
        <div className="search-filter" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 260, maxWidth: 420 }}>
            <input
              type="text"
              placeholder="Search by crew name, ID, or condition..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)} style={{ width: 200 }}>
            <option>All Records</option>
            <option>Medical History</option>
            <option>Examinations</option>
            <option>Treatments</option>
            <option>Vaccinations</option>
            <option>Chronic Condition</option>
          </select>
          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }}>
            <option>All Status</option>
            <option>Active</option>
            <option>Resolved</option>
            <option>Chronic</option>
            <option>Completed</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Crew Member</th>
                <th>Record Type</th>
                <th>Condition</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record._id}>
                  <td>{record.crewName || '—'} ({record.crewId})</td>
                  <td>{typeLabel(record.recordType)}</td>
                  <td>{record.condition}</td>
                  <td>{record.date}</td>
                  <td><span className="status-badge">—</span></td>
                  <td className="action-buttons">
                    <button className="btn btn-action btn-sm" onClick={() => openView(record._id)}>
                      <i className="fas fa-book"></i> View
                    </button>
                    <button
                      className="btn btn-action btn-sm"
                      onClick={() => {
                        setEditingId(record._id);
                        setForm({
                          crewId: record.crewId || '',
                          recordType: record.recordType || '',
                          condition: record.condition || '',
                          date: record.date || today,
                          notes: record.notes || '',
                        });
                        setAddOpen(true);
                      }}
                    >
                      <i className="fas fa-pen"></i> Edit
                    </button>
                    <button
                      className="btn btn-action btn-sm delete"
                      onClick={async () => {
                        if (!window.confirm('Delete this record?')) return;
                        try {
                          await deleteMedicalRecord(record._id);
                          await loadRecords();
                        } catch (e) {
                          alert('Failed to delete');
                        }
                      }}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm">Previous</button>
          <button className="btn btn-outline btn-sm">Next</button>
        </div>
      </HealthPageSection>

      {/* Add Medical Record Modal */}
      {addOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setAddOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit' : 'Add'} Medical Record</h3>
              <button className="close-modal" onClick={() => setAddOpen(false)}>
                &times;
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!form.crewId || !form.recordType || !form.condition) {
                  alert('Please fill in required fields.');
                  return;
                }
                try {
                  if (editingId) {
                    await updateMedicalRecord(editingId, { crewId: form.crewId, recordType: form.recordType, condition: form.condition, date: form.date, notes: form.notes }, uploadFiles);
                    alert('Medical record updated successfully!');
                  } else {
                    await saveMedicalRecord(
                      { crewId: form.crewId, recordType: form.recordType, condition: form.condition, date: form.date, notes: form.notes },
                      uploadFiles
                    );
                    alert('Medical record added successfully!');
                  }
                  setAddOpen(false);
                  setForm({ crewId: '', recordType: '', condition: '', date: today, notes: '' });
                  setUploadFiles([]);
                  setEditingId(null);
                  await loadRecords();
                } catch (err) {
                  console.warn('saveMedicalRecord failed', err);
                  alert('Backend unavailable. Your record could not be saved.');
                }
              }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="crewMember">Crew Member *</label>
                  <select
                    id="crewMember"
                    className="form-control"
                    required
                    value={form.crewId}
                    onChange={(e) => setForm((f) => ({ ...f, crewId: e.target.value }))}
                  >
                    <option value="">Select crew member</option>
                    {crewOptions.map((m) => (
                      <option key={m.crewId} value={m.crewId}>
                        {m.fullName} ({m.crewId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="recordType">Record Type *</label>
                  <select
                    id="recordType"
                    className="form-control"
                    required
                    value={form.recordType}
                    onChange={(e) => setForm((f) => ({ ...f, recordType: e.target.value }))}
                  >
                    <option value="">Select type</option>
                    <option value="medical-history">Medical History</option>
                    <option value="examination">Examination</option>
                    <option value="treatment">Treatment</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="chronic">Chronic Condition</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="condition">Condition/Diagnosis *</label>
                  <input
                    type="text"
                    id="condition"
                    className="form-control"
                    required
                    value={form.condition}
                    onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recordDate">Record Date *</label>
                  <input
                    type="date"
                    id="recordDate"
                    className="form-control"
                    required
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Clinical Notes</label>
                <textarea
                  id="notes"
                  className="form-control"
                  rows="4"
                  placeholder="Enter clinical notes, observations, or recommendations..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="attachments">Attachments</label>
                <input
                  type="file"
                  id="attachments"
                  className="form-control"
                  multiple
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                />
                <small style={{ color: '#777' }}>You can upload lab results, scans, or other documents</small>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-action btn-sm"
                  onClick={() => { setAddOpen(false); setEditingId(null); }}
                  style={{ flex: 1 }}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Record Modal */}
      {viewOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setViewOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Medical Record Details</h3>
              <button className="close-modal" onClick={() => setViewOpen(false)}>&times;</button>
            </div>
            <div id="recordDetails">
              {viewRecordId ? viewDetails(records.find((r) => r._id === viewRecordId) || records[0] || {}) : null}
            </div>
          </div>
        </div>
      )}
    </HealthPageLayout>
  );
}
