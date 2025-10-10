import React, { useEffect, useMemo, useState } from 'react';
import { getUser, getToken } from '../../lib/token';
import EmergencySidebar from './EmergencySidebar';
import './emrgencyAlert.css';

export default function EmergencyAlerts() {
  const user = getUser();

  // Filters state
  const [filters, setFilters] = useState({
    status: 'All Alerts',
    severity: 'All Severities',
    range: 'Last 24 Hours',
    search: '',
  });

  const onFilterChange = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  // Alerts dataset based on the template
  const initialAlerts = useMemo(() => ([
    {
      id: 'AL-1001',
      type: 'critical',
      icon: 'fas fa-heartbeat',
      title: 'Cardiac Emergency - John Davis',
      meta: {
        user: 'John Davis (ID: CREW-045)',
        location: 'Engine Room',
        triggered: '10:24 AM',
      },
      description: 'Critical cardiac anomaly detected. Heart rate elevated to 145 bpm with irregular rhythm.',
      vitals: [
        { icon: 'fas fa-heart', label: 'HR: 145 bpm' },
        { icon: 'fas fa-tint', label: 'BP: 165/95 mmHg' },
        { icon: 'fas fa-lungs', label: 'SpO2: 92%' },
        { icon: 'fas fa-thermometer-half', label: 'Temp: 37.1°C' },
      ],
      footerTime: 'Last updated: 10:28 AM',
      status: 'NEW', // NEW | ACKNOWLEDGED | RESOLVED
    },
    {
      id: 'AL-1002',
      type: 'warning',
      icon: 'fas fa-lungs',
      title: 'Respiratory Distress - Maria Rodriguez',
      meta: {
        user: 'Maria Rodriguez (ID: CREW-128)',
        location: 'Medical Bay',
        triggered: '09:45 AM',
      },
      description: 'Significant drop in blood oxygen levels. Patient showing signs of respiratory distress.',
      vitals: [
        { icon: 'fas fa-lungs', label: 'SpO2: 88%' },
        { icon: 'fas fa-heart', label: 'HR: 110 bpm' },
        { icon: 'fas fa-tint', label: 'BP: 140/85 mmHg' },
        { icon: 'fas fa-thermometer-half', label: 'Temp: 36.8°C' },
      ],
      footerTime: 'Last updated: 10:15 AM | Ack by: ' + (user?.fullName || 'Officer Smith'),
      status: 'ACKNOWLEDGED',
    },
    {
      id: 'AL-1003',
      type: 'info',
      icon: 'fas fa-thermometer-full',
      title: 'Elevated Temperature - Robert Chen',
      meta: {
        user: 'Robert Chen (ID: CREW-312)',
        location: 'Crew Quarters B',
        triggered: '08:15 AM',
      },
      description: 'High fever detected. Patient administered antipyretics and moved to medical bay for observation.',
      vitals: [
        { icon: 'fas fa-thermometer-half', label: 'Temp: 39.2°C → 37.5°C' },
        { icon: 'fas fa-heart', label: 'HR: 95 bpm' },
        { icon: 'fas fa-tint', label: 'BP: 125/80 mmHg' },
      ],
      footerTime: 'Resolved: 09:30 AM | By: Dr. Sarah Johnson',
      status: 'RESOLVED',
    },
  ]), [user]);

  const [alertList, setAlertList] = useState(initialAlerts);
  const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:5000';

  const authHeaders = () => {
    const t = getToken?.();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.search) params.set('q', filters.search);
      const res = await fetch(`${API_BASE}/api/emergency-alerts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load alerts');
      const data = await res.json();
      // Map server fields to UI shape
      const mapped = data.map((a) => ({
        id: a._id,
        type: a.severity,
        icon: a.icon || (a.severity==='critical'?'fas fa-heartbeat':a.severity==='warning'?'fas fa-exclamation-triangle':'fas fa-info-circle'),
        title: a.title,
        meta: a.meta,
        description: a.description,
        vitals: a.vitals || [],
        footerTime: a.footerTime || '',
        status: a.status,
      }));
      setAlertList(mapped);
    } catch (e) {
      // fallback keep current list
      console.warn(e);
    }
  };

  useEffect(() => { fetchAlerts(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  // CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null => creating
  const [form, setForm] = useState({
    title: '',
    severity: 'Critical',
    status: 'NEW',
    user: user?.fullName ? `${user.fullName} (ID: CREW-001)` : 'Unknown (ID: CREW-001)',
    location: '',
    description: '',
    incidentType: 'Medical',
    notifyTeam: true,
  });
  const [errors, setErrors] = useState({});

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      severity: 'Critical',
      status: 'NEW',
      user: user?.fullName ? `${user.fullName} (ID: CREW-001)` : 'Unknown (ID: CREW-001)',
      location: '',
      description: '',
      incidentType: 'Medical',
      notifyTeam: true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const onFormChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveForm = async () => {
    // Basic validation for emergency speed
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.severity) e.severity = 'Select a severity';
    setErrors(e);
    if (Object.keys(e).length) return;
    const severityMap = { Critical: 'critical', Warning: 'warning', Info: 'info' };
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      if (editingId) {
        // Update existing via API
        const payload = {
          title: form.title,
          severity: severityMap[form.severity] || 'info',
          description: form.description,
          status: form.status,
          meta: { user: form.user, location: form.location },
          incidentType: form.incidentType,
          notifyTeam: form.notifyTeam,
        };
        const res = await fetch(`${API_BASE}/api/emergency-alerts/${editingId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Update failed');
        const a = await res.json();
        setAlertList((list) => list.map((x) => x.id === editingId ? { ...x, id:a._id, type:a.severity, title:a.title, description:a.description, status:a.status, meta:a.meta, footerTime:a.footerTime } : x));
      } else {
        // Create new via API
        const payload = {
          title: form.title,
          severity: severityMap[form.severity] || 'info',
          status: form.status,
          incidentType: form.incidentType,
          notifyTeam: form.notifyTeam,
          description: form.description || '',
          meta: { user: form.user || (user?.fullName ? `${user.fullName} (ID: CREW-001)` : 'Unknown (ID: CREW-001)'), location: form.location, triggered: timeStr },
          vitals: [],
          icon: form.severity === 'Critical' ? 'fas fa-heartbeat' : form.severity === 'Warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle',
          footerTime: `Created: ${timeStr} | By: ${user?.fullName || 'Officer'}${form.incidentType ? ' • Type: ' + form.incidentType : ''}${form.notifyTeam ? ' • Team notified' : ''}`,
        };
        const res = await fetch(`${API_BASE}/api/emergency-alerts`, { method: 'POST', headers: { 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Create failed');
        const a = await res.json();
        setAlertList((list) => [
          {
            id: a._id,
            type: a.severity,
            icon: a.icon,
            title: a.title,
            meta: a.meta,
            description: a.description,
            vitals: a.vitals || [],
            footerTime: a.footerTime || '',
            status: a.status,
          },
          ...list,
        ]);
      }
    } catch (err) {
      console.warn(err);
    }
    setIsModalOpen(false);
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/emergency-alerts/${id}`, { method: 'DELETE', headers: { ...authHeaders() } });
      if (!res.ok) throw new Error('Delete failed');
      setAlertList((list) => list.filter((a) => a.id !== id));
    } catch (e) { console.warn(e); }
  };

  const onEdit = (id) => {
    const a = alertList.find((x) => x.id === id);
    if (!a) return;
    setEditingId(id);
    // reverse map
    const severityRev = { critical: 'Critical', warning: 'Warning', info: 'Info' };
    setForm({
      title: a.title,
      severity: severityRev[a.type] || 'Info',
      status: a.status,
      user: a.meta.user,
      location: a.meta.location,
      description: a.description,
      incidentType: 'Medical',
      notifyTeam: true,
    });
    setIsModalOpen(true);
  };

  const applyFilters = async () => {
    await fetchAlerts();
  };

  

  const onAcknowledge = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/emergency-alerts/${id}/ack`, { method: 'POST', headers: { 'Content-Type':'application/json', ...authHeaders() } });
      if (!res.ok) throw new Error('Ack failed');
      const a = await res.json();
      setAlertList((list) => list.map((x) => x.id === id ? { ...x, status: a.status, footerTime: a.footerTime } : x));
    } catch (e) { console.warn(e); }
  };

  const onResolve = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/emergency-alerts/${id}/resolve`, { method: 'POST', headers: { 'Content-Type':'application/json', ...authHeaders() } });
      if (!res.ok) throw new Error('Resolve failed');
      const a = await res.json();
      setAlertList((list) => list.map((x) => x.id === id ? { ...x, status: a.status, footerTime: a.footerTime } : x));
    } catch (e) { console.warn(e); }
  };

  const filtered = alertList.filter((a) => {
    if (filters.status !== 'All Alerts') {
      if (filters.status === 'New' && a.status !== 'NEW') return false;
      if (filters.status === 'Acknowledged' && a.status !== 'ACKNOWLEDGED') return false;
      if (filters.status === 'Resolved' && a.status !== 'RESOLVED') return false;
    }
    if (filters.severity !== 'All Severities') {
      const map = { Critical: 'critical', Warning: 'warning', Info: 'info' };
      if (a.type !== map[filters.severity]) return false;
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const text = `${a.title} ${a.description} ${a.meta.user} ${a.meta.location}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    // Time range is not applied in demo
    return true;
  });

  return (
    <div className="dashboard-container emergency-dashboard">

      {/* Sidebar */}
      <EmergencySidebar onLogout={() => window.location.assign('/')} />

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h2>Health Alerts Management</h2>
          <div className="user-info">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Officer')}&background=e63946&color=fff`} alt="User" />
            <div>
              <div>{user?.fullName || 'Officer'}</div>
              <small>Emergency Officer{user?.vessel ? ` | ${user.vessel}` : ''}</small>
            </div>
            <div className="status-badge status-active">Online</div>
          </div>
        </div>

        {/* Alert Filters */}
        <div className="alert-filters">
          <div className="filters-left">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select className="filter-select" value={filters.status} onChange={onFilterChange('status')}>
                <option>All Alerts</option>
                <option>New</option>
                <option>Acknowledged</option>
                <option>Resolved</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Severity</label>
              <select className="filter-select" value={filters.severity} onChange={onFilterChange('severity')}>
                <option>All Severities</option>
                <option>Critical</option>
                <option>Warning</option>
                <option>Info</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Time Range</label>
              <select className="filter-select" value={filters.range} onChange={onFilterChange('range')}>
                <option>Last 24 Hours</option>
                <option>Last 48 Hours</option>
                <option>Last Week</option>
                <option>Last Month</option>
              </select>
            </div>

            <div className="search-box">
              <input type="text" placeholder="Search alerts..." value={filters.search} onChange={(e)=>setFilters((f)=>({ ...f, search: e.target.value }))} />
            </div>
          </div>

          <div className="filters-actions">
            <button className="btn btn-success" onClick={applyFilters}><i className="fas fa-filter"></i> Apply Filters</button>
            <button className="btn btn-emergency" onClick={openCreateModal} aria-label="Create New Emergency"><i className="fas fa-plus"></i> New Emergency</button>
          </div>
        </div>

        {/* Alert List */}
        <div className="alert-list">
          <div className="alert-list-header">
            <div className="alert-count">Showing {filtered.length} Health Alerts</div>
            <div className="alert-actions">
              <button className="btn btn-success" onClick={() => filtered.forEach(a => a.status === 'NEW' && onAcknowledge(a.id))}><i className="fas fa-check-double"></i> Acknowledge All</button>
              <button className="btn" onClick={() => alert('Exporting...')}><i className="fas fa-download"></i> Export</button>
            </div>
          </div>

          {filtered.map((a) => (
            <div key={a.id} className={`alert-item ${a.type}`}>
              <div className={`alert-icon ${a.type}`}>
                <i className={a.icon}></i>
              </div>
              <div className="alert-content">
                <div className="alert-title">{a.title}</div>
                <div className="alert-meta">
                  <div className="alert-meta-item"><i className="fas fa-user"></i><span>{a.meta.user}</span></div>
                  <div className="alert-meta-item"><i className="fas fa-map-marker-alt"></i><span>{a.meta.location}</span></div>
                  <div className="alert-meta-item"><i className="fas fa-clock"></i><span>Triggered: {a.meta.triggered}</span></div>
                  <div className={`alert-status ${a.status === 'NEW' ? 'status-new' : a.status === 'ACKNOWLEDGED' ? 'status-acknowledged' : 'status-resolved'}`}>{a.status}</div>
                </div>
                <div className="alert-description">{a.description}</div>
                <div className="alert-vitals">
                  {a.vitals.map((v, i) => (
                    <div key={i} className="vital-item"><i className={v.icon}></i><span>{v.label}</span></div>
                  ))}
                </div>
                <div className="alert-footer">
                  <div className="alert-time">{a.footerTime}</div>
                  <div className="alert-actions">
                    <button className="btn btn-success btn-sm" onClick={() => alert('Viewing details...')}><i className="fas fa-eye"></i> Details</button>
                    <button className="btn btn-warning btn-sm" onClick={() => onEdit(a.id)}><i className="fas fa-edit"></i> Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(a.id)}><i className="fas fa-trash"></i> Delete</button>
                    {a.status !== 'RESOLVED' && (
                      <>
                        <button className="btn btn-danger btn-sm" onClick={() => alert('Opening protocol...')}><i className="fas fa-play"></i> Protocol</button>
                        {a.status === 'NEW' && <button className="btn btn-success btn-sm" onClick={() => onAcknowledge(a.id)}><i className="fas fa-check"></i> Ack</button>}
                        {a.status === 'ACKNOWLEDGED' && <button className="btn btn-warning btn-sm" onClick={() => onResolve(a.id)}><i className="fas fa-check"></i> Resolve</button>}
                      </>
                    )}
                    {a.status === 'RESOLVED' && (
                      <button className="btn btn-success btn-sm" onClick={() => alert('Reopening case...')}><i className="fas fa-history"></i> Reopen</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination (info + next) */}
        <div className="pagination-bar">
          <div className="pagination-info">Page 1 of 1 · {alertList.length} alerts</div>
          <div className="pagination-controls">
            <span className="page-badge">1</span>
            <button className="btn page-next" onClick={() => alert('Next page')}>Next</button>
          </div>
        </div>
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="modal-backdrop" onKeyDown={(e)=>{ if(e.key==='Escape') setIsModalOpen(false); if(e.key==='Enter' && (e.metaKey||e.ctrlKey||!e.shiftKey)) { e.preventDefault(); saveForm(); } }} tabIndex={-1}>
            <div className="modal-card" role="dialog" aria-modal="true">
              <div className="modal-header">
                <h3>{editingId ? 'Edit Alert' : 'New Emergency Alert'}</h3>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <label>Title <span className="req">*</span></label>
                  <input type="text" value={form.title} onChange={onFormChange('title')} placeholder="e.g., Cardiac Emergency - John Davis" />
                  {errors.title && <small className="helper error">{errors.title}</small>}
                </div>
                <div className="form-grid">
                  <div className="form-row severity-row">
                    <label>Severity <span className="req">*</span></label>
                    <div className="segmented">
                      {['Critical','Warning','Info'].map(s => (
                        <button
                          type="button"
                          key={s}
                          className={`chip ${s.toLowerCase()} ${form.severity===s?'active':''}`}
                          aria-pressed={form.severity===s}
                          onClick={()=>setForm(f=>({...f, severity:s}))}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {errors.severity && <small className="helper error">{errors.severity}</small>}
                  </div>
                  <div className="form-row">
                    <label>Status</label>
                    <select value={form.status} onChange={onFormChange('status')}>
                      <option value="NEW">NEW</option>
                      <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-row">
                    <label>User</label>
                    <input type="text" value={form.user} onChange={onFormChange('user')} placeholder="e.g., John Davis (ID: CREW-045)" />
                  </div>
                  <div className="form-row">
                    <label>Location <span className="req">*</span></label>
                    <input type="text" value={form.location} onChange={onFormChange('location')} placeholder="e.g., Engine Room" />
                    {errors.location && <small className="helper error">{errors.location}</small>}
                    <div className="quick-pills">
                      {['Engine Room','Medical Bay','Bridge','Deck','Crew Quarters B'].map(loc => (
                        <button key={loc} type="button" className="chip sm" onClick={()=>setForm(f=>({...f, location:loc}))}>{loc}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Incident Type</label>
                    <select value={form.incidentType} onChange={onFormChange('incidentType')}>
                      <option>Medical</option>
                      <option>Trauma</option>
                      <option>Respiratory</option>
                      <option>Cardiac</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Auto-Notify Medical Team</label>
                    <div className="toggle">
                      <input id="notifyTeam" type="checkbox" checked={form.notifyTeam} onChange={(e)=>setForm(f=>({...f, notifyTeam:e.target.checked}))} />
                      <label htmlFor="notifyTeam">{form.notifyTeam ? 'Enabled' : 'Disabled'}</label>
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <textarea rows="4" value={form.description} onChange={onFormChange('description')} placeholder="Describe the emergency"></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveForm}>{editingId ? 'Save Changes' : 'Create Alert'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
