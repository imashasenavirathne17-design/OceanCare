import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { clearSession, getUser } from '../../lib/token';
import './adminCompliance.css';
import { listAuditLogs, createAuditLog, deleteAuditLog, updateAuditLog } from '../../lib/auditLogApi';
import { listUsers } from '../../lib/users';
import { listFrameworks, createFramework, updateFramework, deleteFramework } from '../../lib/complianceFrameworkApi';
import { listRegulatoryReports, createRegulatoryReport, updateRegulatoryReport, deleteRegulatoryReport } from '../../lib/regulatoryReportApi';

export default function AdminCompliance() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [navigate]);

  const [progress, setProgress] = useState(87);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFramework, setActiveFramework] = useState('gdpr');
  const [activePage, setActivePage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    timestamp: '',
    userName: '',
    userId: '',
    action: 'other',
    resource: '',
    status: 'success',
    details: ''
  });
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [frameworks, setFrameworks] = useState([]);
  const [fwLoading, setFwLoading] = useState(false);
  const [fwModalOpen, setFwModalOpen] = useState(false);
  const [fwEditingId, setFwEditingId] = useState(null);
  const [fwForm, setFwForm] = useState({ name: '', code: '', description: '', status: 'partial', lastAuditAt: '', requirementsTotal: 0, requirementsMet: 0, ownerName: '' });
  const [reports, setReports] = useState([]);
  const [rrLoading, setRrLoading] = useState(false);
  const [rrModalOpen, setRrModalOpen] = useState(false);
  const [rrEditingId, setRrEditingId] = useState(null);
  const [rrForm, setRrForm] = useState({
    title: '',
    description: '',
    agency: '',
    frequency: 'monthly',
    format: 'pdf',
    status: 'scheduled',
    dueDate: '',
    lastRunAt: '',
    ownerName: ''
  });

  // Ensure modal starts closed on mount (guards against HMR/state persistence)
  useEffect(() => {
    setModalOpen(false);
  }, []);

  const onLogout = () => { clearSession(); navigate('/login'); };

  const refreshCompliance = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setProgress((p) => (p < 89 ? 89 : p));
      alert('Compliance status refreshed!');
    }, 1500);
  };

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
    await new Promise((r) => setTimeout(r, 250));
    await window.html2pdf().from(doc.body).set({ margin: 10, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).save();
    document.body.removeChild(iframe);
  };

  const exportAuditLogsAsReport = async () => {
    const title = 'Audit Trail Report';
    const generatedAt = new Date().toLocaleString();
    const rows = (logs || []).map((log, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
        <td>${log.userName || 'System'}</td>
        <td><span class="pill pill-${(log.action||'other').toLowerCase()}">${(log.action||'other')}</span></td>
        <td>${log.resource || ''}</td>
        <td>${log.status === 'success' ? '<span class="status ok">Success</span>' : '<span class="status fail">Failure</span>'}</td>
      </tr>
    `).join('');
    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  :root {
    --bg: #0f172a;
    --card: #111827;
    --text: #e5e7eb;
    --muted: #9ca3af;
    --primary: #8b5cf6;
    --accent: #22d3ee;
    --ok: #22c55e;
    --fail: #ef4444;
    --tableStripe: rgba(255,255,255,0.03);
  }
  body { background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; margin: 0; padding: 32px; }
  .card { background: linear-gradient(180deg, rgba(139,92,246,0.12), rgba(34,211,238,0.08)), var(--card); border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
  h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: 0.3px; }
  .meta { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 12px; }
  thead th { text-align: left; font-size: 12px; color: var(--muted); background: rgba(139,92,246,0.15); padding: 10px 12px; }
  tbody td { padding: 10px 12px; border-top: 1px solid rgba(148,163,184,0.12); font-size: 13px; }
  tbody tr:nth-child(odd) { background: var(--tableStripe); }
  .status { padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: 0.2px; }
  .status.ok { background: rgba(34,197,94,0.15); color: #bbf7d0; border: 1px solid rgba(34,197,94,0.35); }
  .status.fail { background: rgba(239,68,68,0.15); color: #fecaca; border: 1px solid rgba(239,68,68,0.35); }
  .pill { padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 600; }
  .pill-create { background: rgba(16,185,129,0.18); color: #a7f3d0; }
  .pill-update { background: rgba(59,130,246,0.18); color: #bfdbfe; }
  .pill-delete { background: rgba(244,63,94,0.18); color: #fecdd3; }
  .pill-access { background: rgba(245,158,11,0.18); color: #fde68a; }
  .pill-login { background: rgba(34,197,94,0.18); color: #bbf7d0; }
  .pill-logout { background: rgba(234,179,8,0.18); color: #fde68a; }
  .pill-export { background: rgba(99,102,241,0.18); color: #c7d2fe; }
  .pill-other { background: rgba(148,163,184,0.18); color: #e5e7eb; }
  .footer { margin-top: 16px; color: var(--muted); font-size: 11px; }
  @media print {
    body { background: #fff; }
    .card { box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <div class="meta">Generated at ${generatedAt} • Total entries: ${(logs||[]).length}</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Timestamp</th>
          <th>User</th>
          <th>Action</th>
          <th>Resource</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="footer">OceanCare • Audit Trail Export</div>
  </div>
</body>
</html>`;
    await downloadPdfFromHtml(html, 'audit-trail-report.pdf');
  };

  const exportFrameworksAsReport = async () => {
    const title = 'Compliance Frameworks Report';
    const generatedAt = new Date().toLocaleString();
    const rows = (frameworks || []).map((fw, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${fw.name}</td>
        <td>${fw.code}</td>
        <td>${fw.status}</td>
        <td>${fw.lastAuditAt ? new Date(fw.lastAuditAt).toLocaleDateString() : ''}</td>
        <td>${fw.requirementsMet}/${fw.requirementsTotal}</td>
      </tr>
    `).join('');
    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  :root {
    --bg: #0f172a;
    --card: #111827;
    --text: #e5e7eb;
    --muted: #9ca3af;
    --primary: #8b5cf6;
    --accent: #22d3ee;
    --ok: #22c55e;
    --fail: #ef4444;
    --tableStripe: rgba(255,255,255,0.03);
  }
  body { background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; margin: 0; padding: 32px; }
  .card { background: linear-gradient(180deg, rgba(139,92,246,0.12), rgba(34,211,238,0.08)), var(--card); border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
  h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: 0.3px; }
  .meta { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 12px; }
  thead th { text-align: left; font-size: 12px; color: var(--muted); background: rgba(139,92,246,0.15); padding: 10px 12px; }
  tbody td { padding: 10px 12px; border-top: 1px solid rgba(148,163,184,0.12); font-size: 13px; }
  tbody tr:nth-child(odd) { background: var(--tableStripe); }
  .footer { margin-top: 16px; color: var(--muted); font-size: 11px; }
  @media print {
    body { background: #fff; }
    .card { box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <div class="meta">Generated at ${generatedAt} • Total entries: ${(frameworks||[]).length}</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Code</th>
          <th>Status</th>
          <th>Last Audit</th>
          <th>Requirements</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="footer">OceanCare • Compliance Frameworks Export</div>
  </div>
</body>
</html>`;
    await downloadPdfFromHtml(html, 'compliance-frameworks-report.pdf');
  };

  const exportRegulatoryReportsAsReport = async () => {
    const title = 'Regulatory Reports Report';
    const generatedAt = new Date().toLocaleString();
    const rows = (reports || []).map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.title}</td>
        <td>${r.agency}</td>
        <td>${r.frequency}</td>
        <td>${r.format}</td>
        <td>${r.status}</td>
        <td>${r.dueDate ? new Date(r.dueDate).toLocaleDateString() : ''}</td>
        <td>${r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : ''}</td>
      </tr>
    `).join('');
    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  :root {
    --bg: #0f172a;
    --card: #111827;
    --text: #e5e7eb;
    --muted: #9ca3af;
    --primary: #8b5cf6;
    --accent: #22d3ee;
    --ok: #22c55e;
    --fail: #ef4444;
    --tableStripe: rgba(255,255,255,0.03);
  }
  body { background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; margin: 0; padding: 32px; }
  .card { background: linear-gradient(180deg, rgba(139,92,246,0.12), rgba(34,211,238,0.08)), var(--card); border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
  h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: 0.3px; }
  .meta { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 12px; }
  thead th { text-align: left; font-size: 12px; color: var(--muted); background: rgba(139,92,246,0.15); padding: 10px 12px; }
  tbody td { padding: 10px 12px; border-top: 1px solid rgba(148,163,184,0.12); font-size: 13px; }
  tbody tr:nth-child(odd) { background: var(--tableStripe); }
  .footer { margin-top: 16px; color: var(--muted); font-size: 11px; }
  @media print {
    body { background: #fff; }
    .card { box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <div class="meta">Generated at ${generatedAt} • Total entries: ${(reports||[]).length}</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Title</th>
          <th>Agency</th>
          <th>Frequency</th>
          <th>Format</th>
          <th>Status</th>
          <th>Due Date</th>
          <th>Last Run</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="footer">OceanCare • Regulatory Reports Export</div>
  </div>
</body>
</html>`;
    await downloadPdfFromHtml(html, 'regulatory-reports-report.pdf');
  };

  const fetchLogs = async (page = 1, term = '') => {
    setLogsLoading(true);
    try {
      const res = await listAuditLogs({ page, limit: 10, sort: '-timestamp', term });
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
    fetchLogs(activePage, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFrameworks = async () => {
    setFwLoading(true);
    try {
      const res = await listFrameworks({ sort: 'name', limit: 50 });
      setFrameworks(res.frameworks || []);
    } catch (e) {
      console.error('Failed to load compliance frameworks', e);
      setFrameworks([]);
    } finally {
      setFwLoading(false);
    }
  };

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchReports = async () => {
    setRrLoading(true);
    try {
      const res = await listRegulatoryReports({ sort: '-dueDate', limit: 50 });
      setReports(res.reports || []);
    } catch (e) {
      console.error('Failed to load regulatory reports', e);
      setReports([]);
    } finally {
      setRrLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await listUsers({ page: 1, limit: 100 });
      const items = res.items || res.users || [];
      setUsers(items);
    } catch (e) {
      console.error('Failed to load users', e);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (addOpen) {
      fetchUsers();
    }
  }, [addOpen]);

  return (
    <div className="admin-dashboard admin-compliance">
      <div className="dashboard-container">
        <AdminSidebar onLogout={onLogout} />

        <main className="main-content">
          <div className="header">
            <h2>Compliance & Audit</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin User')}&background=8338ec&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Sarah Johnson'}</div>
                <small>Administrator</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Compliance Overview */}
          <div className="compliance-overview">
            <div className="section-header">
              <div className="section-title">Compliance Overview</div>
              <button className="btn btn-primary" onClick={refreshCompliance} disabled={refreshing}>
                {refreshing ? (<><i className="fas fa-spinner fa-spin"></i> Refreshing...</>) : (<><i className="fas fa-sync"></i> Refresh Status</>)}
              </button>
            </div>

            <div className="compliance-stats">
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
                <div className="stat-value">94%</div>
                <div className="stat-label">Overall Compliance</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-file-contract"></i></div>
                <div className="stat-value">28</div>
                <div className="stat-label">Active Policies</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-exclamation-triangle"></i></div>
                <div className="stat-value">3</div>
                <div className="stat-label">Compliance Gaps</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-history"></i></div>
                <div className="stat-value">2,487</div>
                <div className="stat-label">Audit Entries (7 days)</div>
              </div>
            </div>

            <div className="compliance-progress">
              <div className="progress-header">
                <div className="progress-title">GDPR Compliance Progress</div>
                <div className="progress-percent">{progress}%</div>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
              <div className="progress-labels"><span>0%</span><span>50%</span><span>100%</span></div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="audit-logs">
            <div className="logs-header">
              <div className="section-title">Audit Trail</div>
              <div className="search-box">
                <input className="search-input" placeholder="Search audit logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <button className="btn btn-primary" onClick={() => { setActivePage(1); fetchLogs(1, searchTerm); }}><i className="fas fa-search"></i> Search</button>
                <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setActivePage(1); fetchLogs(1, ''); }}><i className="fas fa-undo"></i> Reset</button>
                <button className="btn btn-success" onClick={() => exportAuditLogsAsReport()}><i className="fas fa-file-export"></i> Export Logs</button>
                <button className="btn btn-primary" onClick={() => setAddOpen(true)}><i className="fas fa-plus"></i> Add Log</button>
              </div>
            </div>

            <table className="logs-table">
              <thead>
                <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Status</th></tr>
              </thead>
              <tbody>
                {logsLoading && (
                  <tr><td colSpan={6}>Loading…</td></tr>
                )}
                {!logsLoading && logs.length === 0 && (
                  <tr><td colSpan={6}>No audit logs found.</td></tr>
                )}
                {!logsLoading && logs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                    <td>{log.userName || 'System'}</td>
                    <td>
                      <span className={`audit-action action-${(log.action || 'other').toLowerCase()}`}>
                        {(log.action || 'other').charAt(0).toUpperCase() + (log.action || 'other').slice(1)}
                      </span>
                    </td>
                    <td>{log.resource}</td>
                    <td>
                      {log.status === 'success' ? (
                        <i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i>
                      ) : (
                        <i className="fas fa-times-circle" style={{ color: 'var(--danger)' }}></i>
                      )}
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginLeft: 8 }}
                        onClick={() => {
                          setEditingId(log._id);
                          setForm({
                            timestamp: log.timestamp ? new Date(log.timestamp).toISOString().slice(0,16) : '',
                            userName: log.userName || '',
                            userId: (log.userId || ''),
                            action: log.action || 'other',
                            resource: log.resource || '',
                            status: log.status || 'success',
                            details: log.details || ''
                          });
                          setAddOpen(true);
                        }}
                        title="Update"
                      >
                        <i className="far fa-edit"></i>
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ marginLeft: 8 }} onClick={async () => { if (window.confirm('Delete this log?')) { try { await deleteAuditLog(log._id); fetchLogs(activePage, searchTerm); } catch (e) { alert(e.message || 'Failed to delete'); } } }} title="Delete">
                        <i className="far fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <div className="pagination-info">Page {activePage} of {totalPages}</div>
              <div className="pagination-controls">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => idx + 1).map((p) => (
                  <button key={p} className={`page-btn ${activePage===p?'active':''}`} onClick={() => { setActivePage(p); fetchLogs(p, searchTerm); }}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => { const next = Math.min(activePage + 1, totalPages); setActivePage(next); fetchLogs(next, searchTerm); }}>Next</button>
              </div>
            </div>
          </div>

          {/* Compliance Framework */}
          <div className="compliance-framework">
            <div className="section-header">
              <div className="section-title">Compliance Framework</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => fetchFrameworks()} disabled={fwLoading}><i className="fas fa-sync"></i> {fwLoading ? 'Refreshing…' : 'Refresh'}</button>
                <button className="btn btn-success" onClick={() => exportFrameworksAsReport()}><i className="fas fa-file-export"></i> Export</button>
                <button className="btn btn-primary" onClick={() => { setFwEditingId(null); setFwForm({ name: '', code: '', description: '', status: 'partial', lastAuditAt: '', requirementsTotal: 0, requirementsMet: 0, ownerName: '' }); setFwModalOpen(true); }}><i className="fas fa-plus"></i> New Framework</button>
              </div>
            </div>

            <div className="framework-tabs"></div>

            <div className={`framework-content ${activeFramework==='gdpr'?'active':''}`} id="gdpr-content">
              <div className="framework-grid">
                {fwLoading && (
                  <div className="framework-card"><div className="framework-name">Loading…</div></div>
                )}
                {!fwLoading && frameworks.length === 0 && (
                  <div className="framework-card"><div className="framework-name">No frameworks</div></div>
                )}
                {!fwLoading && frameworks.map((fw) => {
                  const statusClass = fw.status === 'compliant' ? 'status-compliant' : fw.status === 'non_compliant' ? 'status-danger' : 'status-partial';
                  const met = Number(fw.requirementsMet || 0);
                  const total = Number(fw.requirementsTotal || 0);
                  return (
                    <div className="framework-card" key={fw._id}>
                      <div className="framework-header">
                        <div className="framework-name">{fw.name} ({fw.code})</div>
                        <div className={`compliance-status ${statusClass}`}>{fw.status.replace('_', ' ')}</div>
                      </div>
                      <div className="framework-details">
                        <div className="detail-item"><span className="detail-label">Last Audit:</span><span className="detail-value">{fw.lastAuditAt ? new Date(fw.lastAuditAt).toLocaleDateString() : '—'}</span></div>
                        <div className="detail-item"><span className="detail-label">Requirements:</span><span className="detail-value">{met}/{total} Met</span></div>
                        <div className="detail-item"><span className="detail-label">Owner:</span><span className="detail-value">{fw.ownerName || '—'}</span></div>
                      </div>
                      <div className="framework-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => { setFwEditingId(fw._id); setFwForm({ name: fw.name || '', code: fw.code || '', description: fw.description || '', status: fw.status || 'partial', lastAuditAt: fw.lastAuditAt ? new Date(fw.lastAuditAt).toISOString().slice(0,10) : '', requirementsTotal: fw.requirementsTotal || 0, requirementsMet: fw.requirementsMet || 0, ownerName: fw.ownerName || '' }); setFwModalOpen(true); }}><i className="far fa-edit"></i> Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={async () => { if (window.confirm('Delete this framework?')) { try { await deleteFramework(fw._id); fetchFrameworks(); } catch (e) { alert(e.message || 'Failed to delete'); } } }}><i className="far fa-trash-alt"></i> Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeFramework !== 'gdpr' && (
              <div className="framework-content active"><div className="section-title">{activeFramework.toUpperCase()} content coming soon</div></div>
            )}
          </div>

          {/* Regulatory Reports */}
          <div className="regulatory-reports">
            <div className="section-header">
              <div className="section-title">Regulatory Reports</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => fetchReports()} disabled={rrLoading}><i className="fas fa-sync"></i> {rrLoading ? 'Refreshing…' : 'Refresh'}</button>
                <button className="btn btn-success" onClick={() => exportRegulatoryReportsAsReport()}><i className="fas fa-file-export"></i> Export</button>
                <button className="btn btn-primary" onClick={() => { setRrEditingId(null); setRrForm({ title: '', description: '', agency: '', frequency: 'monthly', format: 'pdf', status: 'scheduled', dueDate: '', lastRunAt: '', ownerName: '' }); setRrModalOpen(true); }}><i className="fas fa-plus"></i> New Report</button>
              </div>
            </div>

            <div className="reports-grid">
              {rrLoading && (
                <div className="report-card"><div className="report-title">Loading…</div></div>
              )}
              {!rrLoading && reports.length === 0 && (
                <div className="report-card"><div className="report-title">No reports</div></div>
              )}
              {!rrLoading && reports.map((r) => (
                <div key={r._id} className="report-card">
                  <div className="report-icon"><i className={r.agency?.toLowerCase().includes('port') ? 'fas fa-ship' : 'fas fa-file-contract'}></i></div>
                  <div className="report-title">{r.title}</div>
                  <div className="report-desc">{r.description || '—'}</div>
                  <div className="report-meta">Agency: {r.agency} • Freq: {r.frequency} • Format: {r.format}</div>
                  <div className="report-meta">Status: {r.status} • Due: {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'} • Last Run: {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : '—'}</div>
                  <div className="framework-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => { setRrEditingId(r._id); setRrForm({ title: r.title || '', description: r.description || '', agency: r.agency || '', frequency: r.frequency || 'monthly', format: r.format || 'pdf', status: r.status || 'scheduled', dueDate: r.dueDate ? new Date(r.dueDate).toISOString().slice(0,10) : '', lastRunAt: r.lastRunAt ? new Date(r.lastRunAt).toISOString().slice(0,16) : '', ownerName: r.ownerName || '' }); setRrModalOpen(true); }}><i className="far fa-edit"></i> Edit</button>
                    <button className="btn btn-outline btn-sm" onClick={async () => { if (window.confirm('Delete this report?')) { try { await deleteRegulatoryReport(r._id); fetchReports(); } catch (e) { alert(e.message || 'Failed to delete'); } } }}><i className="far fa-trash-alt"></i> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>


      {/* Add/Update Regulatory Report Modal */}
      <div className={`modal ${rrModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal')) { setRrModalOpen(false); setRrEditingId(null); } }}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">{rrEditingId ? 'Update Regulatory Report' : 'New Regulatory Report'}</div>
            <button className="close-modal" onClick={() => { setRrModalOpen(false); setRrEditingId(null); }}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-control" value={rrForm.title} onChange={(e) => setRrForm({ ...rrForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Agency</label>
                <input className="form-control" value={rrForm.agency} onChange={(e) => setRrForm({ ...rrForm, agency: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={rrForm.description} onChange={(e) => setRrForm({ ...rrForm, description: e.target.value })}></textarea>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-control" value={rrForm.frequency} onChange={(e) => setRrForm({ ...rrForm, frequency: e.target.value })}>
                  <option value="daily">daily</option>
                  <option value="weekly">weekly</option>
                  <option value="monthly">monthly</option>
                  <option value="quarterly">quarterly</option>
                  <option value="yearly">yearly</option>
                  <option value="adhoc">adhoc</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Format</label>
                <select className="form-control" value={rrForm.format} onChange={(e) => setRrForm({ ...rrForm, format: e.target.value })}>
                  <option value="pdf">pdf</option>
                  <option value="csv">csv</option>
                  <option value="xlsx">xlsx</option>
                  <option value="json">json</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={rrForm.status} onChange={(e) => setRrForm({ ...rrForm, status: e.target.value })}>
                  <option value="draft">draft</option>
                  <option value="scheduled">scheduled</option>
                  <option value="completed">completed</option>
                  <option value="failed">failed</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-control" value={rrForm.dueDate} onChange={(e) => setRrForm({ ...rrForm, dueDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Run At</label>
                <input type="datetime-local" className="form-control" value={rrForm.lastRunAt} onChange={(e) => setRrForm({ ...rrForm, lastRunAt: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <input className="form-control" value={rrForm.ownerName} onChange={(e) => setRrForm({ ...rrForm, ownerName: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => { setRrModalOpen(false); setRrEditingId(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={async () => {
              try {
                // Required validation
                const requiredRr = ['title','agency','frequency','format','status','dueDate','lastRunAt','ownerName'];
                const hasEmptyRr = requiredRr.some(k => !String((rrForm?.[k] ?? '')).trim());
                if (hasEmptyRr) { alert('Please fill all the rows'); return; }
                const payload = { ...rrForm };
                if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();
                if (payload.lastRunAt) payload.lastRunAt = new Date(payload.lastRunAt).toISOString();
                if (rrEditingId) {
                  await updateRegulatoryReport(rrEditingId, payload);
                } else {
                  await createRegulatoryReport(payload);
                }
                setRrModalOpen(false);
                setRrEditingId(null);
                setRrForm({ title: '', description: '', agency: '', frequency: 'monthly', format: 'pdf', status: 'scheduled', dueDate: '', lastRunAt: '', ownerName: '' });
                fetchReports();
              } catch (e) {
                alert(e.message || (rrEditingId ? 'Failed to update report' : 'Failed to create report'));
              }
            }}>{rrEditingId ? 'Update' : 'Save'}</button>
          </div>
        </div>
      </div>

      {/* Add/Update Audit Log Modal */}
      <div className={`modal ${addOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal')) setAddOpen(false); }}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">{editingId ? 'Update Audit Log' : 'Add Audit Log'}</div>
            <button className="close-modal" onClick={() => setAddOpen(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Timestamp</label>
              <input type="datetime-local" className="form-control" value={form.timestamp} onChange={(e) => setForm({ ...form, timestamp: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">User</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="form-control" value={form.userId} onChange={(e) => {
                  const userId = e.target.value;
                  const u = users.find(u => (u._id || u.id) === userId);
                  const userName = u ? (u.fullName || u.name || u.email || '') : '';
                  setForm({ ...form, userId, userName });
                }}>
                  <option value="">Select a user…</option>
                  {users.map(u => (
                    <option key={(u._id || u.id)} value={(u._id || u.id)}>
                      {(u.fullName || u.name || u.email || 'Unknown User')}
                    </option>
                  ))}
                </select>
                <button className="btn btn-outline" type="button" onClick={fetchUsers} disabled={usersLoading}>
                  {usersLoading ? (<><i className="fas fa-spinner fa-spin"></i> Loading</>) : (<><i className="fas fa-sync"></i> Refresh</>)}
                </button>
              </div>
              <small className="form-hint">User name will be saved together with the selection. You may override it below if needed.</small>
            </div>
            <div className="form-group">
              <label className="form-label">User Name (override)</label>
              <input type="text" className="form-control" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Action</label>
              <select className="form-control" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                <option value="create">create</option>
                <option value="update">update</option>
                <option value="delete">delete</option>
                <option value="access">access</option>
                <option value="login">login</option>
                <option value="logout">logout</option>
                <option value="export">export</option>
                <option value="other">other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Resource</label>
              <input type="text" className="form-control" value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="success">success</option>
                <option value="failure">failure</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Details</label>
              <textarea className="form-control" rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })}></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => { setAddOpen(false); setEditingId(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={async () => {
              try {
                // Basic required validations: all fields must be filled
                const requiredFields = ['timestamp','userId','userName','action','resource','status','details'];
                const hasEmpty = requiredFields.some(k => !String((form?.[k] ?? '')).trim());
                if (hasEmpty) {
                  alert('Please fill all the rows');
                  return;
                }
                const payload = { ...form };
                if (payload.timestamp) payload.timestamp = new Date(payload.timestamp).toISOString();
                if (editingId) {
                  await updateAuditLog(editingId, payload);
                } else {
                  await createAuditLog(payload);
                }
                setAddOpen(false);
                setEditingId(null);
                setForm({ timestamp: '', userName: '', userId: '', action: 'other', resource: '', status: 'success', details: '' });
                fetchLogs(activePage, searchTerm);
              } catch (e) {
                alert(e.message || (editingId ? 'Failed to update audit log' : 'Failed to create audit log'));
              }
            }}>{editingId ? 'Update' : 'Save'}</button>
          </div>
        </div>
      </div>

      <div className={`modal ${fwModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal')) { setFwModalOpen(false); setFwEditingId(null); } }}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">{fwEditingId ? 'Update Framework' : 'New Framework'}</div>
            <button className="close-modal" onClick={() => { setFwModalOpen(false); setFwEditingId(null); }}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-control" value={fwForm.name} onChange={(e) => setFwForm({ ...fwForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Code</label>
                <input className="form-control" value={fwForm.code} onChange={(e) => setFwForm({ ...fwForm, code: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={fwForm.description} onChange={(e) => setFwForm({ ...fwForm, description: e.target.value })}></textarea>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={fwForm.status} onChange={(e) => setFwForm({ ...fwForm, status: e.target.value })}>
                  <option value="compliant">compliant</option>
                  <option value="partial">partial</option>
                  <option value="non_compliant">non_compliant</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Last Audit Date</label>
                <input type="date" className="form-control" value={fwForm.lastAuditAt} onChange={(e) => setFwForm({ ...fwForm, lastAuditAt: e.target.value })} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Requirements Total</label>
                <input type="number" min="0" className="form-control" value={fwForm.requirementsTotal} onChange={(e) => setFwForm({ ...fwForm, requirementsTotal: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Requirements Met</label>
                <input type="number" min="0" className="form-control" value={fwForm.requirementsMet} onChange={(e) => setFwForm({ ...fwForm, requirementsMet: Number(e.target.value) })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <input className="form-control" value={fwForm.ownerName} onChange={(e) => setFwForm({ ...fwForm, ownerName: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => { setFwModalOpen(false); setFwEditingId(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={async () => {
              try {
                // Basic required validations for framework form
                const requiredFw = ['name','code','description','status','lastAuditAt','requirementsTotal','requirementsMet','ownerName'];
                const hasEmptyFw = requiredFw.some(k => {
                  const v = fwForm?.[k];
                  if (typeof v === 'number') return Number.isNaN(v);
                  return !String(v ?? '').trim();
                });
                if (hasEmptyFw) {
                  alert('Please fill all the rows');
                  return;
                }
                if (Number(fwForm.requirementsMet) > Number(fwForm.requirementsTotal)) {
                  alert('Requirements Met cannot exceed Requirements Total');
                  return;
                }
                const payload = { ...fwForm };
                if (payload.lastAuditAt) payload.lastAuditAt = new Date(payload.lastAuditAt).toISOString();
                if (fwEditingId) {
                  await updateFramework(fwEditingId, payload);
                } else {
                  await createFramework(payload);
                }
                setFwModalOpen(false);
                setFwEditingId(null);
                setFwForm({ name: '', code: '', description: '', status: 'partial', lastAuditAt: '', requirementsTotal: 0, requirementsMet: 0, ownerName: '' });
                fetchFrameworks();
              } catch (e) {
                alert(e.message || (fwEditingId ? 'Failed to update framework' : 'Failed to create framework'));
              }
            }}>{fwEditingId ? 'Update' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
