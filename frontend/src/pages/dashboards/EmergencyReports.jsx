import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../lib/token';
import EmergencySidebar from './EmergencySidebar';

export default function EmergencyReports() {
  const user = getUser();
  const navigate = useNavigate();

  const userFullName = user?.fullName || 'Emergency Officer';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Emergency Officer';
  const userVessel = user?.vessel || 'MV Ocean Explorer';
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=e63946&color=fff`;

  const [filters, setFilters] = useState({ type: 'All Reports', period: 'Last 24 Hours', from: '2023-10-01', to: '2023-10-26' });
  const [showModal, setShowModal] = useState(false);

  const templates = useMemo(() => ([
    { icon: 'fas fa-file-medical', title: 'Monthly Health Summary', desc: 'Comprehensive overview of crew health metrics, incidents, and response effectiveness for the month.', lastRun: 'Oct 25, 2023', formats: 'PDF, Excel' },
    { icon: 'fas fa-tachometer-alt', title: 'Response Time Analysis', desc: 'Detailed analysis of emergency response times with trends and improvement recommendations.', lastRun: 'Oct 24, 2023', formats: 'PDF, CSV' },
    { icon: 'fas fa-user-md', title: 'Medical Equipment Usage', desc: 'Report on medical equipment utilization, maintenance schedules, and replacement recommendations.', lastRun: 'Oct 20, 2023', formats: 'PDF, Excel' },
    { icon: 'fas fa-vial', title: 'Health Risk Assessment', desc: 'Assessment of health risks across crew members with preventive recommendations.', lastRun: 'Oct 15, 2023', formats: 'PDF' },
  ]), []);

  const recent = useMemo(() => ([
    { name: 'October Health Summary', type: 'Monthly Summary', time: 'Oct 26, 2023 08:30', status: 'Completed', format: 'PDF' },
    { name: 'Cardiac Incident Analysis', type: 'Incident Report', time: 'Oct 25, 2023 14:15', status: 'Completed', format: 'Excel' },
    { name: 'Response Time Q3 2023', type: 'Performance Report', time: 'Oct 24, 2023 11:45', status: 'Completed', format: 'PDF' },
    { name: 'Emergency Protocol Usage', type: 'Protocol Analysis', time: 'Oct 22, 2023 09:30', status: 'Completed', format: 'CSV' },
    { name: 'Crew Health Risk Assessment', type: 'Risk Analysis', time: 'Oct 23, 2023 16:20', status: 'Processing', format: 'PDF' },
  ]), []);

  const charts = [
    { title: 'Incidents by Type', content: 'Incident Type Chart - Cardiac: 35%, Respiratory: 25%, Trauma: 20%, Other: 20%' },
    { title: 'Response Time Trends', content: 'Response Time Chart - Improvement from 6.5min to 4.2min over last 30 days' },
    { title: 'Crew Health Status', content: 'Health Status Chart - Critical: 2%, Monitoring: 8%, Stable: 85%, Offline: 5%' },
    { title: 'Protocol Usage', content: 'Protocol Usage Chart - Cardiac: 45%, Respiratory: 30%, Evacuation: 15%, Other: 10%' },
  ];

  return (
    <div className="dashboard-container emergency-dashboard">
      <style>{`
        .header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding:18px 22px; background:#fff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .header h2{ color:#e63946; font-size:24px; font-weight:700; margin:0; }
        .user-info{ display:flex; align-items:center; gap:10px; }
        .user-info img{ width:40px; height:40px; border-radius:50%; margin-right:8px; }
        .user-info .meta{ display:flex; flex-direction:column; }
        .user-info .name{ color:#343a40; font-weight:600; line-height:1.2; }
        .user-info small{ color:#6c757d; }
        .status-badge{ padding:6px 12px; border-radius:9999px; font-size:12px; font-weight:600; margin-left:10px; border:1px solid rgba(230,57,70,.35); background:rgba(230,57,70,.12); color:#e63946; }

        .report-controls{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:20px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:15px; align-items:center; }
        .filter-group{ display:flex; flex-direction:column; }
        .filter-label{ font-size:14px; margin-bottom:5px; color:#666; font-weight:500; }
        .filter-select, .date-input{ padding:8px 12px; border:1px solid #ddd; border-radius:4px; background:#fff; }
        .date-range{ display:flex; gap:10px; align-items:center; }
        .btn{ padding:8px 15px; border:none; border-radius:4px; cursor:pointer; font-weight:500; transition:.3s; display:inline-flex; align-items:center; }
        .btn i{ margin-right:5px; }
        .btn-primary{ background:#e63946; color:#fff; }
        .btn-success{ background:#2a9d8f; color:#fff; }

        .report-stats{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px; }
        .stat-card{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:20px; text-align:center; transition:.3s; }
        .stat-card:hover{ transform: translateY(-5px); }
        .stat-icon{ width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; margin:0 auto 15px; color:#fff; }
        .incidents{ background:#e63946; } .response{ background:#e63946; } .resolved{ background:#2a9d8f; } .crew{ background:#3a86ff; }
        .stat-value{ font-size:32px; font-weight:700; margin-bottom:5px; }
        .stat-label{ font-size:14px; color:#777; }

        .charts-section{ display:grid; grid-template-columns:1fr 1fr; gap:25px; margin-bottom:30px; }
        .chart-card{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; }
        .chart-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .chart-title{ font-size:18px; font-weight:600; color:#e63946; }
        .chart-actions{ display:flex; gap:10px; }
        .chart-container{ height:300px; display:flex; align-items:center; justify-content:center; background:#f8f9fa; border-radius:8px; color:#666; font-weight:500; }

        .report-templates{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; margin-bottom:30px; }
        .section-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .section-title{ font-size:20px; font-weight:600; color:#e63946; }
        .templates-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px; }
        .template-card{ background:#f8f9fa; border-radius:8px; padding:20px; cursor:pointer; transition:.3s; border-left:4px solid #e63946; }
        .template-card:hover{ transform:translateY(-3px); box-shadow:0 3px 10px rgba(0,0,0,.1); }
        .template-icon{ width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:15px; color:#fff; background:#e63946; }
        .template-title{ font-weight:600; margin-bottom:8px; font-size:18px; }
        .template-desc{ font-size:14px; color:#666; margin-bottom:15px; }
        .template-meta{ display:flex; justify-content:space-between; font-size:12px; color:#999; }

        .recent-reports{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; }
        .reports-table{ width:100%; border-collapse:collapse; }
        .reports-table th, .reports-table td{ padding:12px 15px; text-align:left; border-bottom:1px solid #eee; }
        .reports-table th{ background:#f8f9fa; font-weight:600; color:#555; }
        .reports-table tr:hover{ background:#f8f9fa; }
        .report-status{ padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; }
        .status-completed{ background:rgba(42,157,143,.2); color:#2a9d8f; }
        .status-pending{ background:rgba(244,162,97,.2); color:#f4a261; }
        .status-failed{ background:rgba(230,57,70,.2); color:#e63946; }
        .report-format{ padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; background:#e3f2fd; color:#3a86ff; }

        .modal{ display:none; position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; align-items:center; justify-content:center; }
        .modal-content{ background:#fff; border-radius:10px; width:90%; max-width:600px; padding:30px; box-shadow:0 5px 25px rgba(0,0,0,.2); }
        .modal-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .modal-title{ font-size:20px; font-weight:600; color:#e63946; }
        .close-modal{ background:none; border:none; font-size:24px; cursor:pointer; color:#777; }
        .modal-body{ margin-bottom:25px; }
        .form-group{ margin-bottom:20px; }
        .form-label{ display:block; margin-bottom:8px; font-weight:500; }
        .form-control{ width:100%; padding:10px 15px; border:1px solid #ddd; border-radius:4px; font-size:14px; }
        .form-row{ display:flex; gap:15px; }
        .form-row .form-group{ flex:1; }
        .checkbox-group{ display:flex; flex-wrap:wrap; gap:15px; margin-top:10px; }
        .checkbox-item{ display:flex; align-items:center; }
        .checkbox-item input{ margin-right:8px; }
        .modal-footer{ display:flex; justify-content:flex-end; gap:10px; }

        @media (max-width:992px){ .dashboard-container{flex-direction:column;} .sidebar{width:100%; height:auto;} .sidebar-menu{display:flex; overflow-x:auto;} .sidebar-menu li{margin-bottom:0; margin-right:10px;} .sidebar-menu a{padding:10px 15px; border-left:none; border-bottom:3px solid transparent;} .sidebar-menu a:hover, .sidebar-menu a.active{border-left:none; border-bottom:3px solid #fff;} .charts-section{grid-template-columns:1fr;} }
        @media (max-width:768px){ .header{flex-direction:column; align-items:flex-start;} .user-info{margin-top:15px;} .report-controls{flex-direction:column; align-items:flex-start;} .filter-group, .filter-select{width:100%;} .date-range{width:100%; flex-direction:column;} .date-input{width:100%;} .report-stats{grid-template-columns:repeat(2, 1fr);} .templates-grid{grid-template-columns:1fr;} .reports-table{display:block; overflow-x:auto;} .form-row{flex-direction:column; gap:0;} }
        @media (max-width:480px){ .report-stats{grid-template-columns:1fr;} .chart-actions{flex-direction:column; gap:5px;} }
      `}</style>

      {/* Sidebar */}
      <EmergencySidebar onLogout={() => navigate('/')} />

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h2>Reports & Analytics</h2>
          <div className="user-info">
            <img src={userAvatarUrl} alt="User" />
            <div className="meta">
              <div className="name">{userFullName}</div>
              <small>{`${userRole} | ${userVessel}`}</small>
            </div>
            <div className="status-badge status-active">On Duty</div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="report-controls">
          <div className="filter-group">
            <label className="filter-label">Report Type</label>
            <select className="filter-select" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
              <option>All Reports</option>
              <option>Incident Reports</option>
              <option>Health Analytics</option>
              <option>Response Times</option>
              <option>Crew Health</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Time Period</label>
            <select className="filter-select" value={filters.period} onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value }))}>
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div className="date-range" style={{ display: filters.period === 'Custom Range' ? 'flex' : 'none' }}>
            <div className="filter-group"><label className="filter-label">From Date</label><input type="date" className="date-input" value={filters.from} onChange={(e) => setFilters((f)=>({ ...f, from: e.target.value }))} /></div>
            <div className="filter-group"><label className="filter-label">To Date</label><input type="date" className="date-input" value={filters.to} onChange={(e) => setFilters((f)=>({ ...f, to: e.target.value }))} /></div>
          </div>
          <button className="btn btn-primary" onClick={() => alert(`Generating ${filters.type} for ${filters.period}`)}><i className="fas fa-chart-bar" /> Generate Report</button>
          <button className="btn btn-success" onClick={() => setShowModal(true)}><i className="fas fa-plus" /> Create Custom Report</button>
        </div>

        {/* Report Stats */}
        <div className="report-stats">
          <div className="stat-card"><div className="stat-icon incidents"><i className="fas fa-exclamation-triangle" /></div><div className="stat-value">18</div><div className="stat-label">Total Incidents</div></div>
          <div className="stat-card"><div className="stat-icon response"><i className="fas fa-clock" /></div><div className="stat-value">4.2</div><div className="stat-label">Avg Response Time (min)</div></div>
          <div className="stat-card"><div className="stat-icon resolved"><i className="fas fa-check-circle" /></div><div className="stat-value">94%</div><div className="stat-label">Incidents Resolved</div></div>
          <div className="stat-card"><div className="stat-icon crew"><i className="fas fa-user-injured" /></div><div className="stat-value">12</div><div className="stat-label">Crew Treated</div></div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          {charts.map((c) => (
            <div key={c.title} className="chart-card">
              <div className="chart-header">
                <div className="chart-title">{c.title}</div>
                <div className="chart-actions">
                  <button className="btn btn-sm"><i className="fas fa-download" /></button>
                  <button className="btn btn-sm"><i className="fas fa-expand" /></button>
                </div>
              </div>
              <div className="chart-container">[{c.content}]</div>
            </div>
          ))}
        </div>

        {/* Report Templates */}
        <div className="report-templates">
          <div className="section-header">
            <div className="section-title">Report Templates</div>
            <button className="btn btn-primary"><i className="fas fa-plus" /> New Template</button>
          </div>
          <div className="templates-grid">
            {templates.map((t, i) => (
              <div key={i} className="template-card" onClick={() => alert(`Using template: ${t.title}`)}>
                <div className="template-icon"><i className={t.icon} /></div>
                <div className="template-title">{t.title}</div>
                <div className="template-desc">{t.desc}</div>
                <div className="template-meta"><span>Last run: {t.lastRun}</span><span>{t.formats}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="recent-reports">
          <div className="section-header">
            <div className="section-title">Recently Generated Reports</div>
            <button className="btn"><i className="fas fa-history" /> View All</button>
          </div>
          <table className="reports-table">
            <thead>
              <tr><th>Report Name</th><th>Type</th><th>Generated</th><th>Status</th><th>Format</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.time}</td>
                  <td><span className={`report-status ${r.status==='Completed'?'status-completed': r.status==='Processing'?'status-pending':'status-failed'}`}>{r.status}</span></td>
                  <td><span className="report-format">{r.format}</span></td>
                  <td>
                    {r.status==='Completed' ? (
                      <>
                        <button className="btn btn-primary btn-sm"><i className="fas fa-download" /></button>
                        <button className="btn btn-sm"><i className="fas fa-share" /></button>
                      </>
                    ) : (
                      <button className="btn btn-sm" disabled><i className="fas fa-sync fa-spin" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Report Modal */}
      <div className="modal" style={{ display: showModal ? 'flex' : 'none' }}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">Create Custom Report</div>
            <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Report Name</label><input type="text" className="form-control" placeholder="Enter report name" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Report Type</label><select className="form-control"><option>Incident Analysis</option><option>Health Metrics</option><option>Response Times</option><option>Equipment Usage</option><option>Custom Analysis</option></select></div>
              <div className="form-group"><label className="form-label">Output Format</label><select className="form-control"><option>PDF</option><option>Excel</option><option>CSV</option><option>HTML</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-control" defaultValue={filters.from} /></div>
              <div className="form-group"><label className="form-label">End Date</label><input type="date" className="form-control" defaultValue={filters.to} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Include Data</label>
              <div className="checkbox-group">
                {['Incident Records','Response Times','Vital Signs','Protocol Usage','Equipment Data'].map((lab) => (
                  <label key={lab} className="checkbox-item"><input type="checkbox" defaultChecked={['Incident Records','Response Times','Vital Signs'].includes(lab)} /> {lab}</label>
                ))}
              </div>
            </div>
            <div className="form-group"><label className="form-label">Email Report To</label><input type="text" className="form-control" placeholder="Enter email addresses (comma separated)" /></div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { alert('Custom report generation started...'); setShowModal(false); setTimeout(()=>alert('Custom report generated successfully!'), 1500); }}>Generate Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}
