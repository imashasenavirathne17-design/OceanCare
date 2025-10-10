import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { clearSession, getUser } from '../../lib/token';
import './adminReports.css';

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

          {/* Report Charts */}
          <div className="report-charts">
            <div className="section-header">
              <div className="section-title">Analytics Overview</div>
              <button className="btn btn-primary" onClick={() => { alert('Exporting charts...'); setTimeout(()=>alert('Charts exported!'), 1200); }}>
                <i className="fas fa-download"></i> Export Charts
              </button>
            </div>

            <div className="chart-container">
              <div className="chart-title">User Activity Over Time</div>
              <div className="chart-placeholder">
                <i className="fas fa-chart-bar" style={{fontSize: 48, marginRight: 15}}></i>
                User Activity Chart Visualization
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-title">System Health Metrics</div>
              <div className="chart-placeholder">
                <i className="fas fa-chart-line" style={{fontSize: 48, marginRight: 15}}></i>
                System Health Metrics Visualization
              </div>
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
                  <tr>
                    <td>2023-10-15 14:32:18</td>
                    <td>Dr. Michael Chen</td>
                    <td><span className="user-role role-medical">Medical Officer</span></td>
                    <td><span className="action-type action-update">Updated</span></td>
                    <td>Health Record #4821</td>
                    <td>Modified patient vitals</td>
                  </tr>
                  <tr>
                    <td>2023-10-15 13:45:02</td>
                    <td>Sarah Johnson</td>
                    <td><span className="user-role role-admin">Administrator</span></td>
                    <td><span className="action-type action-create">Created</span></td>
                    <td>User Account</td>
                    <td>New crew member account</td>
                  </tr>
                  <tr>
                    <td>2023-10-15 12:18:37</td>
                    <td>Robert Williams</td>
                    <td><span className="user-role role-inventory">Inventory Manager</span></td>
                    <td><span className="action-type action-update">Updated</span></td>
                    <td>Inventory Item #872</td>
                    <td>Adjusted stock levels</td>
                  </tr>
                  <tr>
                    <td>2023-10-15 11:05:55</td>
                    <td>Dr. Elena Rodriguez</td>
                    <td><span className="user-role role-medical">Medical Officer</span></td>
                    <td><span className="action-type action-access">Accessed</span></td>
                    <td>Medical Database</td>
                    <td>Viewed patient records</td>
                  </tr>
                  <tr>
                    <td>2023-10-15 09:42:11</td>
                    <td>James Wilson</td>
                    <td><span className="user-role role-crew">Crew Member</span></td>
                    <td><span className="action-type action-update">Updated</span></td>
                    <td>Personal Information</td>
                    <td>Changed contact details</td>
                  </tr>
                  <tr>
                    <td>2023-10-14 16:28:44</td>
                    <td>Sarah Johnson</td>
                    <td><span className="user-role role-admin">Administrator</span></td>
                    <td><span className="action-type action-delete">Deleted</span></td>
                    <td>User Account #129</td>
                    <td>Deactivated former crew</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">Showing 1-6 of 128 activities</div>
              <div className="pagination-controls">
                {[1,2,3].map(p => (
                  <button key={p} className={`page-btn ${activePage===p ? 'active' : ''}`} onClick={() => { setActivePage(p); alert(`Loading page ${p}...`); }}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => { setActivePage(p => Math.min(p+1, 3)); alert('Loading next page...'); }}>Next</button>
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
