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

  // Users state
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'crew', mfa: false });
  const [users, setUsers] = useState([
    { id: 'U-1001', name: 'Crew Member', email: 'crew@ship.com', role: 'crew', mfa: false },
    { id: 'U-1002', name: 'Health Officer', email: 'health@ship.com', role: 'health', mfa: true },
    { id: 'U-1003', name: 'Inventory Manager', email: 'inventory@ship.com', role: 'inventory', mfa: false },
  ]);

  const [policy, setPolicy] = useState({ minLen: 8, requireUpper: true, expireDays: 90 });
  const [alertsCfg, setAlertsCfg] = useState({ hrThreshold: 120, hrWindow: 10, notify: 'email' });
  const [backupCfg, setBackupCfg] = useState({ cron: '0 3 * * *' });
  const [compliance, setCompliance] = useState({ gdpr: true, imo: true, integrations: { scanners: true, telemedicine: true } });
  const [audit, setAudit] = useState([]);

  const onLogout = () => { clearSession(); navigate('/login'); };
  const addAudit = (action, payload) => setAudit((a) => [{ ts: new Date().toISOString(), user: user?.fullName || 'Admin', action, payload }, ...a]);

  const addUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return alert('Name and email are required');
    const u = { ...newUser, id: 'U-' + Math.floor(Math.random() * 90000 + 10000) };
    setUsers((us) => [u, ...us]);
    setNewUser({ name: '', email: '', role: 'crew', mfa: false });
    addAudit('user_create', u);
  };

  const updateRole = (id, role) => { setUsers((us) => us.map(u => u.id === id ? { ...u, role } : u)); addAudit('user_role_update', { id, role }); };
  const toggleMfa = (id) => { setUsers((us) => us.map(u => u.id === id ? { ...u, mfa: !u.mfa } : u)); addAudit('user_mfa_toggle', { id }); };
  const deleteUser = (id) => { setUsers((us) => us.filter(u => u.id !== id)); addAudit('user_delete', { id }); };
  const resetPassword = (id) => { alert('Password reset link sent (demo)'); addAudit('password_reset', { id }); };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <AdminSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="dash-header">
            <h2>Administrator Dashboard</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin')}&background=6c3fb8&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Administrator'}</div>
                <small>Role: Admin</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Quick actions */}
          <section className="quick-actions">
            <button className="btn btn-primary" onClick={() => document.getElementById('users')?.scrollIntoView({ behavior: 'smooth' })}><i className="fas fa-users-cog"></i> Manage Users</button>
            <button className="btn btn-primary" onClick={() => document.getElementById('permissions')?.scrollIntoView({ behavior: 'smooth' })}><i className="fas fa-shield-alt"></i> Permissions</button>
            <button className="btn btn-primary" onClick={() => document.getElementById('config')?.scrollIntoView({ behavior: 'smooth' })}><i className="fas fa-sliders-h"></i> Configuration</button>
          </section>

          {/* 1. Managing User Accounts */}
          <section className="panel" id="users">
            <h3 className="form-title">User Accounts</h3>
            <form onSubmit={addUser}>
              <div className="form-grid">
                <div className="form-group"><label>Name</label><input className="form-control" value={newUser.name} onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))} /></div>
                <div className="form-group"><label>Email</label><input type="email" className="form-control" value={newUser.email} onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))} /></div>
                <div className="form-group"><label>Role</label>
                  <select className="form-control" value={newUser.role} onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value }))}>
                    <option value="crew">Crew</option>
                    <option value="health">Medical Officer</option>
                    <option value="inventory">Inventory Manager</option>
                    <option value="emergency">Emergency Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Require MFA</label>
                  <div className="form-check-line">
                    <input type="checkbox" id="mfa" checked={newUser.mfa} onChange={(e) => setNewUser((s) => ({ ...s, mfa: e.target.checked }))} />
                    <label htmlFor="mfa">Enable multi-factor authentication</label>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary" type="submit">Create User</button>
            </form>
            <div className="table-responsive" style={{ marginTop: 16 }}>
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>MFA</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td><td>{u.name}</td><td>{u.email}</td>
                      <td>
                        <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}>
                          <option value="crew">Crew</option>
                          <option value="health">Medical Officer</option>
                          <option value="inventory">Inventory Manager</option>
                          <option value="emergency">Emergency Officer</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-success" onClick={() => toggleMfa(u.id)}>{u.mfa ? 'On' : 'Off'}</button>
                      </td>
                      <td>
                        <button className="btn btn-primary" onClick={() => resetPassword(u.id)}>Reset Password</button>
                        <button className="btn btn-danger" onClick={() => deleteUser(u.id)} style={{ marginLeft: 8 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Permissions and Access Control */}
          <section className="panel" id="permissions">
            <h3 className="form-title">Permissions & Access Control</h3>
            <ul className="bullet-list">
              <li>Medical Officers can edit health records but not delete them.</li>
              <li>Administrators can access sensitive data; access restricted for others.</li>
              <li>Enable/Disable MFA for critical positions.</li>
            </ul>
          </section>

          {/* 3. System Configuration */}
          <section className="panel" id="config">
            <h3 className="form-title">System Configuration</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Health Alert Threshold</label>
                <div className="form-grid">
                  <div className="form-group"><label>Heart rate &gt; (bpm)</label><input type="number" className="form-control" value={alertsCfg.hrThreshold} onChange={(e) => setAlertsCfg((s) => ({ ...s, hrThreshold: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber }))} /></div>
                  <div className="form-group"><label>For (minutes)</label><input type="number" className="form-control" value={alertsCfg.hrWindow} onChange={(e) => setAlertsCfg((s) => ({ ...s, hrWindow: isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber }))} /></div>
                </div>
              </div>
              <div className="form-group">
                <label>Automated Backup</label>
                <input className="form-control" placeholder="Cron Expression" value={backupCfg.cron} onChange={(e) => setBackupCfg({ cron: e.target.value })} />
                <small className="muted">Example: 0 3 * * * (daily 3AM)</small>
              </div>
              <div className="form-group">
                <label>Alert Channel</label>
                <select className="form-control" value={alertsCfg.notify} onChange={(e) => setAlertsCfg((s) => ({ ...s, notify: e.target.value }))}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password Policy</label>
                <div className="form-grid">
                  <div className="form-group"><label>Minimum Length</label><input type="number" min="6" className="form-control" value={policy.minLen} onChange={(e) => setPolicy((s) => ({ ...s, minLen: parseInt(e.target.value || '0', 10) }))} /></div>
                  <div className="form-group"><label>Expire (days)</label><input type="number" min="1" className="form-control" value={policy.expireDays} onChange={(e) => setPolicy((s) => ({ ...s, expireDays: parseInt(e.target.value || '0', 10) }))} /></div>
                  <div className="form-group">
                    <label>Complexity</label>
                    <div className="form-check-line">
                      <input id="requireUpper" type="checkbox" checked={policy.requireUpper} onChange={(e) => setPolicy((s) => ({ ...s, requireUpper: e.target.checked }))} />
                      <label htmlFor="requireUpper">Require uppercase letters</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => addAudit('config_update', { alertsCfg, backupCfg })}>Save Config</button>
            <button className="btn btn-success" style={{ marginLeft: 8 }} onClick={() => addAudit('password_policy_update', policy)}>Save Password Policy</button>
          </section>

          {/* 4. Compliance & Audit */}
          <section className="panel" id="compliance">
            <h3 className="form-title">Compliance & Audit</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Compliance</label>
                <div className="form-check-line"><input id="gdpr" type="checkbox" checked={compliance.gdpr} onChange={(e) => setCompliance((s) => ({ ...s, gdpr: e.target.checked }))} /> <label htmlFor="gdpr">GDPR</label></div>
                <div className="form-check-line"><input id="imo" type="checkbox" checked={compliance.imo} onChange={(e) => setCompliance((s) => ({ ...s, imo: e.target.checked }))} /> <label htmlFor="imo">IMO</label></div>
              </div>
              <div className="form-group">
                <label>Integrations</label>
                <div className="form-check-line"><input id="scan" type="checkbox" checked={compliance.integrations.scanners} onChange={(e) => setCompliance((s) => ({ ...s, integrations: { ...s.integrations, scanners: e.target.checked } }))} /> <label htmlFor="scan">Inventory Scanners</label></div>
                <div className="form-check-line"><input id="tele" type="checkbox" checked={compliance.integrations.telemedicine} onChange={(e) => setCompliance((s) => ({ ...s, integrations: { ...s.integrations, telemedicine: e.target.checked } }))} /> <label htmlFor="tele">Telemedicine API</label></div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => addAudit('compliance_update', compliance)}>Save Compliance</button>
            <div className="history" style={{ marginTop: 16 }}>
              <h4>Audit Records</h4>
              <div className="table-responsive">
                <table>
                  <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th></tr></thead>
                  <tbody>
                    {audit.map((a, i) => (
                      <tr key={i}><td>{new Date(a.ts).toLocaleString()}</td><td>{a.user}</td><td>{a.action}</td><td><code>{JSON.stringify(a.payload)}</code></td></tr>
                    ))}
                    {audit.length === 0 && <tr><td colSpan={4}>No audit records yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
