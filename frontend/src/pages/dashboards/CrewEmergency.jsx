import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewEmergency() {
  const navigate = useNavigate();
  const user = getUser();

  const [form, setForm] = useState({
    type: '',
    location: '',
    description: '',
    urgency: 'high',
    crewId: user?.crewId || 'CD12345',
    date: new Date().toISOString(),
  });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // keep date current each mount
    setForm((f) => ({ ...f, date: new Date().toISOString() }));
  }, []);

  const onLogout = () => { clearSession(); navigate('/login'); };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const triggerEmergencyAlert = () => {
    if (window.confirm('Are you sure you want to trigger an emergency alert? This will notify all emergency personnel.')) {
      setModalOpen(true);
      // Here you could also POST to backend immediate alert endpoint
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.type || !form.description) {
      alert('Please select an emergency type and provide a description.');
      return;
    }
    setModalOpen(true);
    // Simulate submission success; integrate backend call as needed
    setForm({ type: '', location: '', description: '', urgency: 'high', crewId: user?.crewId || 'CD12345', date: new Date().toISOString() });
  };

  const contacts = [
    { icon: 'fas fa-user-md', name: 'Dr. Sarah Johnson', role: 'Health Officer', phone: 'Ext. 701', channel: 'Channel 7' },
    { icon: 'fas fa-plus-circle', name: 'Michael Chen', role: 'Emergency Officer', phone: 'Ext. 702', channel: 'Channel 2' },
    { icon: 'fas fa-user-shield', name: 'Captain Rodriguez', role: 'Ship Captain', phone: 'Ext. 700', channel: 'Channel 1' },
    { icon: 'fas fa-first-aid', name: 'Medical Team', role: 'Emergency Response', phone: 'Ext. 703', channel: 'Channel 9' },
  ];

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <CrewSidebar onLogout={onLogout} />

        {/* Main Content */}
        <main className="main-content">
          <div className="dash-header">
            <h2>Emergency Assistance</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="emergency-container" style={{ background: '#fff', borderRadius: 10, boxShadow: '0 5px 15px rgba(0,0,0,0.05)', padding: 30, marginBottom: 30, textAlign: 'center' }}>
            <div className="emergency-alert" style={{ background: 'linear-gradient(135deg, var(--danger) 0%, #c1121f 100%)', color: '#fff', padding: 40, borderRadius: 10, marginBottom: 30 }}>
              <div className="emergency-icon" style={{ fontSize: 60, marginBottom: 20 }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2 className="emergency-title" style={{ fontSize: 28, marginBottom: 15 }}>Emergency Alert System</h2>
              <p className="emergency-description" style={{ fontSize: 16, marginBottom: 25, opacity: 0.9 }}>Use this button only in case of genuine emergency. Health and Emergency Officers will be notified immediately.</p>
              <button className="btn btn-danger" onClick={triggerEmergencyAlert} style={{ fontSize: 18, padding: '15px 30px' }}>
                <i className="fas fa-bell"></i> Trigger Emergency Alert
              </button>
            </div>

            <div className="emergency-form" style={{ background: '#f8f9fa', padding: 25, borderRadius: 10, marginTop: 30, textAlign: 'left' }}>
              <h3 className="form-title" style={{ fontSize: 22, marginBottom: 20, color: 'var(--dark)', textAlign: 'left' }}>Report Emergency Situation</h3>
              <form onSubmit={onSubmit} id="emergencyForm">
                <div className="form-group">
                  <label>Emergency Type *</label>
                  <select name="type" className="form-control" value={form.type} onChange={onChange} required>
                    <option value="">Select emergency type</option>
                    <option value="medical">Medical Emergency</option>
                    <option value="safety">Safety Concern</option>
                    <option value="symptoms">Severe Symptoms</option>
                    <option value="accident">Accident/Injury</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Your Current Location</label>
                  <input type="text" name="location" className="form-control" placeholder="Deck, cabin number, or area" value={form.location} onChange={onChange} />
                </div>

                <div className="form-group">
                  <label>Emergency Description *</label>
                  <textarea name="description" className="form-control" placeholder="Please describe the emergency situation in detail..." value={form.description} onChange={onChange} required></textarea>
                </div>

                <div className="form-group">
                  <label>Urgency Level</label>
                  <select name="urgency" className="form-control" value={form.urgency} onChange={onChange}>
                    <option value="high">High - Immediate response needed</option>
                    <option value="medium">Medium - Response within 30 minutes</option>
                    <option value="low">Low - Non-urgent but important</option>
                  </select>
                </div>

                <input type="hidden" name="crewId" value={form.crewId} />
                <input type="hidden" name="date" value={form.date} />

                <button type="submit" className="btn btn-danger" style={{ width: '100%', fontSize: 18, padding: '15px 30px' }}>
                  <i className="fas fa-paper-plane"></i> Submit Emergency Report
                </button>
              </form>
            </div>
          </div>

          <div className="emergency-contacts" style={{ background: '#fff', borderRadius: 10, boxShadow: '0 5px 15px rgba(0,0,0,0.05)', padding: 30, marginBottom: 30 }}>
            <h3 className="form-title">Emergency Contacts</h3>
            <p>In case of emergency, you can directly contact these officers:</p>
            <div className="contacts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginTop: 20 }}>
              {contacts.map((c, i) => (
                <div key={i} className="contact-card" style={{ background: '#f8f9fa', padding: 20, borderRadius: 8, textAlign: 'center', transition: 'transform .3s' }}>
                  <div className="contact-icon" style={{ fontSize: 30, color: 'var(--primary)', marginBottom: 15 }}>
                    <i className={c.icon}></i>
                  </div>
                  <div className="contact-name" style={{ fontWeight: 600, marginBottom: 5 }}>{c.name}</div>
                  <div className="contact-role" style={{ color: '#777', fontSize: 14, marginBottom: 10 }}>{c.role}</div>
                  <div className="contact-info" style={{ fontSize: 14 }}>
                    <p><i className="fas fa-phone"></i> {c.phone}</p>
                    <p><i className="fas fa-walkie-talkie"></i> {c.channel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Emergency Modal */}
      {modalOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setModalOpen(false)}>
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div className="modal-header">
              <h3 className="modal-title">Emergency Alert Sent!</h3>
              <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-icon" style={{ fontSize: 50, color: 'var(--danger)', margin: '20px 0' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <p>Health and Emergency Officers have been notified of your emergency.</p>
            <p><strong>Response team is on the way.</strong></p>
            <p>Please stay where you are if it is safe to do so.</p>
            <button className="btn btn-danger" onClick={() => setModalOpen(false)} style={{ marginTop: 20 }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
