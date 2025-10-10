import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  // Stats for top grid (match sample numbers)
  const stats = useMemo(() => ([
    { icon: 'fas fa-exclamation-circle', value: 3, label: 'Pending Examinations', tone: 'danger' },
    { icon: 'fas fa-heartbeat', value: 5, label: 'Chronic Patients', tone: 'warning' },
    { icon: 'fas fa-syringe', value: 8, label: 'Vaccination Alerts', tone: 'primary' },
    { icon: 'fas fa-pills', value: 2, label: 'Low Stock Items', tone: 'info' },
  ]), []);

  // Simple modal controls for quick actions
  const [modals, setModals] = useState({ record: false, exam: false, vaccine: false, reminder: false, report: false, education: false, emergency: false });
  const open = (k) => setModals((m) => ({ ...m, [k]: true }));
  const close = (k) => setModals((m) => ({ ...m, [k]: false }));

  // Quick sample data
  const quickStats = useMemo(() => ([
    { label: 'Pending Exams', value: 6, icon: 'fas fa-clipboard-check', color: 'var(--info)' },
    { label: 'Chronic Patients', value: 18, icon: 'fas fa-heartbeat', color: 'var(--warning)' },
    { label: 'Vaccination Alerts', value: 5, icon: 'fas fa-syringe', color: 'var(--danger)' },
    { label: 'Upcoming Follow-ups', value: 9, icon: 'fas fa-bell', color: 'var(--success)' },
  ]), []);

  // Medical Records form state
  const [recordForm, setRecordForm] = useState({
    crewId: '', fullName: '', dob: '', allergies: '', risks: '', notes: '',
  });
  const [recordFiles, setRecordFiles] = useState([]);
  const [recordHistory, setRecordHistory] = useState([]);

  const onRecordChange = (e) => setRecordForm((f) => ({ ...f, [e.target.id]: e.target.value }));
  const onRecordFiles = (e) => setRecordFiles(Array.from(e.target.files || []));
  const onSaveRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.crewId || !recordForm.fullName || !recordForm.dob) {
      return alert('Crew ID, Full Name, and Date of Birth are required.');
    }
    if (isNaN(Date.parse(recordForm.dob))) return alert('Please enter a valid Date of Birth');
    try {
      // await saveMedicalRecord(recordForm, recordFiles);
      const version = { ts: new Date().toISOString(), data: recordForm, files: recordFiles.map(f => f.name) };
      setRecordHistory((h) => [version, ...h]);
      setRecordFiles([]);
      alert('Medical record saved successfully.');
    } catch (err) {
      console.warn('saveMedicalRecord failed, falling back to local history', err);
      const version = { ts: new Date().toISOString(), data: recordForm, files: recordFiles.map(f => f.name) };
      setRecordHistory((h) => [version, ...h]);
      setRecordFiles([]);
      alert('Backend unavailable. Saved locally for now.');
    }
  };

  // Examination state
  const [exam, setExam] = useState({ bp: '', hr: '', bmi: '', temp: '', findings: '', notes: '' });
  const [examFiles, setExamFiles] = useState([]);
  const [evalDate, setEvalDate] = useState('');
  const onExamChange = (e) => setExam((s) => ({ ...s, [e.target.id]: e.target.value }));

  // Chronic tracking
  const [chronicType, setChronicType] = useState('diabetes');
  const [metric, setMetric] = useState('');
  const [chronicLog, setChronicLog] = useState([]);
  const addChronicLog = async () => {
    if (!metric) return;
    const entry = { ts: new Date().toISOString(), type: chronicType, value: metric };
    setChronicLog((l) => [entry, ...l]);
    setMetric('');
    try {
      // await addChronicEntry({ crewId: recordForm.crewId || 'CR-0000', type: chronicType, value: entry.value, at: entry.ts });
    } catch (err) {
      console.warn('addChronicEntry failed', err);
    }
  };

  // Reminders
  const [reminders, setReminders] = useState([
    { title: 'Insulin - John D', schedule: 'Daily 08:00', status: 'pending' },
    { title: 'Follow-up - Jane S', schedule: '2025-09-25 10:00', status: 'scheduled' },
  ]);

  // Vaccinations
  const [vaccineFilter, setVaccineFilter] = useState('all');
  const vaccinationRows = useMemo(() => ([
    { crewId: 'CR-1001', name: 'John Doe', vaccine: 'Tetanus', due: '2025-10-10', status: 'overdue' },
    { crewId: 'CR-1002', name: 'Jane Smith', vaccine: 'Influenza', due: '2025-10-25', status: 'upcoming' },
    { crewId: 'CR-1003', name: 'Sam Lee', vaccine: 'Hepatitis B', due: '2025-11-02', status: 'complete' },
  ]), []);

  // Reports
  const [reportRange, setReportRange] = useState({ from: '', to: '' });

  // Simple inactivity logout (demo): 30 minutes
  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Health Officer Dashboard</h2>
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

          {/* Dashboard Stats (match reference) */}
          <div className="stats-container">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className={`stat-icon ${s.tone}`}>
                  <i className={s.icon}></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <section className="dashboard-section">
            <div className="section-header">
              <div className="section-title">Quick Actions</div>
            </div>
            <div className="quick-actions">
              {[
                { to: '/dashboard/health/examinations', icon: 'fas fa-stethoscope', title: 'New Examination', desc: 'Record medical examination' },
                { to: '/dashboard/health/medical-records', icon: 'fas fa-file-medical', title: 'Medical Records', desc: 'Update patient records' },
                { to: '/dashboard/health/vaccination', icon: 'fas fa-syringe', title: 'Vaccinations', desc: 'Record vaccinations' },
                { to: '/dashboard/health/inventory-alerts', icon: 'fas fa-bell', title: 'Inventory Alert', desc: 'Send stock alert' },
                { to: '/dashboard/health/emergency', icon: 'fas fa-exclamation-triangle', title: 'Emergency', desc: 'Emergency protocols' },
                { to: '/dashboard/health/reports', icon: 'fas fa-chart-bar', title: 'Reports', desc: 'Generate health reports' },
              ].map((a, idx) => (
                <div key={idx} className="action-card" role="button" tabIndex={0} onClick={() => navigate(a.to)}>
                  <div className="action-icon"><i className={a.icon}></i></div>
                  <div className="action-title">{a.title}</div>
                  <div className="action-desc">{a.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity + Upcoming Schedule */}
          <div className="two-col-grid">
            {/* Recent Activity */}
            <div className="activity-container">
              <div className="section-header">
                <div className="section-title">Recent Activity</div>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/health/reports')}>View All</button>
              </div>
              <ul className="activity-list">
                {[
                  { icon: 'fas fa-stethoscope', title: 'Medical Examination Completed', desc: 'John Doe - Routine check-up', time: '10:30 AM • Today' },
                  { icon: 'fas fa-vial', title: 'Blood Test Results Added', desc: 'Maria Rodriguez - Diabetes monitoring', time: 'Yesterday • 3:15 PM' },
                  { icon: 'fas fa-syringe', title: 'Vaccination Administered', desc: 'Influenza vaccine - 5 crew members', time: 'Oct 24 • 9:45 AM' },
                  { icon: 'fas fa-pills', title: 'Inventory Alert Sent', desc: 'Low stock: Insulin (3 doses remaining)', time: 'Oct 23 • 2:30 PM' },
                  { icon: 'fas fa-file-medical', title: 'Health Report Generated', desc: 'Monthly health summary - October 2023', time: 'Oct 22 • 11:20 AM' },
                ].map((a, i) => (
                  <li key={i} className="activity-item">
                    <div className="activity-icon"><i className={a.icon}></i></div>
                    <div className="activity-content">
                      <div className="activity-title">{a.title}</div>
                      <div className="activity-desc">{a.desc}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upcoming Schedule */}
            <div className="schedule-container">
              <div className="section-header">
                <div className="section-title">Upcoming Schedule</div>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/health/reminders')}>View Calendar</button>
              </div>
              <ul className="schedule-list">
                {[
                  { time: '10:00 AM', title: 'James Wilson - Hypertension Review', desc: 'Chronic condition follow-up', status: 'High Priority', cls: 'status-urgent' },
                  { time: '11:30 AM', title: 'Vaccination Clinic', desc: 'Influenza vaccines for deck crew', status: 'Scheduled', cls: 'status-upcoming' },
                  { time: '02:00 PM', title: 'Mental Health Session', desc: 'Group therapy - Stress management', status: 'Scheduled', cls: 'status-upcoming' },
                  { time: '03:30 PM', title: 'Health Education Workshop', desc: 'Hand hygiene best practices', status: 'Scheduled', cls: 'status-upcoming' },
                  { time: '04:45 PM', title: 'Medical Supplies Check', desc: 'Weekly inventory review', status: 'Scheduled', cls: 'status-upcoming' },
                ].map((s, i) => (
                  <li key={i} className="schedule-item">
                    <div className="schedule-time">{s.time}</div>
                    <div className="schedule-content">
                      <div className="schedule-title">{s.title}</div>
                      <div className="schedule-desc">{s.desc}</div>
                    </div>
                    <div className={`schedule-status ${s.cls}`}>{s.status}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Upcoming Examinations */}
          <div className="dashboard-section">
            <div className="section-header">
              <div className="section-title">Upcoming Examinations</div>
              <div className="section-actions"><button className="btn btn-primary">View All</button></div>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr><th>Crew Member</th><th>Exam Type</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr><td>John Doe (CD12345)</td><td>Annual Physical</td><td>Oct 25, 2025</td><td><span className="status-indicator status-pending"></span> Scheduled</td></tr>
                  <tr><td>Jane Smith (CD12346)</td><td>Follow-up</td><td>Oct 27, 2025</td><td><span className="status-indicator status-pending"></span> Scheduled</td></tr>
                  <tr><td>Robert Brown (CD12347)</td><td>Post-Incident Check</td><td>Oct 30, 2025</td><td><span className="status-indicator status-warning"></span> Pending</td></tr>
                  <tr><td>Lisa Chen (CD12348)</td><td>Pre-Voyage Assessment</td><td>Nov 2, 2025</td><td><span className="status-indicator status-pending"></span> Scheduled</td></tr>
                </tbody>
              </table>
            </div>
          </div>

            {/* Vaccination Status */}
            <div className="dashboard-section">
              <div className="section-header">
                <div className="section-title">Vaccination Status</div>
                <div className="section-actions"><button className="btn btn-primary">Manage</button></div>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr><th>Vaccine</th><th>Due Count</th><th>Overdue</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Influenza</td><td>12</td><td>3</td><td><button className="btn btn-outline">Schedule</button></td></tr>
                    <tr><td>Tetanus</td><td>8</td><td>2</td><td><button className="btn btn-outline">Schedule</button></td></tr>
                    <tr><td>Hepatitis A & B</td><td>5</td><td>0</td><td><button className="btn btn-outline">Schedule</button></td></tr>
                    <tr><td>COVID-19 Booster</td><td>15</td><td>5</td><td><button className="btn btn-outline">Schedule</button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

          {/* Health Metrics Charts */}
          <div className="dashboard-section">
            <div className="section-header"><div className="section-title">Health Metrics Overview</div></div>
            <div className="charts-container">
              <div className="chart">
                <div className="chart-title">Crew Health Status Distribution</div>
                <div style={{ display: 'flex', height: 160, alignItems: 'flex-end', justifyContent: 'space-around' }}>
                  <div style={{ background: 'var(--success)', width: '20%', height: '80%', borderRadius: '4px 4px 0 0' }} title="Good: 65%"></div>
                  <div style={{ background: 'var(--warning)', width: '20%', height: '50%', borderRadius: '4px 4px 0 0' }} title="Needs Attention: 25%"></div>
                  <div style={{ background: 'var(--danger)', width: '20%', height: '30%', borderRadius: '4px 4px 0 0' }} title="Critical: 10%"></div>
                </div>
              </div>
              <div className="chart">
                <div className="chart-title">Monthly Consultations</div>
                <div style={{ display: 'flex', height: 160, alignItems: 'flex-end', justifyContent: 'space-around' }}>
                  {[
                    { h: 40, m: 'Jul: 12' },
                    { h: 60, m: 'Aug: 18' },
                    { h: 55, m: 'Sep: 16' },
                    { h: 80, m: 'Oct: 24' },
                  ].map((b, i) => (
                    <div key={i} style={{ background: 'var(--primary)', width: '15%', height: `${b.h}%`, borderRadius: '4px 4px 0 0' }} title={b.m}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Critical Cases */}
          <div className="dashboard-section">
            <div className="section-header">
              <div className="section-title">Cases Requiring Attention</div>
              <div className="section-actions"><button className="btn btn-primary" onClick={() => open('emergency')}>Alert Emergency Officer</button></div>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr><th>Crew Member</th><th>Condition</th><th>Last Update</th><th>Priority</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <tr><td>James Wilson (CD12347)</td><td>Hypertension - Elevated readings</td><td>Oct 18, 2025</td><td><span style={{ color: 'var(--danger)', fontWeight: 600 }}>High</span></td><td><button className="btn btn-outline">Review</button></td></tr>
                  <tr><td>Michael Brown (CD12349)</td><td>Respiratory infection - No improvement</td><td>Oct 20, 2025</td><td><span style={{ color: 'var(--warning)', fontWeight: 600 }}>Medium</span></td><td><button className="btn btn-outline">Review</button></td></tr>
                  <tr><td>Anna Kowalski (CD12350)</td><td>Mental health - Anxiety symptoms</td><td>Oct 15, 2025</td><td><span style={{ color: 'var(--warning)', fontWeight: 600 }}>Medium</span></td><td><button className="btn btn-outline">Review</button></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Modals */}
          {Object.entries(modals).map(([k, v]) => (
            k !== 'emergency' && v ? (
              <div key={k} className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && close(k)}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h3 className="modal-title">{({
                      record: 'Add Medical Record', exam: 'Record Examination', vaccine: 'Log Vaccination', reminder: 'Set Reminder', report: 'Generate Report', education: 'Publish Content'
                    })[k]}</h3>
                    <button className="close-modal" onClick={() => close(k)}>&times;</button>
                  </div>
                  <p>Form goes here (mock).</p>
                  <button className="btn btn-primary" onClick={() => close(k)} style={{ width: '100%' }}>OK</button>
                </div>
              </div>
            ) : null
          ))}

          {modals.emergency && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && close('emergency')}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Alert Emergency Officer</h3>
                  <button className="close-modal" onClick={() => close('emergency')}>&times;</button>
                </div>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 50, color: 'var(--danger)', marginBottom: 15 }}><i className="fas fa-exclamation-triangle"></i></div>
                  <p>Emergency Officer will be notified immediately.</p>
                  <p><strong>Are you sure you want to proceed?</strong></p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-outline" onClick={() => close('emergency')} style={{ flex: 1 }}>Cancel</button>
                  <button className="btn btn-danger" onClick={() => { alert('Emergency Officer has been notified!'); close('emergency'); }} style={{ flex: 1 }}>Confirm Alert</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
