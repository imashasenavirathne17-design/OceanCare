import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { clearSession, getUser } from '../../lib/token';
import './adminReports.css';
import { listAuditLogs } from '../../lib/auditLogApi';
import { listUsers } from '../../lib/users';

export default function AdminReports() {
  const navigate = useNavigate();
  const user = getUser();

  // Auto logout on inactivity (consistent with other admin pages)
  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [navigate]);

  const onLogout = () => { clearSession(); navigate('/login'); };

  // pagination active page (fake)
  const [activePage, setActivePage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // html2pdf helpers for colorful PDF export
  const ensureHtml2Pdf = async () => {
    if (window.html2pdf) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s.crossOrigin = 'anonymous';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load html2pdf.js'));
      document.head.appendChild(s);
    });
  };

  const downloadPdfFromHtml = async (html, filename) => {
    await ensureHtml2Pdf();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    await new Promise((r) => setTimeout(r, 200));
    await window.html2pdf().from(doc.body).set({ margin: 10, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).save();
    document.body.removeChild(iframe);
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await listUsers({ page: 1, limit: 200 });
      const items = res.items || res.users || [];
      setUsers(items);
    } catch (e) {
      console.error('Failed to load users', e);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await listAuditLogs({ page, limit: 10, sort: '-timestamp' });
      setLogs(res.logs || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (e) {
      console.error('Failed to load audit logs', e);
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs(1);
  }, []);

  const exportAllReports = async () => {
    // Read current filter values from the DOM (keeps UI unchanged)
    const root = document.querySelector('.report-filters');
    const getVal = (sel, fallback='') => root?.querySelector(sel)?.value || fallback;
    const dateRange = getVal('select:nth-of-type(1)', '');
    const reportType = getVal('select:nth-of-type(2)', '');
    const userRole = getVal('select:nth-of-type(3)', '');
    const startDate = getVal('input[type="date"]:nth-of-type(1)', '');
    const endDate = getVal('input[type="date"]:nth-of-type(2)', '');
    const sensitivity = getVal('select:nth-of-type(4)', '');

    const title = 'OceanCare Reports Summary';
    const generatedAt = new Date().toLocaleString();
    const rows = (logs || []).map((row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${row.timestamp ? new Date(row.timestamp).toLocaleString() : ''}</td>
        <td>${row.userName || 'System'}</td>
        <td><span class="pill pill-${(row.action||'other').toLowerCase()}">${(row.action||'other')}</span></td>
        <td>${row.resource || '—'}</td>
        <td>${(row.details || '—').toString().slice(0,120)}</td>
      </tr>
    `).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title>
    <style>
    :root{--bg:#0f172a;--card:#111827;--text:#e5e7eb;--muted:#9ca3af;--grad1:#8b5cf6;--grad2:#22d3ee;--stripe:rgba(255,255,255,.03)}
    body{background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;margin:0;padding:28px}
    .card{background:linear-gradient(180deg,rgba(139,92,246,.12),rgba(34,211,238,.08)),var(--card);border-radius:16px;padding:22px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
    h1{margin:0 0 6px;font-size:22px}
    .meta{color:var(--muted);font-size:12px;margin-bottom:12px}
    .filters{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
    .f{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);padding:8px 10px;border-radius:10px;font-size:12px}
    table{width:100%;border-collapse:collapse;overflow:hidden;border-radius:12px}
    thead th{text-align:left;font-size:12px;color:var(--muted);background:rgba(139,92,246,.15);padding:10px 12px}
    tbody td{padding:10px 12px;border-top:1px solid rgba(148,163,184,.12);font-size:12.5px}
    tbody tr:nth-child(odd){background:var(--stripe)}
    .pill{padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700}
    .pill-create{background:rgba(16,185,129,.18);color:#a7f3d0}
    .pill-update{background:rgba(59,130,246,.18);color:#bfdbfe}
    .pill-delete{background:rgba(244,63,94,.18);color:#fecdd3}
    .pill-access{background:rgba(245,158,11,.18);color:#fde68a}
    .pill-export{background:rgba(99,102,241,.18);color:#c7d2fe}
    .pill-other{background:rgba(148,163,184,.18);color:#e5e7eb}
    .footer{margin-top:12px;color:var(--muted);font-size:11px}
    @media print{body{background:#fff}.card{box-shadow:none}}
    </style></head><body>
    <div class="card">
      <h1>${title}</h1>
      <div class="meta">Generated at ${generatedAt} • Current page size: ${(logs||[]).length}</div>
      <div class="filters">
        <div class="f"><strong>Date Range:</strong> ${dateRange || '—'}</div>
        <div class="f"><strong>Report Type:</strong> ${reportType || '—'}</div>
        <div class="f"><strong>User Role:</strong> ${userRole || '—'}</div>
        <div class="f"><strong>Start Date:</strong> ${startDate || '—'}</div>
        <div class="f"><strong>End Date:</strong> ${endDate || '—'}</div>
        <div class="f"><strong>Sensitivity:</strong> ${sensitivity || '—'}</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">OceanCare • Reports Export</div>
    </div>
    </body></html>`;

    await downloadPdfFromHtml(html, 'oceanCare-reports-export.pdf');
  };

  return (
    <div className="admin-dashboard admin-reports">
      <div className="dashboard-container">
        <AdminSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="header">
            <h2>Reports & Analytics</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin User')}&background=8338ec&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Sarah Johnson'}</div>
                <small>Administrator</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Report Filters */}
          <div className="report-filters">
            <div className="section-header">
              <div className="section-title">Report Filters</div>
              <button className="btn btn-primary" onClick={() => { alert('Exporting all reports...'); setTimeout(()=>alert('All reports exported!'), 1500); }}>
                <i className="fas fa-file-export"></i> Export All
              </button>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label className="form-label">Date Range</label>
                <select className="form-control" defaultValue="Last 30 days">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Custom Range</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="form-label">Report Type</label>
                <select className="form-control" defaultValue="All Reports">
                  <option>All Reports</option>
                  <option>User Activity</option>
                  <option>System Health</option>
                  <option>Medical Data</option>
                  <option>Inventory Status</option>
                  <option>Compliance</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="form-label">User Role</label>
                <select className="form-control" defaultValue="All Roles">
                  <option>All Roles</option>
                  <option>Administrator</option>
                  <option>Medical Officer</option>
                  <option>Inventory Manager</option>
                  <option>Crew Member</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-control" />
              </div>

              <div className="filter-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-control" />
              </div>

              <div className="filter-group">
                <label className="form-label">Data Sensitivity</label>
                <select className="form-control" defaultValue="All Data">
                  <option>All Data</option>
                  <option>Anonymized Only</option>
                  <option>Sensitive Data</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <button className="btn btn-primary" onClick={() => { alert('Applying filters...'); setTimeout(()=>alert('Reports updated!'), 1200); }}>
                <i className="fas fa-filter"></i> Apply Filters
              </button>
              <button className="btn" onClick={() => alert('Filters reset!')}>
                <i className="fas fa-redo"></i> Reset Filters
              </button>
            </div>
          </div>

          {/* Report Cards */}
          <div className="report-cards">
            <div className="report-card">
              <div className="report-icon"><i className="fas fa-users"></i></div>
              <div className="report-value">247</div>
              <div className="report-title">Active Users</div>
              <div className="report-desc">+12 from last month</div>
            </div>
            <div className="report-card">
              <div className="report-icon success"><i className="fas fa-heartbeat"></i></div>
              <div className="report-value">1,284</div>
              <div className="report-title">Health Records</div>
              <div className="report-desc">98.7% complete</div>
            </div>
            <div className="report-card">
              <div className="report-icon info"><i className="fas fa-boxes"></i></div>
              <div className="report-value">5,672</div>
              <div className="report-title">Inventory Items</div>
              <div className="report-desc">87% in stock</div>
            </div>
            <div className="report-card">
              <div className="report-icon warning"><i className="fas fa-exclamation-triangle"></i></div>
              <div className="report-value">23</div>
              <div className="report-title">Alerts Triggered</div>
              <div className="report-desc">This month</div>
            </div>
            <div className="report-card">
              <div className="report-icon danger"><i className="fas fa-bug"></i></div>
              <div className="report-value">0.12%</div>
              <div className="report-title">System Errors</div>
              <div className="report-desc">Below threshold</div>
            </div>
            <div className="report-card">
              <div className="report-icon"><i className="fas fa-shield-alt"></i></div>
              <div className="report-value">100%</div>
              <div className="report-title">Compliance</div>
              <div className="report-desc">GDPR & IMO standards</div>
            </div>
          </div>

          
          {/* Audit Logs */}
          
          <div className="audit-logs">
            <div className="section-header">
              <div className="section-title">Recent Activity Logs</div>
              <button className="btn btn-primary" onClick={() => { alert('Exporting activity logs...'); setTimeout(()=>alert('Logs exported!'), 1200); }}>
                <i className="fas fa-file-csv"></i> Export Logs
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading && (
                    <tr><td colSpan={6}>Loading…</td></tr>
                  )}
                  {!logsLoading && logs.length === 0 && (
                    <tr><td colSpan={6}>No activity found.</td></tr>
                  )}
                  {!logsLoading && logs.map((row) => {
                    const u = users.find(u => (u._id || u.id) === (row.userId || row.user_id));
                    const role = u?.role || u?.userType || u?.type || '';
                    const roleClass = role?.toString().toLowerCase().includes('admin') ? 'role-admin' : role?.toString().toLowerCase().includes('medical') ? 'role-medical' : role?.toString().toLowerCase().includes('inventory') ? 'role-inventory' : role ? 'role-crew' : '';
                    const action = (row.action || '').toLowerCase();
                    const actionClass = action === 'create' ? 'action-create' : action === 'update' ? 'action-update' : action === 'delete' ? 'action-delete' : action === 'access' ? 'action-access' : 'action-other';
                    return (
                      <tr key={row._id}>
                        <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : ''}</td>
                        <td>{row.userName || u?.fullName || u?.name || u?.email || 'System'}</td>
                        <td>{role ? (<span className={`user-role ${roleClass}`}>{role}</span>) : '—'}</td>
                        <td><span className={`action-type ${actionClass}`}>{(row.action || '').charAt(0).toUpperCase() + (row.action || '').slice(1)}</span></td>
                        <td>{row.resource || '—'}</td>
                        <td>{row.details || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">Page {activePage} of {totalPages}</div>
              <div className="pagination-controls">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${activePage===p ? 'active' : ''}`} onClick={() => { setActivePage(p); fetchLogs(p); }}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => { const next = Math.min(activePage + 1, totalPages); setActivePage(next); fetchLogs(next); }}>Next</button>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="export-section">
            <div className="section-header">
              <div className="section-title">Data Export Options</div>
              <button className="btn btn-primary" onClick={() => alert('Opening export settings...')}>
                <i className="fas fa-cog"></i> Export Settings
              </button>
            </div>

            <div className="export-options">
              <div className="export-card">
                <div className="export-icon"><i className="fas fa-file-csv"></i></div>
                <div className="export-title">CSV Export</div>
                <div className="export-desc">Export data in CSV format for spreadsheet analysis</div>
                <button className="btn btn-primary btn-sm" onClick={() => { alert('Preparing CSV download...'); setTimeout(()=>alert('CSV ready!'), 1000); }}><i className="fas fa-download"></i> Download</button>
              </div>

              <div className="export-card">
                <div className="export-icon"><i className="fas fa-file-pdf"></i></div>
                <div className="export-title">PDF Report</div>
                <div className="export-desc">Generate formatted PDF reports for documentation</div>
                <button className="btn btn-danger btn-sm" onClick={() => { alert('Preparing PDF download...'); setTimeout(()=>alert('PDF ready!'), 1200); }}><i className="fas fa-download"></i> Download</button>
              </div>

              <div className="export-card">
                <div className="export-icon"><i className="fas fa-file-excel"></i></div>
                <div className="export-title">Excel Export</div>
                <div className="export-desc">Export to Excel with formatted tables and charts</div>
                <button className="btn btn-success btn-sm" onClick={() => { alert('Preparing Excel download...'); setTimeout(()=>alert('Excel ready!'), 1200); }}><i className="fas fa-download"></i> Download</button>
              </div>

              <div className="export-card">
                <div className="export-icon"><i className="fas fa-database"></i></div>
                <div className="export-title">Database Backup</div>
                <div className="export-desc">Full database backup for regulatory compliance</div>
                <button className="btn btn-info btn-sm" onClick={() => { alert('Preparing backup...'); setTimeout(()=>alert('Backup ready!'), 1500); }}><i className="fas fa-download"></i> Download</button>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label className="form-label">Anonymization Level</label>
                <select className="form-control" defaultValue="No Anonymization">
                  <option>No Anonymization</option>
                  <option>Partial Anonymization</option>
                  <option>Full Anonymization (GDPR Compliant)</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="form-label">Data Scope</label>
                <select className="form-control" defaultValue="All Data">
                  <option>All Data</option>
                  <option>Medical Records Only</option>
                  <option>User Activity Only</option>
                  <option>System Logs Only</option>
                  <option>Inventory Data Only</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="form-label">Date Range</label>
                <select className="form-control" defaultValue="Last 30 Days">
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                  <option>Last Year</option>
                  <option>Custom Range</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <button className="btn btn-primary" onClick={() => { alert('Generating custom export...'); setTimeout(()=>alert('Custom export completed!'), 1500); }}>
                <i className="fas fa-file-export"></i> Generate Custom Export
              </button>
              <button className="btn btn-warning" onClick={() => alert('Opening schedule configuration...')}>
                <i className="fas fa-history"></i> Schedule Regular Export
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
