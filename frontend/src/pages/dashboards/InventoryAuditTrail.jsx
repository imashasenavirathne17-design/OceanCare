import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getToken, getUser } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryAuditTrail.css';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'export', label: 'Export' },
  { value: 'access', label: 'Access' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
];

export default function InventoryAuditTrail() {
  const user = getUser();
  const token = getToken();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const onLogout = () => { clearSession(); navigate('/login'); };

  const [action, setAction] = useState('all');
  const [status, setStatus] = useState('all');
  const [resource] = useState('inventory');
  const [term, setTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async (overridePage) => {
    if (!token) return;
    const targetPage = overridePage ?? page;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(limit),
        action,
        status,
        resource,
        term: term.trim(),
      });
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(`${API}/api/audit/logs?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      if (data.pagination) {
        setPagination({
          page: data.pagination.page,
          pages: data.pagination.pages,
          total: data.pagination.total,
          limit: data.pagination.limit,
        });
        setPage(data.pagination.page);
      }
    } catch (err) {
      setError(err.message || 'Unable to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [API, token, page, limit, action, status, resource, term, fromDate, toDate]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const applyFilters = () => {
    fetchLogs(1);
  };

  const handleExport = async () => {
    if (!logs.length) {
      alert('No logs to export');
      return;
    }
    const header = ['Timestamp', 'Action', 'Resource', 'User', 'Status', 'Details'];
    const rows = logs.map((log) => [
      new Date(log.timestamp || log.createdAt || Date.now()).toISOString(),
      log.action || 'other',
      log.resource || '-',
      log.userName || 'System',
      log.status || 'success',
      (log.details || '').replace(/\n+/g, ' '),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((val) => {
        const str = String(val ?? '');
        return /[",\n,]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.pages || nextPage === page) return;
    fetchLogs(nextPage);
  };

  const stats = useMemo(() => {
    const byAction = logs.reduce((acc, item) => {
      const key = item.action || 'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      created: byAction.create || 0,
      updated: byAction.update || 0,
      deleted: byAction.delete || 0,
      exported: byAction.export || 0,
    };
  }, [logs]);

  const timeline = useMemo(() => logs.slice(0, 8).map((log) => ({
    id: log._id,
    type: log.action || 'other',
    status: log.status || 'success',
    title: log.resource ? `${log.action || 'action'}: ${log.resource}` : (log.action || 'Audit event'),
    time: new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString(),
    details: log.details || 'No additional details provided.',
    user: log.userName || 'System',
    role: (log.metadata?.role || '').toUpperCase() || 'ROLE UNKNOWN',
    avatar: encodeURIComponent(log.userName || 'System'),
  })), [logs]);

  const pageNumbers = useMemo(() => {
    const totalPages = Math.max(1, pagination.pages || 1);
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }, [pagination.pages]);

  const startEntry = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endEntry = pagination.total ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  return (
    <div className="inventory-dashboard inventory-audit">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />
        <main className="main-content">
          {loading && <div className="info-banner">Loading audit logs…</div>}
          {!!error && <div className="error-banner">{error}</div>}
          <div className="header">
            <h2>Audit Trail</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>
          <div className="audit-controls">
            <div className="filter-group">
              <label className="filter-label">Action Type</label>
              <select className="filter-select" value={action} onChange={(e) => setAction(e.target.value)}>
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="date-range">
              <div className="filter-group">
                <label className="filter-label">From Date</label>
                <input type="date" className="date-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="filter-label">To Date</label>
                <input type="date" className="date-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">Resource</label>
              <input type="text" className="filter-input" value={resource} readOnly />
            </div>
            <div className="filter-group search">
              <label className="filter-label">Search</label>
              <input type="text" className="filter-input" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="User, action, etc." />
            </div>
            <button className="btn btn-primary" onClick={applyFilters}>
              <i className="fas fa-filter"></i> Apply Filters
            </button>
            <button className="btn btn-success" onClick={handleExport}>
              <i className="fas fa-file-export"></i> Export Log
            </button>
          </div>
          <div className="audit-stats">
            <div className="stat-card">
              <div className="stat-icon add"><i className="fas fa-plus"></i></div>
              <div className="stat-value">{stats.created}</div>
              <div className="stat-label">Items Added</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon update"><i className="fas fa-sync"></i></div>
              <div className="stat-value">{stats.updated}</div>
              <div className="stat-label">Quantity Updates</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon delete"><i className="fas fa-trash"></i></div>
              <div className="stat-value">{stats.deleted}</div>
              <div className="stat-label">Items Deleted</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon usage"><i className="fas fa-pills"></i></div>
              <div className="stat-value">{stats.exported}</div>
              <div className="stat-label">Exports Logged</div>
            </div>
          </div>

          <div className="activity-timeline">
            <div className="section-header">
              <div className="section-title">Recent Activity Timeline</div>
              <button className="btn" onClick={() => fetchLogs(1)}>
                <i className="fas fa-history"></i> Refresh Timeline
              </button>
            </div>

            <div className="timeline">
              {timeline.length ? (
                timeline.map((t) => (
                  <div className="timeline-item" key={t.id}>
                    <div className={`timeline-marker ${t.type}`}></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <div className="timeline-title">{t.title}</div>
                        <div className="timeline-time">{t.time}</div>
                      </div>
                      <div className="timeline-details">
                        <span className={`timeline-badge badge-${t.status}`}>{t.type.toUpperCase()}</span>
                        {t.details}
                      </div>
                      <div className="timeline-user">
                        <img src={`https://ui-avatars.com/api/?name=${t.avatar}&background=3a86ff&color=fff`} alt="User" />
                        {t.user} ({t.role})
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="timeline-empty">No recent activity available.</div>
              )}
            </div>
          </div>

          <div className="audit-table-section">
            <div className="section-header">
              <div className="section-title">Detailed Audit Log</div>
              <button className="btn btn-primary" onClick={() => fetchLogs(page)}>
                <i className="fas fa-sync"></i> Refresh
              </button>
            </div>

            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                    <th>User</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length ? (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td>{new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()}</td>
                        <td><span className={`action-type action-${(log.action || 'other').toLowerCase()}`}>{(log.action || 'other').toUpperCase()}</span></td>
                        <td>{log.resource || '—'}</td>
                        <td>{log.details || '—'}</td>
                        <td>{log.userName || 'System'}</td>
                        <td><span className={`user-role status-${log.status || 'success'}`}>{(log.status || 'success').toUpperCase()}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No audit logs found for the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">{pagination.total ? `Showing ${startEntry}-${endEntry} of ${pagination.total} entries` : 'No entries to display'}</div>
              <div className="pagination-controls">
                <button className="page-btn" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>Prev</button>
                {pageNumbers.map((p) => (
                  <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => handlePageChange(p)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => handlePageChange(page + 1)} disabled={page >= pagination.pages}>Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
