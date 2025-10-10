import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import AdminSidebar from './AdminSidebar';
import api from '../../lib/api';
import './adminPermissions.css';

export default function AdminPermissions() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [navigate]);

  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [permInput, setPermInput] = useState('');
  const [perms, setPerms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]); // multiple: admin, inventory, emergency, health, crew
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [userStats, setUserStats] = useState({ mfaEnabled: 0 });

  const ROLE_PRESETS = {
    admin: {
      label: 'Admin',
      permissions: ['users.read','users.write','inventory.manage','reports.generate','system.configure','audit.read']
    },
    inventory: {
      label: 'Inventory Manager',
      permissions: ['inventory.read','inventory.manage','reports.generate']
    },
    emergency: {
      label: 'Emergency Officer',
      permissions: ['emergency.handle','emergency.alerts','reports.generate']
    },
    health: {
      label: 'Health Officer',
      permissions: ['health.read','health.write','reports.generate']
    },
    crew: {
      label: 'Crew',
      permissions: ['self.read']
    }
  };

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const res = await api.get('/admin/roles-custom');
      setRoles(res.data?.items || []);
    } catch (err) {
      console.log('[roles:list] error', err?.response?.status, err?.response?.data);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); (async () => { try { const res = await api.get('/users/stats'); setUserStats(res.data || {}); } catch (err) { console.log('[users:stats] error', err?.response?.status, err?.response?.data); } })(); }, []);

  const PERMISSION_OPTIONS = [
    { key: 'users.read', label: 'Users: Read' },
    { key: 'users.write', label: 'Users: Write' },
    { key: 'inventory.read', label: 'Inventory: Read' },
    { key: 'inventory.manage', label: 'Inventory: Manage' },
    { key: 'health.read', label: 'Health: Read' },
    { key: 'health.write', label: 'Health: Write' },
    { key: 'emergency.handle', label: 'Emergency: Handle Incidents' },
    { key: 'emergency.alerts', label: 'Emergency: Alerts' },
    { key: 'reports.generate', label: 'Reports: Generate' },
    { key: 'audit.read', label: 'Audit Log: Read' },
    { key: 'system.configure', label: 'System: Configure' },
    { key: 'self.read', label: 'Self: Read Own Data' },
  ];

  // Well-named permission presets
  const QUICK_PRESETS = [
    { label: 'Read Only', perms: ['users.read','inventory.read','health.read','audit.read','self.read'] },
    { label: 'User Management', perms: ['users.read','users.write'] },
    { label: 'Inventory Ops', perms: ['inventory.read','inventory.manage','reports.generate'] },
    { label: 'Emergency Ops', perms: ['emergency.handle','emergency.alerts'] },
    { label: 'Health Ops', perms: ['health.read','health.write'] },
    { label: 'Reporting', perms: ['reports.generate'] },
    { label: 'System Admin', perms: ['system.configure','audit.read'] },
  ];

  const resetForm = () => {
    setRoleName('');
    setRoleDesc('');
    setPermInput('');
    setPerms([]); // used as manual overrides
    setError('');
    setSaving(false);
    setSelectedRoles([]);
  };

  const addPerm = () => {
    const p = permInput.trim().replace(/,$/, '');
    if (!p) return;
    if (!perms.includes(p)) setPerms([...perms, p]);
    setPermInput('');
  };
  const removePerm = (p) => setPerms(perms.filter(x => x !== p));
  const handlePermKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') { e.preventDefault(); addPerm(); }
  };
  const usePreset = (arr) => {
    const set = new Set(perms);
    arr.forEach(x => set.add(x));
    setPerms(Array.from(set));
  };

  const toggleRole = (role) => {
    setSelectedRoles((prev) => {
      const next = prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role];
      return next;
    });
  };

  const togglePerm = (p) => {
    // perms state represents manual overrides; union with role-derived perms is computed below
    setPerms((prev) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  // Use only manually entered/toggled permissions
  const effectivePerms = perms;

  const handleCreateRole = async () => {
    setError('');
    const name = roleName.trim();
    if (!name) { setError('Role name is required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/admin/roles-custom', { name, description: roleDesc, permissions: effectivePerms });
      console.log('[roles:create] ok', res.status, res.data?._id || res.data?.id);
      alert('Role created successfully');
      setCreateRoleOpen(false);
      resetForm();
      await fetchRoles();
    } catch (err) {
      console.log('[roles:create] error', err?.response?.status, err?.response?.data);
      const msg = err?.response?.data?.message || `Failed to create role (HTTP ${err?.response?.status || 'error'})`;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const openEditRole = (role) => {
    // Pre-fill form state with selected role
    setError('');
    setRoleName(role?.name || '');
    setRoleDesc(role?.description || '');
    setPermInput('');
    setPerms(Array.isArray(role?.permissions) ? role.permissions : []);
    setSelectedRoles([]);
    setEditTarget(role);
    setEditRoleOpen(true);
  };

  const handleUpdateRole = async () => {
    setError('');
    const name = roleName.trim();
    if (!name) { setError('Role name is required'); return; }
    const id = editTarget?._id || editTarget?.id;
    if (!id) { setError('Invalid role selected'); return; }
    setSaving(true);
    try {
      const res = await api.patch(`/admin/roles-custom/${id}`, { name, description: roleDesc, permissions: effectivePerms });
      console.log('[roles:update] ok', res.status, id);
      alert('Role updated successfully');
      setEditRoleOpen(false);
      setEditTarget(null);
      resetForm();
      await fetchRoles();
    } catch (err) {
      console.log('[roles:update] error', err?.response?.status, err?.response?.data);
      const msg = err?.response?.data?.message || `Failed to update role (HTTP ${err?.response?.status || 'error'})`;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    const id = role?._id || role?.id;
    if (!id) return alert('Invalid role');
    if (!window.confirm(`Delete role "${role?.name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/admin/roles-custom/${id}`);
      console.log('[roles:delete] ok', res.status, id);
      await fetchRoles();
    } catch (err) {
      console.log('[roles:delete] error', err?.response?.status, err?.response?.data);
      alert(err?.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleDuplicateRole = (role) => {
    // Open create modal with copied fields
    resetForm();
    setRoleName(`${role?.name || 'Role'} Copy`);
    setRoleDesc(role?.description || '');
    setPerms(Array.isArray(role?.permissions) ? role.permissions : []);
    setCreateRoleOpen(true);
  };

  return (
    <div className="admin-dashboard admin-permissions">
      <div className="dashboard-container">
        <AdminSidebar onLogout={() => { clearSession(); navigate('/login'); }} />

        <main className="main-content">
          <div className="header">
            <h2>Permissions & Access Control</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin User')}&background=8338ec&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Sarah Johnson'}</div>
                <small>Administrator</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Permissions Header + Security Stats */}
          <div className="permissions-header">
            <div className="section-header">
              <div className="section-title">Access Control Management</div>
              <div className="search-box">
                <input type="text" className="search-input" placeholder="Search permissions or roles..." />
                <button className="btn btn-primary">Search</button>
                <button className="btn btn-success" onClick={() => { resetForm(); setCreateRoleOpen(true); }}>Create Role</button>
              </div>
            </div>

            <div className="security-stats">
              {(() => {
                const customRolesCount = roles.filter(r => !r.system).length;
                const mfaEnabledCount = Number(userStats?.mfaEnabled || 0);
                const totalUsers = Number(userStats?.total || 0);
                const compliance = totalUsers > 0 ? `${((mfaEnabledCount / totalUsers) * 100).toFixed(1)}%` : '—';
                const restrictedResources = userStats?.restrictedResources ?? '—';
                return (
                  <>
                    <div className="stat-card"><div className="stat-icon"><i className="fas fa-user-shield"></i></div><div className="stat-value">{customRolesCount}</div><div className="stat-label">Custom Roles</div></div>
                    <div className="stat-card"><div className="stat-icon"><i className="fas fa-shield-alt"></i></div><div className="stat-value">{mfaEnabledCount}</div><div className="stat-label">MFA Enabled Users</div></div>
                    <div className="stat-card"><div className="stat-icon"><i className="fas fa-lock"></i></div><div className="stat-value">{restrictedResources}</div><div className="stat-label">Restricted Resources</div></div>
                    <div className="stat-card"><div className="stat-icon"><i className="fas fa-history"></i></div><div className="stat-value">{compliance}</div><div className="stat-label">Policy Compliance</div></div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Role Management (dynamic) */}
          <div className="role-management">
            <div className="section-header">
              <div className="section-title">Role Management</div>
              <button className="btn btn-primary" onClick={fetchRoles}><i className="fas fa-sync"></i> Refresh Roles</button>
            </div>

            <div className="roles-grid">
              {rolesLoading && (<div>Loading roles...</div>)}
              {!rolesLoading && roles.length === 0 && (
                <div style={{ color:'#666' }}>No roles found.</div>
              )}
              {roles.map((r) => (
                <div key={r._id || r.id || r.name} className="role-card">
                  <div className="role-header">
                    <div className="role-title">{r.name}</div>
                    {r.system && (<div className="user-count">System</div>)}
                  </div>
                  {r.description && (<div className="role-description">{r.description}</div>)}
                  {Array.isArray(r.permissions) && r.permissions.length > 0 && (
                    <div className="permissions-list">
                      {r.permissions.slice(0, 6).map((p) => (
                        <div key={p} className="permission-item"><i className="fas fa-check-circle"></i> {p}</div>
                      ))}
                      {r.permissions.length > 6 && (
                        <div className="permission-item">+{r.permissions.length - 6} more</div>
                      )}
                    </div>
                  )}
                  <div className="role-actions">
                    <button className="btn btn-primary btn-sm" disabled={r.system} onClick={() => openEditRole(r)}><i className="fas fa-edit"></i> Edit</button>
                    <button className="btn btn-warning btn-sm" onClick={() => handleDuplicateRole(r)}><i className="fas fa-copy"></i> Duplicate</button>
                    <button className="btn btn-danger btn-sm" disabled={r.system} onClick={() => handleDeleteRole(r)}><i className="fas fa-trash"></i> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="permissions-matrix">
            <div className="section-header">
              <div className="section-title">Permissions Matrix</div>
              <button className="btn btn-primary" onClick={() => alert('Exporting permissions matrix...')}><i className="fas fa-download"></i> Export Matrix</button>
            </div>
            <div className="table-responsive">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    {(() => {
                      // Order roles: system first, then custom; stable by name
                      const ordered = [...roles].sort((a,b) => {
                        if (a.system !== b.system) return a.system ? -1 : 1;
                        return String(a.name).localeCompare(String(b.name));
                      });
                      return (
                        <>
                          {ordered.map(r => (
                            <th key={r._id || r.id || r.key || r.name}>{r.name}</th>
                          ))}
                        </>
                      );
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Prepare ordered role columns and their permission sets
                    const ordered = [...roles].sort((a,b) => {
                      if (a.system !== b.system) return a.system ? -1 : 1;
                      return String(a.name).localeCompare(String(b.name));
                    });
                    const cols = ordered.map(r => ({
                      id: r._id || r.id || r.key || r.name,
                      name: r.name,
                      perms: new Set(Array.isArray(r.permissions) ? r.permissions : []),
                    }));

                    // Original grouped format rows
                    const rows = [
                      { label: 'User Management', rule: { type: 'tier', full: 'users.write', read: 'users.read' } },
                      { label: 'Medical Records - View', rule: { type: 'exact', key: 'health.read' } },
                      { label: 'Medical Records - Edit', rule: { type: 'exact', key: 'health.write' } },
                      { label: 'Medical Records - Delete', rule: { type: 'exact', key: 'health.write' } },
                      { label: 'Inventory Management', rule: { type: 'tier', full: 'inventory.manage', read: 'inventory.read' } },
                      { label: 'Emergency - Handle Incidents', rule: { type: 'exact', key: 'emergency.handle' } },
                      { label: 'Emergency - Alerts', rule: { type: 'exact', key: 'emergency.alerts' } },
                      { label: 'Self Data - View', rule: { type: 'exact', key: 'self.read' } },
                      { label: 'System Configuration', rule: { type: 'exact', key: 'system.configure' } },
                      { label: 'Audit Log Access', rule: { type: 'exact', key: 'audit.read' } },
                      { label: 'Report Generation', rule: { type: 'exact', key: 'reports.generate' } },
                    ];

                    const renderCell = (state) => {
                      if (state === 'granted') return (<td className="permission-cell permission-granted"><i className="fas fa-check-circle"></i></td>);
                      if (state === 'partial') return (<td className="permission-cell permission-partial"><i className="fas fa-minus-circle"></i></td>);
                      return (<td className="permission-cell permission-denied"><i className="fas fa-times-circle"></i></td>);
                    };

                    const evalRule = (set, rule) => {
                      if (rule.type === 'exact') return set.has(rule.key) ? 'granted' : 'denied';
                      if (rule.type === 'tier') {
                        if (set.has(rule.full)) return 'granted';
                        if (rule.read && set.has(rule.read)) return 'partial';
                        return 'denied';
                      }
                      return 'denied';
                    };

                    return rows.map((row) => (
                      <tr key={row.label}>
                        <th>{row.label}</th>
                        {cols.map(c => (
                          <React.Fragment key={c.id}>
                            {renderCell(evalRule(c.perms, row.rule))}
                          </React.Fragment>
                        ))}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          
        </main>
      </div>

      {/* Create Role Modal */}
      {createRoleOpen && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) setCreateRoleOpen(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create New Role</div>
              <button className="close-modal" onClick={() => setCreateRoleOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && (<div style={{color:'var(--danger)', marginBottom: 8}}>{error}</div>)}
              <div className="form-group">
                <label className="form-label">Role Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter role name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe the purpose and permissions of this role..."
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                ></textarea>
              </div>
              {/* Permissions input (chip-style) */}
              <div className="form-group">
                <label className="form-label">Permissions (type and press Enter/Space/Comma to add)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., users.read"
                  value={permInput}
                  onChange={(e) => setPermInput(e.target.value)}
                  onKeyDown={handlePermKeyDown}
                />
                {perms.length > 0 && (
                  <div className="perm-chips" style={{ marginTop: 8 }}>
                    {perms.map((p) => (
                      <span key={p} className="chip">
                        {p}
                        <button type="button" className="chip-remove" onClick={() => removePerm(p)} aria-label={`remove ${p}`}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Quick Presets</label>
                {/* Quick presets to match grouped matrix */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Quick add</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {QUICK_PRESETS.map(p => (
                      <button
                        key={p.label}
                        type="button"
                        className="btn"
                        style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
                        onClick={() => usePreset(p.perms)}
                        disabled={saving}
                        title={`Add: ${p.perms.join(', ')}`}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button type="button" className="btn" style={{ background: '#f1f3f5' }} onClick={() => setPerms([])} disabled={saving}>Clear All</button>
                  </div>
                </div>
              </div>
            </div>
            {/* Modal Footer: Cancel / Save */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn"
                style={{ background: '#e9ecef' }}
                onClick={() => setCreateRoleOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#f1f3f5' }}
                  onClick={resetForm}
                  disabled={saving}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleCreateRole}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRoleOpen && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) setEditRoleOpen(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Role</div>
              <button className="close-modal" onClick={() => setEditRoleOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && (<div style={{color:'var(--danger)', marginBottom: 8}}>{error}</div>)}
              <div className="form-group">
                <label className="form-label">Role Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter role name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe the purpose and permissions of this role..."
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Permissions (type and press Enter/Space/Comma to add)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., users.read"
                  value={permInput}
                  onChange={(e) => setPermInput(e.target.value)}
                  onKeyDown={handlePermKeyDown}
                />
                {perms.length > 0 && (
                  <div className="perm-chips" style={{ marginTop: 8 }}>
                    {perms.map((p) => (
                      <span key={p} className="chip">
                        {p}
                        <button type="button" className="chip-remove" onClick={() => removePerm(p)} aria-label={`remove ${p}`}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                {/* Quick presets to match grouped matrix */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Quick add</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {QUICK_PRESETS.map(p => (
                      <button
                        key={p.label}
                        type="button"
                        className="btn"
                        style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
                        onClick={() => usePreset(p.perms)}
                        disabled={saving}
                        title={`Add: ${p.perms.join(', ')}`}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button type="button" className="btn" style={{ background: '#f1f3f5' }} onClick={() => setPerms([])} disabled={saving}>Clear All</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn"
                style={{ background: '#e9ecef' }}
                onClick={() => setEditRoleOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#f1f3f5' }}
                  onClick={resetForm}
                  disabled={saving}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleUpdateRole}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


