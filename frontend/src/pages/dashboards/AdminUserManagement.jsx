import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import AdminSidebar from './AdminSidebar';
import './adminUserManagement.css';
import { listUsers, createUser, updateUser, setStatus, deleteUser } from '../../lib/users';

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [navigate]);

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [query, setQuery] = useState('');
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: 'admin', password: '', status: 'active', dob: '', nationality: '', gender: '', phone: '', bloodGroup: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '', addressLine1: '', addressLine2: '', addressCity: '', addressState: '', addressPostalCode: '', addressCountry: '' });
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null); // {_id, fullName, email, role, status, dob, extra}
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: 'admin', status: 'active', dob: '', nationality: '', gender: '', phone: '', bloodGroup: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '', addressLine1: '', addressLine2: '', addressCity: '', addressState: '', addressPostalCode: '', addressCountry: '' });
  const [viewOpen, setViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });
  const [error, setError] = useState('');

  // Generate a Crew ID when missing (e.g., users who self-register)
  const generateCrewId = () => {
    const y = new Date().getFullYear().toString().slice(-2);
    const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const num = Math.floor(1000 + Math.random() * 9000);
    return `OC-${y}-${rand}-${num}`;
  };

  const fetchUsers = async (opts = {}) => {
    try {
      setLoading(true);
      const params = { page, limit: 10, q: query, ...opts };
      const data = await listUsers(params);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      if (data.page) setPage(data.page);
      setError('');
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || 'Failed to load users';
      setError(`${msg}${e?.response?.status ? ` (HTTP ${e.response.status})` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // reuse api client via users.js list route base
      const res = await listUsers({ limit: 1 }); // warm auth; ignore
      // call stats endpoint using fetch (via window.fetch) or api; we don't have direct export; use dynamic import
      const { default: api } = await import('../../lib/api');
      const { data } = await api.get('/users/stats');
      setStats({ total: data.total || 0, active: data.active || 0, suspended: data.suspended || 0 });
    } catch (e) {
      // keep cards as-is if stats fail
      console.warn('Failed to load stats');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Populate edit form when an editUser is selected
  useEffect(() => {
    if (editUser) {
      setEditForm({
        fullName: editUser.fullName || '',
        email: editUser.email || '',
        role: editUser.role || 'admin',
        status: editUser.status || 'active',
        dob: editUser.dob ? new Date(editUser.dob).toISOString().slice(0,10) : '',
        nationality: editUser.nationality || '',
        gender: editUser.gender || '',
        phone: editUser.phone || '',
        bloodGroup: editUser.bloodGroup || '',
        emergencyName: editUser.emergency?.name || '',
        emergencyPhone: editUser.emergency?.phone || '',
        emergencyRelation: editUser.emergency?.relation || '',
        addressLine1: editUser.address?.line1 || '',
        addressLine2: editUser.address?.line2 || '',
        addressCity: editUser.address?.city || '',
        addressState: editUser.address?.state || '',
        addressPostalCode: editUser.address?.postalCode || '',
        addressCountry: editUser.address?.country || '',
      });
    }
  }, [editUser]);

  return (
    <div className="admin-dashboard admin-user-mgmt">
      <div className="dashboard-container">
        <AdminSidebar onLogout={() => { clearSession(); navigate('/login'); }} />

        <main className="main-content">
          <div className="header">
            <h2>User Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin User')}&background=8338ec&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Sarah Johnson'}</div>
                <small>Administrator</small>
              </div>
          {error && (
            <div style={{background:'#ffe5e5', color:'#b00020', padding: '10px 12px', borderRadius: 8, marginBottom: 12}}>
              <strong>Error:</strong> {error}
            </div>
          )}
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Header + Quick controls + Stats */}
          <div className="user-management-header">
            <div className="section-header">
              <div className="section-title">Manage User Accounts</div>
              <div className="search-box">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search users by name, email, or role..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchUsers({ page: 1, q: e.currentTarget.value }); } }}
                />
                <button className="btn btn-primary" onClick={() => { setPage(1); fetchUsers({ page: 1 }); }}><i className="fas fa-search"></i> Search</button>
                <button className="btn btn-success" onClick={() => setCreateUserOpen(true)}><i className="fas fa-user-plus"></i> Add User</button>
              </div>
            </div>
            <div className="user-stats">
              <div className="stat-card"><div className="stat-icon"><i className="fas fa-users"></i></div><div className="stat-value">{stats.total}</div><div className="stat-label">Total Users</div></div>
              <div className="stat-card"><div className="stat-icon"><i className="fas fa-user-check"></i></div><div className="stat-value">{stats.active}</div><div className="stat-label">Active Users</div></div>
              <div className="stat-card"><div className="stat-icon"><i className="fas fa-user-clock"></i></div><div className="stat-value">{Math.max(stats.total - stats.active - stats.suspended, 0)}</div><div className="stat-label">Pending Activation</div></div>
              <div className="stat-card"><div className="stat-icon"><i className="fas fa-user-slash"></i></div><div className="stat-value">{stats.suspended}</div><div className="stat-label">Suspended Users</div></div>
            </div>
          </div>

          {/* Users Table */}
          <div className="users-table-container">
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th><th>Role</th><th>Crew ID</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={5}>Loading...</td></tr>
                  )}
                  {!loading && items.length === 0 && (
                    <tr><td colSpan={5}>No users found</td></tr>
                  )}
                  {!loading && items.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=3a86ff&color=fff`} alt="User" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 10 }} />
                          <div><div>{u.fullName}</div><small>{u.email}</small></div>
                        </div>
                      </td>
                      <td><span className={`user-role ${u.role==='admin'?'role-admin':u.role==='inventory'?'role-inventory':u.role==='health'?'role-medical':u.role==='crew'?'role-crew':u.role==='emergency'?'role-emergency':''}`}>{u.role}</span></td>
                      <td>{u.crewId || u.crewID || u.crew_id || '-'}</td>
                      <td><span className={`user-status ${(u.status||'active').toLowerCase()==='active'?'status-active':(u.status||'active').toLowerCase()==='inactive'?'status-inactive':'status-pending'}`}>{(u.status||'active').toLowerCase()}</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-success btn-sm" title="View" onClick={() => { setViewUser(u); setViewOpen(true); }}><i className="fas fa-eye"></i></button>
                          <button className="btn btn-primary btn-sm" title="Edit" onClick={() => { setEditUser(u); setEditOpen(true); }}><i className="fas fa-edit"></i></button>
                          {u.status !== 'suspended' ? (
                            <button className="btn btn-warning btn-sm" title="Suspend" onClick={async () => { if (window.confirm(`Suspend ${u.fullName}?`)) { await setStatus(u._id, 'suspended'); fetchUsers(); fetchStats(); } }}><i className="fas fa-user-lock"></i></button>
                          ) : (
                            <button className="btn btn-success btn-sm" title="Activate" onClick={async () => { await setStatus(u._id, 'active'); fetchUsers(); fetchStats(); }}><i className="fas fa-user-check"></i></button>
                          )}
                          <button className="btn btn-danger btn-sm" title="Delete" onClick={async () => { if (window.confirm(`Delete ${u.fullName}? This cannot be undone.`)) { await deleteUser(u._id); fetchUsers(); fetchStats(); } }}><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">Page {page} of {pages} • {total} users</div>
              <div className="pagination-controls">
                {Array.from({ length: pages }).slice(0, 5).map((_, idx) => {
                  const p = idx + 1;
                  return <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => setPage(p)}>{p}</button>;
                })}
                <button className="page-btn" onClick={() => setPage((p)=> Math.min(p+1, pages))}>Next</button>
              </div>
            </div>
          </div>

          
        </main>
      </div>

      {/* Modal */}
      {createUserOpen && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) setCreateUserOpen(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Create New User Account</div>
              <button className="close-modal" onClick={() => setCreateUserOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">First Name</label><input type="text" className="form-control" value={newUser.firstName} onChange={(e)=>setNewUser({...newUser, firstName:e.target.value})} placeholder="Enter first name" /></div>
                <div className="form-group"><label className="form-label">Last Name</label><input type="text" className="form-control" value={newUser.lastName} onChange={(e)=>setNewUser({...newUser, lastName:e.target.value})} placeholder="Enter last name" /></div>
              </div>
              <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-control" value={newUser.email} onChange={(e)=>setNewUser({...newUser, email:e.target.value})} placeholder="Enter email address" /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Role</label>
                  <select className="form-control" value={newUser.role} onChange={(e)=>setNewUser({...newUser, role:e.target.value})}>
                    <option value="admin">admin</option>
                    <option value="health">health</option>
                    <option value="inventory">inventory</option>
                    <option value="emergency">emergency</option>
                    <option value="crew">crew</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-control" value={newUser.password} onChange={(e)=>setNewUser({...newUser, password:e.target.value})} placeholder="Enter password" /></div>
              </div>
              
              <div className="form-row">
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-control" value={newUser.status} onChange={(e)=>setNewUser({...newUser, status:e.target.value})}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="suspended">suspended</option>
                  </select>
                </div>
                <div style={{fontSize:12, color:'#666', marginTop:8}}>Crew ID will be generated automatically.</div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-control" value={newUser.dob} onChange={(e)=>setNewUser({...newUser, dob:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Nationality</label><input type="text" className="form-control" value={newUser.nationality} onChange={(e)=>setNewUser({...newUser, nationality:e.target.value})} placeholder="e.g., Sri Lankan" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Gender</label>
                  <select className="form-control" value={newUser.gender} onChange={(e)=>setNewUser({...newUser, gender:e.target.value})}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-control" value={newUser.phone} onChange={(e)=>setNewUser({...newUser, phone:e.target.value})} placeholder="+94 7X XXX XXXX" /></div>
                <div className="form-group"><label className="form-label">Blood Group</label>
                  <select className="form-control" value={newUser.bloodGroup} onChange={(e)=>setNewUser({...newUser, bloodGroup:e.target.value})}>
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Emergency Contact Name</label><input type="text" className="form-control" value={newUser.emergencyName} onChange={(e)=>setNewUser({...newUser, emergencyName:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Emergency Phone</label><input type="tel" className="form-control" value={newUser.emergencyPhone} onChange={(e)=>setNewUser({...newUser, emergencyPhone:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Relation</label><input type="text" className="form-control" value={newUser.emergencyRelation} onChange={(e)=>setNewUser({...newUser, emergencyRelation:e.target.value})} placeholder="e.g., Spouse" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setCreateUserOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                const fullName = `${newUser.firstName} ${newUser.lastName}`.trim();
                const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email);
                const phoneOk = !newUser.phone || /^[+\d][\d\s()-]{6,}$/.test(newUser.phone);
                const bgList = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
                const dobOk = !newUser.dob || new Date(newUser.dob) <= new Date();
                if (!fullName || !newUser.email || !newUser.password) { alert('Please fill first name, last name, email, and password'); return; }
                if (!emailOk) { alert('Invalid email'); return; }
                if (newUser.password.length < 6) { alert('Password must be at least 6 characters'); return; }
                if (!dobOk) { alert('DOB cannot be in the future'); return; }
                if (newUser.bloodGroup && !bgList.includes(newUser.bloodGroup)) { alert('Invalid blood group'); return; }
                if (!phoneOk) { alert('Invalid phone number'); return; }
                try {
                  const created = await createUser({
                    fullName,
                    email: newUser.email,
                    role: newUser.role,
                    password: newUser.password,
                    status: newUser.status,
                    dob: newUser.dob || undefined,
                    nationality: newUser.nationality || undefined,
                    gender: newUser.gender || undefined,
                    phone: newUser.phone || undefined,
                    bloodGroup: newUser.bloodGroup || undefined,
                    emergency: (newUser.emergencyName||newUser.emergencyPhone||newUser.emergencyRelation) ? { name: newUser.emergencyName, phone: newUser.emergencyPhone, relation: newUser.emergencyRelation } : undefined,
                    address: {
                      line1: newUser.addressLine1 || '',
                      line2: newUser.addressLine2 || '',
                      city: newUser.addressCity || '',
                      state: newUser.addressState || '',
                      postalCode: newUser.addressPostalCode || '',
                      country: newUser.addressCountry || ''
                    }
                  });
                  alert(`User account created successfully!\nCrew ID: ${created.crewId || '(generated)'}`);
                  setCreateUserOpen(false);
                  setNewUser({ firstName: '', lastName: '', email: '', role: 'admin', password: '', status: 'active', dob: '', nationality: '', gender: '', phone: '', bloodGroup: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '', addressLine1: '', addressLine2: '', addressCity: '', addressState: '', addressPostalCode: '', addressCountry: '' });
                  setQuery('');
                  setPage(1);
                  fetchUsers({ page: 1, q: '' });
                } catch (e) {
                  console.error(e);
                  alert('Failed to create user');
                }
              }}><i className="fas fa-user-plus"></i> Create User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && editUser && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) { setEditOpen(false); setEditUser(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Edit User</div>
              <button className="close-modal" onClick={() => { setEditOpen(false); setEditUser(null); }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="form-control" value={editForm.fullName} onChange={(e)=>setEditForm({...editForm, fullName:e.target.value})} placeholder="Enter full name" /></div>
                <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-control" value={editForm.email} onChange={(e)=>setEditForm({...editForm, email:e.target.value})} placeholder="Enter email address" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Role</label>
                  <select className="form-control" value={editForm.role} onChange={(e)=>setEditForm({...editForm, role:e.target.value})}>
                    <option value="admin">admin</option>
                    <option value="health">health</option>
                    <option value="inventory">inventory</option>
                    <option value="emergency">emergency</option>
                    <option value="crew">crew</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-control" value={editForm.status} onChange={(e)=>setEditForm({...editForm, status:e.target.value})}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="suspended">suspended</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-control" value={editForm.dob} onChange={(e)=>setEditForm({...editForm, dob:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Nationality</label><input type="text" className="form-control" value={editForm.nationality} onChange={(e)=>setEditForm({...editForm, nationality:e.target.value})} placeholder="e.g., Sri Lankan" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Gender</label>
                  <select className="form-control" value={editForm.gender} onChange={(e)=>setEditForm({...editForm, gender:e.target.value})}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-control" value={editForm.phone} onChange={(e)=>setEditForm({...editForm, phone:e.target.value})} placeholder="+94 7X XXX XXXX" /></div>
                <div className="form-group"><label className="form-label">Blood Group</label>
                  <select className="form-control" value={editForm.bloodGroup} onChange={(e)=>setEditForm({...editForm, bloodGroup:e.target.value})}>
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Emergency Contact Name</label><input type="text" className="form-control" value={editForm.emergencyName} onChange={(e)=>setEditForm({...editForm, emergencyName:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Emergency Phone</label><input type="tel" className="form-control" value={editForm.emergencyPhone} onChange={(e)=>setEditForm({...editForm, emergencyPhone:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Relation</label><input type="text" className="form-control" value={editForm.emergencyRelation} onChange={(e)=>setEditForm({...editForm, emergencyRelation:e.target.value})} placeholder="e.g., Spouse" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Address Line 1</label><input type="text" className="form-control" value={editForm.addressLine1} onChange={(e)=>setEditForm({...editForm, addressLine1:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Address Line 2</label><input type="text" className="form-control" value={editForm.addressLine2} onChange={(e)=>setEditForm({...editForm, addressLine2:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">City</label><input type="text" className="form-control" value={editForm.addressCity} onChange={(e)=>setEditForm({...editForm, addressCity:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">State</label><input type="text" className="form-control" value={editForm.addressState} onChange={(e)=>setEditForm({...editForm, addressState:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Postal Code</label><input type="text" className="form-control" value={editForm.addressPostalCode} onChange={(e)=>setEditForm({...editForm, addressPostalCode:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Country</label><input type="text" className="form-control" value={editForm.addressCountry} onChange={(e)=>setEditForm({...editForm, addressCountry:e.target.value})} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => { setEditOpen(false); setEditUser(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email);
                const phoneOk = !editForm.phone || /^[+\d][\d\s()-]{6,}$/.test(editForm.phone);
                const dobOk = !editForm.dob || new Date(editForm.dob) <= new Date();
                if (!editForm.fullName || !editForm.email) { alert('Please fill full name and email'); return; }
                if (!emailOk) { alert('Invalid email'); return; }
                if (!dobOk) { alert('DOB cannot be in the future'); return; }
                if (editForm.bloodGroup && !['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(editForm.bloodGroup)) { alert('Invalid blood group'); return; }
                if (!phoneOk) { alert('Invalid phone number'); return; }
                try {
                  const payload = {
                    fullName: editForm.fullName,
                    email: editForm.email,
                    role: editForm.role,
                    status: editForm.status,
                    dob: editForm.dob || undefined,
                    nationality: editForm.nationality || undefined,
                    gender: editForm.gender || undefined,
                    phone: editForm.phone || undefined,
                    bloodGroup: editForm.bloodGroup || undefined,
                    emergency: (editForm.emergencyName||editForm.emergencyPhone||editForm.emergencyRelation) ? { name: editForm.emergencyName, phone: editForm.emergencyPhone, relation: editForm.emergencyRelation } : undefined,
                    address: {
                      line1: editForm.addressLine1 || '',
                      line2: editForm.addressLine2 || '',
                      city: editForm.addressCity || '',
                      state: editForm.addressState || '',
                      postalCode: editForm.addressPostalCode || '',
                      country: editForm.addressCountry || ''
                    }
                  };
                  // Auto-generate crewId if missing and role is crew (or switching to crew)
                  if (!editUser.crewId && (editForm.role === 'crew' || editUser.role === 'crew')) {
                    payload.crewId = generateCrewId();
                  }
                  await updateUser(editUser._id, payload);
                  alert(`User updated successfully${payload.crewId ? `\nCrew ID: ${payload.crewId}` : ''}`);
                  setEditOpen(false);
                  setEditUser(null);
                  fetchUsers();
                  fetchStats();
                } catch (e) {
                  console.error(e);
                  alert('Failed to update user');
                }
              }}><i className="fas fa-save"></i> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewOpen && viewUser && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) { setViewOpen(false); setViewUser(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">User Details</div>
              <button className="close-modal" onClick={() => { setViewOpen(false); setViewUser(null); }}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div><strong>Name:</strong> {viewUser.fullName}</div>
                <div><strong>Email:</strong> {viewUser.email}</div>
                <div><strong>Role:</strong> {viewUser.role}</div>
                <div><strong>Crew ID:</strong> {viewUser.crewId || viewUser.crewID || viewUser.crew_id || '-'}</div>
                <div><strong>Status:</strong> {viewUser.status}</div>
                <div><strong>DOB:</strong> {viewUser.dob ? new Date(viewUser.dob).toLocaleDateString() : '-'}</div>
                <div><strong>Gender:</strong> {viewUser.gender || '-'}</div>
                <div><strong>Phone:</strong> {viewUser.phone || '-'}</div>
                <div><strong>Nationality:</strong> {viewUser.nationality || '-'}</div>
                <div><strong>Blood Group:</strong> {viewUser.bloodGroup || '-'}</div>
                <div><strong>Last Login:</strong> {viewUser.lastLogin ? new Date(viewUser.lastLogin).toLocaleString() : '-'}</div>
                <div><strong>Emergency:</strong> {viewUser.emergency ? `${viewUser.emergency.name || ''} ${viewUser.emergency.phone ? '('+viewUser.emergency.phone+')' : ''} ${viewUser.emergency.relation ? '- '+viewUser.emergency.relation : ''}`.trim() || '-' : '-'}</div>
                <div style={{gridColumn:'1 / span 2'}}>
                  <strong>Address:</strong> {viewUser.address ? [viewUser.address.line1, viewUser.address.line2, viewUser.address.city, viewUser.address.state, viewUser.address.postalCode, viewUser.address.country].filter(Boolean).join(', ') : '-'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => { setViewOpen(false); setViewUser(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
