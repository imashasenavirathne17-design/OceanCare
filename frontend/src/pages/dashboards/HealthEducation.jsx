import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthEducation.css';
import HealthSidebar from './HealthSidebar';
import {
  listHealthEducation,
  getHealthEducation,
  createHealthEducation,
  updateHealthEducation,
  deleteHealthEducation,
  recordHealthEducationEngagement,
} from '../../lib/healthEducationApi';

const formatDate = (value) => {
  if (!value) return '—';
  try { return new Date(value).toLocaleDateString(); } catch (err) { return '—'; }
};

const toInputDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const createInitialForm = () => ({
  title: '',
  category: '',
  summary: '',
  content: '',
  status: 'draft',
  publishDate: '',
  icon: '',
  tags: '',
  featured: false,
  thumbnailUrl: '',
});

export default function HealthEducation() {
  const user = getUser();
  const navigate = useNavigate();
  const role = (user?.role || '').toLowerCase();
  const canManage = ['health', 'admin', 'education'].includes(role);
  const onLogout = () => { clearSession(); navigate('/login'); };

  const [educationContent, setEducationContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(() => createInitialForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [summaryStats, setSummaryStats] = useState(null);

  const loadEducation = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { sort: 'recent' };
      if (!canManage) params.publishedOnly = 'true';
      const data = await listHealthEducation(params);
      const normalized = (data?.items || []).map((item) => ({
        ...item,
        id: item.id || item._id?.toString?.() || item._id || '',
      }));
      setEducationContent(normalized);
      setSummaryStats(data?.summary || null);
    } catch (err) {
      setError('Failed to load health education resources.');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { loadEducation(); }, [loadEducation]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(educationContent.map((item) => item.category).filter(Boolean)));
    const mapped = unique.map((value) => ({
      key: value,
      label: value.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
    }));
    return [{ key: 'all', label: 'All Topics' }, ...mapped];
  }, [educationContent]);

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return educationContent
      .filter((item) => (category === 'all' ? true : item.category === category))
      .filter((item) => {
        if (!term) return true;
        const parts = [item.title, item.summary, item.category, Array.isArray(item.tags) ? item.tags.join(' ') : '']
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return parts.includes(term);
      });
  }, [educationContent, search, category]);

  const handleView = useCallback(async (id) => {
    const base = educationContent.find((item) => item.id === id);
    if (!base) return;
    setSelected(base);
    setModalOpen(true);
    try { await recordHealthEducationEngagement(id, { views: 1 }); } catch (err) {}
    if (!base.content) {
      try {
        const full = await getHealthEducation(id);
        if (full) {
          setSelected({ ...base, ...full, id: full.id || full._id || id });
        }
      } catch (err) {}
    }
  }, [educationContent]);

  const openCreateForm = () => {
    setFormData(createInitialForm());
    setFormError('');
    setEditingId('');
    setFormOpen(true);
    setSuccessMessage('');
  };

  const openEditForm = (item) => {
    setFormData({
      title: item.title || '',
      category: item.category || '',
      summary: item.summary || '',
      content: item.content || '',
      status: item.status || 'draft',
      publishDate: toInputDate(item.publishDate),
      icon: item.icon || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
      featured: Boolean(item.featured),
      thumbnailUrl: item.thumbnailUrl || '',
    });
    setFormError('');
    setEditingId(item.id);
    setFormOpen(true);
    setSuccessMessage('');
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.category.trim() || !formData.summary.trim() || !formData.content.trim()) {
      setFormError('Title, category, summary, and content are required.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: formData.category.trim(),
      summary: formData.summary.trim(),
      content: formData.content,
      status: formData.status,
      publishDate: formData.publishDate ? new Date(formData.publishDate).toISOString() : undefined,
      icon: formData.icon.trim() || undefined,
      tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      featured: Boolean(formData.featured),
      thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
    };

    if (!payload.publishDate) delete payload.publishDate;
    if (!payload.icon) delete payload.icon;
    if (!payload.thumbnailUrl) delete payload.thumbnailUrl;
    if (!canManage) delete payload.status;

    try {
      setSaving(true);
      if (editingId) {
        await updateHealthEducation(editingId, payload);
        setSuccessMessage('Resource updated successfully.');
      } else {
        await createHealthEducation(payload);
        setSuccessMessage('Resource created successfully.');
      }
      setFormOpen(false);
      setFormData(createInitialForm());
      setEditingId('');
      await loadEducation();
    } catch (err) {
      setFormError('Failed to save resource.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;
    const confirmed = window.confirm('Delete this resource? This cannot be undone.');
    if (!confirmed) return;
    try {
      setSuccessMessage('');
      await deleteHealthEducation(item.id);
      if (selected?.id === item.id) {
        setModalOpen(false);
        setSelected(null);
      }
      await loadEducation();
      setSuccessMessage('Resource deleted successfully.');
    } catch (err) {
      setError('Failed to delete resource.');
    }
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          <div className="header">
            <h2>Health Education Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Health Officer'}</div>
                <small>{user?.role ? user.role : 'Health Department'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Content Overview</div>
              <div className="page-actions">
                {canManage && (
                  <button className="btn btn-education" onClick={openCreateForm}>
                    <i className="fas fa-plus"></i> New Resource
                  </button>
                )}
              </div>
            </div>

            {successMessage && (
              <div style={{ background: 'rgba(42, 157, 143, 0.12)', color: '#1b4332', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>{successMessage}</div>
            )}
            {error && (
              <div style={{ background: 'rgba(230, 57, 70, 0.12)', color: '#e63946', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>{error}</div>
            )}

            <div className="analytics-container">
              <div className="analytics-item">
                <div className="analytics-value">{summaryStats?.total ?? educationContent.length}</div>
                <div className="analytics-label">Total Resources</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-value">{summaryStats?.statusSummary?.published ?? 0}</div>
                <div className="analytics-label">Published</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-value">{summaryStats?.statusSummary?.draft ?? 0}</div>
                <div className="analytics-label">Drafts</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-value">{summaryStats?.featuredCount ?? 0}</div>
                <div className="analytics-label">Featured</div>
              </div>
            </div>

            <div className="filters-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div className="search-bar" style={{ display: 'flex', flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search topics, categories, tags..."
                  style={{ flex: 1, padding: '12px 15px', border: '1px solid #ddd', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '1rem' }}
                />
                <button className="btn btn-education" style={{ borderRadius: '0 8px 8px 0' }}>
                  <i className="fas fa-search"></i>
                </button>
              </div>
              <div className="categories-container" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {categories.map((c) => (
                  <button
                    key={c.key}
                    className={`category-filter ${category === c.key ? 'active' : ''}`}
                    onClick={() => setCategory(c.key)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Loading resources…</div>
            ) : list.length === 0 ? (
              <div className="empty-state">No resources found for the selected filters.</div>
            ) : (
              <div className="cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {list.map((item) => {
                  const description = item.summary || item.description || '';
                  const dateDisplay = formatDate(item.publishDate || item.createdAt);
                  const statusLabel = (item.status || 'draft').replace(/-/g, ' ');
                  return (
                    <div key={item.id} className={`card ${item.featured ? 'featured' : ''}`}>
                      <div className="card-header">
                        <div>
                          <div className="card-title">{item.title}</div>
                          <span className="card-category">{(item.category || '').replace('-', ' ')}</span>
                        </div>
                        <div className={`card-icon ${item.featured ? 'primary' : 'education'}`}>
                          <i className={item.icon || 'fas fa-book-medical'}></i>
                        </div>
                      </div>
                      <div className="card-content">
                        <div className="card-description">{description}</div>
                        <div className="card-stats">
                          <div className="stat"><i className="fas fa-calendar"></i> {dateDisplay}</div>
                          <div className="stat" style={{ textTransform: 'capitalize' }}>{statusLabel}</div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <div className="card-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => handleView(item.id)}>
                            <i className="fas fa-book-open"></i> View
                          </button>
                          {canManage && (
                            <>
                              <button className="btn btn-outline btn-sm" onClick={() => openEditForm(item)}>
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => handleDelete(item)}>
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {modalOpen && selected && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 860, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selected.title}</h3>
              <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-image" style={{ height: 200, backgroundColor: '#f0f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: 60, marginBottom: 20, borderRadius: 8 }}>
              <i className={selected.icon || 'fas fa-book-medical'}></i>
            </div>
            <div className="modal-content-text" dangerouslySetInnerHTML={{ __html: selected.content || `<p>${selected.summary || ''}</p>` }} />
            <div style={{ marginTop: 25, textAlign: 'center' }}>
              <button className="btn" onClick={() => setModalOpen(false)} style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}>Close</button>
              <button className="btn btn-education" style={{ marginLeft: 10 }} onClick={() => alert('Downloading resource...')}>
                <i className="fas fa-download"></i> Download Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {canManage && formOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && !saving && setFormOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Resource' : 'Create Resource'}</h3>
              <button className="close-modal" onClick={() => !saving && setFormOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && <div style={{ color: 'var(--danger)' }}>{formError}</div>}

              <div className="form-group">
                <label>Title *</label>
                <input name="title" className="form-control" value={formData.title} onChange={handleFormChange} required />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <input name="category" className="form-control" value={formData.category} onChange={handleFormChange} placeholder="e.g., nutrition" required />
              </div>

              <div className="form-group">
                <label>Summary *</label>
                <textarea name="summary" className="form-control" rows={3} value={formData.summary} onChange={handleFormChange} required />
              </div>

              <div className="form-group">
                <label>Detailed Content *</label>
                <textarea name="content" className="form-control" rows={6} value={formData.content} onChange={handleFormChange} required />
                <small style={{ color: '#6c757d' }}>Supports HTML content.</small>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label>Status</label>
                  <select name="status" className="form-control" value={formData.status} onChange={handleFormChange} disabled={!canManage}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label>Publish Date</label>
                  <input type="date" name="publishDate" className="form-control" value={formData.publishDate} onChange={handleFormChange} />
                </div>
                <div>
                  <label>Icon class</label>
                  <input name="icon" className="form-control" value={formData.icon} onChange={handleFormChange} placeholder="fas fa-book-medical" />
                </div>
                <div>
                  <label>Thumbnail URL</label>
                  <input name="thumbnailUrl" className="form-control" value={formData.thumbnailUrl} onChange={handleFormChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input name="tags" className="form-control" value={formData.tags} onChange={handleFormChange} placeholder="comma separated" />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleFormChange} /> Featured resource
              </label>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={() => !saving && setFormOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-education" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update Resource' : 'Create Resource'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
