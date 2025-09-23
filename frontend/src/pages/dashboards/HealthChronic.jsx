import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthChronic() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('patients');
  const [addReadingOpen, setAddReadingOpen] = useState(false);

  const stats = useMemo(() => ([
    { icon: 'fas fa-heartbeat', value: 8, label: 'Patients with Chronic Conditions', bg: 'var(--primary)' },
    { icon: 'fas fa-user-md', value: 5, label: 'Requiring Close Monitoring', bg: 'var(--warning)' },
    { icon: 'fas fa-exclamation-triangle', value: 2, label: 'Critical Conditions', bg: 'var(--danger)' },
    { icon: 'fas fa-chart-line', value: '75%', label: 'Stable/Improving', bg: 'var(--success)' },
  ]), []);

  const distribution = [
    { label: 'Hypertension', count: 4, percent: 50 },
    { label: 'Diabetes', count: 3, percent: 37.5 },
    { label: 'Asthma', count: 2, percent: 25 },
    { label: 'Cardiovascular Disease', count: 1, percent: 12.5 },
  ];

  const patients = [
    { id: 1, name: 'James Wilson', conditions: 'Hypertension, Diabetes', status: 'critical', lastBp: '165/95', hba1c: '8.9', last: 'Oct 18, 2023', next: 'Oct 28, 2023' },
    { id: 2, name: 'Maria Rodriguez', conditions: 'Asthma', status: 'monitoring', oxy: '92%', attacks: 2, last: 'Oct 20, 2023', next: 'Nov 5, 2023' },
    { id: 3, name: 'Robert Smith', conditions: 'Hypertension', status: 'stable', lastBp: '135/85', hr: 78, last: 'Oct 22, 2023', next: 'Nov 15, 2023' },
  ];

  const [patientSelect, setPatientSelect] = useState('1');
  const [timePeriod, setTimePeriod] = useState('30');

  const [addPatientForm, setAddPatientForm] = useState({ crew: '', condition: '', dx: '', assessment: '', freq: 'biweekly' });
  const [readingForm, setReadingForm] = useState({ patient: '', bp: '', sugar: '', hr: '', weight: '', spo2: '', notes: '' });

  const onLogout = () => { clearSession(); navigate('/login'); };

  const viewPatient = (id) => alert(`Viewing patient details for ID: ${id}`);
  const logReading = (id) => { setReadingForm((f) => ({ ...f, patient: String(id) })); setAddReadingOpen(true); };

  const submitAddPatient = (e) => { e.preventDefault(); alert('Patient added to chronic condition tracking!'); };
  const submitReading = (e) => { e.preventDefault(); alert('Health reading saved successfully!'); setAddReadingOpen(false); };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />
        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Chronic Illness Tracking</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Stats */}
          <section className="dashboard-stats">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: s.bg }}>
                  <i className={s.icon}></i>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Condition Distribution */}
          <div className="dashboard-section">
            <div className="section-header">
              <div className="section-title">Condition Distribution</div>
            </div>
            {distribution.map((d) => (
              <div key={d.label} className="progress-container">
                <div className="progress-label">
                  <span>{d.label}</span>
                  <span>{d.count} {d.count === 1 ? 'patient' : 'patients'}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${d.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="dashboard-section">
            <div className="tabs">
              <div className={`tab ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')} role="button" tabIndex={0}>Patient Overview</div>
              <div className={`tab ${activeTab === 'tracking' ? 'active' : ''}`} onClick={() => setActiveTab('tracking')} role="button" tabIndex={0}>Health Tracking</div>
              <div className={`tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')} role="button" tabIndex={0}>Add New Patient</div>
            </div>

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="tab-content active" id="patients">
                <div className="section-header">
                  <div className="section-title">Patients with Chronic Conditions</div>
                  <div className="section-actions">
                    <button className="btn btn-outline"><i className="fas fa-download"></i> Export</button>
                  </div>
                </div>
                <div className="patient-cards">
                  {patients.map((p) => (
                    <div key={p.id} className={`patient-card ${p.status === 'critical' ? 'critical' : p.status === 'monitoring' ? 'monitoring' : ''}`}>
                      <div className="patient-header">
                        <div>
                          <div className="patient-name">{p.name}</div>
                          <div className="patient-condition">{p.conditions}</div>
                        </div>
                        <div className={`status-badge ${p.status === 'critical' ? 'status-critical' : p.status === 'monitoring' ? 'status-monitoring' : 'status-stable'}`}>
                          {p.status === 'critical' ? 'Critical' : p.status === 'monitoring' ? 'Monitoring' : 'Stable'}
                        </div>
                      </div>
                      <div className="patient-stats">
                        <div className="stat-item">
                          <div className="stat-value">{p.lastBp || p.oxy}</div>
                          <div className="stat-label">{p.lastBp ? 'Last BP' : 'Oxygen Sat'}</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-value">{p.hba1c || p.attacks || p.hr}</div>
                          <div className="stat-label">{p.hba1c ? 'HbA1c' : p.attacks ? 'Weekly Attacks' : 'Heart Rate'}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, marginBottom: 15 }}>
                        Last reading: {p.last} • Next review: {p.next}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-outline" onClick={() => viewPatient(p.id)}>View Details</button>
                        <button className="btn btn-outline" onClick={() => logReading(p.id)}>Log Reading</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tracking Tab */}
            {activeTab === 'tracking' && (
              <div className="tab-content active" id="tracking">
                <div className="section-header">
                  <div className="section-title">Health Progress Tracking</div>
                  <div className="section-actions">
                    <button className="btn btn-primary" onClick={() => setAddReadingOpen(true)}><i className="fas fa-plus"></i> Add Reading</button>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Select Patient</label>
                    <select className="form-control" value={patientSelect} onChange={(e) => setPatientSelect(e.target.value)}>
                      <option value="1">James Wilson (Hypertension, Diabetes)</option>
                      <option value="2">Maria Rodriguez (Asthma)</option>
                      <option value="3">Robert Smith (Hypertension)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time Period</label>
                    <select className="form-control" value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)}>
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="365">Last year</option>
                    </select>
                  </div>
                </div>
                <div className="chart-container">
                  <div className="chart-title">Blood Pressure Trends - {patients.find(p => p.id === Number(patientSelect))?.name || ''}</div>
                  <div style={{ display: 'flex', height: 200, alignItems: 'flex-end', justifyContent: 'space-around', padding: '0 20px' }}>
                    {[70,65,75,60,55].map((h, idx) => (
                      <div key={idx} style={{ background: 'var(--primary)', width: '8%', height: `${h}%`, borderRadius: '4px 4px 0 0' }}></div>
                    ))}
                  </div>
                </div>
                <div className="table-responsive" style={{ marginTop: 20 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Blood Pressure</th>
                        <th>Blood Sugar</th>
                        <th>Weight</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Oct 23, 2023</td>
                        <td>145/80</td>
                        <td>128 mg/dL</td>
                        <td>82 kg</td>
                        <td>Improving with medication</td>
                        <td><button className="btn btn-outline">Edit</button></td>
                      </tr>
                      <tr>
                        <td>Oct 16, 2023</td>
                        <td>150/85</td>
                        <td>142 mg/dL</td>
                        <td>83 kg</td>
                        <td>Medication adjusted</td>
                        <td><button className="btn btn-outline">Edit</button></td>
                      </tr>
                      <tr>
                        <td>Oct 9, 2023</td>
                        <td>165/95</td>
                        <td>158 mg/dL</td>
                        <td>84 kg</td>
                        <td>Elevated readings</td>
                        <td><button className="btn btn-outline">Edit</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Add New Patient Tab */}
            {activeTab === 'add' && (
              <div className="tab-content active" id="add">
                <div className="section-header">
                  <div className="section-title">Add New Chronic Condition Patient</div>
                </div>
                <form onSubmit={submitAddPatient}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Crew Member</label>
                      <select className="form-control" required value={addPatientForm.crew} onChange={(e) => setAddPatientForm(f => ({ ...f, crew: e.target.value }))}>
                        <option value="">Select crew member</option>
                        <option value="CD12345">John Doe (CD12345)</option>
                        <option value="CD12346">Maria Rodriguez (CD12346)</option>
                        <option value="CD12347">James Wilson (CD12347)</option>
                        <option value="CD12348">Lisa Chen (CD12348)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Condition Type</label>
                      <select className="form-control" required value={addPatientForm.condition} onChange={(e) => setAddPatientForm(f => ({ ...f, condition: e.target.value }))}>
                        <option value="">Select condition</option>
                        <option value="hypertension">Hypertension</option>
                        <option value="diabetes">Diabetes</option>
                        <option value="asthma">Asthma</option>
                        <option value="cardiovascular">Cardiovascular Disease</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Diagnosis Date</label>
                    <input type="date" className="form-control" required value={addPatientForm.dx} onChange={(e) => setAddPatientForm(f => ({ ...f, dx: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Assessment</label>
                    <textarea className="form-control" rows={4} placeholder="Describe the condition, severity, and initial treatment plan..." value={addPatientForm.assessment} onChange={(e) => setAddPatientForm(f => ({ ...f, assessment: e.target.value }))}></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monitoring Frequency</label>
                    <select className="form-control" required value={addPatientForm.freq} onChange={(e) => setAddPatientForm(f => ({ ...f, freq: e.target.value }))}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">Add Patient to Tracking</button>
                </form>
              </div>
            )}
          </div>

          {/* Add Reading Modal */}
          {addReadingOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setAddReadingOpen(false)}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Log Health Reading</h3>
                  <button className="close-modal" onClick={() => setAddReadingOpen(false)}>&times;</button>
                </div>
                <form onSubmit={submitReading}>
                  <div className="form-group">
                    <label className="form-label">Patient</label>
                    <select className="form-control" required value={readingForm.patient} onChange={(e) => setReadingForm(f => ({ ...f, patient: e.target.value }))}>
                      <option value="">Select patient</option>
                      <option value="1">James Wilson (Hypertension, Diabetes)</option>
                      <option value="2">Maria Rodriguez (Asthma)</option>
                      <option value="3">Robert Smith (Hypertension)</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Blood Pressure</label>
                      <input type="text" className="form-control" placeholder="e.g., 120/80" value={readingForm.bp} onChange={(e) => setReadingForm(f => ({ ...f, bp: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Blood Sugar (mg/dL)</label>
                      <input type="number" className="form-control" placeholder="e.g., 100" value={readingForm.sugar} onChange={(e) => setReadingForm(f => ({ ...f, sugar: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Heart Rate (BPM)</label>
                      <input type="number" className="form-control" placeholder="e.g., 72" value={readingForm.hr} onChange={(e) => setReadingForm(f => ({ ...f, hr: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weight (kg)</label>
                      <input type="number" step="0.1" className="form-control" placeholder="e.g., 70.5" value={readingForm.weight} onChange={(e) => setReadingForm(f => ({ ...f, weight: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Oxygen Saturation (%)</label>
                    <input type="number" className="form-control" placeholder="e.g., 98" min="0" max="100" value={readingForm.spo2} onChange={(e) => setReadingForm(f => ({ ...f, spo2: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={3} placeholder="Any observations or notes..." value={readingForm.notes} onChange={(e) => setReadingForm(f => ({ ...f, notes: e.target.value }))}></textarea>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Reading</button>
                    <button type="button" className="btn btn-outline" onClick={() => setAddReadingOpen(false)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
