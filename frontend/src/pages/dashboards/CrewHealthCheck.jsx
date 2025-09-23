import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewHealthCheck() {
  const navigate = useNavigate();
  const user = getUser();

  // Form state (professional layout)
  const [form, setForm] = useState({
    temperature: '',
    heartRate: '',
    systolic: '',
    diastolic: '',
    oxygen: '',
    respiratoryRate: '',
    symptoms: [],
    symptomsDescription: '',
    additionalNotes: '',
    crewId: user?.crewId || 'CD12345',
    submissionDate: ''
  });
  const [errors, setErrors] = useState({});
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, submissionDate: new Date().toISOString().split('T')[0] }));
  }, []);

  const onLogout = () => { clearSession(); navigate('/login'); };
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggleSymptom = (value) => setForm((f) => {
    const set = new Set(f.symptoms);
    if (set.has(value)) set.delete(value); else set.add(value);
    return { ...f, symptoms: Array.from(set) };
  });
  const validate = () => {
    const e = {};
    const t = parseFloat(form.temperature);
    const hr = parseInt(form.heartRate, 10);
    const sys = parseInt(form.systolic, 10);
    const dia = parseInt(form.diastolic, 10);
    const oxy = parseInt(form.oxygen, 10);
    const rr = parseInt(form.respiratoryRate, 10);
    if (!(t >= 35 && t <= 42)) e.temperature = 'Temperature must be between 35°C and 42°C';
    if (!(hr >= 40 && hr <= 200)) e.heartRate = 'Heart rate must be between 40 and 200 BPM';
    if (!(sys >= 70 && sys <= 200) || !(dia >= 40 && dia <= 130)) e.bp = 'Valid systolic: 70-200, diastolic: 40-130';
    if (!(oxy >= 70 && oxy <= 100)) e.oxygen = 'Oxygen saturation must be between 70% and 100%';
    if (!(rr >= 10 && rr <= 40)) e.respiratoryRate = 'Respiratory rate must be between 10 and 40';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Placeholder: submit to backend
    setSuccessOpen(true);
    // reset form (keep crewId and submissionDate)
    setForm((f) => ({ ...f, temperature: '', heartRate: '', systolic: '', diastolic: '', oxygen: '', respiratoryRate: '', symptoms: [], symptomsDescription: '', additionalNotes: '' }));
  };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Daily Health Check</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>
          <section className="health-check-form">
            <h3 className="form-title">Submit Your Daily Health Check</h3>
            <form onSubmit={onSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Temperature (°C) *</label>
                  <input name="temperature" type="number" className="form-control" placeholder="36.5" step="0.1" min="35" max="42" value={form.temperature} onChange={onChange} required />
                  {errors.temperature && <div className="error-message">{errors.temperature}</div>}
                </div>
                <div className="form-group">
                  <label>Heart Rate (BPM) *</label>
                  <input name="heartRate" type="number" className="form-control" placeholder="72" min="40" max="200" value={form.heartRate} onChange={onChange} required />
                  {errors.heartRate && <div className="error-message">{errors.heartRate}</div>}
                </div>
                <div className="form-group">
                  <label>Blood Pressure - Systolic *</label>
                  <input name="systolic" type="number" className="form-control" placeholder="120" min="70" max="200" value={form.systolic} onChange={onChange} required />
                </div>
                <div className="form-group">
                  <label>Blood Pressure - Diastolic *</label>
                  <input name="diastolic" type="number" className="form-control" placeholder="80" min="40" max="130" value={form.diastolic} onChange={onChange} required />
                  {errors.bp && <div className="error-message">{errors.bp}</div>}
                </div>
                <div className="form-group">
                  <label>Oxygen Saturation (%) *</label>
                  <input name="oxygen" type="number" className="form-control" placeholder="98" min="70" max="100" value={form.oxygen} onChange={onChange} required />
                  {errors.oxygen && <div className="error-message">{errors.oxygen}</div>}
                </div>
                <div className="form-group">
                  <label>Respiratory Rate (breaths/min) *</label>
                  <input name="respiratoryRate" type="number" className="form-control" placeholder="16" min="10" max="40" value={form.respiratoryRate} onChange={onChange} required />
                  {errors.respiratoryRate && <div className="error-message">{errors.respiratoryRate}</div>}
                </div>
              </div>

              <div className="form-group">
                <label>Symptoms (if any)</label>
                <div className="checkbox-group">
                  {[
                    { id: 'headache', label: 'Headache' },
                    { id: 'cough', label: 'Cough' },
                    { id: 'fever', label: 'Fever' },
                    { id: 'nausea', label: 'Nausea' },
                    { id: 'fatigue', label: 'Fatigue' },
                    { id: 'other', label: 'Other' },
                  ].map(s => (
                    <label key={s.id} className="checkbox-item">
                      <input type="checkbox" checked={form.symptoms.includes(s.id)} onChange={() => toggleSymptom(s.id)} />
                      {s.label}
                    </label>
                  ))}
                </div>
                <textarea name="symptomsDescription" className="form-control" rows={3} placeholder="Describe any symptoms you're experiencing..." style={{ marginTop: 10 }} value={form.symptomsDescription} onChange={onChange}></textarea>
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea name="additionalNotes" className="form-control" rows={2} placeholder="Any additional information..." value={form.additionalNotes} onChange={onChange}></textarea>
              </div>

              {/* Hidden meta */}
              <input type="hidden" name="crewId" value={form.crewId} />
              <input type="hidden" name="submissionDate" value={form.submissionDate} />

              <button type="submit" className="btn btn-primary btn-block">Submit Health Check</button>
            </form>
          </section>
        </main>
      </div>
      {/* Success Modal */}
      {successOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setSuccessOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Success!</h3>
              <button className="close-modal" onClick={() => setSuccessOpen(false)}>&times;</button>
            </div>
            <p>Your health check has been submitted successfully.</p>
            <button className="btn btn-primary" onClick={() => setSuccessOpen(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
