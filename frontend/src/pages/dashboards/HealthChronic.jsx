import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import './HealthChronic.css';
import HealthSidebar from './HealthSidebar';
import { listCrewMembers } from '../../lib/healthApi';
import {
  listChronicPatients,
  createChronicPatient,
  updateChronicPatient,
  deleteChronicPatient,
  createChronicReading
} from '../../lib/chronicApi';

export default function HealthChronic() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('patients');
  const [addReadingOpen, setAddReadingOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [viewPatientOpen, setViewPatientOpen] = useState(false);
  const [viewPatientId, setViewPatientId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All Conditions');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [progressSearch, setProgressSearch] = useState('');
  const [timePeriod, setTimePeriod] = useState('Last 30 Days');
  
  // Crew members data
  const [crewMembers, setCrewMembers] = useState([]);
  const [loadingCrew, setLoadingCrew] = useState(false);

  const [patients, setPatients] = useState([]);

  const [addPatientForm, setAddPatientForm] = useState({
    crewId: '',
    crewName: '',
    condition: '',
    dx: '',
    severity: 'mild',
    findings: '',
    treatment: '',
    monitoring: '',
    nextCheckup: ''
  });
  const [readingForm, setReadingForm] = useState({
    patient: '',
    date: '',
    bloodGlucose: '',
    bloodPressure: '',
    peakFlow: '',
    weight: '',
    notes: ''
  });

  const onLogout = () => { clearSession(); navigate('/login'); };

  // Crew name lookup
  const crewNameById = useMemo(() => {
    const map = {};
    crewMembers.forEach(member => {
      if (member.crewId) {
        map[member.crewId] = member.fullName || member.name || 'Unknown';
      }
    });
    return map;
  }, [crewMembers]);

  // Filtered patients based on search and filters
  const filteredPatients = patients.filter((p) => {
    const matchesSearch = searchQuery.trim() === '' || 
      (p.crewName && p.crewName.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (p.crewId && p.crewId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.conditions && p.conditions.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCondition = conditionFilter === 'All Conditions' || 
      (p.conditions && p.conditions.includes(conditionFilter.replace(' Disease', '')));
    const matchesStatus = statusFilter === 'All Status' || 
      (statusFilter === 'Stable' && p.status === 'stable') ||
      (statusFilter === 'Needs Review' && p.status === 'warning') ||
      (statusFilter === 'Critical' && p.status === 'critical');
    return matchesSearch && matchesCondition && matchesStatus;
  });

  const viewPatient = (id) => {
    setViewPatientId(id);
    setViewPatientOpen(true);
  };
  
  const editPatient = (id) => {
    const patient = patients.find(p => p.id === id || p._id === id);
    if (patient) {
      setAddPatientForm({
        id: patient._id || patient.id,
        crewId: patient.crewId,
        crewName: patient.crewName,
        condition: patient.primaryCondition || 
                   (patient.conditions && patient.conditions.includes('Diabetes') ? 'diabetes' : 
                   patient.conditions.includes('Hypertension') ? 'hypertension' :
                   patient.conditions.includes('Asthma') ? 'asthma' :
                   patient.conditions.includes('Hyperthyroidism') ? 'thyroid' : 'other'),
        dx: patient.diagnosisDate ? new Date(patient.diagnosisDate).toISOString().slice(0, 10) : '',
        severity: patient.severity || 'mild',
        findings: patient.initialFindings || '',
        treatment: patient.treatmentPlan || '',
        monitoring: patient.monitoringParameters || '',
        nextCheckup: patient.nextCheckup ? new Date(patient.nextCheckup).toISOString().slice(0, 10) : ''
      });
      setEditMode(true);
      setAddPatientOpen(true);
    }
  };
  
  const deletePatient = async (id) => {
    if (confirm('Are you sure you want to remove this patient from chronic illness tracking?')) {
      try {
        await deleteChronicPatient(id);
        await loadPatients();
        alert('Patient removed from chronic illness tracking successfully!');
      } catch (error) {
        console.error('Delete patient error:', error);
        alert('Failed to remove patient: ' + error.message);
      }
    }
  };
  
  const logReading = (id) => {
    const patient = patients.find(p => p.id === id || p._id === id);
    setReadingForm((f) => ({ 
      ...f, 
      patient: String(id),
      patientId: patient?._id || patient?.id || id
    })); 
    setAddReadingOpen(true); 
  };

  const submitAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const selectedCrew = crewMembers.find(c => c.crewId === addPatientForm.crewId);
      
      const patientData = {
        crewId: addPatientForm.crewId,
        crewName: selectedCrew?.fullName || addPatientForm.crewName,
        primaryCondition: addPatientForm.condition === 'diabetes' ? 'Type 2 Diabetes' :
                         addPatientForm.condition === 'hypertension' ? 'Hypertension' :
                         addPatientForm.condition === 'asthma' ? 'Asthma' :
                         addPatientForm.condition === 'heart' ? 'Heart Disease' :
                         addPatientForm.condition === 'thyroid' ? 'Hyperthyroidism' : 'Other',
        conditions: [addPatientForm.condition === 'diabetes' ? 'Type 2 Diabetes' :
                    addPatientForm.condition === 'hypertension' ? 'Hypertension' :
                    addPatientForm.condition === 'asthma' ? 'Asthma' :
                    addPatientForm.condition === 'heart' ? 'Heart Disease' :
                    addPatientForm.condition === 'thyroid' ? 'Hyperthyroidism' : 'Other'],
        severity: addPatientForm.severity,
        diagnosisDate: addPatientForm.dx,
        status: 'stable',
        nextCheckup: addPatientForm.nextCheckup || null,
        initialFindings: addPatientForm.findings,
        treatmentPlan: addPatientForm.treatment,
        monitoringParameters: addPatientForm.monitoring
      };
      
      if (editMode) {
        await updateChronicPatient(addPatientForm.id, patientData);
        alert('Patient record updated successfully!');
      } else {
        await createChronicPatient(patientData);
        alert('Chronic illness patient record added successfully!');
      }
      
      await loadPatients();
      setAddPatientOpen(false);
      setEditMode(false);
      resetForm();
    } catch (error) {
      console.error('Submit patient error:', error);
      setError(error.message || 'Failed to save patient record');
    } finally {
      setLoading(false);
    }
  };
  const submitReading = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const readingData = {
        patientId: readingForm.patientId,
        crewId: readingForm.crewId,
        readingDate: readingForm.date,
        bloodGlucose: readingForm.bloodGlucose,
        bloodPressure: readingForm.bloodPressure,
        peakFlow: readingForm.peakFlow,
        weight: readingForm.weight,
        clinicalNotes: readingForm.notes
      };
      
      await createChronicReading(readingData);
      alert('Health reading logged successfully!');
      setAddReadingOpen(false);
      await loadPatients(); // Refresh to show updated last reading
      
      // Reset form
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setReadingForm({ 
        patient: '', 
        patientId: '',
        crewId: '',
        date: now.toISOString().slice(0, 16), 
        bloodGlucose: '', 
        bloodPressure: '', 
        peakFlow: '', 
        weight: '', 
        notes: '' 
      });
    } catch (error) {
      console.error('Submit reading error:', error);
      alert('Failed to log reading: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load patients from API
  const loadPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listChronicPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load patients error:', error);
      setError('Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load crew members
  const loadCrewMembers = async () => {
    try {
      setLoadingCrew(true);
      const data = await listCrewMembers();
      setCrewMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load crew members error:', error);
      setCrewMembers([]);
    } finally {
      setLoadingCrew(false);
    }
  };
  
  // Reset form to defaults
  const resetForm = () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    
    setAddPatientForm({
      crewId: '',
      crewName: '',
      condition: '',
      dx: today,
      severity: 'mild',
      findings: '',
      treatment: '',
      monitoring: '',
      nextCheckup: ''
    });
    
    setReadingForm({
      patient: '',
      patientId: '',
      crewId: '',
      date: now.toISOString().slice(0, 16),
      bloodGlucose: '',
      bloodPressure: '',
      peakFlow: '',
      weight: '',
      notes: ''
    });
  };
  
  // Initialize data and forms
  useEffect(() => {
    loadPatients();
    loadCrewMembers();
    resetForm();
  }, []);

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />
        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Chronic Illness Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName}</div>
                <small>Health Officer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Chronic Conditions Management</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-chart-line"></i> View Trends</button>
                <button className="btn btn-primary" onClick={() => { setEditMode(false); setError(''); resetForm(); setAddPatientOpen(true); }} disabled={loading}>
                  <i className="fas fa-plus"></i> Add Patient
                </button>
              </div>
            </div>
            
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 20, padding: 15, backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 8, border: '1px solid #f5c6cb' }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>
                {error}
              </div>
            )}
            
            {loading && (
              <div className="alert alert-info" style={{ marginBottom: 20, padding: 15, backgroundColor: '#d1ecf1', color: '#0c5460', borderRadius: 8, border: '1px solid #bee5eb' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                Loading...
              </div>
            )}

            <div className="tabs">
              <div className={`tab ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>Active Patients</div>
              <div className={`tab ${activeTab === 'conditions' ? 'active' : ''}`} onClick={() => setActiveTab('conditions')}>Conditions Overview</div>
              <div className={`tab ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>Progress Tracking</div>
            </div>

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="tab-content active" id="patients-tab">
                <div className="chronic-filter-container">
                  <div className="chronic-search-box">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      placeholder="Search by patient name, ID, or condition..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    className="chronic-filter-select" 
                    value={conditionFilter} 
                    onChange={(e) => setConditionFilter(e.target.value)}
                  >
                    <option>All Conditions</option>
                    <option>Diabetes</option>
                    <option>Hypertension</option>
                    <option>Asthma</option>
                    <option>Heart Disease</option>
                    <option>Hyperthyroidism</option>
                  </select>
                  <select 
                    className="chronic-filter-select" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>All Status</option>
                    <option>Stable</option>
                    <option>Needs Review</option>
                    <option>Critical</option>
                  </select>
                </div>

                <div className="table-responsive">
                  <table className="chronic-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Condition(s)</th>
                        <th>Severity</th>
                        <th>Diagnosis Date</th>
                        <th>Last Reading</th>
                        <th>Next Checkup</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((p) => (
                        <tr key={p._id || p.id}>
                          <td>
                            <div className="patient-cell">
                              <div className="name">{p.crewName || crewNameById[p.crewId] || 'Unknown'}</div>
                              <div className="id">{p.crewId}</div>
                              {p.createdAt && <div className="record-date" style={{ fontSize: '0.75em', color: '#6b7280' }}>
                                Record: {new Date(p.createdAt).toLocaleDateString()}
                              </div>}
                            </div>
                          </td>
                          <td className="nowrap">{p.primaryCondition || (Array.isArray(p.conditions) ? p.conditions.join(', ') : p.conditions)}</td>
                          <td>
                            <span className={`severity-badge severity-${p.severity}`}>
                              {p.severity}
                            </span>
                          </td>
                          <td className="nowrap">{p.diagnosisDate ? new Date(p.diagnosisDate).toLocaleDateString() : '—'}</td>
                          <td>{p.lastReading?.notes || p.lastReading?.bloodGlucose || p.lastReading?.bloodPressure || 'No readings yet'}</td>
                          <td className="nowrap">{p.nextCheckup ? new Date(p.nextCheckup).toLocaleDateString() : '—'}</td>
                          <td>
                            <span className={`status-badge ${p.status === 'warning' ? 'status-warning' : p.status === 'stable' ? 'status-active' : 'status-danger'}`}>
                              {p.status === 'warning' ? 'Needs Review' : p.status === 'stable' ? 'Stable' : 'Critical'}
                            </span>
                          </td>
                          <td className="chronic-actions">
                            <button className="btn btn-action btn-sm" onClick={() => logReading(p._id || p.id)}>
                              <i className="fas fa-notes-medical"></i> Log Reading
                            </button>
                            <button className="btn btn-action btn-sm" onClick={() => viewPatient(p._id || p.id)}>
                              <i className="fas fa-book"></i> View
                            </button>
                            <button className="btn btn-action btn-sm" onClick={() => editPatient(p._id || p.id)}>
                              <i className="fas fa-pen"></i> Edit
                            </button>
                            <button className="btn btn-action btn-sm delete" onClick={() => deletePatient(p._id || p.id)}>
                              <i className="fas fa-trash"></i> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Conditions Tab */}
            {activeTab === 'conditions' && (
              <div className="tab-content active" id="conditions-tab">
                <div className="cards-container">
                  <div className="chronic-condition-card">
                    <div className="chronic-condition-header">
                      <div className="chronic-condition-title">Diabetes</div>
                      <div className="chronic-condition-icon warning">
                        <i className="fas fa-vial"></i>
                      </div>
                    </div>
                    <div className="chronic-condition-value">3 Patients</div>
                    <div className="chronic-condition-label">1 needs follow-up</div>
                    <button className="btn btn-outline btn-sm" style={{ marginTop: 15 }}>View Patients</button>
                  </div>

                  <div className="chronic-condition-card">
                    <div className="chronic-condition-header">
                      <div className="chronic-condition-title">Hypertension</div>
                      <div className="chronic-condition-icon danger">
                        <i className="fas fa-heartbeat"></i>
                      </div>
                    </div>
                    <div className="chronic-condition-value">4 Patients</div>
                    <div className="chronic-condition-label">2 need medication adjustment</div>
                    <button className="btn btn-outline btn-sm" style={{ marginTop: 15 }}>View Patients</button>
                  </div>

                  <div className="chronic-condition-card">
                    <div className="chronic-condition-header">
                      <div className="chronic-condition-title">Asthma</div>
                      <div className="chronic-condition-icon primary">
                        <i className="fas fa-wind"></i>
                      </div>
                    </div>
                    <div className="chronic-condition-value">2 Patients</div>
                    <div className="chronic-condition-label">All stable</div>
                    <button className="btn btn-outline btn-sm" style={{ marginTop: 15 }}>View Patients</button>
                  </div>
                </div>

                <div className="page-content" style={{ marginTop: 20 }}>
                  <div className="page-header">
                    <div className="page-title">Condition Overview</div>
                  </div>

                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Condition</th>
                          <th>Total Patients</th>
                          <th>Stable</th>
                          <th>Needs Review</th>
                          <th>Critical</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Diabetes</td>
                          <td>3</td>
                          <td>2</td>
                          <td>1</td>
                          <td>0</td>
                          <td className="action-buttons">
                            <button className="btn btn-action btn-sm">
                              <i className="fas fa-book"></i> View Details
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>Hypertension</td>
                          <td>4</td>
                          <td>2</td>
                          <td>2</td>
                          <td>0</td>
                          <td className="action-buttons">
                            <button className="btn btn-action btn-sm">
                              <i className="fas fa-book"></i> View Details
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>Asthma</td>
                          <td>2</td>
                          <td>2</td>
                          <td>0</td>
                          <td>0</td>
                          <td className="action-buttons">
                            <button className="btn btn-action btn-sm">
                              <i className="fas fa-book"></i> View Details
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>Hyperthyroidism</td>
                          <td>1</td>
                          <td>0</td>
                          <td>1</td>
                          <td>0</td>
                          <td className="action-buttons">
                            <button className="btn btn-action btn-sm">
                              <i className="fas fa-book"></i> View Details
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Tracking Tab */}
            {activeTab === 'progress' && (
              <div className="tab-content active" id="progress-tab">
                <div className="chronic-filter-container">
                  <div className="chronic-search-box">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      placeholder="Search patient progress..." 
                      value={progressSearch}
                      onChange={(e) => setProgressSearch(e.target.value)}
                    />
                  </div>
                  <select 
                    className="chronic-filter-select" 
                    value={timePeriod} 
                    onChange={(e) => setTimePeriod(e.target.value)}
                    style={{ width: 200 }}
                  >
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Last 3 Months</option>
                    <option>All Time</option>
                  </select>
                </div>

                {/* Example progress bars */}
                <div className="chronic-progress-container">
                  <div className="chronic-progress-header">
                    <div className="chronic-progress-title">Maria Rodriguez - Blood Glucose Control</div>
                    <div className="chronic-progress-target">Target: &lt; 130 mg/dL</div>
                  </div>
                  <div className="chronic-progress-bar">
                    <div className="chronic-progress-fill" style={{ width: '75%' }}></div>
                  </div>
                  <div className="chronic-progress-labels">
                    <span>Start: 180 mg/dL</span>
                    <span>Current: 145 mg/dL</span>
                    <span>Target: 130 mg/dL</span>
                  </div>
                </div>

                <div className="chronic-progress-container">
                  <div className="chronic-progress-header">
                    <div className="chronic-progress-title">John Doe - Blood Pressure Control</div>
                    <div className="chronic-progress-target">Target: &lt; 120/80 mmHg</div>
                  </div>
                  <div className="chronic-progress-bar">
                    <div className="chronic-progress-fill" style={{ width: '60%' }}></div>
                  </div>
                  <div className="chronic-progress-labels">
                    <span>Start: 160/95 mmHg</span>
                    <span>Current: 142/88 mmHg</span>
                    <span>Target: 120/80 mmHg</span>
                  </div>
                </div>

                <div className="chronic-progress-container">
                  <div className="chronic-progress-header">
                    <div className="chronic-progress-title">James Wilson - Asthma Control</div>
                    <div className="chronic-progress-target">Target: Peak Flow &gt; 450 L/min</div>
                  </div>
                  <div className="chronic-progress-bar">
                    <div className="chronic-progress-fill" style={{ width: '85%' }}></div>
                  </div>
                  <div className="chronic-progress-labels">
                    <span>Start: 350 L/min</span>
                    <span>Current: 420 L/min</span>
                    <span>Target: 450 L/min</span>
                  </div>
                </div>

                <div className="page-content">
                  <div className="page-header">
                    <div className="page-title">Recent Progress Notes</div>
                    <div className="page-actions">
                      <button className="btn btn-primary" onClick={() => setAddReadingOpen(true)}><i className="fas fa-plus"></i> Add Reading</button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="chronic-notes-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Patient</th>
                          <th>Condition</th>
                          <th>Progress Note</th>
                          <th>Health Officer</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>2023-10-24</td>
                          <td>Maria Rodriguez</td>
                          <td>Diabetes</td>
                          <td>Blood glucose levels improving with new medication regimen. Patient reports increased energy.</td>
                          <td>Dr. Johnson</td>
                        </tr>
                        <tr>
                          <td>2023-10-22</td>
                          <td>John Doe</td>
                          <td>Hypertension</td>
                          <td>BP readings remain elevated. Considering dosage adjustment for lisinopril.</td>
                          <td>Dr. Johnson</td>
                        </tr>
                        <tr>
                          <td>2023-10-20</td>
                          <td>James Wilson</td>
                          <td>Asthma</td>
                          <td>Peak flow measurements show consistent improvement. No recent asthma attacks reported.</td>
                          <td>Dr. Johnson</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Patient Modal */}
          {viewPatientOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setViewPatientOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Patient Details</h3>
                  <button className="close-modal" onClick={() => setViewPatientOpen(false)}>&times;</button>
                </div>
                {(() => {
                  const patient = patients.find((p) => p.id === viewPatientId);
                  if (!patient) return <div style={{ padding: 10 }}>Patient not found</div>;
                  return (
                    <div style={{ padding: 10 }}>
                      <div className="chronic-modal-section">
                        <h4>Patient Information</h4>
                        <div className="chronic-info-grid">
                          <div className="chronic-info-item"><strong>Name:</strong> {patient.name}</div>
                          <div className="chronic-info-item"><strong>ID:</strong> {patient.code}</div>
                          <div className="chronic-info-item"><strong>Condition(s):</strong> {patient.conditions}</div>
                          <div className="chronic-info-item"><strong>Severity:</strong> <span className={`severity-badge severity-${patient.severity}`}>{patient.severity}</span></div>
                          <div className="chronic-info-item"><strong>Diagnosis Date:</strong> {patient.diagnosisDate}</div>
                          <div className="chronic-info-item"><strong>Status:</strong> 
                            <span className={`status-badge ${patient.status === 'warning' ? 'status-warning' : patient.status === 'stable' ? 'status-active' : 'status-danger'}`} style={{ marginLeft: 8 }}>
                              {patient.status === 'warning' ? 'Needs Review' : patient.status === 'stable' ? 'Stable' : 'Critical'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="chronic-modal-section">
                        <h4>Latest Reading</h4>
                        <div>{patient.lastReading}</div>
                      </div>
                      <div className="chronic-modal-section">
                        <h4>Next Checkup</h4>
                        <div>{patient.nextCheckup}</div>
                      </div>
                      <div className="chronic-modal-section">
                        <h4>Treatment History</h4>
                        <ul style={{ paddingLeft: 20 }}>
                          <li>Regular monitoring of vital signs</li>
                          <li>Medication compliance tracking</li>
                          <li>Lifestyle modification counseling</li>
                        </ul>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-outline" onClick={() => setViewPatientOpen(false)}>Close</button>
                        <button className="btn btn-primary" onClick={() => { setViewPatientOpen(false); editPatient(viewPatientId); }}>Edit</button>
                        <button className="btn btn-primary" onClick={() => { setViewPatientOpen(false); logReading(viewPatientId); }}>Log Reading</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Add/Edit Patient Modal */}
          {addPatientOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setAddPatientOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">{editMode ? 'Edit Patient Record' : 'Add New Chronic Illness Patient'}</h3>
                  <button className="close-modal" onClick={() => { setAddPatientOpen(false); setEditMode(false); }}>&times;</button>
                </div>
                <form onSubmit={submitAddPatient}>
                  {error && (
                    <div className="alert alert-danger" style={{ marginBottom: 20, padding: 10, backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 5 }}>
                      {error}
                    </div>
                  )}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="patientSelect">Crew Member *</label>
                      <select 
                        id="patientSelect" 
                        className="form-control" 
                        required 
                        value={addPatientForm.crewId} 
                        onChange={(e) => {
                          const selectedCrew = crewMembers.find(c => c.crewId === e.target.value);
                          setAddPatientForm(f => ({ 
                            ...f, 
                            crewId: e.target.value,
                            crewName: selectedCrew?.fullName || ''
                          }));
                        }} 
                        disabled={loadingCrew}
                      >
                        <option value="">{loadingCrew ? 'Loading crew members...' : 'Select crew member'}</option>
                        {crewMembers.map((crew) => (
                          <option key={crew._id || crew.crewId} value={crew.crewId}>
                            {crew.fullName || crew.name} ({crew.crewId})
                          </option>
                        ))}
                      </select>
                      {loadingCrew && <small style={{ color: '#6b7280' }}>Loading crew members...</small>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="conditionType">Condition *</label>
                      <select id="conditionType" className="form-control" required value={addPatientForm.condition} onChange={(e) => setAddPatientForm(f => ({ ...f, condition: e.target.value }))}>
                        <option value="">Select condition</option>
                        <option value="diabetes">Type 2 Diabetes</option>
                        <option value="hypertension">Hypertension</option>
                        <option value="asthma">Asthma</option>
                        <option value="heart">Heart Disease</option>
                        <option value="thyroid">Thyroid Disorder</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="diagnosisDate">Diagnosis Date *</label>
                      <input id="diagnosisDate" type="date" className="form-control" required value={addPatientForm.dx} onChange={(e) => setAddPatientForm(f => ({ ...f, dx: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="severity">Severity *</label>
                      <select id="severity" className="form-control" required value={addPatientForm.severity} onChange={(e) => setAddPatientForm(f => ({ ...f, severity: e.target.value }))}>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="nextCheckup">Next Checkup Date</label>
                      <input id="nextCheckup" type="date" className="form-control" value={addPatientForm.nextCheckup} onChange={(e) => setAddPatientForm(f => ({ ...f, nextCheckup: e.target.value }))} />
                    </div>
                  </div>
                  
                  {!editMode && (
                    <>
                      <div className="form-group">
                        <label htmlFor="initialFindings">Initial Findings</label>
                        <textarea id="initialFindings" className="form-control" rows={3} placeholder="Initial symptoms and diagnostic findings..." value={addPatientForm.findings} onChange={(e) => setAddPatientForm(f => ({ ...f, findings: e.target.value }))}></textarea>
                      </div>
                      <div className="form-group">
                        <label htmlFor="treatmentPlan">Treatment Plan</label>
                        <textarea id="treatmentPlan" className="form-control" rows={3} placeholder="Initial treatment approach and medications..." value={addPatientForm.treatment} onChange={(e) => setAddPatientForm(f => ({ ...f, treatment: e.target.value }))}></textarea>
                      </div>
                    </>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="monitoringParams">Monitoring Parameters</label>
                    <textarea id="monitoringParams" className="form-control" rows={2} placeholder="e.g., Blood glucose 2x daily, BP weekly..." value={addPatientForm.monitoring} onChange={(e) => setAddPatientForm(f => ({ ...f, monitoring: e.target.value }))}></textarea>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button type="button" className="btn btn-outline" onClick={() => { setAddPatientOpen(false); setEditMode(false); setError(''); }} style={{ flex: 1 }} disabled={loading}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                      {loading ? 'Saving...' : (editMode ? 'Update Record' : 'Add Patient Record')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Log Reading Modal */}
          {addReadingOpen && (
            <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setAddReadingOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Log Health Reading</h3>
                  <button className="close-modal" onClick={() => setAddReadingOpen(false)}>&times;</button>
                </div>
                <form onSubmit={submitReading}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="readingPatient">Patient *</label>
                      <select id="readingPatient" className="form-control" required value={readingForm.patient} onChange={(e) => {
                        const selectedPatient = patients.find(p => (p._id || p.id) === e.target.value);
                        setReadingForm(f => ({ 
                          ...f, 
                          patient: e.target.value,
                          patientId: selectedPatient?._id || selectedPatient?.id,
                          crewId: selectedPatient?.crewId
                        }));
                      }}>
                        <option value="">Select patient</option>
                        {patients.map(p => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.crewName || crewNameById[p.crewId] || 'Unknown'} ({p.primaryCondition || (Array.isArray(p.conditions) ? p.conditions.join(', ') : p.conditions)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="readingDate">Reading Date *</label>
                      <input id="readingDate" type="datetime-local" className="form-control" required value={readingForm.date} onChange={(e) => setReadingForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                  </div>

                  <h4 style={{ color: 'var(--primary)', margin: '20px 0 15px' }}>Vital Signs & Measurements</h4>
                  <div className="chronic-vitals-grid">
                    <div className="chronic-vital-item">
                      <div className="chronic-vital-label">Blood Glucose</div>
                      <input type="number" className="form-control" placeholder="mg/dL" value={readingForm.bloodGlucose} onChange={(e) => setReadingForm(f => ({ ...f, bloodGlucose: e.target.value }))} />
                    </div>
                    <div className="chronic-vital-item">
                      <div className="chronic-vital-label">Blood Pressure</div>
                      <input type="text" className="form-control" placeholder="Systolic/Diastolic" value={readingForm.bloodPressure} onChange={(e) => setReadingForm(f => ({ ...f, bloodPressure: e.target.value }))} />
                    </div>
                    <div className="chronic-vital-item">
                      <div className="chronic-vital-label">Peak Flow</div>
                      <input type="number" className="form-control" placeholder="L/min" value={readingForm.peakFlow} onChange={(e) => setReadingForm(f => ({ ...f, peakFlow: e.target.value }))} />
                    </div>
                    <div className="chronic-vital-item">
                      <div className="chronic-vital-label">Weight</div>
                      <input type="number" step="0.1" className="form-control" placeholder="kg" value={readingForm.weight} onChange={(e) => setReadingForm(f => ({ ...f, weight: e.target.value }))} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="readingNotes">Clinical Notes</label>
                    <textarea id="readingNotes" className="form-control" rows={4} placeholder="Patient symptoms, observations, medication adherence..." value={readingForm.notes} onChange={(e) => setReadingForm(f => ({ ...f, notes: e.target.value }))}></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setAddReadingOpen(false)} style={{ flex: 1 }} disabled={loading}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Reading'}
                    </button>
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
