import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { clearSession, getUser } from '../../lib/token';
import './adminSystemConfiguration.css';

export default function AdminSystemConfiguration() {
  const navigate = useNavigate();
  const user = getUser();

  // Auto logout after inactivity (match other admin pages)
  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [navigate]);

  const [activeTab, setActiveTab] = useState('health');
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ensure modal starts closed on mount (guards against HMR/state persistence)
  useEffect(() => {
    setHealthModalOpen(false);
  }, []);

  // Demo data / states
  const [storagePercent, setStoragePercent] = useState(78);
  const [statusIcons, setStatusIcons] = useState([
    { kind: 'healthy' }, { kind: 'healthy' }, { kind: 'warning' }, { kind: 'healthy' }, { kind: 'healthy' }, { kind: 'healthy' }
  ]);

  // Simulate periodic status changes
  useEffect(() => {
    const id = setInterval(() => {
      setStatusIcons(prev => prev.map(icon => {
        if (icon.kind === 'healthy' && Math.random() > 0.95) return { kind: 'warning' };
        return icon;
      }));
    }, 45000);
    return () => clearInterval(id);
  }, []);

  const onLogout = () => { clearSession(); navigate('/login'); };

  // Handlers similar to the provided HTML's script
  const onRefreshStatus = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      // simulate storage increase
      setStoragePercent(p => (p === 78 ? 79 : p));
      alert('System status refreshed!');
    }, 2000);
  };

  const onSaveAll = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('All system configuration changes saved successfully!');
    }, 1500);
  };

  const handleAction = (action) => {
    if (action === 'Run Backup Now') {
      if (window.confirm('Start immediate system backup?')) {
        alert('Starting backup process...');
        setTimeout(() => alert('Backup completed successfully!'), 3000);
      }
    } else if (action === 'Clear Cache') {
      alert('Clearing system cache...');
      setTimeout(() => alert('Cache cleared successfully!'), 1500);
    } else if (action === 'System Diagnostics') {
      alert('Running system diagnostics...');
      setTimeout(() => alert('Diagnostics completed. All systems operational.'), 2000);
    } else if (action === 'Restart Services') {
      if (window.confirm('Restart all system services? This may cause brief downtime.')) {
        alert('Restarting services...');
        setTimeout(() => alert('Services restarted successfully!'), 2500);
      }
    } else if (action === 'Export Config') {
      alert('Exporting system configuration...');
      setTimeout(() => alert('Configuration exported successfully!'), 1500);
    } else if (action === 'Emergency Mode') {
      if (window.confirm('ACTIVATE EMERGENCY MODE? This will override normal operations.')) {
        alert('EMERGENCY MODE ACTIVATED! All systems in emergency protocol.');
      }
    }
  };

  const StatusCard = ({ iconClass, name, value, desc, idx }) => (
    <div className="status-card">
      <div className={`status-icon ${statusIcons[idx]?.kind || 'healthy'}`}>
        <i className={iconClass}></i>
      </div>
      <div className="status-name">{name}</div>
      <div className="status-value">{value}</div>
      <div className="status-desc">{desc}</div>
    </div>
  );

  return (
    <div className="admin-dashboard admin-system-config">
      <div className="dashboard-container">
        <AdminSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="header">
            <h2>System Configuration</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin User')}&background=8338ec&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Sarah Johnson'}</div>
                <small>Administrator</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* System Status */}
          <div className="system-status">
            <div className="section-header">
              <div className="section-title">System Health & Status</div>
              <button className="btn btn-primary" onClick={onRefreshStatus} disabled={refreshing}>
                {refreshing ? (<><i className="fas fa-spinner fa-spin"></i> Refreshing...</>) : (<><i className="fas fa-sync"></i> Refresh Status</>)}
              </button>
            </div>
            <div className="status-grid">
              <StatusCard idx={0} iconClass="fas fa-database" name="Database" value="98.7%" desc="Uptime & Performance" />
              <StatusCard idx={1} iconClass="fas fa-server" name="API Services" value="99.2%" desc="Response Time & Availability" />
              <StatusCard idx={2} iconClass="fas fa-hdd" name="Storage" value={`${storagePercent}%`} desc="Disk Space Used" />
              <StatusCard idx={3} iconClass="fas fa-network-wired" name="Network" value="100%" desc="Connectivity & Bandwidth" />
              <StatusCard idx={4} iconClass="fas fa-shield-alt" name="Security" value="Active" desc="All Systems Secured" />
              <StatusCard idx={5} iconClass="fas fa-cloud" name="Backups" value="Current" desc="Last backup: 2 hours ago" />
            </div>
          </div>

          {/* Configuration Tabs */}
          <div className="configuration-tabs">
            <div className="tabs-header">
              <div className={`config-tab ${activeTab==='health'?'active':''}`} onClick={() => setActiveTab('health')} data-tab="health">Health Monitoring</div>
              <div className={`config-tab ${activeTab==='backup'?'active':''}`} onClick={() => setActiveTab('backup')} data-tab="backup">Backup Settings</div>
              <div className={`config-tab ${activeTab==='alerts'?'active':''}`} onClick={() => setActiveTab('alerts')} data-tab="alerts">Alert Systems</div>
              <div className={`config-tab ${activeTab==='integrations'?'active':''}`} onClick={() => setActiveTab('integrations')} data-tab="integrations">Integrations</div>
            </div>

            {/* Health Monitoring */}
            <div className={`tab-content ${activeTab==='health'?'active':''}`} id="health-content">
              <div className="health-config">
                <div className="config-title">Health Monitoring Thresholds</div>
                <div className="config-grid">
                  {/* Heart Rate */}
                  <div className="config-card">
                    <div className="config-header">
                      <div className="config-name">Heart Rate Monitoring</div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked onChange={(e) => { e.target.closest('.config-card').style.borderLeftColor = e.target.checked ? 'var(--success)' : 'var(--primary)'; }} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Critical Threshold:</span><span className="detail-value">&gt; 120 BPM for 10 min</span></div>
                      <div className="detail-item"><span className="detail-label">Warning Threshold:</span><span className="detail-value">&gt; 100 BPM for 30 min</span></div>
                      <div className="detail-item"><span className="detail-label">Action:</span><span className="detail-value">Trigger SOS Alert</span></div>
                    </div>
                    <div className="config-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => setHealthModalOpen(true)}><i className="fas fa-edit"></i> Configure</button>
                      <button className="btn btn-info btn-sm" onClick={() => alert('Testing alert for: Heart Rate Monitoring')}><i className="fas fa-bell"></i> Test Alert</button>
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="config-card">
                    <div className="config-header">
                      <div className="config-name">Blood Pressure Alerts</div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked onChange={(e) => { e.target.closest('.config-card').style.borderLeftColor = e.target.checked ? 'var(--success)' : 'var(--primary)'; }} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Systolic Critical:</span><span className="detail-value">&gt; 180 mmHg</span></div>
                      <div className="detail-item"><span className="detail-label">Diastolic Critical:</span><span className="detail-value">&gt; 120 mmHg</span></div>
                      <div className="detail-item"><span className="detail-label">Notification:</span><span className="detail-value">Immediate Alert</span></div>
                    </div>
                    <div className="config-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => setHealthModalOpen(true)}><i className="fas fa-edit"></i> Configure</button>
                      <button className="btn btn-info btn-sm" onClick={() => alert('Testing alert for: Blood Pressure Alerts')}><i className="fas fa-bell"></i> Test Alert</button>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="config-card">
                    <div className="config-header">
                      <div className="config-name">Temperature Monitoring</div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked onChange={(e) => { e.target.closest('.config-card').style.borderLeftColor = e.target.checked ? 'var(--success)' : 'var(--primary)'; }} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Fever Threshold:</span><span className="detail-value">&gt; 39°C (102.2°F)</span></div>
                      <div className="detail-item"><span className="detail-label">Hypothermia:</span><span className="detail-value">&lt; 35°C (95°F)</span></div>
                      <div className="detail-item"><span className="detail-label">Action:</span><span className="detail-value">Medical Alert</span></div>
                    </div>
                    <div className="config-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => setHealthModalOpen(true)}><i className="fas fa-edit"></i> Configure</button>
                      <button className="btn btn-info btn-sm" onClick={() => alert('Testing alert for: Temperature Monitoring')}><i className="fas fa-bell"></i> Test Alert</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup Settings Tab */}
            <div className={`tab-content ${activeTab==='backup'?'active':''}`} id="backup-content">
              <div className="health-config">
                <div className="config-title">Automated Backup Configuration</div>

                <div className="backup-schedule">
                  <div className="schedule-header">
                    <div className="schedule-title">Backup Schedules</div>
                    <button className="btn btn-success btn-sm" onClick={() => alert('Opening backup schedule creation...')}><i className="fas fa-plus"></i> Add Schedule</button>
                  </div>
                  <div className="schedule-grid">
                    {[
                      { name: 'Health Data', freq: 'Every 4 hours', retention: '90 days', lastRun: '2 hours ago' },
                      { name: 'Inventory Data', freq: 'Daily at 02:00', retention: '1 year', lastRun: 'Yesterday' },
                      { name: 'System Config', freq: 'Weekly', retention: 'Permanent', lastRun: '3 days ago' }
                    ].map(s => (
                      <div key={s.name} className="schedule-card">
                        <div className="schedule-name">{s.name}</div>
                        <div className="schedule-details">
                          <div>Frequency: {s.freq}</div>
                          <div>Retention: {s.retention}</div>
                          <div>Last Run: {s.lastRun}</div>
                        </div>
                        <div className="config-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => alert(`Edit schedule: ${s.name}`)}><i className="fas fa-edit"></i></button>
                          <button className="btn btn-info btn-sm" onClick={() => alert(`Running backup: ${s.name}`)}><i className="fas fa-play"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="config-grid">
                  <div className="config-card">
                    <div className="config-header">
                      <div className="config-name">Backup Encryption</div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked onChange={(e) => { e.target.closest('.config-card').style.borderLeftColor = e.target.checked ? 'var(--success)' : 'var(--primary)'; }} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Encryption:</span><span className="detail-value">AES-256</span></div>
                      <div className="detail-item"><span className="detail-label">Key Rotation:</span><span className="detail-value">90 days</span></div>
                    </div>
                    <div className="config-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Configure backup encryption')}><i className="fas fa-edit"></i> Configure</button>
                    </div>
                  </div>

                  <div className="config-card">
                    <div className="config-header">
                      <div className="config-name">Cloud Backup</div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked onChange={(e) => { e.target.closest('.config-card').style.borderLeftColor = e.target.checked ? 'var(--success)' : 'var(--primary)'; }} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Provider:</span><span className="detail-value">AWS S3</span></div>
                      <div className="detail-item"><span className="detail-label">Region:</span><span className="detail-value">eu-west-1</span></div>
                    </div>
                    <div className="config-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Configure cloud backup')}><i className="fas fa-edit"></i> Configure</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Systems Tab */}
            <div className={`tab-content ${activeTab==='alerts'?'active':''}`} id="alerts-content">
              <div className="health-config">
                <div className="config-title">Alert & Notification Systems</div>

                <div className="alert-config">
                  <div className="alert-header">
                    <div className="alert-title">Emergency Notifications</div>
                    <button className="btn btn-success btn-sm" onClick={() => alert('Opening alert channel configuration...')}><i className="fas fa-plus"></i> Add Channel</button>
                  </div>
                  <div className="alert-grid">
                    {[
                      { name: 'SMS Alerts', status: 'Active', priority: 'Critical Only', extra: 'Recipients: 8 users' },
                      { name: 'Email Notifications', status: 'Active', priority: 'All Alerts', extra: 'Recipients: 24 users' },
                      { name: 'In-app Alerts', status: 'Active', priority: 'All Events', extra: 'Users: All' }
                    ].map(a => (
                      <div key={a.name} className="alert-card">
                        <div className="alert-name">{a.name}</div>
                        <div className="alert-details">
                          <div>Status: {a.status}</div>
                          <div>Priority: {a.priority}</div>
                          <div>{a.extra}</div>
                        </div>
                        <div className="config-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => alert(`Edit: ${a.name}`)}><i className="fas fa-edit"></i></button>
                          <button className="btn btn-info btn-sm" onClick={() => alert(`Test: ${a.name}`)}><i className="fas fa-bell"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="config-grid">
                  <div className="config-card">
                    <div className="config-header">
                      <div className="config-name">Audit Alerting</div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked onChange={(e) => { e.target.closest('.config-card').style.borderLeftColor = e.target.checked ? 'var(--success)' : 'var(--primary)'; }} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">Security Events:</span><span className="detail-value">Immediate</span></div>
                      <div className="detail-item"><span className="detail-label">System Events:</span><span className="detail-value">Daily Digest</span></div>
                    </div>
                    <div className="config-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Configure audit alerting')}><i className="fas fa-edit"></i> Configure</button>
                    </div>
                  </div>

                  <div className="config-card">
                    <div className="config-header">
                      <div className="config-name">Performance Alerts</div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked onChange={(e) => { e.target.closest('.config-card').style.borderLeftColor = e.target.checked ? 'var(--success)' : 'var(--primary)'; }} />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="config-details">
                      <div className="detail-item"><span className="detail-label">CPU Threshold:</span><span className="detail-value">&gt; 80% for 5 min</span></div>
                      <div className="detail-item"><span className="detail-label">Memory Threshold:</span><span className="detail-value">&gt; 85% for 5 min</span></div>
                    </div>
                    <div className="config-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Configure performance alerts')}><i className="fas fa-edit"></i> Configure</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Actions */}
          <div className="system-actions">
            <div className="section-header">
              <div className="section-title">System Maintenance Actions</div>
              <button className="btn btn-primary" onClick={onSaveAll} disabled={saving}>
                {saving ? (<><i className="fas fa-spinner fa-spin"></i> Saving...</>) : (<><i className="fas fa-save"></i> Save All Changes</>)}
              </button>
            </div>
            <div className="actions-grid">
              {[
                { icon: 'fas fa-database', title: 'Run Backup Now', desc: 'Create immediate system backup' },
                { icon: 'fas fa-sync', title: 'Clear Cache', desc: 'Refresh system cache' },
                { icon: 'fas fa-search', title: 'System Diagnostics', desc: 'Run comprehensive system check' },
                { icon: 'fas fa-power-off', title: 'Restart Services', desc: 'Graceful service restart', iconClass: 'action-icon warning' },
                { icon: 'fas fa-file-export', title: 'Export Config', desc: 'Download system configuration' },
                { icon: 'fas fa-exclamation-triangle', title: 'Emergency Mode', desc: 'Activate emergency protocols', danger: true }
              ].map(({ icon, title, desc, iconClass, danger }) => (
                <div key={title} className={`action-card ${danger ? 'danger' : ''}`} onClick={() => handleAction(title)}>
                  <div className={iconClass || 'action-icon'}>
                    <i className={icon}></i>
                  </div>
                  <div className="action-title">{title}</div>
                  <div className="action-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Health Threshold Modal */}
      <div className={`modal ${healthModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal')) setHealthModalOpen(false); }}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">Configure Health Threshold</div>
            <button className="close-modal" onClick={() => setHealthModalOpen(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Monitoring Type</label>
              <select className="form-control" defaultValue="Heart Rate">
                <option>Heart Rate</option>
                <option>Blood Pressure</option>
                <option>Temperature</option>
                <option>Respiratory Rate</option>
                <option>Oxygen Saturation</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Critical Threshold</label>
                <input type="text" className="form-control" placeholder="e.g., > 120 BPM" />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input type="text" className="form-control" placeholder="e.g., 10 minutes" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Warning Threshold</label>
                <input type="text" className="form-control" placeholder="e.g., > 100 BPM" />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input type="text" className="form-control" placeholder="e.g., 30 minutes" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Alert Actions</label>
              <div className="checkbox-group">
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Trigger SOS Alert</label>
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Notify Medical Staff</label>
                <label className="checkbox-item"><input type="checkbox" /> Send SMS Alert</label>
                <label className="checkbox-item"><input type="checkbox" /> Log Incident</label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Escalation Protocol</label>
              <select className="form-control" defaultValue="Immediate Medical Response">
                <option>Immediate Medical Response</option>
                <option>Notify Senior Medical Officer</option>
                <option>Emergency Protocol Activation</option>
                <option>Standard Medical Review</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setHealthModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { alert('Health threshold configuration saved!'); setHealthModalOpen(false); }}>Save Configuration</button>
          </div>
        </div>
      </div>
    </div>
  );
}
