import React, { useMemo, useState } from 'react';
import './healthEmergency.css';
import HealthSidebar from './HealthSidebar';
import { getUser, clearSession } from '../../lib/token';
import { useNavigate } from 'react-router-dom';

export default function HealthEmergency() {
  const user = getUser();
  const navigate = useNavigate();

  // Tabs
  const [activeTab, setActiveTab] = useState('active');

  // Modals
  const [modal, setModal] = useState({ medevac: false, emergencyAlert: false, contactSpecialist: false });
  const openModal = (k) => setModal((m) => ({ ...m, [k]: true }));
  const closeModal = (k) => setModal((m) => ({ ...m, [k]: false }));

  // Form state for Emergency Alert
  const [alertForm, setAlertForm] = useState({
    emergencyType: '', patientName: '', crewId: '', emergencyLocation: '', emergencyDescription: '', immediateActions: '',
    recipients: { captain: true, 'first-officer': true, 'emergency-team': true, 'all-hands': false },
  });

  const onFormChange = (e) => {
    const { id, value } = e.target;
    setAlertForm((f) => ({ ...f, [id]: value }));
  };

  const onRecipientToggle = (key) => {
    setAlertForm((f) => ({ ...f, recipients: { ...f.recipients, [key]: !f.recipients[key] } }));
  };

  const sendEmergencyAlert = (e) => {
    e.preventDefault();
    if (!alertForm.emergencyType || !alertForm.patientName || !alertForm.emergencyLocation || !alertForm.emergencyDescription) {
      return alert('Please fill in all required fields.');
    }
    alert(`Emergency alert for ${alertForm.patientName} (${alertForm.emergencyType}) has been sent!`);
    setAlertForm({
      emergencyType: '', patientName: '', crewId: '', emergencyLocation: '', emergencyDescription: '', immediateActions: '',
      recipients: { captain: true, 'first-officer': true, 'emergency-team': true, 'all-hands': false },
    });
    closeModal('emergencyAlert');
  };

  const triggerEmergency = () => {
    if (confirm('Are you sure you want to trigger a full emergency alert? This will notify the entire emergency response team.')) {
      alert('Emergency alert triggered! Emergency response team has been notified.');
    }
  };

  const protocols = useMemo(() => ([
    { id: 'cardiac', icon: 'fas fa-heart', title: 'Cardiac Emergency', desc: 'Protocol for heart attacks, cardiac arrest' },
    { id: 'respiratory', icon: 'fas fa-lungs', title: 'Respiratory Distress', desc: 'Protocol for breathing difficulties, asthma' },
    { id: 'trauma', icon: 'fas fa-user-injured', title: 'Severe Injury', desc: 'Protocol for fractures, severe bleeding' },
    { id: 'allergic', icon: 'fas fa-allergies', title: 'Anaphylaxis', desc: 'Protocol for severe allergic reactions' },
  ]), []);

  const activeEmergencies = [
    { id: 1, type: 'Cardiac Emergency', icon: 'fas fa-heart', className: 'danger', patient: 'James Wilson (CD12347)', details: ['Chest pain, shortness of breath', 'Location: Engine Room'], time: 'Reported: 5 minutes ago', critical: true },
    { id: 2, type: 'Severe Injury', icon: 'fas fa-user-injured', className: 'emergency', patient: 'Michael Brown (CD12349)', details: ['Deep laceration to arm, heavy bleeding', 'Location: Deck Area'], time: 'Reported: 15 minutes ago' },
    { id: 3, type: 'Respiratory Distress', icon: 'fas fa-lungs', className: 'warning', patient: 'Robert Kim (CD12350)', details: ['Severe asthma attack, low oxygen saturation', 'Location: Crew Quarters'], time: 'Reported: 25 minutes ago' },
  ];

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={() => { clearSession(); navigate('/login'); }} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Emergency Response</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Emergency Alert Banner */}
          <div className="emergency-banner">
            <i className="fas fa-exclamation-triangle"></i>
            <div className="emergency-content">
              <div className="emergency-title">ACTIVE EMERGENCY: Crew Member Requires Immediate Attention</div>
              <div>James Wilson (CD12347) is experiencing chest pain and shortness of breath</div>
            </div>
            <button className="btn btn-outline" onClick={() => alert('Viewing emergency details')}>View Details</button>
          </div>

          {/* Quick Actions */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Emergency Quick Actions</div>
            </div>

            <div className="quick-actions">
              <button className="btn btn-emergency" onClick={triggerEmergency}><i className="fas fa-broadcast-tower"></i> Alert Emergency Team</button>
              <button className="btn btn-warning" onClick={() => openModal('medevac')}><i className="fas fa-ambulance"></i> Request Medevac</button>
              <button className="btn btn-outline" onClick={() => openModal('emergencyAlert')}><i className="fas fa-bell"></i> Send Emergency Alert</button>
              <button className="btn btn-outline" onClick={() => openModal('contactSpecialist')}><i className="fas fa-user-md"></i> Contact Specialist</button>
            </div>

            <div className="protocols-container">
              {protocols.map((p) => (
                <div key={p.id} className="protocol-item" onClick={() => alert(`Viewing protocol: ${p.id}`)}>
                  <div className="protocol-icon"><i className={p.icon}></i></div>
                  <div className="protocol-title">{p.title}</div>
                  <div className="protocol-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Management */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Emergency Management</div>
            </div>

            <div className="tabs">
              <div className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')} data-tab="active">Active Emergencies</div>
              <div className={`tab ${activeTab === 'protocols' ? 'active' : ''}`} onClick={() => setActiveTab('protocols')} data-tab="protocols">Emergency Protocols</div>
              <div className={`tab ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')} data-tab="contacts">Emergency Contacts</div>
              <div className={`tab ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')} data-tab="resources">Emergency Resources</div>
            </div>

            {/* Active Emergencies Tab */}
            {activeTab === 'active' && (
              <div className="tab-content active" id="active-tab">
                <div className="cards-container">
                  {activeEmergencies.map((em) => (
                    <div key={em.id} className={`card ${em.className === 'danger' ? 'alert' : ''}`}>
                      <div className="card-header">
                        <div className="card-title">{em.type}</div>
                        <div className={`card-icon ${em.className}`}>
                          <i className={em.icon}></i>
                        </div>
                      </div>
                      <div className="card-content">
                        <div className="card-patient">{em.patient}</div>
                        {em.details.map((d, i) => (<div key={i} className="card-details">{d}</div>))}
                        <div className={`card-time ${em.critical ? 'time-critical' : ''}`}>{em.time}</div>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => alert(`Viewing details for emergency ID: ${em.id}`)}>View Details</button>
                        <button className="btn btn-outline btn-sm" onClick={() => alert(`Updating status for emergency ID: ${em.id}`)}>Update Status</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Protocols Tab */}
            {activeTab === 'protocols' && (
              <div className="tab-content active" id="protocols-tab">
                <div className="page-header"><div className="page-title">Emergency Response Protocols</div></div>
                <div className="cards-container">
                  {[
                    { id: 'cardiac', title: 'Cardiac Emergency Protocol', code: 'EM-001', updated: '2023-08-15', steps: 15 },
                    { id: 'respiratory', title: 'Respiratory Distress Protocol', code: 'EM-002', updated: '2023-07-22', steps: 12 },
                    { id: 'trauma', title: 'Severe Injury Protocol', code: 'EM-003', updated: '2023-09-05', steps: 18 },
                  ].map((pr) => (
                    <div key={pr.id} className="card protocol">
                      <div className="card-header">
                        <div className="card-title">{pr.title}</div>
                        <div className="card-icon warning"><i className="fas fa-file-medical"></i></div>
                      </div>
                      <div className="card-content">
                        <div className="card-details">Protocol #{pr.code}</div>
                        <div className="card-details">Last updated: {pr.updated}</div>
                        <div className="card-details">Steps: {pr.steps}</div>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => alert(`Viewing protocol: ${pr.id}`)}>View Protocol</button>
                        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="tab-content active" id="contacts-tab">
                <div className="page-header"><div className="page-title">Emergency Contacts</div></div>
                <div className="contacts-container">
                  {[
                    { initials: 'C', name: 'Captain Rodriguez', role: 'Vessel Captain', info: ['Bridge: Ext. 101', 'Mobile: +1-555-0101'] },
                    { initials: 'FO', name: 'First Officer Chen', role: 'Second in Command', info: ['Bridge: Ext. 102', 'Mobile: +1-555-0102'] },
                    { initials: 'CM', name: 'Chief Engineer Mbeki', role: 'Engine Department', info: ['Engine Room: Ext. 201', 'Mobile: +1-555-0201'] },
                    { initials: 'IM', name: 'Inventory Manager', role: 'Medical Supplies', info: ['Office: Ext. 305', 'Mobile: +1-555-0305'] },
                  ].map((c, idx) => (
                    <div key={idx} className="contact-card">
                      <div className="contact-avatar">{c.initials}</div>
                      <div className="contact-name">{c.name}</div>
                      <div className="contact-role">{c.role}</div>
                      {c.info.map((i, n) => (<div key={n} className="contact-info">{i}</div>))}
                      <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }}>Contact</button>
                    </div>
                  ))}
                </div>

                <div className="page-content" style={{ marginTop: 30 }}>
                  <div className="page-header"><div className="page-title">External Emergency Contacts</div></div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr><th>Service</th><th>Contact Number</th><th>Availability</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {[
                          ['Medical Emergency Hotline', '+1-800-MED-HELP', '24/7'],
                          ['Coast Guard Emergency', '+1-800-COASTGD', '24/7'],
                          ['Medical Evacuation', '+1-800-MED-EVAC', '24/7'],
                          ['Toxicology Control Center', '+1-800-POISON1', '24/7'],
                        ].map((row, i) => (
                          <tr key={i}>
                            <td>{row[0]}</td>
                            <td>{row[1]}</td>
                            <td>{row[2]}</td>
                            <td className="action-buttons">
                              <button className="btn btn-outline btn-sm">Call</button>
                              <button className="btn btn-outline btn-sm">Save</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="tab-content active" id="resources-tab">
                <div className="page-header"><div className="page-title">Emergency Resources</div></div>
                <div className="cards-container">
                  {[
                    { icon: 'fas fa-clipboard-list', title: 'Emergency Equipment Checklist', desc: 'Comprehensive checklist for emergency medical equipment', sub: 'Last verified: 2023-10-15' },
                    { icon: 'fas fa-pills', title: 'Emergency Drug Dosages', desc: 'Quick reference for emergency medication dosages', sub: 'Updated: 2023-09-20' },
                    { icon: 'fas fa-helicopter', title: 'Medevac Procedures', desc: 'Step-by-step medical evacuation procedures', sub: 'Last revised: 2023-08-10' },
                  ].map((r, i) => (
                    <div key={i} className="card resource">
                      <div className="card-header">
                        <div className="card-title">{r.title}</div>
                        <div className="card-icon info"><i className={r.icon}></i></div>
                      </div>
                      <div className="card-content">
                        <div className="card-details">{r.desc}</div>
                        <div className="card-details">{r.sub}</div>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-outline btn-sm">View</button>
                        <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {modal.emergencyAlert && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal('emergencyAlert')}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Send Emergency Alert</h3>
              <button className="close-modal" onClick={() => closeModal('emergencyAlert')}>&times;</button>
            </div>

            <form onSubmit={sendEmergencyAlert}>
              <div className="form-group">
                <label htmlFor="emergencyType">Emergency Type *</label>
                <select id="emergencyType" className="form-control" value={alertForm.emergencyType} onChange={onFormChange} required>
                  <option value="">Select emergency type</option>
                  <option value="cardiac">Cardiac Emergency</option>
                  <option value="respiratory">Respiratory Distress</option>
                  <option value="trauma">Severe Injury/Trauma</option>
                  <option value="allergic">Anaphylaxis/Allergic Reaction</option>
                  <option value="neurological">Neurological Emergency</option>
                  <option value="other">Other Medical Emergency</option>
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="patientName">Patient Name *</label>
                  <input type="text" id="patientName" className="form-control" placeholder="Patient name" value={alertForm.patientName} onChange={onFormChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="crewId">Crew ID</label>
                  <input type="text" id="crewId" className="form-control" placeholder="Crew identification" value={alertForm.crewId} onChange={onFormChange} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="emergencyLocation">Emergency Location *</label>
                <input type="text" id="emergencyLocation" className="form-control" placeholder="Where is the emergency?" value={alertForm.emergencyLocation} onChange={onFormChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="emergencyDescription">Emergency Description *</label>
                <textarea id="emergencyDescription" className="form-control" rows={4} placeholder="Describe the emergency situation, symptoms, and current condition..." value={alertForm.emergencyDescription} onChange={onFormChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="immediateActions">Immediate Actions Taken</label>
                <textarea id="immediateActions" className="form-control" rows={3} placeholder="What immediate actions have been taken?" value={alertForm.immediateActions} onChange={onFormChange} />
              </div>

              <div className="form-group">
                <label>Alert Recipients *</label>
                <div>
                  {Object.entries(alertForm.recipients).map(([k, v]) => (
                    <label key={k} style={{ marginRight: 10 }}>
                      <input type="checkbox" checked={v} onChange={() => onRecipientToggle(k)} /> {k.replace('-', ' ')}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => closeModal('emergencyAlert')} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-emergency" style={{ flex: 1 }}>Send Emergency Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.medevac && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal('medevac')}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Request Medevac</h3>
              <button className="close-modal" onClick={() => closeModal('medevac')}>&times;</button>
            </div>
            <p>Please confirm medevac request. This will notify the Coast Guard and relevant authorities.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => closeModal('medevac')} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-warning" onClick={() => { alert('Medevac requested. Stand by for instructions.'); closeModal('medevac'); }} style={{ flex: 1 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {modal.contactSpecialist && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal('contactSpecialist')}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Contact Specialist</h3>
              <button className="close-modal" onClick={() => closeModal('contactSpecialist')}>&times;</button>
            </div>
            <p>Connecting you to an on-call specialist...</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => closeModal('contactSpecialist')} style={{ flex: 1 }}>Close</button>
              <button className="btn btn-primary" onClick={() => alert('Specialist contacted.')} style={{ flex: 1 }}>Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
