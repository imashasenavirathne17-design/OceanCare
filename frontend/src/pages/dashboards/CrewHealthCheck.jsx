import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';
import { createMyMedicalRecord, listMyMedicalRecords, updateMyMedicalRecord, deleteMyMedicalRecord } from '../../lib/crewMedicalRecordsApi';

export default function CrewHealthCheck() {
  const navigate = useNavigate();
  const user = getUser();

  // Form state (professional layout)
  const [form, setForm] = useState({
    temperature: '',
    temperatureUnit: 'C', // 'C' or 'F'
    heartRate: '',
    systolic: '',
    diastolic: '',
    oxygen: '',
    respiratoryRate: '',
    weightKg: '', // optional
    sleepHours: '', // last 24h
    waterLiters: '', // hydration
    symptoms: [],
    symptomsDescription: '',
    additionalNotes: '',
    crewId: user?.crewId || 'CD12345',
    submissionDate: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const saveTimer = useRef(null);
  const [formOpen, setFormOpen] = useState(false);
  const [checks, setChecks] = useState([]);
  const [editingId, setEditingId] = useState(null);

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

  const loadChecks = async () => {
    try {
      const items = await listMyMedicalRecords({ type: 'Daily Check' });
      const mapped = (Array.isArray(items) ? items : []).map((it) => ({
        id: it._id || it.id,
        date: it.date,
        type: it.recordType,
        condition: it.condition,
        notes: it.notes,
        status: it.status || 'open',
        nextDue: it.nextDueDate,
        payload: { ...(it.metadata || {}) },
      }));
      setChecks(mapped);
    } catch {}
  };

  const isValidObjectId = (v) => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);

  useEffect(() => {
    loadChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogout = () => { clearSession(); navigate('/login'); };
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onTempUnitChange = (e) => {
    const to = e.target.value; // 'C' or 'F'
    setForm((f) => {
      let temp = f.temperature;
      if (temp !== '' && !Number.isNaN(parseFloat(temp))) {
        const t = parseFloat(temp);
        if (f.temperatureUnit === 'C' && to === 'F') {
          temp = ((t * 9) / 5 + 32).toFixed(1);
        } else if (f.temperatureUnit === 'F' && to === 'C') {
          temp = (((t - 32) * 5) / 9).toFixed(1);
        }
      }
      return { ...f, temperatureUnit: to, temperature: temp };
    });
  };
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
    // Temperature validation depends on unit
    if (form.temperatureUnit === 'C') {
      if (!(t >= 35 && t <= 42)) e.temperature = 'Must be 35–42°C';
    } else {
      if (!(t >= 95 && t <= 107.6)) e.temperature = 'Must be 95–107.6°F';
    }
    if (!(hr >= 40 && hr <= 200)) e.heartRate = 'Must be 40–200 BPM';
    if (!(sys >= 70 && sys <= 200) || !(dia >= 40 && dia <= 130)) e.bp = 'Systolic 70–200, Diastolic 40–130';
    if (!(oxy >= 70 && oxy <= 100)) e.oxygen = 'Must be 70–100%';
    if (!(rr >= 10 && rr <= 40)) e.respiratoryRate = 'Must be 10–40';
    // Optional fields validation if provided
    const wt = parseFloat(form.weightKg);
    if (form.weightKg !== '' && !(wt >= 20 && wt <= 250)) e.weightKg = 'Weight should be 20–250 kg';
    const sh = parseFloat(form.sleepHours);
    if (form.sleepHours !== '' && !(sh >= 0 && sh <= 24)) e.sleepHours = 'Sleep should be 0–24 hours';
    const wl = parseFloat(form.waterLiters);
    if (form.waterLiters !== '' && !(wl >= 0 && wl <= 10)) e.waterLiters = 'Water intake should be 0–10 liters';
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
  }, [form.temperature, form.temperatureUnit, form.heartRate, form.systolic, form.diastolic, form.oxygen, form.respiratoryRate, form.weightKg, form.sleepHours, form.waterLiters]);

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
  // Lazy-load jsPDF for exports
  const ensureJsPDF = async () => {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload = resolve; s.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(s);
    });
    return window.jspdf.jsPDF;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Daily submission guard (server-side) using local submissionDate to avoid timezone issues
    const today = form.submissionDate || new Date().toISOString().split('T')[0];
    if (!editingId) {
      try {
        const existing = await listMyMedicalRecords({ type: 'Daily Check', from: today, to: today });
        if (Array.isArray(existing) && existing.length > 0) {
          const proceed = window.confirm('A daily health check already exists for today. Submit another entry anyway?');
          if (!proceed) return;
        }
      } catch {}
    }
    setLoading(true);
    try {
      const recordPayload = {
        recordType: 'Daily Check',
        condition: form.symptoms && form.symptoms.length ? 'yes' : 'no',
        date: form.submissionDate || today,
        notes: form.additionalNotes || '',
        status: 'open',
        nextDueDate: new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10),
        metadata: {
          temperature: form.temperature,
          temperatureUnit: form.temperatureUnit,
          heartRate: form.heartRate,
          systolic: form.systolic,
          diastolic: form.diastolic,
          oxygen: form.oxygen,
          respiratoryRate: form.respiratoryRate,
          weightKg: form.weightKg,
          sleepHours: form.sleepHours,
          waterLiters: form.waterLiters,
          symptoms: form.symptoms,
          symptomsDescription: form.symptomsDescription,
          crewId: form.crewId,
        },
        metrics: {
          risk: summary.risk,
          bpLabel: summary.bpLabel,
        },
      };
      if (editingId && isValidObjectId(editingId)) {
        try {
          await updateMyMedicalRecord(editingId, recordPayload);
        } catch (e) {
          if (e && e.response && e.response.status === 404) {
            await createMyMedicalRecord(recordPayload);
          } else {
            throw e;
          }
        }
      } else {
        await createMyMedicalRecord(recordPayload);
      }
      // refresh list from backend
      await loadChecks();
      // reset form (keep crewId and submissionDate)
      setForm((f) => ({ ...f, temperature: '', heartRate: '', systolic: '', diastolic: '', oxygen: '', respiratoryRate: '', symptoms: [], symptomsDescription: '', additionalNotes: '' }));
      // clear draft after successful submit
      try { localStorage.removeItem(`crewHealthCheck:draft:${form.crewId}`); } catch {}
      // close after submit for UX symmetry with other pages
      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      const msg = (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) || err?.message || 'Failed to submit';
      alert(`Submission failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (row) => {
    if (!row) return;
    const p = row.payload || {};
    const lines = [
      `Date: ${row.date}`,
      `Temperature: ${p.temperature || '—'} °${p.temperatureUnit || 'C'}`,
      `Heart Rate: ${p.heartRate || '—'} bpm`,
      `BP: ${p.systolic || '—'}/${p.diastolic || '—'}`,
      `SpO₂: ${p.oxygen || '—'}%`,
      `Respiratory Rate: ${p.respiratoryRate || '—'}`,
      `Weight: ${p.weightKg || '—'} kg`,
      `Sleep: ${p.sleepHours || '—'} h`,
      `Water: ${p.waterLiters || '—'} L`,
      `Symptoms: ${Array.isArray(p.symptoms) && p.symptoms.length ? p.symptoms.join(', ') : '—'}`,
      `Notes: ${p.additionalNotes || '—'}`,
    ];
    alert(lines.join('\n'));
  };

  const openEdit = (row) => {
    if (!row) return;
    const p = row.payload || {};
    setEditingId(row.id);
    setForm((f) => ({ ...f, ...p, submissionDate: row.date || f.submissionDate }));
    setFormOpen(true);
    setTimeout(() => {
      const el = document.querySelector('input[name="temperature"]');
      if (el) el.focus();
    }, 0);
  };

  const handleDelete = async (row) => {
    if (!row) return;
    if (!window.confirm('Delete this daily health check record?')) return;
    try {
      if (row.id && /^[a-fA-F0-9]{24}$/.test(row.id)) {
        await deleteMyMedicalRecord(row.id);
      }
    } catch (e) {
      const msg = (e && e.response && e.response.data && (e.response.data.message || e.response.data.error)) || e?.message || 'Failed to delete';
      alert(`Delete failed: ${msg}`);
    }
    await loadChecks();
  };

  const downloadCSV = (row) => {
    if (!row) return;
    const p = row.payload || {};
    const headers = ['Field','Value'];
    const rows = [
      ['Date', row.date],
      ['Type', row.type],
      ['Condition', row.condition],
      ['Notes', row.notes || ''],
      ['Status', row.status],
      ['Next Due', row.nextDue || '—'],
      ['Temperature', `${p.temperature || ''} °${p.temperatureUnit || 'C'}`],
      ['Heart Rate', `${p.heartRate || ''} bpm`],
      ['Blood Pressure', `${p.systolic || ''}/${p.diastolic || ''}`],
      ['SpO₂', `${p.oxygen || ''}%`],
      ['Respiratory Rate', `${p.respiratoryRate || ''}`],
      ['Weight (kg)', `${p.weightKg || ''}`],
      ['Sleep (h)', `${p.sleepHours || ''}`],
      ['Water (L)', `${p.waterLiters || ''}`],
    ];
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `healthcheck-${row.id}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const downloadPDF = async (row) => {
    if (!row) return;
    const p = row.payload || {};
    const jsPDF = await ensureJsPDF();
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48; let y = margin;
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('Daily Health Check', margin, y); y += 14;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y); y += 20; doc.setTextColor(0);
    const kv = {
      Date: row.date,
      Type: row.type,
      Condition: row.condition,
      Notes: row.notes || '—',
      Status: row.status,
      'Next Due': row.nextDue || '—',
      Temperature: `${p.temperature || '—'} °${p.temperatureUnit || 'C'}`,
      'Heart Rate': `${p.heartRate || '—'} bpm`,
      'Blood Pressure': `${p.systolic || '—'}/${p.diastolic || '—'}`,
      'SpO₂': `${p.oxygen || '—'}%`,
      'Respiratory Rate': `${p.respiratoryRate || '—'}`,
      'Weight (kg)': `${p.weightKg || '—'}`,
      'Sleep (h)': `${p.sleepHours || '—'}`,
      'Water (L)': `${p.waterLiters || '—'}`,
    };
    const keyW = 170; const lineH = 16;
    Object.entries(kv).forEach(([k,v]) => {
      if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(k, margin, y);
      doc.setFont('helvetica','normal'); doc.setFontSize(11);
      const text = doc.splitTextToSize(String(v), pageW - margin - keyW);
      doc.text(text, margin + keyW, y);
      y += Math.max(lineH, text.length * 12);
    });
    doc.save(`healthcheck-${row.id}.pdf`);
  };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="header">
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

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Your Daily Check</div>
              <div className="page-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    // Reload draft from localStorage
                    try {
                      const draftKey = `crewHealthCheck:draft:${form.crewId}`;
                      const raw = localStorage.getItem(draftKey);
                      if (raw) {
                        const parsed = JSON.parse(raw);
                        setForm((f) => ({ ...f, ...parsed }));
                      }
                    } catch {}
                  }}
                >
                  <i className="fas fa-sync" /> Refresh
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setFormOpen(true);
                    setTimeout(() => {
                      const el = document.querySelector('input[name="temperature"]');
                      if (el) el.focus();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 0);
                  }}
                >
                  <i className="fas fa-plus" /> New Check
                </button>
              </div>
            </div>

            {!formOpen && (
              <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e7eb', marginBottom: 16 }}>
                Click "New Check" to open the daily health check form.
              </div>
            )}
          </div>

          {formOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 720, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 className="form-title" style={{ margin: 0 }}>{editingId ? 'Edit Daily Health Check' : 'New Daily Health Check'}</h3>
                  <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)} aria-label="Close" style={{ padding: '6px 10px' }}>×</button>
                </div>
                <form onSubmit={onSubmit}>
                  <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: 16 }}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Body Temperature *</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            name="temperature"
                            type="number"
                            className="form-control"
                            placeholder={form.temperatureUnit === 'C' ? '36.5' : '97.7'}
                            step="0.1"
                            value={form.temperature}
                            onChange={onChange}
                            required
                            aria-invalid={!!errors.temperature}
                            style={{ flex: 1 }}
                          />
                          <select className="form-control" value={form.temperatureUnit} onChange={onTempUnitChange} style={{ width: 100 }}>
                            <option value="C">°C</option>
                            <option value="F">°F</option>
                          </select>
                        </div>
                        <div className="error-slot">
                          {errors.temperature ? (
                            <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.temperature}</div>
                          ) : (
                            <div className="hint-message">{form.temperatureUnit === 'C' ? 'Range: 35–42°C' : 'Range: 95–107.6°F'}</div>
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
                      <div className="form-group">
                        <label>Body Weight (kg)</label>
                        <input name="weightKg" type="number" className="form-control" placeholder="e.g., 70" step="0.1" value={form.weightKg} onChange={onChange} aria-invalid={!!errors.weightKg} />
                        <div className="error-slot">
                          {errors.weightKg ? (
                            <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.weightKg}</div>
                          ) : (
                            <div className="hint-message">Optional</div>
                          )}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Sleep Duration (last 24h) - Hours</label>
                        <input name="sleepHours" type="number" className="form-control" placeholder="e.g., 7.5" step="0.1" min="0" max="24" value={form.sleepHours} onChange={onChange} aria-invalid={!!errors.sleepHours} />
                        <div className="error-slot">
                          {errors.sleepHours ? (
                            <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.sleepHours}</div>
                          ) : (
                            <div className="hint-message">Optional</div>
                          )}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Hydration / Water Intake (Liters)</label>
                        <input name="waterLiters" type="number" className="form-control" placeholder="e.g., 2.0" step="0.1" min="0" max="10" value={form.waterLiters} onChange={onChange} aria-invalid={!!errors.waterLiters} />
                        <div className="error-slot">
                          {errors.waterLiters ? (
                            <div className="error-message"><i className="fas fa-exclamation-circle" aria-hidden="true"></i> {errors.waterLiters}</div>
                          ) : (
                            <div className="hint-message">Optional</div>
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
                  </div>

                  <input type="hidden" name="crewId" value={form.crewId} />
                  <input type="hidden" name="submissionDate" value={form.submissionDate} />

                  <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid #e5e7eb', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? (editingId ? 'Updating…' : 'Submitting…') : (editingId ? 'Update Health Check' : 'Submit Health Check')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">My Daily Health Checks</div>
            </div>
            <div className="table-responsive">
              {checks.length === 0 ? (
                <div style={{ padding: 16, border: '1px dashed #e5e7eb', borderRadius: 10, color: '#6b7280' }}>
                  No records yet. Submit your first daily check.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Condition</th>
                      <th>Notes</th>
                      <th>Status</th>
                      <th>Next Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>{row.type}</td>
                        <td>{row.condition}</td>
                        <td>{row.notes?.trim() ? row.notes : '—'}</td>
                        <td><span className="status-badge status-warning">{row.status}</span></td>
                        <td>{row.nextDue || '—'}</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewDetails(row)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(row)}>Delete</button>
                          <button className="btn btn-action btn-sm" onClick={() => downloadCSV(row)}><i className="fas fa-file-csv" /> CSV</button>
                          <button className="btn btn-danger btn-sm" onClick={() => downloadPDF(row)}><i className="fas fa-file-pdf" /> PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Success modal removed */}
    </div>
  );
}
