import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [loading, setLoading] = useState(false);
  const saveTimer = useRef(null);

  // Draft restore (runs once)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const draftKey = `crewHealthCheck:draft:${form.crewId}`;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setForm((f) => ({ ...f, ...parsed, submissionDate: parsed.submissionDate || today }));
      } else {
        setForm((f) => ({ ...f, submissionDate: today }));
      }
    } catch {
      setForm((f) => ({ ...f, submissionDate: today }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!(t >= 35 && t <= 42)) e.temperature = 'Must be 35–42°C';
    if (!(hr >= 40 && hr <= 200)) e.heartRate = 'Must be 40–200 BPM';
    if (!(sys >= 70 && sys <= 200) || !(dia >= 40 && dia <= 130)) e.bp = 'Systolic 70–200, Diastolic 40–130';
    if (!(oxy >= 70 && oxy <= 100)) e.oxygen = 'Must be 70–100%';
    if (!(rr >= 10 && rr <= 40)) e.respiratoryRate = 'Must be 10–40';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Debounced validation while typing
  useEffect(() => {
    const id = setTimeout(() => {
      validate();
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.temperature, form.heartRate, form.systolic, form.diastolic, form.oxygen, form.respiratoryRate]);

  // Autosave draft
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const draftKey = `crewHealthCheck:draft:${form.crewId}`;
        localStorage.setItem(draftKey, JSON.stringify(form));
      } catch {}
    }, 500);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [form]);

  // Removed clearDraft controls and notifications

  // Derived summary and risk
  const summary = useMemo(() => {
    const t = parseFloat(form.temperature);
    const hr = parseInt(form.heartRate || '0', 10);
    const sys = parseInt(form.systolic || '0', 10);
    const dia = parseInt(form.diastolic || '0', 10);
    const oxy = parseInt(form.oxygen || '0', 10);
    const rr = parseInt(form.respiratoryRate || '0', 10);

    const bpCategory = () => {
      if (!sys || !dia) return '—';
      if (sys >= 180 || dia >= 120) return 'Hypertensive crisis';
      if (sys >= 140 || dia >= 90) return 'Hypertension stage 2';
      if (sys >= 130 || dia >= 80) return 'Hypertension stage 1';
      if (sys >= 120 && dia < 80) return 'Elevated';
      return 'Normal';
    };

    let risk = 'Low';
    if (
      (t && (t < 35.5 || t > 38.5)) ||
      (oxy && oxy < 94) ||
      (rr && (rr < 12 || rr > 24)) ||
      (hr && (hr < 50 || hr > 110)) ||
      ['Hypertension stage 2', 'Hypertensive crisis'].includes(bpCategory())
    ) {
      risk = 'High';
    } else if (
      (t && (t < 36 || t > 37.8)) ||
      (oxy && oxy < 96) ||
      (rr && (rr < 14 || rr > 20)) ||
      (hr && (hr < 55 || hr > 100)) ||
      bpCategory() === 'Hypertension stage 1' ||
      bpCategory() === 'Elevated'
    ) {
      risk = 'Moderate';
    }

    return {
      bpLabel: sys && dia ? `${sys}/${dia} (${bpCategory()})` : '—',
      risk,
    };
  }, [form.temperature, form.heartRate, form.systolic, form.diastolic, form.oxygen, form.respiratoryRate]);
  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Daily submission guard (client-side)
    const today = new Date().toISOString().split('T')[0];
    const lastKey = `crewHealthCheck:lastSubmission:${form.crewId}`;
    const last = localStorage.getItem(lastKey);
    if (last === today) return; // silently block duplicate same-day submissions
    setLoading(true);
    try {
      // Placeholder: submit to backend using api helper when backend is ready
      // await api.post('/crew/health-checks', form)
      localStorage.setItem(lastKey, today);
      // reset form (keep crewId and submissionDate)
      setForm((f) => ({ ...f, temperature: '', heartRate: '', systolic: '', diastolic: '', oxygen: '', respiratoryRate: '', symptoms: [], symptomsDescription: '', additionalNotes: '' }));
      // clear draft after successful submit
      try { localStorage.removeItem(`crewHealthCheck:draft:${form.crewId}`); } catch {}
    } catch (err) {
    } finally {
      setLoading(false);
    }
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
              {/* Risk badge removed for clean header */}
            </div>
          </div>
          <section className="health-check-form">
            <h3 className="form-title">Submit Your Daily Health Check</h3>
            <form onSubmit={onSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Temperature (°C) *</label>
                  <input name="temperature" type="number" className="form-control" placeholder="36.5" step="0.1" min="35" max="42" value={form.temperature} onChange={onChange} required aria-invalid={!!errors.temperature} />
                  <div className="error-slot">
                    {errors.temperature ? (
                      <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.temperature}</div>
                    ) : (
                      <div className="hint-message">Range: 35–42°C</div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Heart Rate (BPM) *</label>
                  <input name="heartRate" type="number" className="form-control" placeholder="72" min="40" max="200" value={form.heartRate} onChange={onChange} required aria-invalid={!!errors.heartRate} />
                  <div className="error-slot">
                    {errors.heartRate ? (
                      <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.heartRate}</div>
                    ) : (
                      <div className="hint-message">Range: 40–200 BPM</div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Blood Pressure - Systolic *</label>
                  <input name="systolic" type="number" className="form-control" placeholder="120" min="70" max="200" value={form.systolic} onChange={onChange} required aria-invalid={!!errors.bp} />
                  <div className="error-slot">
                    {errors.bp ? (
                      <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.bp}</div>
                    ) : (
                      <div className="hint-message">Systolic 70–200</div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Blood Pressure - Diastolic *</label>
                  <input name="diastolic" type="number" className="form-control" placeholder="80" min="40" max="130" value={form.diastolic} onChange={onChange} required aria-invalid={!!errors.bp} />
                  <div className="error-slot">
                    {errors.bp ? (
                      <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.bp}</div>
                    ) : (
                      <div className="hint-message">Diastolic 40–130</div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Oxygen Saturation (%) *</label>
                  <input name="oxygen" type="number" className="form-control" placeholder="98" min="70" max="100" value={form.oxygen} onChange={onChange} required aria-invalid={!!errors.oxygen} />
                  <div className="error-slot">
                    {errors.oxygen ? (
                      <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.oxygen}</div>
                    ) : (
                      <div className="hint-message">Range: 70–100%</div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Respiratory Rate (breaths/min) *</label>
                  <input name="respiratoryRate" type="number" className="form-control" placeholder="16" min="10" max="40" value={form.respiratoryRate} onChange={onChange} required aria-invalid={!!errors.respiratoryRate} />
                  <div className="error-slot">
                    {errors.respiratoryRate ? (
                      <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.respiratoryRate}</div>
                    ) : (
                      <div className="hint-message">Range: 10–40</div>
                    )}
                  </div>
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

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Submitting…' : 'Submit Health Check'}</button>
            </form>
          </section>
        </main>
      </div>
      {/* Success modal removed */}
    </div>
  );
}
