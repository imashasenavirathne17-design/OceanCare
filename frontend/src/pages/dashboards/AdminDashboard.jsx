import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './adminDashboard.css';
import AdminSidebar from './AdminSidebar';
import { listUsers, updateUser } from '../../lib/users';
import { listAuditLogs } from '../../lib/auditLogApi';

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

  // Tabs
  const [activeTab, setActiveTab] = useState('alerts');

  // Users state for read-only list
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  // Edit modal state
  const [editing, setEditing] = useState(null); // user object
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editCrewId, setEditCrewId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  // Role-based metrics
  const [adminCount, setAdminCount] = useState(0);
  const [healthCount, setHealthCount] = useState(0);
  const [crewCount, setCrewCount] = useState(0);

  const fetchUsers = async (opts = {}) => {
    try {
      setLoading(true);
      const params = { page, limit: 5, q: query, ...opts };
      const data = await listUsers(params);
      setItems(data.items || []);
      setPages(data.pages || 1);
      setTotal(data.total || (data.items ? data.items.length : 0));
      if (data.page) setPage(data.page);
      setError('');
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page]);

  const onLogout = () => { clearSession(); navigate('/login'); };

  const openEdit = (user) => {
    setEditing(user);
    setEditRole(user.role || 'crew');
    setEditStatus((user.status || 'active').toLowerCase());
    setEditCrewId(String(user.crewId || ''));
  };
  const closeEdit = () => {
    setEditing(null);
    setEditRole('');
    setEditStatus('active');
    setEditCrewId('');
    setSavingEdit(false);
  };
  const generateCrewId = () => {
    if (!editing) return;
    const base = (editing.fullName || 'CREW').replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase();
    const rand = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(2, 8).toUpperCase();
    setEditCrewId(`${base || 'CRW'}-${rand}`);
  };
  const generateCrewIdFor = (name = '') => {
    const base = (name || 'CREW').replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase();
    const rand = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(2, 8).toUpperCase();
    return `${base || 'CRW'}-${rand}`;
  };
  const assignCrewIdInline = async (user) => {
    const confirm = window.confirm(`Generate and assign a Crew ID for ${user.fullName}?`);
    if (!confirm) return;
    try {
      const newId = generateCrewIdFor(user.fullName);
      await updateUser(user._id, { crewId: newId });
      await fetchUsers({ page });
      alert(`Assigned Crew ID: ${newId}`);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to assign Crew ID');
    }
  };
  const saveEdit = async () => {
    if (!editing) return;
    try {
      setSavingEdit(true);
      const payload = { role: editRole, status: editStatus };
      // Persist crewId if present; otherwise auto-generate if missing on user
      let crewIdToSave = editCrewId;
      if (!crewIdToSave && !editing.crewId) {
        crewIdToSave = generateCrewIdFor(editing.fullName);
      }
      if (crewIdToSave) payload.crewId = crewIdToSave;
      await updateUser(editing._id || editing.id, payload);
      closeEdit();
      await fetchUsers({ page });
    } catch (e) {
      setSavingEdit(false);
      alert(e?.response?.data?.message || e.message || 'Failed to update user');
    }
  };

  // Fetch accurate counts by role
  const fetchRoleCounts = async () => {
    try {
      const [admins, health, crew] = await Promise.all([
        listUsers({ role: 'admin', limit: 1 }),
        listUsers({ role: 'health', limit: 1 }),
        listUsers({ role: 'crew', limit: 1 }),
      ]);
      setAdminCount(admins?.total || (admins?.items?.length || 0));
      setHealthCount(health?.total || (health?.items?.length || 0));
      setCrewCount(crew?.total || (crew?.items?.length || 0));
    } catch (e) {
      console.error('Failed to fetch role counts', e);
    }
  };
  useEffect(() => { fetchRoleCounts(); }, []);

  // Recent Audit Logs (read-only)
  const [aPage, setAPage] = useState(1);
  const [aPages, setAPages] = useState(1);
  const [aTotal, setATotal] = useState(0);
  const [aLoading, setALoading] = useState(false);
  const [aItems, setAItems] = useState([]);
  const [aError, setAError] = useState('');

  const fetchAudit = async (p = 1) => {
    try {
      setALoading(true);
      const res = await listAuditLogs({ page: p, limit: 5 });
      setAItems(res.items || res.logs || []);
      setAPages(res.pages || 1);
      setATotal(res.total || (res.items ? res.items.length : 0));
      setAPage(res.page || p);
      setAError('');
    } catch (e) {
      console.error(e);
      setAError(e.message || 'Failed to load audit logs');
    } finally {
      setALoading(false);
    }
  };

  useEffect(() => { fetchAudit(1); }, []);

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
            <div className="stat-card"><div className="stat-icon"><i className="fas fa-users"></i></div><div className="stat-value">{total}</div><div className="stat-label">Total Users</div></div>
            <div className="stat-card"><div className="stat-icon"><i className="fas fa-user-shield"></i></div><div className="stat-value">{adminCount}</div><div className="stat-label">Administrators</div></div>
            <div className="stat-card"><div className="stat-icon"><i className="fas fa-stethoscope"></i></div><div className="stat-value">{healthCount}</div><div className="stat-label">Medical Officers</div></div>
            <div className="stat-card"><div className="stat-icon"><i className="fas fa-id-badge"></i></div><div className="stat-value">{crewCount}</div><div className="stat-label">Crew Members</div></div>
          </div>

          {/* Overview Cards: Recent Activity */}
          <div className="overview-cards" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginTop: 16 }}>
            {/* Recent Activity */}
            <div className="card" style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}><i className="fas fa-stream" /> Recent Activity</div>
                <button className="btn btn-sm" onClick={() => navigate('/dashboard/admin/compliance')}><i className="fas fa-external-link-alt" /> View All</button>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {(aItems || []).slice(0, 5).map((row) => {
                  const action = (row.action || '').toUpperCase();
                  const time = row.timestamp ? new Date(row.timestamp).toLocaleString() : '';
                  const userName = row.userName || row.user_name || row.user || 'System';
                  return (
                    <div key={row._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f0f0f0', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 10, background: '#3a86ff', display: 'inline-block' }}></span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{action} • {row.resource || '-'}</div>
                          <small style={{ color: '#6c757d' }}>{userName} • {time}</small>
                        </div>
                      </div>
                      <div>
                        {((row.status || 'success') + '').toLowerCase().includes('success') ? (
                          <i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i>
                        ) : (
                          <i className="fas fa-times-circle" style={{ color: 'var(--danger)' }}></i>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!aItems || aItems.length === 0) && (
                  <div style={{ color: '#6c757d' }}>No recent activity.</div>
                )}
              </div>
            </div>

          </div>

          {/* User Metrics (Charts) */}
          {(() => {
            const roleTotal = Math.max(1, adminCount + healthCount + crewCount);
            const pAdmin = Math.round((adminCount / roleTotal) * 100);
            const pHealth = Math.round((healthCount / roleTotal) * 100);
            const pCrew = 100 - pAdmin - pHealth;
            const a = pAdmin;
            const b = pAdmin + pHealth;
            const pieBg = `conic-gradient(#8338ec 0 ${a}%, #2a9d8f ${a}% ${b}%, #3a86ff ${b}% 100%)`;
            const barBase = { height: 12, borderRadius: 999, background: '#eef2ff' };
            const barFill = (color, pct) => ({ width: `${pct}%`, height: '100%', borderRadius: 999, background: color });
            return (
              <div className="user-metrics" style={{ marginTop: 20 }}>
                <div className="section-header">
                  <div className="section-title">User Metrics</div>
                </div>
                <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: 20 }}>
                  {/* Pie */}
                  <div className="pie-card" style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 140, height: 140, borderRadius: '50%', background: pieBg, boxShadow: 'inset 0 0 0 10px #fff' }} />
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#8338ec', display: 'inline-block' }}></span><span>Admins: {adminCount} ({pAdmin}%)</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#2a9d8f', display: 'inline-block' }}></span><span>Health: {healthCount} ({pHealth}%)</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#3a86ff', display: 'inline-block' }}></span><span>Crew: {crewCount} ({pCrew}%)</span></div>
                      </div>
                    </div>
                  </div>
                  {/* Bars */}
                  <div className="bars-card" style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 18 }}>
                    <div style={{ fontWeight: 600, marginBottom: 10 }}>Users by Role</div>
                    <div style={{ display: 'grid', gap: 14 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span>Administrators</span><span>{adminCount}</span>
                        </div>
                        <div style={barBase}><div style={barFill('#8338ec', pAdmin)} /></div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span>Medical Officers</span><span>{healthCount}</span>
                        </div>
                        <div style={barBase}><div style={barFill('#2a9d8f', pHealth)} /></div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span>Crew Members</span><span>{crewCount}</span>
                        </div>
                        <div style={barBase}><div style={barFill('#3a86ff', pCrew)} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Actions */}
          <div className="quick-actions">
            <div className="section-header">
              <div className="section-title">Quick Actions</div>
            </div>
            <div className="actions-grid">
              {/* Sidebar routes as quick actions (no logout) */}
              <div className="action-card" onClick={() => navigate('/dashboard/admin')}>
                <div className="action-icon"><i className="fas fa-tachometer-alt"></i></div>
                <div className="action-title">Dashboard</div>
                <div className="action-desc">Go to admin overview</div>
              </div>
              <div className="action-card" onClick={() => navigate('/dashboard/admin/users')}>
                <div className="action-icon"><i className="fas fa-users-cog"></i></div>
                <div className="action-title">User Management</div>
                <div className="action-desc">Manage users & roles</div>
              </div>
              <div className="action-card" onClick={() => navigate('/dashboard/admin/permissions')}>
                <div className="action-icon"><i className="fas fa-user-lock"></i></div>
                <div className="action-title">Permissions</div>
                <div className="action-desc">Role-based access policies</div>
              </div>
              <div className="action-card" onClick={() => navigate('/dashboard/admin/compliance')}>
                <div className="action-icon"><i className="fas fa-clipboard-check"></i></div>
                <div className="action-title">Compliance & Audit</div>
                <div className="action-desc">Governance & audits</div>
              </div>
              <div className="action-card" onClick={() => navigate('/dashboard/admin/announcements')}>
                <div className="action-icon"><i className="fas fa-bullhorn"></i></div>
                <div className="action-title">Announcements</div>
                <div className="action-desc">Broadcast updates</div>
              </div>
              <div className="action-card" onClick={() => navigate('/dashboard/admin/messaging')}>
                <div className="action-icon"><i className="fas fa-comments"></i></div>
                <div className="action-title">Messaging</div>
                <div className="action-desc">Open admin messaging</div>
              </div>
              <div className="action-card" onClick={() => navigate('/dashboard/admin/users')}>
                <div className="action-icon"><i className="fas fa-user-plus"></i></div>
                <div className="action-title">Create User</div>
                <div className="action-desc">Add new crew member or staff</div>
              </div>
              <div className="action-card" onClick={() => alert('Opening audit logs dashboard...')}>
                <div className="action-icon"><i className="fas fa-history"></i></div>
                <div className="action-title">Audit Logs</div>
                <div className="action-desc">View system activity records</div>
              </div>
            </div>
          </div>

          {/* User Management (Read-Only) */}
          <div className="user-management" id="users">
            <div className="management-header">
              <div className="section-title">User Management</div>
              <div className="search-box">
                <input type="text" className="search-input" placeholder="Search users..." value={query} onChange={(e)=>setQuery(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ setPage(1); fetchUsers({ page: 1 }); } }} />
                <button className="btn btn-primary" onClick={()=>{ setPage(1); fetchUsers({ page: 1 }); }}><i className="fas fa-search"></i> Search</button>
              </div>
            </div>
            {error && (
              <div style={{background:'#ffe5e5', color:'#b00020', padding: '10px 12px', borderRadius: 8, marginBottom: 12}}>
                <strong>Error:</strong> {error}
              </div>
            )}
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr><th>User</th><th>Role</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {loading && (<tr><td colSpan={3}>Loading…</td></tr>)}
                  {!loading && items.length === 0 && (<tr><td colSpan={3}>No users found</td></tr>)}
                  {!loading && items.map((u) => {
                    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=3a86ff&color=fff`;
                    const roleClass = u.role==='admin'?'role-admin':u.role==='health'?'role-medical':u.role==='inventory'?'role-inventory':u.role==='crew'?'role-crew':u.role==='emergency'?'role-emergency':'';// eslint-disable-next-line no-lone-blocks
                    const statusClass = (u.status||'active').toLowerCase()==='active'?'status-active':(u.status||'active').toLowerCase()==='inactive'?'status-inactive':'status-pending';
                    return (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img src={avatar} alt="User" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 10 }} />
                            <div><div>{u.fullName}</div><small>{u.email}</small></div>
                          </div>
                        </td>
                        <td><span className={`user-role ${roleClass}`}>{u.role}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`user-status ${statusClass}`}>{(u.status||'active').toLowerCase()}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">Page {page} of {pages} • {total} users</div>
              <div className="pagination-controls">
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className="page-btn" onClick={() => setPage((p)=> Math.min(p+1, pages))}>Next</button>
              </div>
            </div>
          </div>

          

          {/* Compliance & Audit (Read-Only from backend) */}
          <div className="compliance-audit">
            <div className="section-header"><div className="section-title">Recent Audit Logs</div></div>
            {aError && (
              <div style={{background:'#ffe5e5', color:'#b00020', padding: '10px 12px', borderRadius: 8, marginBottom: 12}}>
                <strong>Error:</strong> {aError}
              </div>
            )}
            <div className="table-responsive">
              <table className="audit-table">
                <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Status</th></tr></thead>
                <tbody>
                  {aLoading && (<tr><td colSpan={6}>Loading…</td></tr>)}
                  {!aLoading && aItems.length === 0 && (<tr><td colSpan={6}>No audit logs found</td></tr>)}
                  {!aLoading && aItems.map((row) => {
                    const action = (row.action || '').toLowerCase();
                    const actionClass = action === 'create' ? 'action-create' : action === 'update' ? 'action-update' : action === 'delete' ? 'action-delete' : action === 'login' || action === 'access' ? 'action-login' : 'action-other';
                    const ok = (row.status || 'success').toString().toLowerCase();
                    const userName = row.userName || row.user_name || row.user || 'System';
                    return (
                      <tr key={row._id}>
                        <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : ''}</td>
                        <td>{userName}</td>
                        <td><span className={`audit-action ${actionClass}`}>{(row.action || '').charAt(0).toUpperCase() + (row.action || '').slice(1)}</span></td>
                        <td>{row.resource || '-'}</td>
                        <td>{ok.includes('success') || ok==='ok' || ok==='200' ? <i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i> : <i className="fas fa-times-circle" style={{ color: 'var(--danger)' }}></i>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">Page {aPage} of {aPages} • {aTotal} audit entries</div>
              <div className="pagination-controls">
                {Array.from({ length: Math.min(5, aPages) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p===aPage?'active':''}`} onClick={() => fetchAudit(p)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => fetchAudit(Math.min(aPage + 1, aPages))}>Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit User Modal */}
      {editing && (
        <div className="detail-modal" role="dialog" aria-modal="true">
          <div className="detail-card" style={{ width: 'min(520px, 95vw)' }}>
            <div className="detail-header">
              <div className="detail-title">Edit User</div>
              <button className="detail-close" onClick={closeEdit} aria-label="Close"><i className="fas fa-times"></i></button>
            </div>
            <div className="detail-body">
              <div className="detail-row"><span>Name</span><span>{editing.fullName}</span></div>
              <div className="detail-row"><span>Email</span><span>{editing.email}</span></div>
              <div className="detail-row">
                <span>Role</span>
                <span>
                  <select value={editRole} onChange={(e)=>setEditRole(e.target.value)}>
                    <option value="admin">admin</option>
                    <option value="health">health</option>
                    <option value="inventory">inventory</option>
                    <option value="emergency">emergency</option>
                    <option value="crew">crew</option>
                  </select>
                </span>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <span>
                  <select value={editStatus} onChange={(e)=>setEditStatus(e.target.value)}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="pending">pending</option>
                  </select>
                </span>
              </div>
              <div className="detail-row">
                <span>Crew ID</span>
                <span>
                  <input type="text" value={editCrewId} onChange={(e)=>setEditCrewId(e.target.value)} placeholder={editing.crewId? String(editing.crewId):'Not set'} disabled={!!editing.crewId} />
                  {!editing.crewId && (
                    <button className="btn btn-sm" style={{ marginLeft: 8 }} onClick={generateCrewId}><i className="fas fa-magic"></i> Generate</button>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button className="btn" onClick={closeEdit}>Cancel</button>
                <button className="btn btn-primary" disabled={savingEdit} onClick={saveEdit}>{savingEdit ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
