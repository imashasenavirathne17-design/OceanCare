import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { clearSession, getUser } from '../../lib/token';
import './adminCompliance.css';

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
                <button className="btn btn-primary" onClick={() => { if (searchTerm) alert(`Searching audit logs for: "${searchTerm}"`); else alert('Please enter a search term'); }}><i className="fas fa-search"></i> Search</button>
                <button className="btn btn-success" onClick={() => setModalOpen(true)}><i className="fas fa-file-export"></i> Export Logs</button>
              </div>
            </div>

            <table className="logs-table">
              <thead>
                <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr><td>2023-10-26 14:25:32</td><td>Dr. Michael Chen</td><td><span className="audit-action action-update">Updated</span></td><td>Patient Record #MC-2310</td><td>192.168.1.45</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                <tr><td>2023-10-26 13:40:15</td><td>Alex Johnson</td><td><span className="audit-action action-create">Created</span></td><td>Inventory Item #INV-2042</td><td>192.168.1.67</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                <tr><td>2023-10-26 12:15:08</td><td>Maria Garcia</td><td><span className="audit-action action-login">Login</span></td><td>System Access</td><td>192.168.1.12</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                <tr><td>2023-10-26 11:30:45</td><td>Robert Smith</td><td><span className="audit-action action-delete">Deleted</span></td><td>User Account #USR-087</td><td>192.168.1.89</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                <tr><td>2023-10-26 10:20:33</td><td>Sarah Johnson</td><td><span className="audit-action action-access">Accessed</span></td><td>Sensitive Medical Data</td><td>192.168.1.01</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                <tr><td>2023-10-26 09:45:21</td><td>Dr. Lisa Wang</td><td><span className="audit-action action-update">Modified</span></td><td>Treatment Plan #TP-1042</td><td>192.168.1.34</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                <tr><td>2023-10-26 08:55:10</td><td>System</td><td><span className="audit-action action-create">Auto-generated</span></td><td>Backup #BK-20231026</td><td>192.168.1.99</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
              </tbody>
            </table>

            <div className="pagination">
              <div className="pagination-info">Showing 1-7 of 2,487 audit entries</div>
              <div className="pagination-controls">
                {[1,2,3,4,5].map(p => (
                  <button key={p} className={`page-btn ${activePage===p?'active':''}`} onClick={() => { setActivePage(p); alert(`Loading page ${p}...`); }}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => { setActivePage((p)=>Math.min(p+1, 5)); alert('Loading next page...'); }}>Next</button>
              </div>
            </div>
          </div>

          {/* Compliance Framework */}
          <div className="compliance-framework">
            <div className="section-header">
              <div className="section-title">Compliance Framework</div>
              <button className="btn btn-primary" onClick={() => alert('Opening compliance framework management...')}><i className="fas fa-cog"></i> Manage Frameworks</button>
            </div>

            <div className="framework-tabs">
              {['gdpr','imo','hipaa','custom'].map(tab => (
                <div key={tab} className={`framework-tab ${activeFramework===tab?'active':''}`} onClick={() => setActiveFramework(tab)} data-tab={tab}>
                  {tab.toUpperCase() === 'GDPR' ? 'GDPR' : tab.toUpperCase()}
                </div>
              ))}
            </div>

            <div className={`framework-content ${activeFramework==='gdpr'?'active':''}`} id="gdpr-content">
              <div className="framework-grid">
                <div className="framework-card">
                  <div className="framework-header">
                    <div className="framework-name">Data Protection</div>
                    <div className="compliance-status status-compliant">Compliant</div>
                  </div>
                  <div className="framework-details">
                    <div className="detail-item"><span className="detail-label">Last Audit:</span><span className="detail-value">Oct 15, 2023</span></div>
                    <div className="detail-item"><span className="detail-label">Requirements:</span><span className="detail-value">42/45 Met</span></div>
                    <div className="detail-item"><span className="detail-label">Data Officer:</span><span className="detail-value">Sarah Johnson</span></div>
                  </div>
                  <div className="framework-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Viewing compliance details for: Data Protection')}><i className="fas fa-eye"></i> View Details</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert('Generating PDF report for: Data Protection')}><i className="fas fa-file-pdf"></i> Report</button>
                  </div>
                </div>

                <div className="framework-card">
                  <div className="framework-header">
                    <div className="framework-name">Right to Erasure</div>
                    <div className="compliance-status status-compliant">Compliant</div>
                  </div>
                  <div className="framework-details">
                    <div className="detail-item"><span className="detail-label">Last Audit:</span><span className="detail-value">Oct 18, 2023</span></div>
                    <div className="detail-item"><span className="detail-label">Requirements:</span><span className="detail-value">28/28 Met</span></div>
                    <div className="detail-item"><span className="detail-label">Requests (30d):</span><span className="detail-value">3</span></div>
                  </div>
                  <div className="framework-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Viewing compliance details for: Right to Erasure')}><i className="fas fa-eye"></i> View Details</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert('Generating PDF report for: Right to Erasure')}><i className="fas fa-file-pdf"></i> Report</button>
                  </div>
                </div>

                <div className="framework-card">
                  <div className="framework-header">
                    <div className="framework-name">Data Portability</div>
                    <div className="compliance-status status-partial">Partial</div>
                  </div>
                  <div className="framework-details">
                    <div className="detail-item"><span className="detail-label">Last Audit:</span><span className="detail-value">Oct 20, 2023</span></div>
                    <div className="detail-item"><span className="detail-label">Requirements:</span><span className="detail-value">15/18 Met</span></div>
                    <div className="detail-item"><span className="detail-label">Gap Analysis:</span><span className="detail-value">In Progress</span></div>
                  </div>
                  <div className="framework-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Viewing compliance details for: Data Portability')}><i className="fas fa-eye"></i> View Details</button>
                    <button className="btn btn-warning btn-sm" onClick={() => alert('Opening issue resolution for: Data Portability')}><i className="fas fa-exclamation-triangle"></i> Fix Issues</button>
                  </div>
                </div>
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
              <button className="btn btn-primary" onClick={() => alert('Opening report scheduling interface...')}><i className="fas fa-plus"></i> Schedule New Report</button>
            </div>

            <div className="reports-grid">
              {[
                { icon: 'fas fa-ship', title: 'Port Authority', desc: 'Monthly medical inventory and health status report for port authorities', meta: 'Due: Nov 5, 2023' },
                { icon: 'fas fa-user-shield', title: 'GDPR Compliance', desc: 'Quarterly data protection and privacy compliance report', meta: 'Due: Dec 15, 2023' },
                { icon: 'fas fa-heartbeat', title: 'Medical Operations', desc: 'Weekly medical treatment and inventory usage summary', meta: 'Due: Every Monday' },
                { icon: 'fas fa-clipboard-list', title: 'Audit Summary', desc: 'Monthly system access and user activity audit report', meta: 'Due: Nov 1, 2023' }
              ].map(r => (
                <div key={r.title} className="report-card">
                  <div className="report-icon"><i className={r.icon}></i></div>
                  <div className="report-title">{r.title}</div>
                  <div className="report-desc">{r.desc}</div>
                  <div className="report-meta">{r.meta}</div>
                  <div className="framework-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => alert(`Generating report: ${r.title}`)}><i className="fas fa-play"></i> Generate</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert(`Viewing report history for: ${r.title}`)}><i className="fas fa-history"></i> History</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Export Configuration Modal */}
      <div className={`modal ${modalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal')) setModalOpen(false); }}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">Export Audit Data</div>
            <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Export Time Range</label>
              <div className="form-row">
                <div className="form-group"><input type="date" className="form-control" defaultValue="2023-10-01" /></div>
                <div className="form-group"><input type="date" className="form-control" defaultValue="2023-10-26" /></div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Data Anonymization</label>
              <div className="checkbox-group">
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Anonymize Personal Data</label>
                <label className="checkbox-item"><input type="checkbox" /> Anonymize Medical Data</label>
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Anonymize IP Addresses</label>
                <label className="checkbox-item"><input type="checkbox" /> Include System Metadata</label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Export Format</label>
              <select className="form-control" defaultValue="PDF Report">
                <option>PDF Report</option>
                <option>Excel Spreadsheet</option>
                <option>CSV Data</option>
                <option>JSON Format</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Regulatory Framework</label>
              <select className="form-control" defaultValue="GDPR Compliance">
                <option>GDPR Compliance</option>
                <option>IMO Requirements</option>
                <option>HIPAA Standards</option>
                <option>Custom Framework</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea className="form-control" rows={3} placeholder="Add any notes about this export..."></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { alert('Generating compliance export...'); setModalOpen(false); setTimeout(() => alert('Export completed successfully! File ready for download.'), 2000); }}>Generate Export</button>
          </div>
        </div>
      </div>
    </div>
  );
}
