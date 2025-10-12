import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import {
  listAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  deleteAdminAnnouncement,
  publishAdminAnnouncement,
  archiveAdminAnnouncement,
  restoreAdminAnnouncement
} from '../../lib/adminAnnouncementApi';
import AdminSidebar from './AdminSidebar';
import './adminDashboard.css';

const defaultForm = {
  title: '',
  message: '',
  priority: 'normal',
  audience: ['all'],
  tags: '',
  status: 'draft',
  publishAt: '',
  expiresAt: '',
  acknowledgementRequired: false,
  acknowledgementDue: ''
};

const demoAnnouncements = [
  {
    _id: 'demo-1',
    title: 'System Maintenance Window',
    message: 'The core platform will go offline for scheduled maintenance on Saturday at 23:00 UTC.',
    priority: 'high',
    audience: ['all'],
    tags: ['maintenance', 'platform'],
    status: 'scheduled',
    publishAt: '2025-10-14T22:00:00Z',
    acknowledgementRequired: false,
    createdByName: 'Automation',
    createdAt: '2025-10-08T09:00:00Z'
  },
  {
    _id: 'demo-2',
    title: 'Compliance Training Reminder',
    message: 'All ship officers must complete the updated compliance training by the end of this month.',
    priority: 'normal',
    audience: ['officers'],
    tags: ['training', 'compliance'],
    status: 'published',
    publishAt: '2025-10-05T07:30:00Z',
    acknowledgementRequired: true,
    acknowledgementDue: '2025-10-31T23:59:59Z',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-10-03T12:30:00Z'
  }
];

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const user = getUser();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', status: 'all', priority: 'all' });
  const [selected, setSelected] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [navigate]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listAdminAnnouncements(filters);
      setAnnouncements(response.announcements || []);
    } catch (err) {
      console.error('Failed to load admin announcements, showing demo data.', err);
      setError(err.message || 'Unable to load announcements. Showing demo data.');
      setAnnouncements(demoAnnouncements);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const onLogout = () => { clearSession(); navigate('/login'); };

  const handleCreateClick = () => {
    setIsEditing(false);
    setFormData(defaultForm);
    setModalOpen(true);
  };

  const handleEditClick = (announcement) => {
    setIsEditing(true);
    setSelected(announcement);
    setFormData({
      ...defaultForm,
      ...announcement,
      tags: (announcement.tags || []).join(', '),
      audience: announcement.audience || ['all'],
      publishAt: announcement.publishAt ? announcement.publishAt.slice(0, 16) : '',
      expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : '',
      acknowledgementDue: announcement.acknowledgementDue ? announcement.acknowledgementDue.slice(0, 16) : ''
    });
    setModalOpen(true);
  };

  const handleViewClick = (announcement) => {
    setSelected(announcement);
    setViewModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      audience: Array.isArray(formData.audience) ? formData.audience : [formData.audience],
      publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      acknowledgementDue: formData.acknowledgementDue ? new Date(formData.acknowledgementDue).toISOString() : undefined
    };

    try {
      if (isEditing && selected?._id && !selected._id.startsWith('demo')) {
        await updateAdminAnnouncement(selected._id, payload);
      } else {
        await createAdminAnnouncement(payload);
      }
      setModalOpen(false);
      setFormData(defaultForm);
      setSelected(null);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to save announcement', err);
      alert(err.message || 'Failed to save announcement');
    }
  };

  const handleDelete = async (announcement) => {
    if (!window.confirm(`Delete announcement "${announcement.title}"? This cannot be undone.`)) return;

    try {
      if (!announcement._id.startsWith('demo')) {
        await deleteAdminAnnouncement(announcement._id);
      }
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement', err);
      alert(err.message || 'Failed to delete announcement');
    }
  };

  const handlePublish = async (announcement) => {
    try {
      if (!announcement._id.startsWith('demo')) {
        await publishAdminAnnouncement(announcement._id);
      }
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to publish announcement', err);
      alert(err.message || 'Failed to publish announcement');
    }
  };

  const handleArchive = async (announcement) => {
    try {
      if (!announcement._id.startsWith('demo')) {
        await archiveAdminAnnouncement(announcement._id);
      }
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to archive announcement', err);
      alert(err.message || 'Failed to archive announcement');
    }
  };

  const handleRestore = async (announcement) => {
    try {
      if (!announcement._id.startsWith('demo')) {
        await restoreAdminAnnouncement(announcement._id, 'draft');
      }
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to restore announcement', err);
      alert(err.message || 'Failed to restore announcement');
    }
  };

  const filteredAnnouncements = useMemo(() => {
    if (!announcements?.length) return [];
    return announcements.filter((item) => {
      const term = filters.q.trim().toLowerCase();
      const matchesQuery = term
        ? (item.title?.toLowerCase().includes(term) ||
          item.message?.toLowerCase().includes(term) ||
          (item.tags || []).some((tag) => tag.toLowerCase().includes(term)))
        : true;
      const matchesStatus = filters.status === 'all' ? true : item.status === filters.status;
      const matchesPriority = filters.priority === 'all' ? true : item.priority === filters.priority;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [announcements, filters]);

  const stats = useMemo(() => {
    const base = { total: announcements.length, draft: 0, scheduled: 0, published: 0, archived: 0 };
    announcements.forEach((item) => {
      base[item.status] = (base[item.status] || 0) + 1;
    });
    return base;
  }, [announcements]);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <AdminSidebar onLogout={onLogout} />

        <main className="main-content">
          <div className="header">
            <h2>Admin Announcements</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin User')}&background=0ea5e9&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Sarah Johnson'}</div>
                <small>Administrator</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="page-title">Internal Communications</div>
                <div className="page-subtitle">Manage announcements targeted to admin audiences without affecting the public site.</div>
              </div>
              <div className="page-actions" style={{ gap: 10 }}>
                <button className="btn btn-outline" onClick={fetchAnnouncements}><i className="fas fa-sync" aria-hidden="true"></i> Refresh</button>
                <button className="btn btn-primary" onClick={handleCreateClick}><i className="fas fa-plus" aria-hidden="true"></i> New Announcement</button>
              </div>
            </div>
            <section className="admin-announcements-overview">
              <div className="overview-card">
                <div className="overview-label">Total</div>
                <div className="overview-value">{stats.total}</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">Draft</div>
                <div className="overview-value">{stats.draft}</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">Scheduled</div>
                <div className="overview-value">{stats.scheduled}</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">Published</div>
                <div className="overview-value">{stats.published}</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">Archived</div>
                <div className="overview-value">{stats.archived}</div>
              </div>
            </section>

            <div className="filters-ribbon">
              <div className="ribbon-group search">
                <label htmlFor="searchQuery"><i className="fas fa-search"></i></label>
                <input
                  id="searchQuery"
                  type="text"
                  placeholder="Search title, message, or tag..."
                  value={filters.q}
                  onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                />
              </div>
              <div className="ribbon-group">
                <label htmlFor="statusFilter">Status</label>
                <select
                  id="statusFilter"
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="ribbon-group">
                <label htmlFor="priorityFilter">Priority</label>
                <select
                  id="priorityFilter"
                  value={filters.priority}
                  onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="ribbon-group">
                <button className="btn btn-outline" onClick={() => setFilters({ q: '', status: 'all', priority: 'all' })}>
                  <i className="fas fa-undo"></i> Reset
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-warning" role="alert">{error}</div>
            )}

            <div className="announcements-card">
              <div className="card-header">
                <div>
                  <div className="card-title">Announcements</div>
                  <div className="card-subtitle">{filteredAnnouncements.length} records match the current filters.</div>
                </div>
                {loading && <span className="status-badge status-active">Loading…</span>}
              </div>

              <div className="table-responsive">
                <table className="announcements-table">
                  <thead>
                    <tr>
                      <th>Title & Author</th>
                      <th>Audience</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Publish Date</th>
                      <th>Requires Ack?</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnnouncements.length === 0 && (
                      <tr>
                        <td colSpan={7} className="empty-row">
                          <i className="far fa-folder-open"></i>
                          <p>No announcements match the current filters.</p>
                          <button className="btn btn-primary btn-sm" onClick={handleCreateClick}>
                            <i className="fas fa-plus"></i> Create your first announcement
                          </button>
                        </td>
                      </tr>
                    )}

                    {filteredAnnouncements.map((announcement) => (
                      <tr key={announcement._id}>
                        <td>
                          <div className="crew-cell">
                            <div className="name">{announcement.title}</div>
                            <div className="id">Created by {announcement.createdByName || 'Unknown'} on {new Date(announcement.createdAt || Date.now()).toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="nowrap">{(announcement.audience || ['all']).join(', ')}</td>
                        <td className="nowrap">
                          <span className={`status-badge ${announcement.priority === 'critical' ? 'status-danger' : announcement.priority === 'high' ? 'status-warning' : announcement.priority === 'low' ? 'status-secondary' : 'status-active'}`}>
                            {announcement.priority || 'normal'}
                          </span>
                        </td>
                        <td className="nowrap">
                          <span className={`status-badge ${announcement.status === 'published' ? 'status-success' : announcement.status === 'archived' ? 'status-secondary' : announcement.status === 'scheduled' ? 'status-warning' : 'status-active'}`}>
                            {announcement.status}
                          </span>
                        </td>
                        <td className="nowrap">{announcement.publishAt ? new Date(announcement.publishAt).toLocaleString() : '—'}</td>
                        <td className="nowrap">{announcement.acknowledgementRequired ? 'Yes' : 'No'}</td>
                        <td>
                          <div className="table-actions">
                            <button className="btn btn-outline btn-sm" onClick={() => handleViewClick(announcement)} title="View announcement">
                              <i className="far fa-eye"></i>
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleEditClick(announcement)} title="Edit announcement">
                              <i className="far fa-edit"></i>
                            </button>
                            {announcement.status !== 'published' && announcement.status !== 'archived' && (
                              <button className="btn btn-outline btn-sm" onClick={() => handlePublish(announcement)} title="Publish">
                                <i className="fas fa-upload"></i>
                              </button>
                            )}
                            {announcement.status !== 'archived' && (
                              <button className="btn btn-outline btn-sm" onClick={() => handleArchive(announcement)} title="Archive">
                                <i className="fas fa-archive"></i>
                              </button>
                            )}
                            {announcement.status === 'archived' && (
                              <button className="btn btn-outline btn-sm" onClick={() => handleRestore(announcement)} title="Restore">
                                <i className="fas fa-undo"></i>
                              </button>
                            )}
                            <button className="btn btn-outline btn-sm" onClick={() => handleDelete(announcement)} title="Delete">
                              <i className="far fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 className="modal-title">{isEditing ? 'Edit Announcement' : 'Create Announcement'}</h3>
              <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="announcementTitle">Title *</label>
                  <input
                    id="announcementTitle"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="announcementPriority">Priority</label>
                  <select
                    id="announcementPriority"
                    value={formData.priority}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="announcementMessage">Message *</label>
                <textarea
                  id="announcementMessage"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter the announcement details..."
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="announcementAudience">Audience</label>
                  <input
                    id="announcementAudience"
                    type="text"
                    value={Array.isArray(formData.audience) ? formData.audience.join(', ') : formData.audience}
                    onChange={(e) => setFormData((prev) => ({ ...prev, audience: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }))}
                    placeholder="e.g., all, officers, medical"
                  />
                  <small>Comma separated list of target groups</small>
                </div>
                <div className="form-group">
                  <label htmlFor="announcementTags">Tags</label>
                  <input
                    id="announcementTags"
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., compliance, policy"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="announcementStatus">Status</label>
                  <select
                    id="announcementStatus"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="announcementPublishAt">Publish At</label>
                  <input
                    id="announcementPublishAt"
                    type="datetime-local"
                    value={formData.publishAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, publishAt: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="announcementExpiresAt">Expires At</label>
                  <input
                    id="announcementExpiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="announcementAck">Acknowledgement Required</label>
                  <select
                    id="announcementAck"
                    value={formData.acknowledgementRequired ? 'yes' : 'no'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, acknowledgementRequired: e.target.value === 'yes' }))}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {formData.acknowledgementRequired && (
                  <div className="form-group">
                    <label htmlFor="announcementAckDue">Acknowledgement Due</label>
                    <input
                      id="announcementAckDue"
                      type="datetime-local"
                      value={formData.acknowledgementDue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, acknowledgementDue: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Save Changes' : 'Create Announcement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModalOpen && selected && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setViewModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Announcement Details</h3>
              <button className="close-modal" onClick={() => setViewModalOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <h4 style={{ marginBottom: 8 }}>{selected.title}</h4>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>Priority: {selected.priority} • Status: {selected.status}</p>
              <p style={{ whiteSpace: 'pre-line' }}>{selected.message}</p>
              <div className="divider" style={{ margin: '16px 0' }}></div>
              <div className="details-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <div>
                  <div className="label">Audience</div>
                  <div>{(selected.audience || ['all']).join(', ')}</div>
                </div>
                <div>
                  <div className="label">Tags</div>
                  <div>{(selected.tags && selected.tags.length ? selected.tags.join(', ') : '—')}</div>
                </div>
                <div>
                  <div className="label">Publish At</div>
                  <div>{selected.publishAt ? new Date(selected.publishAt).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="label">Expires At</div>
                  <div>{selected.expiresAt ? new Date(selected.expiresAt).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="label">Acknowledgement Required</div>
                  <div>{selected.acknowledgementRequired ? 'Yes' : 'No'}</div>
                </div>
                {selected.acknowledgementRequired && (
                  <div>
                    <div className="label">Acknowledgement Due</div>
                    <div>{selected.acknowledgementDue ? new Date(selected.acknowledgementDue).toLocaleString() : '—'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
