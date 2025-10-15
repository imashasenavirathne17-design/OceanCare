import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CrewSidebar from './CrewSidebar';
import { getUser, clearSession } from '../../lib/token';

const PRIMARY_SYMPTOMS = [
  'Headache',
  'Fever',
  'Cough',
  'Fatigue',
  'Dizziness',
  'Nausea',
  'Sore Throat',
  'Shortness of Breath',
  'Chest Pain',
  'Muscle Aches',
  'Vomiting',
  'Diarrhea',
  'Rash',
  'Other',
];

const OTHER_SYMPTOMS = [
  'Runny Nose',
  'Sneezing',
  'Chills',
  'Loss of Taste',
  'Loss of Smell',
  'Abdominal Pain',
  'Back Pain',
  'Joint Pain',
  'Sore Muscles',
  'Lightheadedness',
  'Heart Palpitations',
];

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];
const FREQUENCY_OPTIONS = ['Constant', 'Intermittent', 'Occasional'];

export default function CrewSymptoms() {
  const user = getUser();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reports, setReports] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    primarySymptom: '',
    otherSymptoms: new Set(),
    onsetDate: '', // yyyy-mm-dd
    onsetTime: '', // HH:MM
    severity: '',
    frequency: '',
    durationValue: '',
    durationUnit: 'Hours',
    notes: '',
  });

  const onLogout = () => { clearSession(); navigate('/login'); };

  useEffect(() => {
    // Load existing (local) reports to show history; replace with backend later
    const raw = localStorage.getItem('oc_symptom_reports');
    try {
      const arr = raw ? JSON.parse(raw) : [];
      setReports(Array.isArray(arr) ? arr : []);
    } catch {
      setReports([]);
    }
  }, []);

  // Lazy-load jsPDF from CDN to avoid bundling dependency
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

  const formValid = useMemo(() => {
    if (!form.primarySymptom) return false;
    if (!form.onsetDate || !form.onsetTime) return false;
    if (!form.severity) return false;
    return true;
  }, [form]);

  const updateField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const toggleOtherSymptom = (sym) => setForm((prev) => {
    const next = new Set(prev.otherSymptoms);
    if (next.has(sym)) next.delete(sym); else next.add(sym);
    return { ...prev, otherSymptoms: next };
  });


  const pad2 = (n) => String(n).padStart(2, '0');
  const localDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };
  const localTimeHM = () => {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formValid) { setError('Please complete all required fields.'); return; }
    const todayStr = localDateStr();
    const nowHM = localTimeHM();
    if (form.onsetDate === todayStr && form.onsetTime && form.onsetTime > nowHM) {
      setError('Onset time cannot be in the future today.');
      return;
    }
    setSaving(true);
    try {
      // Build payload
      const payload = {
        reporterId: user?.id || user?._id || user?.sub || 'me',
        reporterName: user?.fullName || user?.name || 'Crew Member',
        reporterRole: 'crew',
        primarySymptom: form.primarySymptom,
        otherSymptoms: Array.from(form.otherSymptoms),
        onsetAt: new Date(`${form.onsetDate}T${form.onsetTime}:00`).toISOString(),
        severity: form.severity,
        frequency: form.frequency || null,
        duration: form.durationValue ? { value: Number(form.durationValue) || 0, unit: form.durationUnit } : null,
        notes: form.notes?.trim() || '',
        status: 'NEW',
        createdAt: new Date().toISOString(),
      };

      // Persist locally for now; swap to backend API later
      const raw = localStorage.getItem('oc_symptom_reports');
      const arr = raw ? JSON.parse(raw) : [];
      if (editingId) {
        const idx = arr.findIndex((r) => r.id === editingId);
        if (idx >= 0) arr[idx] = { ...arr[idx], ...payload };
      } else {
        arr.unshift({ id: `${Date.now()}`, ...payload });
      }
      localStorage.setItem('oc_symptom_reports', JSON.stringify(arr));
      setReports(arr);

      setSuccess(editingId ? 'Symptom report updated.' : 'Symptom report submitted successfully.');
      setForm({
        primarySymptom: '',
        otherSymptoms: new Set(),
        onsetDate: '',
        onsetTime: '',
        severity: '',
        frequency: '',
        durationValue: '',
        durationUnit: 'Hours',
        notes: '',
      });
      // Close the form after successful submit
      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      setError('Failed to submit symptom report.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (report) => {
    if (!report) return;
    setEditingId(report.id);
    setForm({
      primarySymptom: report.primarySymptom || '',
      otherSymptoms: new Set(Array.isArray(report.otherSymptoms) ? report.otherSymptoms : []),
      onsetDate: report.onsetAt ? new Date(report.onsetAt).toISOString().slice(0,10) : '',
      onsetTime: report.onsetAt ? new Date(report.onsetAt).toISOString().slice(11,16) : '',
      severity: report.severity || '',
      frequency: report.frequency || '',
      durationValue: report.duration?.value?.toString() || '',
      durationUnit: report.duration?.unit || 'Hours',
      notes: report.notes || '',
    });
    setFormOpen(true);
    setTimeout(() => {
      const el = document.getElementById('symptomFormPrimary');
      if (el) el.focus();
    }, 0);
  };

  const handleDelete = (report) => {
    if (!report) return;
    if (!window.confirm('Delete this symptom report?')) return;
    const raw = localStorage.getItem('oc_symptom_reports');
    const arr = raw ? JSON.parse(raw) : [];
    const next = arr.filter((r) => r.id !== report.id);
    localStorage.setItem('oc_symptom_reports', JSON.stringify(next));
    setReports(next);
  };

  const viewDetails = (report) => {
    if (!report) return;
    const lines = [
      `Primary: ${report.primarySymptom}`,
      `Onset: ${new Date(report.onsetAt).toLocaleString()}`,
      `Severity: ${report.severity}`,
      `Frequency: ${report.frequency || '—'}`,
      `Duration: ${report.duration ? `${report.duration.value} ${report.duration.unit}` : '—'}`,
      `Other: ${Array.isArray(report.otherSymptoms) && report.otherSymptoms.length ? report.otherSymptoms.join(', ') : '—'}`,
      `Notes: ${report.notes || '—'}`,
    ];
    alert(lines.join('\n'));
  };

  const downloadCSV = (report) => {
    if (!report) return;
    const rows = [
      ['Primary Symptom', report.primarySymptom || ''],
      ['Onset', report.onsetAt ? new Date(report.onsetAt).toLocaleString() : ''],
      ['Severity', report.severity || ''],
      ['Frequency', report.frequency || ''],
      ['Duration', report.duration ? `${report.duration.value} ${report.duration.unit}` : ''],
      ['Other Symptoms', Array.isArray(report.otherSymptoms) ? report.otherSymptoms.join(', ') : ''],
      ['Notes', report.notes || ''],
    ];
    const csv = [['Field','Value'], ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `symptom-${report.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async (report) => {
    if (!report) return;
    try {
      const jsPDF = await ensureJsPDF();
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 48; let y = margin;
      doc.setFont('helvetica','bold'); doc.setFontSize(16);
      doc.text('Symptom Report', margin, y); y += 10;
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 14);
      doc.setTextColor(0); y += 28;
      const kv = {
        'Primary Symptom': report.primarySymptom || '—',
        'Onset': report.onsetAt ? new Date(report.onsetAt).toLocaleString() : '—',
        'Severity': report.severity || '—',
        'Frequency': report.frequency || '—',
        'Duration': report.duration ? `${report.duration.value} ${report.duration.unit}` : '—',
        'Other Symptoms': Array.isArray(report.otherSymptoms) && report.otherSymptoms.length ? report.otherSymptoms.join(', ') : '—',
        'Notes': report.notes || '—',
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
      doc.save(`symptom-${report.id}.pdf`);
    } catch {
      alert('PDF export failed.');
    }
  };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="header">
            <h2>Symptom Report</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew Member')}&background=0ea5e9&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew Member'}</div>
                <small>Crew ID: {user?.crewId || user?.id || user?._id || '—'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {error && (
            <div style={{ margin: '12px 0', padding: '10px 12px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</div>
          )}
          {success && (
            <div style={{ margin: '12px 0', padding: '10px 12px', borderRadius: 10, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>{success}</div>
          )}

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Your Symptoms</div>
              <div className="page-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const raw = localStorage.getItem('oc_symptom_reports');
                    try { setReports(raw ? JSON.parse(raw) : []); } catch { setReports([]); }
                  }}
                >
                  <i className="fas fa-sync" /> Refresh
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    // Prefill onset date/time to now if empty for better UX
                    setForm((prev) => ({
                      ...prev,
                      onsetDate: prev.onsetDate || localDateStr(),
                      onsetTime: prev.onsetTime || localTimeHM(),
                    }));
                    setFormOpen(true);
                    setTimeout(() => {
                      const el = document.getElementById('symptomFormPrimary');
                      if (el) el.focus();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 0);
                  }}
                >
                  <i className="fas fa-plus" /> New Report
                </button>
              </div>
            </div>

            {!formOpen && (
              <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e7eb', marginBottom: 16 }}>
                Click "New Report" to open the symptom form.
              </div>
            )}

            {formOpen && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 720, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.15)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0 }}>{editingId ? 'Edit Symptom Report' : 'New Symptom Report'}</h3>
                    <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)} aria-label="Close" style={{ padding: '6px 10px' }}>×</button>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: 16 }}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Primary Symptom *</label>
                          <select id="symptomFormPrimary" className="form-control" value={form.primarySymptom} onChange={(e) => updateField('primarySymptom', e.target.value)} required>
                            <option value="">Select a symptom</option>
                            {PRIMARY_SYMPTOMS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Symptom Onset Date *</label>
                          <input type="date" className="form-control" value={form.onsetDate} onChange={(e) => updateField('onsetDate', e.target.value)} required />
                        </div>

                        <div className="form-group">
                          <label>Symptom Onset Time *</label>
                          <input type="time" className="form-control" value={form.onsetTime} onChange={(e) => updateField('onsetTime', e.target.value)} required max={form.onsetDate === localDateStr() ? localTimeHM() : undefined} />
                        </div>

                        <div className="form-group">
                          <label>Severity *</label>
                          <select className="form-control" value={form.severity} onChange={(e) => updateField('severity', e.target.value)} required>
                            <option value="">Select</option>
                            {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Frequency</label>
                          <select className="form-control" value={form.frequency} onChange={(e) => updateField('frequency', e.target.value)}>
                            <option value="">Select</option>
                            {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Duration</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="number" min="0" className="form-control" style={{ flex: 1 }} placeholder="e.g., 12" value={form.durationValue} onChange={(e) => updateField('durationValue', e.target.value)} />
                            <select className="form-control" style={{ width: 140 }} value={form.durationUnit} onChange={(e) => updateField('durationUnit', e.target.value)}>
                              <option>Hours</option>
                              <option>Days</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Other Symptoms</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                            {OTHER_SYMPTOMS.map((s) => (
                              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" checked={form.otherSymptoms.has(s)} onChange={() => toggleOtherSymptom(s)} /> {s}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Additional Notes</label>
                          <textarea className="form-control" rows={3} placeholder="Describe your symptoms..." value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid #e5e7eb', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setForm({
                        primarySymptom: '', otherSymptoms: new Set(), onsetDate: '', onsetTime: '', severity: '', frequency: '', durationValue: '', durationUnit: 'Hours', notes: ''
                      })}>Clear</button>
                      <button type="button" className="btn" onClick={() => setFormOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={!formValid || saving}>{saving ? 'Submitting…' : (editingId ? 'Update Report' : 'Submit Report')}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">My Symptom Reports</div>
            </div>
            {reports.length === 0 ? (
              <div style={{ padding: 16, border: '1px dashed #e5e7eb', borderRadius: 10, color: '#6b7280' }}>
                No symptom reports yet. Submit your first report above.
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Primary</th>
                      <th>Severity</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.onsetAt).toLocaleString()}</td>
                        <td>{r.primarySymptom}</td>
                        <td>{r.severity}</td>
                        <td>{r.frequency || '—'}</td>
                        <td>{r.duration ? `${r.duration.value} ${r.duration.unit}` : '—'}</td>
                        <td><span className="status-badge status-warning">{r.status}</span></td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => viewDetails(r)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(r)}>Delete</button>
                          <button className="btn btn-action btn-sm" onClick={() => downloadCSV(r)}><i className="fas fa-file-csv" /> CSV</button>
                          <button className="btn btn-danger btn-sm" onClick={() => downloadPDF(r)}><i className="fas fa-file-pdf" /> PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        .crew-dashboard .form-grid { display: grid; grid-template-columns: repeat(2, minmax(240px, 1fr)); gap: 14px; }
        @media (max-width: 900px) { .crew-dashboard .form-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
