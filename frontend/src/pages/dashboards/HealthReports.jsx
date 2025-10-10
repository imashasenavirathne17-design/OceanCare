import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthReports() {
  const navigate = useNavigate();
  const user = getUser();

  const [tab, setTab] = useState('summary');
  const onLogout = () => { clearSession(); navigate('/login'); };

  // Set default dates for report generation when component mounts
  useEffect(() => {
    const start = document.getElementById('startDate');
    const end = document.getElementById('endDate');
    if (start && end) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start.valueAsDate = firstDay;
      end.valueAsDate = lastDay;
    }
  }, []);

  const generateReport = (e) => {
    e.preventDefault();
    alert('Report generation started! You will be notified when it is ready.');
    const modal = document.getElementById('newReportModal');
    if (modal) modal.style.display = 'none';
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Health Reports & Analytics</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Reports Overview */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Reports Dashboard</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-cog"></i> Report Settings</button>
                <button className="btn btn-reports" onClick={() => { const m = document.getElementById('newReportModal'); if (m) m.style.display = 'flex'; }}>
                  <i className="fas fa-plus"></i> Generate Report
                </button>
              </div>
            </div>

            <div className="stats-container">
              {[
                ['24', 'Reports Generated'],
                ['8', 'This Month'],
                ['87%', 'Crew Health Compliance'],
                ['5', 'Scheduled Reports'],
              ].map(([v, l], idx) => (
                <div className="stat-item" key={idx}>
                  <div className="stat-value">{v}</div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title">Medical Consultations by Type</div>
                  <select className="filter-select" style={{ width: 'auto' }}>
                    <option>Last 30 Days</option>
                    <option>Last 3 Months</option>
                    <option>Last 6 Months</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <i className="fas fa-chart-bar" style={{ fontSize: 48, marginRight: 15 }}></i>
                  <div>Bar chart visualization would appear here</div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title">Vaccination Status</div>
                  <select className="filter-select" style={{ width: 'auto' }}>
                    <option>Current Status</option>
                    <option>6 Month Trend</option>
                    <option>Yearly Comparison</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <i className="fas fa-chart-pie" style={{ fontSize: 48, marginRight: 15 }}></i>
                  <div>Pie chart visualization would appear here</div>
                </div>
              </div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Health Reports Management</div>
            </div>

            <div className="tabs">
              <div className={`tab ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>Summary Reports</div>
              <div className={`tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>Health Analytics</div>
              <div className={`tab ${tab === 'certificates' ? 'active' : ''}`} onClick={() => setTab('certificates')}>Health Certificates</div>
              <div className={`tab ${tab === 'scheduled' ? 'active' : ''}`} onClick={() => setTab('scheduled')}>Scheduled Reports</div>
            </div>

            {tab === 'summary' && (
              <div className="tab-content active" id="summary-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search reports..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Report Types</option>
                      <option>Monthly Health Summary</option>
                      <option>Vaccination Status</option>
                      <option>Chronic Illness Report</option>
                      <option>Incident Report</option>
                      <option>Inventory Report</option>
                    </select>
                    <select className="filter-select">
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Last 6 Months</option>
                      <option>Custom Range</option>
                    </select>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card recent">
                    <div className="card-header">
                      <div className="card-title">October 2023 Health Summary</div>
                      <div className="card-icon primary"><i className="fas fa-file-medical"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-description">Comprehensive monthly health overview including consultations, vaccinations, and chronic condition management.</div>
                      <div className="card-meta">Generated: 2023-11-01 | By: Dr. Johnson</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">View</button>
                      <button className="btn btn-outline btn-sm">PDF</button>
                      <button className="btn btn-outline btn-sm">Excel</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Q3 Vaccination Status</div>
                      <div className="card-icon reports"><i className="fas fa-syringe"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-description">Vaccination compliance report with coverage rates, overdue vaccinations, and schedule adherence.</div>
                      <div className="card-meta">Generated: 2023-10-05 | By: Dr. Johnson</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">View</button>
                      <button className="btn btn-outline btn-sm">PDF</button>
                      <button className="btn btn-outline btn-sm">Excel</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Chronic Conditions Review</div>
                      <div className="card-icon reports"><i className="fas fa-heartbeat"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-description">Analysis of chronic illness management, treatment adherence, and health outcomes.</div>
                      <div className="card-meta">Generated: 2023-10-15 | By: Dr. Johnson</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">View</button>
                      <button className="btn btn-outline btn-sm">PDF</button>
                      <button className="btn btn-outline btn-sm">Excel</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Report Name</th>
                        <th>Type</th>
                        <th>Date Range</th>
                        <th>Generated By</th>
                        <th>File Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>October 2023 Health Summary</td>
                        <td>Monthly Summary</td>
                        <td>2023-10-01 to 2023-10-31</td>
                        <td>Dr. Johnson</td>
                        <td>2.4 MB</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">View</button>
                          <button className="btn btn-outline btn-sm">PDF</button>
                          <button className="btn btn-outline btn-sm">Excel</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Q3 Vaccination Status</td>
                        <td>Vaccination Report</td>
                        <td>2023-07-01 to 2023-09-30</td>
                        <td>Dr. Johnson</td>
                        <td>1.8 MB</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">View</button>
                          <button className="btn btn-outline btn-sm">PDF</button>
                          <button className="btn btn-outline btn-sm">Excel</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Chronic Conditions Review</td>
                        <td>Chronic Illness Report</td>
                        <td>2023-01-01 to 2023-10-25</td>
                        <td>Dr. Johnson</td>
                        <td>3.2 MB</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">View</button>
                          <button className="btn btn-outline btn-sm">PDF</button>
                          <button className="btn btn-outline btn-sm">Excel</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'analytics' && (
              <div className="tab-content active" id="analytics-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search analytics..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Metrics</option>
                      <option>Consultation Rates</option>
                      <option>Vaccination Coverage</option>
                      <option>Chronic Disease Control</option>
                      <option>Medication Adherence</option>
                    </select>
                    <select className="filter-select">
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Last 6 Months</option>
                      <option>Year to Date</option>
                    </select>
                  </div>
                </div>

                <div className="charts-container">
                  <div className="chart-card">
                    <div className="chart-header">
                      <div className="chart-title">Consultation Trends</div>
                      <select className="filter-select" style={{ width: 'auto' }}>
                        <option>Monthly</option>
                        <option>Weekly</option>
                        <option>Quarterly</option>
                      </select>
                    </div>
                    <div className="chart-placeholder">
                      <i className="fas fa-chart-line" style={{ fontSize: 48, marginRight: 15 }}></i>
                      <div>Line chart showing consultation trends would appear here</div>
                    </div>
                  </div>

                  <div className="chart-card">
                    <div className="chart-header">
                      <div className="chart-title">Top Medical Conditions</div>
                      <select className="filter-select" style={{ width: 'auto' }}>
                        <option>Current Month</option>
                        <option>Last 3 Months</option>
                        <option>Year to Date</option>
                      </select>
                    </div>
                    <div className="chart-placeholder">
                      <i className="fas fa-chart-bar" style={{ fontSize: 48, marginRight: 15 }}></i>
                      <div>Bar chart of top medical conditions would appear here</div>
                    </div>
                  </div>
                </div>

                <div className="page-content">
                  <div className="page-header">
                    <div className="page-title">Key Performance Indicators</div>
                  </div>

                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Current Value</th>
                          <th>Previous Period</th>
                          <th>Trend</th>
                          <th>Target</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Crew Vaccination Rate</td>
                          <td>87%</td>
                          <td>82%</td>
                          <td><i className="fas fa-arrow-up" style={{ color: 'var(--success)' }}></i> +5%</td>
                          <td>95%</td>
                          <td><span className="status-badge status-warning">Below Target</span></td>
                        </tr>
                        <tr>
                          <td>Chronic Condition Control</td>
                          <td>92%</td>
                          <td>89%</td>
                          <td><i className="fas fa-arrow-up" style={{ color: 'var(--success)' }}></i> +3%</td>
                          <td>90%</td>
                          <td><span className="status-badge status-active">On Target</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'certificates' && (
              <div className="tab-content active" id="certificates-tab">
                <div className="page-header">
                  <div className="page-title">Health Certificates</div>
                  <div className="page-actions">
                    <button className="btn btn-outline"><i className="fas fa-print"></i> Bulk Print</button>
                    <button className="btn btn-reports" onClick={() => alert('Generate certificate')}><i className="fas fa-file-medical"></i> Generate Certificate</button>
                  </div>
                </div>

                <div className="report-preview">
                  <div className="report-header">
                    <div className="report-title">CREW HEALTH CERTIFICATE</div>
                    <div className="report-subtitle">MV Ocean Explorer | Issued: 2023-10-25</div>
                  </div>

                  <div className="report-section">
                    <div className="section-title">Crew Member Information</div>
                    <div className="report-data">
                      <div>
                        <div className="data-item"><span className="data-label">Name:</span><span>John Doe</span></div>
                        <div className="data-item"><span className="data-label">Position:</span><span>Deck Officer</span></div>
                        <div className="data-item"><span className="data-label">Crew ID:</span><span>CD12345</span></div>
                      </div>
                      <div>
                        <div className="data-item"><span className="data-label">Date of Birth:</span><span>1985-03-15</span></div>
                        <div className="data-item"><span className="data-label">Nationality:</span><span>Canadian</span></div>
                        <div className="data-item"><span className="data-label">Passport No:</span><span>AB123456</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="report-section">
                    <div className="section-title">Health Status</div>
                    <div className="report-data">
                      <div>
                        <div className="data-item"><span className="data-label">Last Medical Exam:</span><span>2023-10-15</span></div>
                        <div className="data-item"><span className="data-label">Overall Health:</span><span>Fit for Duty</span></div>
                      </div>
                      <div>
                        <div className="data-item"><span className="data-label">Vaccination Status:</span><span>Up to Date</span></div>
                        <div className="data-item"><span className="data-label">Next Review:</span><span>2024-04-15</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="report-footer">
                    <div className="data-item"><span className="data-label">Health Officer:</span><span>Dr. Sarah Johnson</span></div>
                    <div className="data-item"><span className="data-label">Signature:</span><span><img src="https://i.imgur.com/7I5q1aE.png" alt="Signature" style={{ height: 30, marginLeft: 10 }} /></span></div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Certificate Type</th>
                        <th>Issue Date</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>John Doe</td>
                        <td>Fitness for Duty</td>
                        <td>2023-10-15</td>
                        <td>2024-04-15</td>
                        <td><span className="status-badge status-active">Valid</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">View</button>
                          <button className="btn btn-outline btn-sm">Print</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Maria Rodriguez</td>
                        <td>Vaccination Certificate</td>
                        <td>2023-09-20</td>
                        <td>2024-09-20</td>
                        <td><span className="status-badge status-active">Valid</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">View</button>
                          <button className="btn btn-outline btn-sm">Print</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'scheduled' && (
              <div className="tab-content active" id="scheduled-tab">
                <div className="page-header">
                  <div className="page-title">Scheduled Reports</div>
                  <div className="page-actions">
                    <button className="btn btn-outline"><i className="fas fa-pause"></i> Pause All</button>
                    <button className="btn btn-reports" onClick={() => { const m = document.getElementById('scheduleReportModal'); if (m) m.style.display = 'flex'; }}><i className="fas fa-plus"></i> Schedule Report</button>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card scheduled">
                    <div className="card-header">
                      <div className="card-title">Monthly Health Summary</div>
                      <div className="card-icon warning"><i className="fas fa-clock"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-description">Automated monthly health summary report generation.</div>
                      <div className="card-meta">Next run: 2023-11-01 | Frequency: Monthly</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Edit</button>
                      <button className="btn btn-outline btn-sm">Disable</button>
                    </div>
                  </div>

                  <div className="card scheduled">
                    <div className="card-header">
                      <div className="card-title">Vaccination Alert Report</div>
                      <div className="card-icon warning"><i className="fas fa-bell"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-description">Weekly report of vaccination alerts and overdue vaccinations.</div>
                      <div className="card-meta">Next run: 2023-10-30 | Frequency: Weekly</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Edit</button>
                      <button className="btn btn-outline btn-sm">Disable</button>
                    </div>
                  </div>

                  <div className="card scheduled">
                    <div className="card-header">
                      <div className="card-title">Inventory Status Report</div>
                      <div className="card-icon warning"><i className="fas fa-pills"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-description">Bi-weekly medical inventory status and low stock alerts.</div>
                      <div className="card-meta">Next run: 2023-11-05 | Frequency: Bi-weekly</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Edit</button>
                      <button className="btn btn-outline btn-sm">Disable</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Report Name</th>
                        <th>Frequency</th>
                        <th>Next Run</th>
                        <th>Recipients</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Monthly Health Summary</td>
                        <td>Monthly</td>
                        <td>2023-11-01</td>
                        <td>Captain, HR Manager</td>
                        <td><span className="status-badge status-active">Active</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Edit</button>
                          <button className="btn btn-outline btn-sm">Disable</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Vaccination Alert Report</td>
                        <td>Weekly</td>
                        <td>2023-10-30</td>
                        <td>Health Officer</td>
                        <td><span className="status-badge status-active">Active</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Edit</button>
                          <button className="btn btn-outline btn-sm">Disable</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Report Modal */}
      <div className="modal" id="newReportModal" onClick={(e) => e.target.id === 'newReportModal' && (e.currentTarget.style.display = 'none')}>
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Generate New Report</h3>
            <button className="close-modal" onClick={(e) => { const m = document.getElementById('newReportModal'); if (m) m.style.display = 'none'; }}>&times;</button>
          </div>
          <form id="reportForm" onSubmit={generateReport}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="reportType">Report Type *</label>
                <select id="reportType" className="form-control" required defaultValue="">
                  <option value="">Select report type</option>
                  <option value="monthly">Monthly Health Summary</option>
                  <option value="vaccination">Vaccination Status</option>
                  <option value="chronic">Chronic Conditions</option>
                  <option value="mental-health">Mental Health</option>
                  <option value="inventory">Inventory Status</option>
                  <option value="incident">Incident Report</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reportTitle">Report Title *</label>
                <input type="text" id="reportTitle" className="form-control" placeholder="Enter report title" required />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input type="date" id="startDate" className="form-control" required />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input type="date" id="endDate" className="form-control" required />
              </div>
            </div>

            <div className="form-group">
              <label>Report Sections</label>
              <div>
                <label><input type="checkbox" defaultChecked /> Executive Summary</label>{' '}
                <label><input type="checkbox" defaultChecked /> Crew Health Overview</label>{' '}
                <label><input type="checkbox" defaultChecked /> Vaccination Status</label>{' '}
                <label><input type="checkbox" defaultChecked /> Chronic Conditions</label>{' '}
                <label><input type="checkbox" /> Mental Health</label>{' '}
                <label><input type="checkbox" /> Inventory Status</label>{' '}
                <label><input type="checkbox" /> Recommendations</label>
              </div>
            </div>

            <div className="form-group">
              <label>Output Format *</label>
              <div>
                <label><input type="radio" name="format" value="pdf" defaultChecked /> PDF</label>{' '}
                <label><input type="radio" name="format" value="excel" /> Excel</label>{' '}
                <label><input type="radio" name="format" value="both" /> Both</label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reportNotes">Additional Notes</label>
              <textarea id="reportNotes" className="form-control" rows={3} placeholder="Any specific requirements or notes..."></textarea>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-outline" onClick={() => { const m = document.getElementById('newReportModal'); if (m) m.style.display = 'none'; }} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-reports" style={{ flex: 1 }}>Generate Report</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
