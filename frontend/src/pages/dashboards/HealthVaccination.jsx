import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthVaccination() {
  const navigate = useNavigate();
  const user = getUser();

  const [tab, setTab] = useState('records');
  const [newVaccinationOpen, setNewVaccinationOpen] = useState(false);

  const onLogout = () => { clearSession(); navigate('/login'); };

  useEffect(() => {
    if (newVaccinationOpen) {
      const vaccDate = document.getElementById('vaccinationDate');
      const nextDose = document.getElementById('nextDoseDate');
      const validUntil = document.getElementById('validUntil');
      if (vaccDate) vaccDate.valueAsDate = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      if (nextDose) nextDose.valueAsDate = nextYear;
      if (validUntil) validUntil.valueAsDate = nextYear;
    }
  }, [newVaccinationOpen]);

  const submitVaccination = (e) => {
    e.preventDefault();
    alert('Vaccination recorded successfully!');
    setNewVaccinationOpen(false);
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Vaccination Records & Alerts</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Alert Banner removed as requested */}

          {/* Overview */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Vaccination Overview</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-file-import"></i> Import Records</button>
                <button className="btn btn-vaccination" onClick={() => setNewVaccinationOpen(true)}><i className="fas fa-plus"></i> New Vaccination</button>
              </div>
            </div>

            <div className="overview-container">
              <div className="overview-item">
                <div className="overview-value">87%</div>
                <div className="overview-label">Crew Fully Vaccinated</div>
              </div>
              <div className="overview-item">
                <div className="overview-value">5</div>
                <div className="overview-label">Overdue Vaccinations</div>
              </div>
              <div className="overview-item">
                <div className="overview-value">8</div>
                <div className="overview-label">Due This Month</div>
              </div>
              <div className="overview-item">
                <div className="overview-value">23</div>
                <div className="overview-label">Vaccinations This Year</div>
              </div>
            </div>

            <div className="schedule-container">
              <div className="schedule-header">
                <div className="schedule-title">Vaccination Schedule Compliance</div>
                <div>Target: 95%</div>
              </div>
              <div className="schedule-bar"><div className="schedule-fill" style={{ width: '87%' }}></div></div>
              <div className="schedule-labels">
                <span>0%</span>
                <span>50%</span>
                <span>87%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header"><div className="page-title">Vaccination Management</div></div>

            <div className="tabs">
              <div className={`tab ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')} role="button" tabIndex={0}>Vaccination Records</div>
              <div className={`tab ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')} role="button" tabIndex={0}>Alerts</div>
              <div className={`tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')} role="button" tabIndex={0}>Vaccination Schedule</div>
              <div className={`tab ${tab === 'certificates' ? 'active' : ''}`} onClick={() => setTab('certificates')} role="button" tabIndex={0}>Certificates</div>
            </div>

            {tab === 'records' && (
              <div className="tab-content active" id="records-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search crew or vaccine type..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Vaccines</option>
                      <option>COVID-19</option>
                      <option>Influenza</option>
                      <option>Hepatitis A & B</option>
                      <option>Yellow Fever</option>
                      <option>Tetanus</option>
                    </select>
                    <select className="filter-select">
                      <option>All Status</option>
                      <option>Up to Date</option>
                      <option>Due Soon</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card urgent">
                    <div className="card-header">
                      <div className="card-title">Overdue Vaccination</div>
                      <div className="card-icon danger"><i className="fas fa-exclamation-circle"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">Maria Rodriguez (CD12346)</div>
                      <div className="card-details">Influenza Vaccine</div>
                      <div className="card-details">Last dose: 2022-10-10</div>
                      <div className="card-due overdue">OVERDUE: Since 2023-10-10</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Schedule</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setNewVaccinationOpen(true)}>Record Dose</button>
                    </div>
                  </div>

                  <div className="card warning">
                    <div className="card-header">
                      <div className="card-title">Due Soon</div>
                      <div className="card-icon warning"><i className="fas fa-clock"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">John Doe (CD12345)</div>
                      <div className="card-details">COVID-19 Booster</div>
                      <div className="card-details">Last dose: 2023-05-15</div>
                      <div className="card-due due-soon">DUE: 2024-05-15</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Schedule</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setNewVaccinationOpen(true)}>Record Dose</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Up to Date</div>
                      <div className="card-icon vaccination"><i className="fas fa-syringe"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">James Wilson (CD12347)</div>
                      <div className="card-details">Yellow Fever Vaccine</div>
                      <div className="card-details">Last dose: 2023-02-20</div>
                      <div className="card-due">VALID UNTIL: 2033-02-20</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">View Details</button>
                      <button className="btn btn-outline btn-sm">Print Certificate</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Vaccine</th>
                        <th>Date Administered</th>
                        <th>Next Due</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>John Doe (CD12345)</td>
                        <td>COVID-19 Booster</td>
                        <td>2023-05-15</td>
                        <td>2024-05-15</td>
                        <td><span className="status-badge status-active">Up to Date</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">View</button>
                          <button className="btn btn-outline btn-sm">Record Booster</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Maria Rodriguez (CD12346)</td>
                        <td>Influenza</td>
                        <td>2022-10-10</td>
                        <td>2023-10-10</td>
                        <td><span className="status-badge status-danger">Overdue</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">View</button>
                          <button className="btn btn-outline btn-sm">Schedule</button>
                        </td>
                      </tr>
                      <tr>
                        <td>James Wilson (CD12347)</td>
                        <td>Yellow Fever</td>
                        <td>2023-02-20</td>
                        <td>2033-02-20</td>
                        <td><span className="status-badge status-active">Up to Date</span></td>
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

            {tab === 'alerts' && (
              <div className="tab-content active" id="alerts-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search vaccination alerts..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Alert Types</option>
                      <option>Overdue</option>
                      <option>Due Soon</option>
                      <option>Booster Required</option>
                    </select>
                    <select className="filter-select">
                      <option>All Status</option>
                      <option>Unresolved</option>
                      <option>Resolved</option>
                      <option>Snoozed</option>
                    </select>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card urgent">
                    <div className="card-header">
                      <div className="card-title">Overdue Alert</div>
                      <div className="card-icon danger"><i className="fas fa-exclamation-triangle"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">Maria Rodriguez</div>
                      <div className="card-details">Influenza Vaccine overdue by 15 days</div>
                      <div className="card-due overdue">ACTION REQUIRED</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Resolve</button>
                      <button className="btn btn-outline btn-sm">Snooze</button>
                    </div>
                  </div>

                  <div className="card warning">
                    <div className="card-header">
                      <div className="card-title">Due Soon Alert</div>
                      <div className="card-icon warning"><i className="fas fa-bell"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">John Doe</div>
                      <div className="card-details">COVID-19 Booster due in 30 days</div>
                      <div className="card-due due-soon">SCHEDULE RECOMMENDED</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Resolve</button>
                      <button className="btn btn-outline btn-sm">Snooze</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Booster Alert</div>
                      <div className="card-icon vaccination"><i className="fas fa-syringe"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-patient">Robert Kim</div>
                      <div className="card-details">Tetanus booster required</div>
                      <div className="card-due">NEXT DOSE: 2024-03-15</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Resolve</button>
                      <button className="btn btn-outline btn-sm">Snooze</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Alert Date</th>
                        <th>Crew Member</th>
                        <th>Vaccine</th>
                        <th>Alert Type</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2023-10-25</td>
                        <td>Maria Rodriguez</td>
                        <td>Influenza</td>
                        <td>Overdue</td>
                        <td>2023-10-10</td>
                        <td><span className="status-badge status-danger">Active</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Resolve</button>
                          <button className="btn btn-outline btn-sm">Snooze</button>
                        </td>
                      </tr>
                      <tr>
                        <td>2023-10-24</td>
                        <td>John Doe</td>
                        <td>COVID-19 Booster</td>
                        <td>Due Soon</td>
                        <td>2024-05-15</td>
                        <td><span className="status-badge status-warning">Active</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Resolve</button>
                          <button className="btn btn-outline btn-sm">Snooze</button>
                        </td>
                      </tr>
                      <tr>
                        <td>2023-10-20</td>
                        <td>Robert Kim</td>
                        <td>Tetanus</td>
                        <td>Booster Required</td>
                        <td>2024-03-15</td>
                        <td><span className="status-badge status-active">Active</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Resolve</button>
                          <button className="btn btn-outline btn-sm">Snooze</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'schedule' && (
              <div className="tab-content active" id="schedule-tab">
                <div className="page-header"><div className="page-title">Vaccination Schedule</div></div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Vaccine</th>
                        <th>Initial Dose</th>
                        <th>Booster Schedule</th>
                        <th>Validity Period</th>
                        <th>Required for Voyage</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>COVID-19</td>
                        <td>2 doses, 3-4 weeks apart</td>
                        <td>Annual booster recommended</td>
                        <td>1 year (booster)</td>
                        <td><i className="fas fa-check" style={{ color: 'var(--success)' }}></i></td>
                        <td className="action-buttons"><button className="btn btn-outline btn-sm">View Details</button></td>
                      </tr>
                      <tr>
                        <td>Influenza</td>
                        <td>Single dose</td>
                        <td>Annual vaccination</td>
                        <td>1 year</td>
                        <td><i className="fas fa-check" style={{ color: 'var(--success)' }}></i></td>
                        <td className="action-buttons"><button className="btn btn-outline btn-sm">View Details</button></td>
                      </tr>
                      <tr>
                        <td>Yellow Fever</td>
                        <td>Single dose</td>
                        <td>Lifetime immunity</td>
                        <td>10 years (certificate)</td>
                        <td><i className="fas fa-check" style={{ color: 'var(--success)' }}></i></td>
                        <td className="action-buttons"><button className="btn btn-outline btn-sm">View Details</button></td>
                      </tr>
                      <tr>
                        <td>Tetanus</td>
                        <td>3 doses (0, 1, 6 months)</td>
                        <td>Every 10 years</td>
                        <td>10 years</td>
                        <td><i className="fas fa-check" style={{ color: 'var(--success)' }}></i></td>
                        <td className="action-buttons"><button className="btn btn-outline btn-sm">View Details</button></td>
                      </tr>
                      <tr>
                        <td>Hepatitis A & B</td>
                        <td>2-3 dose series</td>
                        <td>Booster after 10-15 years</td>
                        <td>10-15 years</td>
                        <td><i className="fas fa-check" style={{ color: 'var(--success)' }}></i></td>
                        <td className="action-buttons"><button className="btn btn-outline btn-sm">View Details</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'certificates' && (
              <div className="tab-content active" id="certificates-tab">
                <div className="page-header">
                  <div className="page-title">Vaccination Certificates</div>
                  <div className="page-actions">
                    <button className="btn btn-outline"><i className="fas fa-print"></i> Bulk Print</button>
                    <button className="btn btn-vaccination" onClick={() => alert('Generate certificate')}><i className="fas fa-file-medical"></i> Generate Certificate</button>
                  </div>
                </div>

                <div className="certificate-preview">
                  <div className="certificate-logo"><i className="fas fa-syringe"></i></div>
                  <div className="certificate-title">INTERNATIONAL VACCINATION CERTIFICATE</div>
                  <div className="certificate-details">
                    {[
                      ['Name:', 'John Doe'],
                      ['Date of Birth:', '1985-03-15'],
                      ['Passport No:', 'AB123456'],
                      ['Vaccine:', 'Yellow Fever'],
                      ['Date Administered:', '2023-02-20'],
                      ['Valid Until:', '2033-02-20'],
                      ['Health Officer:', 'Dr. Sarah Johnson'],
                    ].map(([k, v], i) => (
                      <div key={i} className="certificate-row"><span><strong>{k}</strong></span><span>{v}</span></div>
                    ))}
                  </div>
                  <button className="btn btn-vaccination" onClick={() => window.print()}><i className="fas fa-print"></i> Print Certificate</button>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Vaccine</th>
                        <th>Certificate Issue Date</th>
                        <th>Valid Until</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>John Doe</td>
                        <td>Yellow Fever</td>
                        <td>2023-02-20</td>
                        <td>2033-02-20</td>
                        <td><span className="status-badge status-active">Valid</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">View</button>
                          <button className="btn btn-outline btn-sm">Print</button>
                        </td>
                      </tr>
                      <tr>
                        <td>James Wilson</td>
                        <td>COVID-19</td>
                        <td>2023-05-15</td>
                        <td>2024-05-15</td>
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
          </div>
        </main>
      </div>

      {/* New Vaccination Modal */}
      {newVaccinationOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setNewVaccinationOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3 className="modal-title">Record New Vaccination</h3>
              <button className="close-modal" onClick={() => setNewVaccinationOpen(false)}>&times;</button>
            </div>
            <form onSubmit={submitVaccination} id="vaccinationForm">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="vaccinationPatient">Crew Member *</label>
                  <select id="vaccinationPatient" className="form-control" required defaultValue="">
                    <option value="">Select crew member</option>
                    <option value="CD12345">John Doe (CD12345)</option>
                    <option value="CD12346">Maria Rodriguez (CD12346)</option>
                    <option value="CD12347">James Wilson (CD12347)</option>
                    <option value="CD12348">Lisa Chen (CD12348)</option>
                    <option value="CD12349">Michael Brown (CD12349)</option>
                    <option value="CD12350">Robert Kim (CD12350)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="vaccineType">Vaccine *</label>
                  <select id="vaccineType" className="form-control" required defaultValue="">
                    <option value="">Select vaccine</option>
                    <option value="covid">COVID-19</option>
                    <option value="influenza">Influenza</option>
                    <option value="yellow-fever">Yellow Fever</option>
                    <option value="tetanus">Tetanus</option>
                    <option value="hepatitis-a">Hepatitis A</option>
                    <option value="hepatitis-b">Hepatitis B</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="vaccinationDate">Date Administered *</label>
                  <input type="date" id="vaccinationDate" className="form-control" required />
                </div>
                <div className="form-group">
                  <label htmlFor="batchNumber">Batch Number *</label>
                  <input type="text" id="batchNumber" className="form-control" placeholder="Vaccine batch number" required />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="doseNumber">Dose Number</label>
                  <select id="doseNumber" className="form-control" defaultValue="1">
                    <option value="1">1st Dose</option>
                    <option value="2">2nd Dose</option>
                    <option value="booster">Booster</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="nextDoseDate">Next Dose Date</label>
                  <input type="date" id="nextDoseDate" className="form-control" />
                </div>
                <div className="form-group">
                  <label htmlFor="validUntil">Valid Until</label>
                  <input type="date" id="validUntil" className="form-control" />
                </div>
                <div className="form-group">
                  <label htmlFor="administeringOfficer">Administering Officer</label>
                  <input type="text" id="administeringOfficer" className="form-control" value={user?.fullName || 'Dr. Sarah Johnson'} readOnly />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="vaccinationNotes">Notes</label>
                <textarea id="vaccinationNotes" className="form-control" rows={3} placeholder="Any reactions or additional information..."></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="certificateGenerate">Generate Certificate</label>
                <div>
                  <input type="checkbox" id="certificateGenerate" defaultChecked /> Generate vaccination certificate
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setNewVaccinationOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-vaccination" style={{ flex: 1 }}>Save Vaccination Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
