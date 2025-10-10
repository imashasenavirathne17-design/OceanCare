import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryReports.css';

export default function InventoryReports() {
  const user = getUser();
  const navigate = useNavigate();
  const onLogout = () => { clearSession(); navigate('/login'); };

  // Filters
  const [reportType, setReportType] = useState('All Reports');
  const [timePeriod, setTimePeriod] = useState('Last 24 Hours');
  const [fromDate, setFromDate] = useState('2023-10-01');
  const [toDate, setToDate] = useState('2023-10-26');

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Custom report form
  const [customForm, setCustomForm] = useState({
    name: '',
    type: 'Stock Analysis',
    format: 'PDF',
    start: '2023-10-01',
    end: '2023-10-26',
    include: {
      stockLevels: true,
      usageData: true,
      expiryInfo: true,
      disposalRecords: false,
      zoneData: false,
    },
    emailTo: '',
    schedule: 'Run once',
  });

  // Sample dynamic stats
  const [stats, setStats] = useState({
    totalItems: 142,
    usedThisMonth: 87,
    expiringSoon: 23,
    disposed: 15,
  });

  // Simulate small realtime fluctuations
  useEffect(() => {
    const t = setInterval(() => {
      const fluctuations = [-2, -1, 0, 1, 2];
      const delta = fluctuations[Math.floor(Math.random() * fluctuations.length)];
      setStats((s) => ({
        ...s,
        usedThisMonth: Math.max(0, s.usedThisMonth + delta),
        expiringSoon: Math.max(0, s.expiringSoon + delta),
      }));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const recentReports = useMemo(() => [
    { name: 'October Inventory Summary', type: 'Monthly Summary', ts: 'Oct 26, 2023 08:30', status: 'completed', format: 'PDF' },
    { name: 'Q3 Usage Analytics', type: 'Analytics Report', ts: 'Oct 25, 2023 14:15', status: 'completed', format: 'Excel' },
    { name: 'Expiry Alert Report', type: 'Expiry Management', ts: 'Oct 24, 2023 11:45', status: 'completed', format: 'PDF' },
    { name: 'Disposal Audit Q3 2023', type: 'Audit Report', ts: 'Oct 23, 2023 16:20', status: 'pending', format: 'PDF' },
    { name: 'Storage Zone Analysis', type: 'Zone Report', ts: 'Oct 22, 2023 09:30', status: 'completed', format: 'CSV' },
  ], []);

  const onGenerateReport = () => {
    alert(`Generating ${reportType} report for ${timePeriod}...`);
  };

  const onGenerateCustom = () => {
    alert('Custom report generation started...');
    setShowModal(false);
    setTimeout(() => alert('Custom report generated successfully!'), 2000);
  };

  const onDownloadChart = (title) => {
    alert(`Downloading chart: ${title}`);
  };

  const onExpandChart = (title) => {
    alert(`Expanding chart: ${title}`);
  };

  const onDownloadReport = (name) => {
    alert(`Downloading report: ${name}`);
    setTimeout(() => alert(`${name} downloaded successfully!`), 1000);
  };

  const onShareReport = (name) => {
    const email = prompt(`Enter email address to share "${name}":`);
    if (email) {
      alert(`Sharing ${name} with ${email}...`);
      setTimeout(() => alert(`Report shared successfully with ${email}!`), 1500);
    }
  };

  return (
    <div className="inventory-dashboard inventory-reports">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Reports & Analytics</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Controls */}
          <div className="report-controls">
            <div className="filter-group">
              <label className="filter-label">Report Type</label>
              <select className="filter-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option>All Reports</option>
                <option>Stock Reports</option>
                <option>Usage Analytics</option>
                <option>Expiry Reports</option>
                <option>Disposal Records</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Time Period</label>
              <select className="filter-select" value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)}>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
                <option>Custom Range</option>
              </select>
            </div>

            <div className="date-range" style={{ display: timePeriod === 'Custom Range' ? 'flex' : 'none' }}>
              <div className="filter-group">
                <label className="filter-label">From Date</label>
                <input type="date" className="date-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="filter-label">To Date</label>
                <input type="date" className="date-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={onGenerateReport}>
              <i className="fas fa-chart-bar"></i> Generate Report
            </button>

            <button className="btn btn-success" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus"></i> Create Custom Report
            </button>
          </div>

          {/* Stats */}
          <div className="report-stats">
            <div className="stat-card">
              <div className="stat-icon stock"><i className="fas fa-boxes"></i></div>
              <div className="stat-value">{stats.totalItems}</div>
              <div className="stat-label">Total Inventory Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon usage"><i className="fas fa-chart-line"></i></div>
              <div className="stat-value">{stats.usedThisMonth}</div>
              <div className="stat-label">Items Used This Month</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon expiry"><i className="fas fa-clock"></i></div>
              <div className="stat-value">{stats.expiringSoon}</div>
              <div className="stat-label">Items Expiring Soon</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon disposal"><i className="fas fa-trash-alt"></i></div>
              <div className="stat-value">{stats.disposed}</div>
              <div className="stat-label">Items Disposed</div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-section">
            {[
              { title: 'Inventory by Category', content: 'Pie Chart - Medications: 35%, Medical Supplies: 40%, Emergency Equipment: 15%, Other: 10%' },
              { title: 'Monthly Usage Trends', content: 'Line Chart - Showing usage increase from 65 to 87 items over last 6 months' },
              { title: 'Stock Status Distribution', content: 'Bar Chart - Adequate: 65%, Low Stock: 20%, Critical: 10%, Expired: 5%' },
              { title: 'Expiry Timeline', content: 'Timeline Chart - Items expiring by month over next 6 months' },
            ].map((c) => (
              <div className="chart-card" key={c.title}>
                <div className="chart-header">
                  <div className="chart-title">{c.title}</div>
                  <div className="chart-actions">
                    <button className="btn btn-sm" onClick={() => onDownloadChart(c.title)}><i className="fas fa-download"></i></button>
                    <button className="btn btn-sm" onClick={() => onExpandChart(c.title)}><i className="fas fa-expand"></i></button>
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
              <button className="btn btn-primary" onClick={() => setTimeout(() => alert('Template creation interface loaded!'), 1000)}>
                <i className="fas fa-plus"></i> New Template
              </button>
            </div>

            <div className="templates-grid">
              {[
                { icon: 'fa-file-medical', title: 'Monthly Inventory Summary', desc: 'Comprehensive overview of stock levels, usage, and expiry status for the month.', meta: 'Last run: Oct 25, 2023', formats: 'PDF, Excel' },
                { icon: 'fa-tachometer-alt', title: 'Usage Analytics Report', desc: 'Detailed analysis of item usage patterns with trends and recommendations.', meta: 'Last run: Oct 24, 2023', formats: 'PDF, CSV' },
                { icon: 'fa-calendar-times', title: 'Expiry Management Report', desc: 'Items expiring soon with disposal recommendations and restocking needs.', meta: 'Last run: Oct 20, 2023', formats: 'PDF, Excel' },
                { icon: 'fa-trash-alt', title: 'Disposal Audit Report', desc: 'Complete record of disposed items with reasons and compliance documentation.', meta: 'Last run: Oct 15, 2023', formats: 'PDF' },
              ].map(t => (
                <div className="template-card" key={t.title} onClick={() => { setCustomForm((f) => ({ ...f, name: t.title })); setShowModal(true); }}>
                  <div className="template-icon"><i className={`fas ${t.icon}`}></i></div>
                  <div className="template-title">{t.title}</div>
                  <div className="template-desc">{t.desc}</div>
                  <div className="template-meta">
                    <span>{t.meta}</span>
                    <span>{t.formats}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="recent-reports">
            <div className="section-header">
              <div className="section-title">Recently Generated Reports</div>
              <button className="btn" onClick={() => setTimeout(() => alert('Reports history loaded!'), 1000)}>
                <i className="fas fa-history"></i> View All
              </button>
            </div>

            <div className="table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Type</th>
                    <th>Generated</th>
                    <th>Status</th>
                    <th>Format</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td>{r.type}</td>
                      <td>{r.ts}</td>
                      <td>
                        <span className={`report-status ${r.status === 'completed' ? 'status-completed' : r.status === 'pending' ? 'status-pending' : 'status-failed'}`}>
                          {r.status === 'pending' ? 'Processing' : 'Completed'}
                        </span>
                      </td>
                      <td><span className="report-format">{r.format}</span></td>
                      <td>
                        {r.status === 'completed' ? (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => onDownloadReport(r.name)}><i className="fas fa-download"></i></button>
                            <button className="btn btn-sm" onClick={() => onShareReport(r.name)}><i className="fas fa-share"></i></button>
                          </>
                        ) : (
                          <button className="btn btn-sm" disabled><i className="fas fa-sync fa-spin"></i></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Report Modal */}
      {showModal && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) setShowModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Create Custom Report</div>
              <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Report Name</label>
                <input type="text" className="form-control" placeholder="Enter report name" value={customForm.name}
                  onChange={(e) => setCustomForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Report Type</label>
                  <select className="form-control" value={customForm.type}
                    onChange={(e) => setCustomForm((f) => ({ ...f, type: e.target.value }))}>
                    <option>Stock Analysis</option>
                    <option>Usage Analytics</option>
                    <option>Expiry Management</option>
                    <option>Disposal Records</option>
                    <option>Storage Zone Analysis</option>
                    <option>Custom Analysis</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Output Format</label>
                  <select className="form-control" value={customForm.format}
                    onChange={(e) => setCustomForm((f) => ({ ...f, format: e.target.value }))}>
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                    <option>HTML</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={customForm.start}
                    onChange={(e) => setCustomForm((f) => ({ ...f, start: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={customForm.end}
                    onChange={(e) => setCustomForm((f) => ({ ...f, end: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Include Data</label>
                <div className="checkbox-group">
                  {Object.entries(customForm.include).map(([key, val]) => (
                    <label className="checkbox-item" key={key}>
                      <input type="checkbox" checked={val}
                        onChange={(e) => setCustomForm((f) => ({ ...f, include: { ...f.include, [key]: e.target.checked } }))} />
                      <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Report To</label>
                <input type="text" className="form-control" placeholder="Enter email addresses (comma separated)"
                  value={customForm.emailTo} onChange={(e) => setCustomForm((f) => ({ ...f, emailTo: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Schedule Report</label>
                <select className="form-control" value={customForm.schedule}
                  onChange={(e) => setCustomForm((f) => ({ ...f, schedule: e.target.value }))}>
                  <option>Run once</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={onGenerateCustom}>Generate Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
