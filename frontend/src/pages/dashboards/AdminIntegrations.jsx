import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { clearSession, getUser } from '../../lib/token';
import './adminIntegrations.css';

export default function AdminIntegrations() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [navigate]);

  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMonitorTab, setActiveMonitorTab] = useState('performance');
  const [activePage, setActivePage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [satellitePercent, setSatellitePercent] = useState(45.2);
  const [fleetStatus, setFleetStatus] = useState('Degraded');

  const onLogout = () => { clearSession(); navigate('/login'); };

  const onRefreshStatus = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      // Simulate satellite improving
      if (satellitePercent === 45.2) setSatellitePercent(62.8);
      alert('Integration status refreshed!');
    }, 2000);
  };

  const IntegrationCard = ({ name, badge, details, actions }) => (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-name">{name}</div>
        <div className={`integration-status-badge ${badge.className}`}>{badge.text}</div>
      </div>
      <div className="integration-details">
        {details.map(([label, value]) => (
          <div key={label} className="detail-item"><span className="detail-label">{label}:</span><span className="detail-value">{value}</span></div>
        ))}
      </div>
      <div className="integration-actions">
        {actions}
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard admin-integrations">
      <div className="dashboard-container">
        <AdminSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="header">
            <h2>Integrations Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin User')}&background=8338ec&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Sarah Johnson'}</div>
                <small>Administrator</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="integration-status">
            <div className="section-header">
              <div className="section-title">Integration Health Status</div>
              <button className="btn btn-primary" onClick={onRefreshStatus} disabled={refreshing}>
                {refreshing ? (<><i className="fas fa-spinner fa-spin"></i> Refreshing...</>) : (<><i className="fas fa-sync"></i> Refresh Status</>)}
              </button>
            </div>
            <div className="status-grid">
              <div className="status-card">
                <div className="status-icon healthy"><i className="fas fa-barcode"></i></div>
                <div className="status-name">Barcode Scanners</div>
                <div className="status-value">98.7%</div>
                <div className="status-desc">Uptime & Connectivity</div>
              </div>
              <div className="status-card">
                <div className="status-icon healthy"><i className="fas fa-stethoscope"></i></div>
                <div className="status-name">Telemedicine APIs</div>
                <div className="status-value">99.2%</div>
                <div className="status-desc">Response Time & Availability</div>
              </div>
              <div className="status-card">
                <div className="status-icon warning"><i className="fas fa-ship"></i></div>
                <div className="status-name">Fleet Communication</div>
                <div className="status-value">87.5%</div>
                <div className="status-desc">Signal Strength & Latency</div>
              </div>
              <div className="status-card">
                <div className="status-icon healthy"><i className="fas fa-cloud"></i></div>
                <div className="status-name">Cloud Storage</div>
                <div className="status-value">100%</div>
                <div className="status-desc">Sync Status & Availability</div>
              </div>
              <div className="status-card">
                <div className="status-icon healthy"><i className="fas fa-database"></i></div>
                <div className="status-name">Health Monitoring</div>
                <div className="status-value">99.8%</div>
                <div className="status-desc">Device Connectivity</div>
              </div>
              <div className="status-card">
                <div className={`status-icon ${satellitePercent >= 60 ? 'warning' : 'error'}`}><i className="fas fa-satellite-dish"></i></div>
                <div className="status-name">Satellite Comms</div>
                <div className="status-value">{satellitePercent}%</div>
                <div className="status-desc">Weather Impacted</div>
              </div>
            </div>
          </div>

          {/* Active Integrations */}
          <div className="active-integrations">
            <div className="integrations-header">
              <div className="section-title">Active Integrations</div>
              <div className="search-box">
                <input type="text" className="search-input" placeholder="Search integrations..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
                <button className="btn btn-primary" onClick={() => { if (searchTerm) alert(`Searching integrations for: "${searchTerm}"`); else alert('Please enter a search term'); }}><i className="fas fa-search"></i> Search</button>
                <button className="btn btn-success" onClick={() => setModalOpen(true)} id="addIntegrationBtn"><i className="fas fa-plus"></i> Add Integration</button>
              </div>
            </div>
            <div className="integrations-grid">
              <IntegrationCard
                name="Barcode Scanner API"
                badge={{ text: 'Active', className: 'status-active' }}
                details={[['Type','Inventory Management'],['Provider','Zebra Technologies'],['Last Sync','2 minutes ago'],['Devices','8 connected']]}
                actions={
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Configuring integration: Barcode Scanner API')}><i className="fas fa-cog"></i> Configure</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert('Viewing metrics for: Barcode Scanner API')}><i className="fas fa-chart-bar"></i> Metrics</button>
                    <button className="btn btn-warning btn-sm" onClick={() => { if (window.confirm('Disable integration: Barcode Scanner API?')) alert('Integration Barcode Scanner API disabled.'); }}><i className="fas fa-pause"></i> Disable</button>
                  </>
                }
              />

              <IntegrationCard
                name="Telemedicine Platform"
                badge={{ text: 'Active', className: 'status-active' }}
                details={[['Type','Medical Services'],['Provider','MedConnect API'],['Last Sync','5 minutes ago'],['Sessions','24 active']]}
                actions={
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Configuring integration: Telemedicine Platform')}><i className="fas fa-cog"></i> Configure</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert('Viewing metrics for: Telemedicine Platform')}><i className="fas fa-chart-bar"></i> Metrics</button>
                    <button className="btn btn-warning btn-sm" onClick={() => { if (window.confirm('Disable integration: Telemedicine Platform?')) alert('Integration Telemedicine Platform disabled.'); }}><i className="fas fa-pause"></i> Disable</button>
                  </>
                }
              />

              <IntegrationCard
                name="Fleet Communication"
                badge={{ text: fleetStatus, className: fleetStatus === 'Degraded' ? 'status-warning' : 'status-active' }}
                details={[['Type','Inter-ship Comms'],['Provider','Maritime SatCom'],['Last Sync','15 minutes ago'],['Vessels','3 of 4 connected']]}
                actions={
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Configuring integration: Fleet Communication')}><i className="fas fa-cog"></i> Configure</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert('Viewing metrics for: Fleet Communication')}><i className="fas fa-chart-bar"></i> Metrics</button>
                    <button className="btn btn-warning btn-sm" onClick={() => { alert('Retrying connection for: Fleet Communication'); setFleetStatus('Active'); }}><i className="fas fa-redo"></i> Retry</button>
                  </>
                }
              />

              <IntegrationCard
                name="Health Monitor Devices"
                badge={{ text: 'Active', className: 'status-active' }}
                details={[['Type','Medical IoT'],['Provider','BioSense Systems'],['Last Sync','30 seconds ago'],['Devices','42 connected']]}
                actions={
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Configuring integration: Health Monitor Devices')}><i className="fas fa-cog"></i> Configure</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert('Viewing metrics for: Health Monitor Devices')}><i className="fas fa-chart-bar"></i> Metrics</button>
                    <button className="btn btn-warning btn-sm" onClick={() => { if (window.confirm('Disable integration: Health Monitor Devices?')) alert('Integration Health Monitor Devices disabled.'); }}><i className="fas fa-pause"></i> Disable</button>
                  </>
                }
              />

              <IntegrationCard
                name="Satellite Communication"
                badge={{ text: 'Offline', className: 'status-error' }}
                details={[['Type','Global Comms'],['Provider','GlobalStar Network'],['Last Sync','2 hours ago'],['Status','Weather disruption']]}
                actions={
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Configuring integration: Satellite Communication')}><i className="fas fa-cog"></i> Configure</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert('Viewing metrics for: Satellite Communication')}><i className="fas fa-chart-bar"></i> Metrics</button>
                    <button className="btn btn-success btn-sm" onClick={() => alert('Enabling integration: Satellite Communication')}><i className="fas fa-play"></i> Enable</button>
                  </>
                }
              />

              <IntegrationCard
                name="Cloud Backup Service"
                badge={{ text: 'Active', className: 'status-active' }}
                details={[['Type','Data Storage'],['Provider','AWS S3'],['Last Sync','4 hours ago'],['Storage','1.2 TB used']]}
                actions={
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Configuring integration: Cloud Backup Service')}><i className="fas fa-cog"></i> Configure</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert('Viewing metrics for: Cloud Backup Service')}><i className="fas fa-chart-bar"></i> Metrics</button>
                    <button className="btn btn-warning btn-sm" onClick={() => { if (window.confirm('Disable integration: Cloud Backup Service?')) alert('Integration Cloud Backup Service disabled.'); }}><i className="fas fa-pause"></i> Disable</button>
                  </>
                }
              />
            </div>
            <div className="pagination">
              <div className="pagination-info">Showing 1-6 of 12 integrations</div>
              <div className="pagination-controls">
                {[1,2].map(p => (
                  <button key={p} className={`page-btn ${activePage===p?'active':''}`} onClick={() => { setActivePage(p); alert(`Loading page ${p}...`); }}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => { setActivePage(p => Math.min(p+1, 2)); alert('Loading next page...'); }}>Next</button>
              </div>
            </div>
          </div>

          {/* API Monitoring */}
          <div className="api-monitoring">
            <div className="section-header">
              <div className="section-title">API Performance Monitoring</div>
              <button className="btn btn-primary" onClick={() => { alert('Exporting API performance metrics...'); setTimeout(()=>alert('Metrics exported successfully!'), 1500); }}><i className="fas fa-download"></i> Export Metrics</button>
            </div>

            <div className="monitoring-tabs">
              {['performance','errors','usage'].map(tab => (
                <div key={tab} className={`monitoring-tab ${activeMonitorTab===tab?'active':''}`} onClick={() => setActiveMonitorTab(tab)} data-tab={tab}>
                  {tab === 'performance' ? 'Performance' : tab === 'errors' ? 'Error Rates' : 'Usage Analytics'}
                </div>
              ))}
            </div>

            {activeMonitorTab === 'performance' && (
              <div className="monitoring-content active" id="performance-content">
                <div className="api-stats">
                  <div className="api-stat-card"><div className="api-stat-value">98.7%</div><div className="api-stat-label">Average Uptime</div></div>
                  <div className="api-stat-card"><div className="api-stat-value">142 ms</div><div className="api-stat-label">Avg Response Time</div></div>
                  <div className="api-stat-card"><div className="api-stat-value">2.4K</div><div className="api-stat-label">Requests/Minute</div></div>
                  <div className="api-stat-card"><div className="api-stat-value">0.12%</div><div className="api-stat-label">Error Rate</div></div>
                </div>
                <table className="api-table">
                  <thead><tr><th>API Endpoint</th><th>Status</th><th>Response Time</th><th>Requests (24h)</th><th>Last Check</th><th>Actions</th></tr></thead>
                  <tbody>
                    <tr>
                      <td>/api/inventory/scan</td>
                      <td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td>
                      <td><span className="response-time time-fast">89 ms</span></td>
                      <td>1,248</td>
                      <td>Just now</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => alert('Viewing performance charts for: /api/inventory/scan')}><i className="fas fa-chart-line"></i></button>
                        <button className="btn btn-info btn-sm" onClick={() => alert('Viewing request history for: /api/inventory/scan')}><i className="fas fa-history"></i></button>
                      </td>
                    </tr>
                    <tr>
                      <td>/api/medical/records</td>
                      <td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td>
                      <td><span className="response-time time-fast">124 ms</span></td>
                      <td>892</td>
                      <td>2 minutes ago</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => alert('Viewing performance charts for: /api/medical/records')}><i className="fas fa-chart-line"></i></button>
                        <button className="btn btn-info btn-sm" onClick={() => alert('Viewing request history for: /api/medical/records')}><i className="fas fa-history"></i></button>
                      </td>
                    </tr>
                    <tr>
                      <td>/api/fleet/communication</td>
                      <td><i className="fas fa-exclamation-triangle" style={{ color: 'var(--warning)' }}></i></td>
                      <td><span className="response-time time-slow">1.2 s</span></td>
                      <td>156</td>
                      <td>5 minutes ago</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => alert('Viewing performance charts for: /api/fleet/communication')}><i className="fas fa-chart-line"></i></button>
                        <button className="btn btn-warning btn-sm" onClick={() => alert('Retrying connection for: /api/fleet/communication')}><i className="fas fa-redo"></i></button>
                      </td>
                    </tr>
                    <tr>
                      <td>/api/health/monitoring</td>
                      <td><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i></td>
                      <td><span className="response-time time-medium">456 ms</span></td>
                      <td>2,841</td>
                      <td>1 minute ago</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => alert('Viewing performance charts for: /api/health/monitoring')}><i className="fas fa-chart-line"></i></button>
                        <button className="btn btn-info btn-sm" onClick={() => alert('Viewing request history for: /api/health/monitoring')}><i className="fas fa-history"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System Health */}
          <div className="system-health">
            <div className="section-header">
              <div className="section-title">System Health & Resources</div>
              <button className="btn btn-primary" onClick={(e) => { const el = e.currentTarget; const t = el.innerHTML; el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...'; setTimeout(()=>{ el.innerHTML = t; alert('System diagnostics completed! All systems operational.'); }, 3000); }}><i className="fas fa-heartbeat"></i> Run Diagnostics</button>
            </div>
            <div className="health-grid">
              <div className="health-card">
                <div className="health-icon"><i className="fas fa-database"></i></div>
                <div className="health-title">Database Storage</div>
                <div className="health-desc">Current database usage and capacity</div>
                <div className="health-meta">78% used • 450 GB / 576 GB</div>
                <div className="integration-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => alert('Expanding capacity for: Database Storage')}><i className="fas fa-expand"></i> Expand</button>
                  <button className="btn btn-info btn-sm" onClick={() => alert('Analyzing storage for: Database Storage')}><i className="fas fa-chart-pie"></i> Analyze</button>
                </div>
              </div>
              <div className="health-card">
                <div className="health-icon"><i className="fas fa-server"></i></div>
                <div className="health-title">API Server Load</div>
                <div className="health-desc">Current server performance metrics</div>
                <div className="health-meta">CPU: 68% • Memory: 72%</div>
                <div className="integration-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => alert('Optimizing performance for: API Server Load')}><i className="fas fa-tachometer-alt"></i> Optimize</button>
                  <button className="btn btn-info btn-sm" onClick={() => alert('Opening monitoring for: API Server Load')}><i className="fas fa-chart-line"></i> Monitor</button>
                </div>
              </div>
              <div className="health-card">
                <div className="health-icon warning"><i className="fas fa-network-wired"></i></div>
                <div className="health-title">Network Latency</div>
                <div className="health-desc">Connection quality to external services</div>
                <div className="health-meta">Avg: 142ms • Peak: 2.1s</div>
                <div className="integration-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => alert('Testing network for: Network Latency')}><i className="fas fa-wifi"></i> Test</button>
                  <button className="btn btn-warning btn-sm" onClick={() => alert('Boosting performance for: Network Latency')}><i className="fas fa-bolt"></i> Boost</button>
                </div>
              </div>
              <div className="health-card">
                <div className="health-icon"><i className="fas fa-shield-alt"></i></div>
                <div className="health-title">Security Status</div>
                <div className="health-desc">Integration security and compliance</div>
                <div className="health-meta">All APIs Secured • TLS 1.3</div>
                <div className="integration-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => alert('Running security audit for: Security Status')}><i className="fas fa-lock"></i> Audit</button>
                  <button className="btn btn-info btn-sm" onClick={() => alert('Enhancing security for: Security Status')}><i className="fas fa-shield-alt"></i> Protect</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Integration Modal */}
      <div className={`modal ${modalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal')) setModalOpen(false); }}>
        <div className="modal-content" id="addIntegrationModal">
          <div className="modal-header">
            <div className="modal-title">Add New Integration</div>
            <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Integration Type</label>
              <select className="form-control" defaultValue="Select Integration Type">
                <option>Select Integration Type</option>
                <option>Barcode Scanner</option>
                <option>Telemedicine API</option>
                <option>Fleet Communication</option>
                <option>Health Monitoring</option>
                <option>Cloud Storage</option>
                <option>Satellite Communication</option>
                <option>Custom API</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Integration Name</label>
              <input type="text" className="form-control" placeholder="Enter integration name" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">API Endpoint</label>
                <input type="text" className="form-control" placeholder="https://api.example.com/v1" />
              </div>
              <div className="form-group">
                <label className="form-label">API Version</label>
                <input type="text" className="form-control" placeholder="v1.2" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input type="password" className="form-control" placeholder="Enter API key" />
              </div>
              <div className="form-group">
                <label className="form-label">Secret Key</label>
                <input type="password" className="form-control" placeholder="Enter secret key" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Security Settings</label>
              <div className="checkbox-group">
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Encrypt Data Transfer</label>
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Verify SSL Certificate</label>
                <label className="checkbox-item"><input type="checkbox" /> Enable Rate Limiting</label>
                <label className="checkbox-item"><input type="checkbox" /> Backup Connection</label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Monitoring Settings</label>
              <div className="checkbox-group">
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Monitor Uptime</label>
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Alert on Errors</label>
                <label className="checkbox-item"><input type="checkbox" /> Log All Requests</label>
                <label className="checkbox-item"><input type="checkbox" defaultChecked /> Track Performance</label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Additional Configuration</label>
              <textarea className="form-control" rows={3} placeholder="Any additional configuration notes..."></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { const el = document.querySelector('.modal-body input[type="text"]'); const name = el ? el.value : ''; if (name.trim()) { alert(`Integration "${name}" added successfully!`); setModalOpen(false); setTimeout(() => alert('Integration configured and initializing...'), 1000); } else { alert('Please enter an integration name'); } }}>Add Integration</button>
          </div>
        </div>
      </div>
    </div>
  );
}
