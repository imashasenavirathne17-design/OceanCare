import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencySidebar from './EmergencySidebar';
import { getUser, clearSession } from '../../lib/token';
import './emergencyOfficerDashboard.css';
import './emergencyProtocols.css';
import {
  listProtocols,
  createProtocol,
  updateProtocol,
  deleteProtocol,
} from '../../lib/emergencyProtocolApi';

const CATEGORY_OPTIONS = ['All', 'Medical', 'Safety', 'Evacuation', 'Environmental', 'Security'];
const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE'];

const createEmptyProtocol = (user) => ({
  title: '',
  category: 'Medical',
  description: '',
  steps: [''],
  status: 'ACTIVE',
  tags: '',
  lastReviewedAt: new Date().toISOString().slice(0, 10),
  createdBy: user?.fullName || 'Emergency Officer',
  updatedBy: user?.fullName || 'Emergency Officer',
});

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusBadge = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
};

export default function EmergencyProtocols() {
  const user = getUser();
  const navigate = useNavigate();

  const [protocols, setProtocols] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: 'ALL', category: 'All' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [formData, setFormData] = useState(createEmptyProtocol(user));
  const [formErrors, setFormErrors] = useState({});
  const [stepDraft, setStepDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedProtocol = useMemo(() => protocols.find((item) => item._id === selectedId), [protocols, selectedId]);

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  const fetchProtocols = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listProtocols({
        q: filters.q || undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        category: filters.category !== 'All' ? filters.category : undefined,
      });
      const items = Array.isArray(data) ? data : [];
      setProtocols(items);
      if (items.length && !selectedId) setSelectedId(items[0]._id);
      if (!items.length) setSelectedId(null);
    } catch (err) {
      setError('Failed to load emergency protocols.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, [filters.status, filters.category]);

  const openCreate = () => {
    setEditorMode('create');
    setFormData(createEmptyProtocol(user));
    setFormErrors({});
    setStepDraft('');
    setIsEditorOpen(true);
  };

  const openEditById = (id) => {
    const target = protocols.find((item) => item._id === id);
    if (!target) return;
    setSelectedId(id);
    setEditorMode('edit');
    setFormData({
      title: target.title,
      category: target.category || 'Medical',
      description: target.description || '',
      steps: Array.isArray(target.steps) && target.steps.length ? target.steps : [''],
      status: target.status || 'ACTIVE',
      tags: Array.isArray(target.tags) ? target.tags.join(', ') : '',
      lastReviewedAt: target.lastReviewedAt ? new Date(target.lastReviewedAt).toISOString().slice(0, 10) : '',
      createdBy: target.createdBy || user?.fullName || 'Emergency Officer',
      updatedBy: user?.fullName || 'Emergency Officer',
    });
    setFormErrors({});
    setStepDraft('');
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (submitting) return;
    setIsEditorOpen(false);
  };

  const onFormChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onStepChange = (index) => (event) => {
    const value = event.target.value;
    setFormData((prev) => {
      const next = [...prev.steps];
      next[index] = value;
      return { ...prev, steps: next };
    });
  };

  const addStep = () => {
    if (!stepDraft.trim()) return;
    setFormData((prev) => ({ ...prev, steps: [...prev.steps, stepDraft.trim()] }));
    setStepDraft('');
  };

  const removeStep = (index) => {
    setFormData((prev) => {
      const next = prev.steps.filter((_, idx) => idx !== index);
      return { ...prev, steps: next.length ? next : [''] };
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.steps.some((step) => step && step.trim())) nextErrors.steps = 'At least one step is required';
    return nextErrors;
  };

  const buildPayload = () => ({
    title: formData.title.trim(),
    category: formData.category,
    description: formData.description.trim(),
    steps: formData.steps.filter((step) => step && step.trim()),
    status: formData.status,
    tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    lastReviewedAt: formData.lastReviewedAt || undefined,
  });

  const submit = async () => {
    const nextErrors = validate();
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = buildPayload();
    setSubmitting(true);
    try {
      if (editorMode === 'create') {
        const created = await createProtocol(payload);
        setProtocols((prev) => [created, ...prev]);
        setSelectedId(created._id);
      } else if (selectedProtocol) {
        const updated = await updateProtocol(selectedProtocol._id, payload);
        setProtocols((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedId(updated._id);
      }
      setIsEditorOpen(false);
    } catch (err) {
      setError('Failed to save emergency protocol.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProtocolById = async (id) => {
    const target = protocols.find((item) => item._id === id);
    if (!target) return;
    if (!window.confirm(`Delete the protocol "${target.title}"?`)) return;
    try {
      await deleteProtocol(id);
      setProtocols((prev) => prev.filter((item) => item._id !== id));
      setSelectedId(null);
    } catch (err) {
      setError('Failed to delete emergency protocol.');
    }
  };

  const filteredProtocols = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return protocols.filter((protocol) => {
      if (filters.status !== 'ALL' && protocol.status !== filters.status) return false;
      if (filters.category !== 'All' && protocol.category !== filters.category) return false;
      if (!needle) return true;
      const haystack = `${protocol.title || ''} ${protocol.description || ''} ${protocol.category || ''} ${protocol.tags?.join(' ') || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [protocols, filters]);

  return (
    <div className="dashboard-container emergency-dashboard protocols-card-view">
      <EmergencySidebar onLogout={onLogout} />

      <main className={`main-content emergency-protocols-page ${isEditorOpen ? 'editor-open' : ''}`}>
        <header className="header">
          <div>
            <h2>Emergency Protocols</h2>
            <div className="page-subtitle">Maintain quick-reference playbooks for emergency response teams.</div>
            {error && <div className="inline-error">{error}</div>}
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={fetchProtocols}><i className="fas fa-sync" /> Refresh</button>
            <button className="btn btn-primary" onClick={openCreate}><i className="fas fa-plus" /> New Protocol</button>
          </div>
        </header>

        <section className="protocol-filters">
          <div className="filter-group search">
            <label>Search</label>
            <input
              className="form-control"
              placeholder="Search by protocol name, category, or tag"
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option === 'ALL' ? 'All statuses' : option}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select
              className="form-control"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option === 'All' ? 'All categories' : option}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="protocol-grid">
          {loading ? (
            <div className="empty-card">Loading protocols…</div>
          ) : filteredProtocols.length === 0 ? (
            <div className="empty-card">No protocols match the current filters.</div>
          ) : (
            filteredProtocols.map((protocol) => {
              const isActive = protocol._id === selectedId;
              const tags = Array.isArray(protocol.tags) ? protocol.tags : [];
              const stepsCount = Array.isArray(protocol.steps) ? protocol.steps.length : 0;
              const needsReview = !protocol.lastReviewedAt || (Date.now() - new Date(protocol.lastReviewedAt).getTime()) > 1000 * 60 * 60 * 24 * 180;
              const previewSteps = Array.isArray(protocol.steps) ? protocol.steps.slice(0, 3) : [];
              const remainingSteps = Array.isArray(protocol.steps) ? protocol.steps.length - previewSteps.length : 0;
              return (
                <article
                  key={protocol._id}
                  className={`protocol-card ${isActive ? 'selected' : ''}`}
                  onClick={() => setSelectedId(protocol._id)}
                >
                  <div className="protocol-header">
                    <div className="protocol-icon"><i className="fas fa-clipboard-list" /></div>
                    <div>
                      <h3 className="protocol-title">{protocol.title}</h3>
                      <p className="protocol-desc">{protocol.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="protocol-tags">
                    <span className="protocol-tag">{protocol.category}</span>
                    <span className={`protocol-tag ${protocol.status === 'ACTIVE' ? 'success' : 'warning'}`}>{protocol.status}</span>
                    <span className="protocol-tag muted">Reviewed {protocol.lastReviewedAt ? formatDate(protocol.lastReviewedAt) : 'n/a'}</span>
                    {needsReview && <span className="protocol-tag danger">Needs review</span>}
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="protocol-tag muted">#{tag}</span>
                    ))}
                  </div>

                  <div className="protocol-stats">
                    <div className="protocol-stat">
                      <span>Steps</span>
                      <strong>{stepsCount}</strong>
                    </div>
                    <div className="protocol-stat">
                      <span>Updated</span>
                      <strong>{formatDate(protocol.updatedAt)}</strong>
                    </div>
                    <div className="protocol-stat">
                      <span>Created By</span>
                      <strong>{protocol.createdBy || '—'}</strong>
                    </div>
                    <div className="protocol-stat">
                      <span>Updated By</span>
                      <strong>{protocol.updatedBy || '—'}</strong>
                    </div>
                  </div>

                  {previewSteps.length > 0 && (
                    <div className="protocol-step-preview">
                      <div className="preview-title">Key Steps</div>
                      <ul>
                        {previewSteps.map((step, index) => (
                          <li key={`${protocol._id}-step-${index}`}>
                            <span className="step-number">{index + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                      {remainingSteps > 0 && <div className="more-steps">+{remainingSteps} more step{remainingSteps > 1 ? 's' : ''}</div>}
                    </div>
                  )}

                  <div className="protocol-actions">
                    <button type="button" className={`status-pill ${protocol.status === 'ACTIVE' ? 'active' : 'inactive'}`}>{protocol.status}</button>
                    <div className="protocol-buttons">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditById(protocol._id);
                        }}
                      >
                        <i className="fas fa-pen" /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteProtocolById(protocol._id);
                        }}
                      >
                        <i className="fas fa-trash" /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="protocol-history">
          <div className="section-header">
            <div>
              <div className="section-title">Protocols Snapshot</div>
              <div className="section-subtitle">Organize and keep your emergency playbooks up to date.</div>
            </div>
            <button className="btn btn-outline" onClick={fetchProtocols}><i className="fas fa-sync-alt" /> Sync</button>
          </div>
          <table className="history-table">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Category</th>
                <th>Status</th>
                <th>Last Reviewed</th>
                <th>Updated By</th>
              </tr>
            </thead>
            <tbody>
              {filteredProtocols.slice(0, 6).map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td><span className={`history-status ${item.status === 'ACTIVE' ? 'status-completed' : 'status-cancelled'}`}>{item.status}</span></td>
                  <td>{item.lastReviewedAt ? formatDate(item.lastReviewedAt) : 'n/a'}</td>
                  <td>{item.updatedBy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      {isEditorOpen && (
        <div className="incident-editor">
          <div className="editor-backdrop" onClick={closeEditor} />
          <div className="editor-card report-editor protocol-editor">
            <header className="editor-header">
              <h2>{editorMode === 'create' ? 'Create Emergency Protocol' : 'Update Emergency Protocol'}</h2>
              <button className="editor-close" onClick={closeEditor}><i className="fas fa-times" /></button>
            </header>
            <div className="editor-body">
              <div className="editor-section">
                <div className="section-head">
                  <h3>Core Details</h3>
                  <span className="section-note">Define the intent and visibility of this protocol.</span>
                </div>
                <div className="editor-grid compact">
                  <label>
                    <span>Title</span>
                    <input value={formData.title} onChange={onFormChange('title')} placeholder="e.g. Cardiac Arrest Response" />
                    {formErrors.title && <small className="error">{formErrors.title}</small>}
                  </label>
                  <label>
                    <span>Category</span>
                    <select value={formData.category} onChange={onFormChange('category')}>
                      {CATEGORY_OPTIONS.filter((option) => option !== 'All').map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={formData.status} onChange={onFormChange('status')}>
                      {STATUS_OPTIONS.filter((option) => option !== 'ALL').map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Last Reviewed</span>
                    <input type="date" value={formData.lastReviewedAt} onChange={onFormChange('lastReviewedAt')} />
                  </label>
                </div>
                <label className="full">
                  <span>Description</span>
                  <textarea rows={3} value={formData.description} onChange={onFormChange('description')} placeholder="Purpose, triggers, or important notes." />
                </label>
              </div>

              <div className="editor-section">
                <div className="section-head">
                  <h3>Procedure Steps</h3>
                  <span className="section-note">Outline each action in sequence.</span>
                </div>
                <div className="steps-editor">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="step-editor-row">
                      <span className="badge">Step {index + 1}</span>
                      <input value={step} onChange={onStepChange(index)} placeholder="Describe the required action" />
                      <button type="button" className="btn btn-outline" onClick={() => removeStep(index)} disabled={formData.steps.length === 1}>
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  ))}
                  <div className="step-editor-add">
                    <input value={stepDraft} onChange={(e) => setStepDraft(e.target.value)} placeholder="Add another procedure step" />
                    <button type="button" className="btn btn-outline" onClick={addStep} disabled={!stepDraft.trim()}>
                      <i className="fas fa-plus" /> Add step
                    </button>
                  </div>
                  {formErrors.steps && <small className="error">{formErrors.steps}</small>}
                </div>
              </div>

              <div className="editor-section">
                <div className="section-head">
                  <h3>Tags & Visibility</h3>
                  <span className="section-note">Help crews search and filter protocols.</span>
                </div>
                <label className="full">
                  <span>Tags</span>
                  <input value={formData.tags} onChange={onFormChange('tags')} placeholder="Comma separated (e.g. medical, cardiac, critical)" />
                </label>
              </div>
            </div>
            <footer className="editor-footer">
              <button className="btn btn-outline" onClick={closeEditor} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={submitting}>{submitting ? 'Saving…' : 'Save Protocol'}</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

