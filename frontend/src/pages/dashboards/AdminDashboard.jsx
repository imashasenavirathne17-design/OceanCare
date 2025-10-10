import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './adminDashboard.css';
import AdminSidebar from './AdminSidebar';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  // Auto logout after inactivity
  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [navigate]);

  // Modal & tabs
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  // Users state (for demo table actions)
  const [audit, setAudit] = useState([]);

  const onLogout = () => { clearSession(); navigate('/login'); };
  const addAudit = (action, payload) => setAudit((a) => [{ ts: new Date().toISOString(), user: user?.fullName || 'Admin', action, payload }, ...a]);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <AdminSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Admin Dashboard</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin User')}&background=8338ec&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Sarah Johnson'}</div>
                <small>Administrator</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Admin Stats */}
          <div className="admin-stats">
            <div className="stat-card"><div className="stat-icon"><i className="fas fa-users"></i></div><div className="stat-value">142</div><div className="stat-label">Total Users</div></div>
            <div className="stat-card"><div className="stat-icon"><i className="fas fa-user-shield"></i></div><div className="stat-value">8</div><div className="stat-label">Administrators</div></div>
            <div className="stat-card"><div className="stat-icon"><i className="fas fa-stethoscope"></i></div><div className="stat-value">24</div><div className="stat-label">Medical Officers</div></div>
            <div className="stat-card"><div className="stat-icon"><i className="fas fa-clipboard-list"></i></div><div className="stat-value">7</div><div className="stat-label">Pending Actions</div></div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <div className="section-header">
              <div className="section-title">Quick Actions</div>
              <button className="btn btn-primary" onClick={(e) => { if (window.confirm('Activate Emergency Mode? This will override some system restrictions.')) { e.currentTarget.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Emergency Active'; e.currentTarget.classList.remove('btn-primary'); e.currentTarget.classList.add('btn-danger'); alert('EMERGENCY MODE ACTIVATED! System restrictions lifted.'); } }}><i className="fas fa-bolt"></i> Emergency Mode</button>
            </div>
            <div className="actions-grid">
              <div className="action-card" onClick={() => setCreateUserOpen(true)}>
                <div className="action-icon"><i className="fas fa-user-plus"></i></div>
                <div className="action-title">Create User</div>
                <div className="action-desc">Add new crew member or staff</div>
              </div>
              <div className="action-card" onClick={() => alert('Opening password reset tool...')}>
                <div className="action-icon"><i className="fas fa-key"></i></div>
                <div className="action-title">Reset Password</div>
                <div className="action-desc">Force password reset for user</div>
              </div>
              <div className="action-card" onClick={() => alert('Opening audit logs dashboard...')}>
                <div className="action-icon"><i className="fas fa-history"></i></div>
                <div className="action-title">Audit Logs</div>
                <div className="action-desc">View system activity records</div>
              </div>
              <div className="action-card" onClick={(e) => { const el = e.currentTarget.querySelector('.action-title'); const t = el.textContent; el.textContent = 'Backing Up...'; setTimeout(() => { el.textContent = t; alert('System backup completed successfully!'); }, 2000); }}>
                <div className="action-icon"><i className="fas fa-database"></i></div>
                <div className="action-title">Backup System</div>
                <div className="action-desc">Create system backup now</div>
              </div>
              <div className="action-card" onClick={() => alert('Opening system health dashboard...')}>
                <div className="action-icon"><i className="fas fa-heartbeat"></i></div>
                <div className="action-title">System Health</div>
                <div className="action-desc">Check system status & metrics</div>
              </div>
              <div className="action-card" onClick={() => alert('Generating compliance report...')}>
                <div className="action-icon"><i className="fas fa-file-contract"></i></div>
                <div className="action-title">Compliance Report</div>
                <div className="action-desc">Generate regulatory reports</div>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="user-management" id="users">
            <div className="management-header">
              <div className="section-title">User Management</div>
              <div className="search-box">
                <input type="text" className="search-input" placeholder="Search users..." />
                <button className="btn btn-primary"><i className="fas fa-search"></i> Search</button>
                <button className="btn btn-success" onClick={() => setCreateUserOpen(true)}><i className="fas fa-plus"></i> Add User</button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr><th>User</th><th>Role</th><th>Last Login</th><th>Status</th><th>MFA</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://ui-avatars.com/api/?name=Dr+Michael+Chen&background=3a86ff&color=fff" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 10 }} />
                        <div><div>Dr. Michael Chen</div><small>michael.chen@oceancare.com</small></div>
                      </div>
                    </td>
                    <td><span className="user-role role-medical">Medical Officer</span></td>
                    <td>Today, 14:25</td>
                    <td><span className="user-status status-active">Active</span></td>
                    <td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Editing user: Dr. Michael Chen')}><i className="fas fa-edit"></i></button>
                      <button className="btn btn-info btn-sm" onClick={() => { if (window.confirm('Reset password for Dr. Michael Chen?')) alert('Password reset initiated.'); }}><i className="fas fa-key"></i></button>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Permanently delete user Dr. Michael Chen?')) alert('User scheduled for deletion.'); }}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://ui-avatars.com/api/?name=Alex+Johnson&background=8338ec&color=fff" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 10 }} />
                        <div><div>Alex Johnson</div><small>alex.johnson@oceancare.com</small></div>
                      </div>
                    </td>
                    <td><span className="user-role role-inventory">Inventory Manager</span></td>
                    <td>Yesterday, 16:40</td>
                    <td><span className="user-status status-active">Active</span></td>
                    <td><i className="fas fa-times-circle" style={{ color: 'var(--danger)' }}></i></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Editing user: Alex Johnson')}><i className="fas fa-edit"></i></button>
                      <button className="btn btn-info btn-sm" onClick={() => { if (window.confirm('Reset password for Alex Johnson?')) alert('Password reset initiated.'); }}><i className="fas fa-key"></i></button>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Permanently delete user Alex Johnson?')) alert('User scheduled for deletion.'); }}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://ui-avatars.com/api/?name=Maria+Garcia&background=38b000&color=fff" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 10 }} />
                        <div><div>Maria Garcia</div><small>maria.garcia@oceancare.com</small></div>
                      </div>
                    </td>
                    <td><span className="user-role role-admin">Administrator</span></td>
                    <td>Today, 09:15</td>
                    <td><span className="user-status status-active">Active</span></td>
                    <td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Editing user: Maria Garcia')}><i className="fas fa-edit"></i></button>
                      <button className="btn btn-info btn-sm" onClick={() => { if (window.confirm('Reset password for Maria Garcia?')) alert('Password reset initiated.'); }}><i className="fas fa-key"></i></button>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Permanently delete user Maria Garcia?')) alert('User scheduled for deletion.'); }}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://ui-avatars.com/api/?name=Robert+Smith&background=ff9e00&color=fff" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 10 }} />
                        <div><div>Robert Smith</div><small>robert.smith@oceancare.com</small></div>
                      </div>
                    </td>
                    <td><span className="user-role role-crew">Crew Member</span></td>
                    <td>Oct 24, 2023</td>
                    <td><span className="user-status status-inactive">Inactive</span></td>
                    <td><i className="fas fa-times-circle" style={{ color: 'var(--danger)' }}></i></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Editing user: Robert Smith')}><i className="fas fa-edit"></i></button>
                      <button className="btn btn-info btn-sm" onClick={() => { if (window.confirm('Reset password for Robert Smith?')) alert('Password reset initiated.'); }}><i className="fas fa-key"></i></button>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Permanently delete user Robert Smith?')) alert('User scheduled for deletion.'); }}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <div className="pagination-info">Showing 1-4 of 142 users</div>
                <div className="pagination-controls">
                  {[1,2,3,4,5].map(p => (
                    <button key={p} className={`page-btn ${p===1?'active':''}`} onClick={() => alert(`Loading page ${p}...`)}>{p}</button>
                  ))}
                  <button className="page-btn" onClick={() => alert('Loading next page...')}>Next</button>
                </div>
              </div>
          </div>

          {/* System Configuration */}
          <div className="system-config">
            <div className="section-header">
              <div className="section-title">System Configuration</div>
              <button className="btn btn-primary" onClick={(e) => { const el = e.currentTarget; const t = el.innerHTML; el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; setTimeout(() => { el.innerHTML = t; alert('System configuration saved successfully!'); }, 1500); }}><i className="fas fa-save"></i> Save Changes</button>
            </div>
            <div className="config-tabs">
              <div className={`config-tab ${activeTab==='alerts'?'active':''}`} onClick={() => setActiveTab('alerts')} data-tab="alerts">Health Alerts</div>
              <div className={`config-tab ${activeTab==='backup'?'active':''}`} onClick={() => setActiveTab('backup')} data-tab="backup">Backup Settings</div>
              <div className={`config-tab ${activeTab==='security'?'active':''}`} onClick={() => setActiveTab('security')} data-tab="security">Security Policies</div>
              <div className={`config-tab ${activeTab==='integrations'?'active':''}`} onClick={() => setActiveTab('integrations')} data-tab="integrations">Integrations</div>
            </div>
            <div className={`config-content ${activeTab==='alerts'?'active':''}`} id="alerts-content">
              <div className="config-section">
                <div className="config-title">Health Monitoring Thresholds</div>
                <div className="config-grid">
                  <div className="config-card">
                    <div className="config-header"><div className="config-name">Heart Rate Alert</div><label className="toggle-switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label></div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Threshold:</span><span className="detail-value">&gt; 120 BPM for 10 min</span></div>
                      <div className="detail-item"><span className="detail-label">Action:</span><span className="detail-value">Trigger SOS Alert</span></div>
                      <div className="detail-item"><span className="detail-label">Notification:</span><span className="detail-value">SMS & Email</span></div>
                    </div>
                    <div className="config-actions"><button className="btn btn-sm" onClick={() => alert('Edit Heart Rate Alert')}><i className="fas fa-edit"></i> Edit</button><button className="btn btn-sm" onClick={() => alert('Test Heart Rate Alert')}><i className="fas fa-bell"></i> Test</button></div>
                  </div>
                  <div className="config-card">
                    <div className="config-header"><div className="config-name">Blood Pressure Alert</div><label className="toggle-switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label></div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Systolic Threshold:</span><span className="detail-value">&gt; 180 mmHg</span></div>
                      <div className="detail-item"><span className="detail-label">Diastolic Threshold:</span><span className="detail-value">&gt; 120 mmHg</span></div>
                      <div className="detail-item"><span className="detail-label">Notification:</span><span className="detail-value">Email & On-screen</span></div>
                    </div>
                    <div className="config-actions"><button className="btn btn-sm" onClick={() => alert('Edit BP Alert')}><i className="fas fa-edit"></i> Edit</button><button className="btn btn-sm" onClick={() => alert('Test BP Alert')}><i className="fas fa-bell"></i> Test</button></div>
                  </div>
                  <div className="config-card">
                    <div className="config-header"><div className="config-name">Temperature Alert</div><label className="toggle-switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label></div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Threshold:</span><span className="detail-value">&gt; 39°C (102.2°F)</span></div>
                      <div className="detail-item"><span className="detail-label">Duration:</span><span className="detail-value">30 minutes</span></div>
                      <div className="detail-item"><span className="detail-label">Notification:</span><span className="detail-value">Email Only</span></div>
                    </div>
                    <div className="config-actions"><button className="btn btn-sm" onClick={() => alert('Edit Temperature Alert')}><i className="fas fa-edit"></i> Edit</button><button className="btn btn-sm" onClick={() => alert('Test Temperature Alert')}><i className="fas fa-bell"></i> Test</button></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Audit */}
          <div className="compliance-audit">
            <div className="section-header"><div className="section-title">Recent Audit Logs</div><button className="btn btn-primary" onClick={() => { alert('Exporting audit logs...'); setTimeout(() => alert('Audit logs exported successfully!'), 1000); }}><i className="fas fa-file-export"></i> Export Logs</button></div>
            <div className="table-responsive">
              <table className="audit-table">
                <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>2023-10-26 14:25:32</td><td>Dr. Michael Chen</td><td><span className="audit-action action-update">Updated</span></td><td>Patient Record #MC-2310</td><td>192.168.1.45</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                  <tr><td>2023-10-26 13:40:15</td><td>Alex Johnson</td><td><span className="audit-action action-create">Created</span></td><td>Inventory Item #INV-2042</td><td>192.168.1.67</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                  <tr><td>2023-10-26 12:15:08</td><td>Maria Garcia</td><td><span className="audit-action action-login">Login</span></td><td>System Access</td><td>192.168.1.12</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                  <tr><td>2023-10-26 11:30:45</td><td>Robert Smith</td><td><span className="audit-action action-delete">Deleted</span></td><td>User Account #USR-087</td><td>192.168.1.89</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                  <tr><td>2023-10-26 10:20:33</td><td>Sarah Johnson</td><td><span className="audit-action action-update">Modified</span></td><td>System Configuration</td><td>192.168.1.01</td><td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td></tr>
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">Showing 1-5 of 2487 audit entries</div>
              <div className="pagination-controls">
                {[1,2,3,4,5].map(p => (
                  <button key={p} className={`page-btn ${p===1?'active':''}`} onClick={() => alert(`Loading page ${p}...`)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => alert('Loading next page...')}>Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create User Modal */}
      {createUserOpen && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) setCreateUserOpen(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Create New User Account</div>
              <button className="close-modal" onClick={() => setCreateUserOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">First Name</label><input type="text" className="form-control" placeholder="Enter first name" /></div>
                <div className="form-group"><label className="form-label">Last Name</label><input type="text" className="form-control" placeholder="Enter last name" /></div>
              </div>
              <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-control" placeholder="Enter email address" /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">User Role</label>
                  <select className="form-control"><option>Select Role</option><option>Administrator</option><option>Medical Officer</option><option>Inventory Manager</option><option>Crew Member</option><option>Read-Only User</option></select>
                </div>
                <div className="form-group"><label className="form-label">Vessel Assignment</label>
                  <select className="form-control"><option>MV Ocean Explorer</option><option>MV Pacific Star</option><option>MV Coral Princess</option><option>MV Deep Blue</option><option>All Vessels</option></select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Permissions</label>
                <div className="checkbox-group">
                  <label className="checkbox-item"><input type="checkbox" defaultChecked /> Read Access</label>
                  <label className="checkbox-item"><input type="checkbox" defaultChecked /> Write Access</label>
                  <label className="checkbox-item"><input type="checkbox" /> Delete Access</label>
                  <label className="checkbox-item"><input type="checkbox" /> Admin Privileges</label>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Security Settings</label>
                <div className="checkbox-group">
                  <label className="checkbox-item"><input type="checkbox" /> Enable Multi-Factor Authentication</label>
                  <label className="checkbox-item"><input type="checkbox" defaultChecked /> Password Expiry (90 days)</label>
                  <label className="checkbox-item"><input type="checkbox" defaultChecked /> Session Timeout (30 min)</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setCreateUserOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { alert('User account created successfully!'); setCreateUserOpen(false); setTimeout(() => alert('Welcome email sent and account activated.'), 1000); }}><i className="fas fa-user-plus"></i> Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
