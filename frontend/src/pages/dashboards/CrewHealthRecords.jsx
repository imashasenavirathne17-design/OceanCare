import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import CrewSidebar from './CrewSidebar';
import './crewDashboard.css';
import {
  listMyMedicalRecords,
  getMyMedicalRecord,
  createMyMedicalRecord,
  updateMyMedicalRecord,
  deleteMyMedicalRecord,
} from '../../lib/crewMedicalRecordsApi';
import { listMyExaminations, listVaccinations } from '../../lib/healthApi';
import { listChronicReadings } from '../../lib/chronicApi';
import { listMentalObservations } from '../../lib/mentalHealthApi';

const TYPE_OPTIONS = [
  { value: 'medical-history', label: 'Medical History' },
  { value: 'examination', label: 'Examination' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'chronic', label: 'Chronic Condition' },
  { value: 'health-check', label: 'Health Check' },
  { value: 'mental-health', label: 'Mental Wellness' },
  { value: 'appointment', label: 'Medical Appointment' },
  { value: 'emergency', label: 'Emergency Report' },
];

const TYPE_LABELS = TYPE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const defaultMetrics = () => ({
  temperature: '',
  heartRate: '',
  bpSystolic: '',
  bpDiastolic: '',
  oxygen: '',
  respiratoryRate: '',
  glucose: '',
  weight: '',
  peakFlow: '',
  mentalScore: '',
  wellnessLevel: '',
});

const defaultMetadata = () => ({
  provider: '',
  officer: '',
  location: '',
  chronicType: '',
  vaccineName: '',
  doseNumber: '',
  followUp: '',
  sessionType: '',
});

const sanitizeObject = (obj = {}) => {
  const clean = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') {
      if (value.trim() === '') return;
      clean[key] = value.trim();
      return;
    }
    clean[key] = value;
  });
  return clean;
};

const METADATA_LABELS = {
  provider: 'Provider',
  officer: 'Officer',
  location: 'Location',
  chronicType: 'Chronic Condition',
  vaccineName: 'Vaccine',
  doseNumber: 'Dose #',
  followUp: 'Follow-up Notes',
  sessionType: 'Session Type',
};

const METRIC_LABELS = {
  temperature: 'Temperature (°C)',
  heartRate: 'Heart Rate (BPM)',
  bpSystolic: 'Blood Pressure Systolic',
  bpDiastolic: 'Blood Pressure Diastolic',
  oxygen: 'Oxygen Saturation (%)',
  respiratoryRate: 'Respiratory Rate',
  glucose: 'Glucose (mg/dL)',
  weight: 'Weight (kg)',
  peakFlow: 'Peak Flow (L/min)',
  mentalScore: 'Mental Health Score',
  wellnessLevel: 'Wellness Level',
};

const STATUS_TO_CLASS = {
  open: 'chip-info',
  scheduled: 'chip-info',
  monitoring: 'chip-warning',
  completed: 'chip-success',
  overdue: 'chip-warning',
};

const extractEntries = (source, labels) => {
  const sanitized = sanitizeObject(source || {});
  return Object.entries(labels)
    .map(([key, label]) => (sanitized[key] !== undefined ? { key, label, value: sanitized[key] } : null))
    .filter(Boolean);
};

const getMetadataEntries = (metadata) => extractEntries(metadata, METADATA_LABELS);
const getMetricEntries = (metrics) => extractEntries(metrics, METRIC_LABELS);

const formatStatus = (value) => {
  if (!value) return '—';
  if (STATUS_LABELS[value]) return STATUS_LABELS[value];
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const isWithinNextDays = (dateStr, days) => {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return false;
  const limit = days * 24 * 60 * 60 * 1000;
  return diff <= limit;
};

const MOCK_RECORDS = [
  {
    _id: 'mock-1',
    recordType: 'health-check',
    condition: 'Daily Health Check',
    date: '2025-10-15',
    notes: 'Vitals within normal range. No symptoms reported.',
    files: [],
    status: 'completed',
    nextDueDate: '2025-10-16',
    metadata: {
      provider: 'Self',
      officer: 'Dr. Johnson',
      location: 'Cabin 4',
      followUp: 'Submit tomorrow health check.',
    },
    metrics: {
      temperature: '36.8',
      heartRate: '72',
      bpSystolic: '118',
      bpDiastolic: '76',
      oxygen: '98',
      respiratoryRate: '16',
    },
  },
  {
    _id: 'mock-2',
    recordType: 'vaccination',
    condition: 'Influenza Booster',
    date: '2025-09-04',
    notes: 'No adverse reactions. Next dose due in one year.',
    files: [],
    status: 'scheduled',
    nextDueDate: '2026-09-01',
    metadata: {
      provider: 'MV Ocean Clinic',
      officer: 'Nurse Emily',
      location: 'Medical Bay',
      vaccineName: 'Influenza',
      doseNumber: '2',
      followUp: 'Schedule reminder for next season.',
    },
    metrics: {},
  },
];

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const UPLOADS_BASE = API_BASE.replace(/\/api$/, '') + '/uploads/medical-records/';

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const isPastDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  d.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return d.getTime() < t.getTime();
};

const fileUrl = (file) => {
  if (!file) return null;
  const name = file.filename || (file.path ? file.path.split(/[\\/]/).pop() : '');
  return name ? `${UPLOADS_BASE}${name}` : null;
};

export default function CrewHealthRecords() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };
  const useMocks = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ recordType: 'all', dateFrom: '', dateTo: '', status: 'all' });
  const [revision, setRevision] = useState(0);

  // Category-specific state for showing existing things on the page
  const [exams, setExams] = useState([]);
  const [vaccs, setVaccs] = useState([]);
  const [chronicReadings, setChronicReadings] = useState([]);
  const [mentalObservations, setMentalObservations] = useState([]);
  const [auxLoading, setAuxLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    id: null,
    recordType: '',
    condition: '',
    date: today(),
    notes: '',
    status: 'open',
    nextDueDate: '',
    metadata: defaultMetadata(),
    metrics: defaultMetrics(),
  });
  const [formFiles, setFormFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [metricErrors, setMetricErrors] = useState({});

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    const run = async () => {
      try {
        if (useMocks) {
          if (!ignore) setRecords(MOCK_RECORDS);
          return;
        }
        const params = {};
        const trimmed = query.trim();
        if (trimmed) params.q = trimmed;
        if (filters.recordType !== 'all' && filters.recordType) params.type = filters.recordType;
        if (filters.status !== 'all' && filters.status) params.status = filters.status;
        if (filters.dateFrom) params.from = filters.dateFrom;
        if (filters.dateTo) params.to = filters.dateTo;
        const data = await listMyMedicalRecords(params);
        if (!ignore) setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('listMyMedicalRecords error', err);
        if (!ignore) {
          setError('Failed to load medical records');
          if (useMocks) setRecords(MOCK_RECORDS);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => { ignore = true; };
  }, [filters.recordType, filters.status, filters.dateFrom, filters.dateTo, query, revision, useMocks]);

  // Load category-specific datasets to show existing content panels
  const vaccLoadOnceRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (useMocks) {
        // Derive category data from MOCK_RECORDS for display
        const all = MOCK_RECORDS;
        setExams(all.filter(r => r.recordType === 'examination').slice(0, 5));
        setVaccs(all.filter(r => r.recordType === 'vaccination').slice(0, 5));
        setChronicReadings(all.filter(r => r.recordType === 'chronic').slice(0, 5));
        setMentalObservations(all.filter(r => r.recordType === 'mental-health').slice(0, 5));
        return;
      }
      try {
        setAuxLoading(true);
        // Prevent duplicate vaccination calls in StrictMode double-mount/dev reloads
        const fetchVaccs = async () => {
          // Crew role typically cannot access /health/vaccinations; skip to avoid 403 noise.
          if (String(user?.role).toLowerCase() === 'crew') return [];
          if (vaccLoadOnceRef.current) return [];
          vaccLoadOnceRef.current = true;
          try {
            return await listVaccinations({ mine: true });
          } catch (e) {
            return [];
          }
        };
        const [ex, va] = await Promise.all([
          listMyExaminations(user?.crewId),
          fetchVaccs()
        ]);
        if (!ignore) {
          setExams(Array.isArray(ex) ? ex : []);
          setVaccs(Array.isArray(va) ? va : []);
        }
      } catch (e) {
        console.warn('aux load exams/vaccs failed, continuing with empty', e);
        if (!ignore) {
          setExams([]);
          setVaccs([]);
        }
      } finally {
        if (!ignore) setAuxLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [user?.crewId, revision, useMocks]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (useMocks) return; // already handled above from MOCK_RECORDS
      try {
        const [cr, mo] = await Promise.all([
          listChronicReadings({ mine: true, limit: 5 }),
          listMentalObservations({ mine: true, limit: 5 }),
        ]);
        if (!ignore) {
          setChronicReadings(Array.isArray(cr) ? cr : []);
          setMentalObservations(Array.isArray(mo) ? mo : []);
        }
      } catch (e) {
        console.warn('aux load chronic/mental failed, continuing with empty', e);
        if (!ignore) {
          setChronicReadings([]);
          setMentalObservations([]);
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, [revision, useMocks]);

  const refresh = () => setRevision((v) => v + 1);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openView = async (record) => {
    const id = record?._id || record?.id;
    if (!id) return;
    setViewOpen(true);
    setViewLoading(true);
    try {
      if (useMocks) {
        const found = MOCK_RECORDS.find((item) => item._id === id);
        setViewRecord(found || record);
      } else {
        const data = await getMyMedicalRecord(id);
        setViewRecord(data);
      }
    } catch (err) {
      console.error('getMyMedicalRecord error', err);
      setViewRecord(record);
    } finally {
      setViewLoading(false);
    }
  };

  const openCreate = () => {
    setViewOpen(false);
    setForm({
      id: null,
      recordType: '',
      condition: '',
      date: today(),
      notes: '',
      status: 'open',
      nextDueDate: '',
      metadata: defaultMetadata(),
      metrics: defaultMetrics(),
    });
    setFormFiles([]);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (record) => {
    if (!record) return;
    setViewOpen(false);
    setForm({
      id: record._id || record.id,
      recordType: record.recordType || '',
      condition: record.condition || '',
      date: record.date ? String(record.date).slice(0, 10) : today(),
      notes: record.notes || '',
      status: record.status || 'open',
      nextDueDate: record.nextDueDate || '',
      metadata: { ...defaultMetadata(), ...(record.metadata || {}) },
      metrics: { ...defaultMetrics(), ...(record.metrics || {}) },
    });
    setFormFiles([]);
    setFormError('');
    setFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'date' || name === 'nextDueDate') {
      if (isPastDate(value)) {
        setFormError('Date cannot be in the past. Please select today or a future date.');
        return; // do not accept past dates
      }
      setFormError('');
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, metadata: { ...prev.metadata, [name]: value } }));
  };

  const handleMetricsChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, metrics: { ...prev.metrics, [name]: value } }));
    const nextErrors = { ...metricErrors };
    const v = String(value).trim();
    const intRe = /^-?\d+$/;
    const oneDecRe = /^-?\d{1,3}(?:\.\d)?$/;
    const setErr = (k, msg) => { if (msg) nextErrors[k] = msg; else delete nextErrors[k]; };
    if (name === 'temperature') {
      if (v === '' || !oneDecRe.test(v)) setErr('temperature', 'Temperature must be a number.');
      else {
        const num = parseFloat(v);
        if (Number.isNaN(num) || num < 30.0 || num > 43.0) setErr('temperature', 'Temperature must be between 30.0 °C and 43.0 °C.');
        else setErr('temperature', '');
      }
    } else if (name === 'heartRate') {
      if (v === '' || !intRe.test(v)) setErr('heartRate', 'Heart rate must be an integer.');
      else {
        const num = parseInt(v, 10);
        if (num < 20 || num > 220) setErr('heartRate', 'Heart rate must be between 20 and 220 bpm.');
        else setErr('heartRate', '');
      }
    } else if (name === 'bpSystolic' || name === 'bpDiastolic') {
      const sysStr = name === 'bpSystolic' ? v : String(form.metrics?.bpSystolic || '').trim();
      const diaStr = name === 'bpDiastolic' ? v : String(form.metrics?.bpDiastolic || '').trim();
      let sysErr = '', diaErr = '', crossErr = '';
      if (sysStr === '' || !intRe.test(sysStr)) sysErr = 'Systolic must be an integer.';
      if (diaStr === '' || !intRe.test(diaStr)) diaErr = 'Diastolic must be an integer.';
      const sys = parseInt(sysStr, 10);
      const dia = parseInt(diaStr, 10);
      if (!sysErr && (sys < 70 || sys > 260)) sysErr = 'Values out of range.';
      if (!diaErr && (dia < 30 || dia > 160)) diaErr = 'Values out of range.';
      if (!sysErr && !diaErr && !(sys >= dia + 5)) crossErr = 'Systolic must be >= diastolic + 5.';
      setErr('bpSystolic', sysErr || crossErr);
      setErr('bpDiastolic', diaErr || '');
    } else if (name === 'oxygen') {
      if (v === '' || !intRe.test(v)) setErr('oxygen', 'SpO₂ must be between 50 and 100%.');
      else {
        const num = parseInt(v, 10);
        if (num < 50 || num > 100) setErr('oxygen', 'SpO₂ must be between 50 and 100%.');
        else setErr('oxygen', '');
      }
    } else if (name === 'weight') {
      if (v !== '' && !oneDecRe.test(v)) setErr('weight', 'Weight must be a number with up to one decimal.'); else setErr('weight', '');
    }
    setMetricErrors(nextErrors);
  };

  const handleFileChange = (e) => {
    setFormFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recordType || !form.condition) {
      setFormError('Record type and condition are required');
      return;
    }
    if (Object.keys(metricErrors).length > 0) {
      setFormError('Please fix the highlighted metric errors.');
      return;
    }
    setFormError('');
    setFormSubmitting(true);
    try {
      const payload = {
        recordType: form.recordType,
        condition: form.condition,
        date: form.date || today(),
        notes: form.notes || '',
        status: form.status || 'open',
        nextDueDate: form.nextDueDate || '',
        metadata: sanitizeObject(form.metadata || {}),
        metrics: sanitizeObject(form.metrics || {}),
      };
      if (useMocks) {
        if (form.id) {
          setRecords((prev) => prev.map((item) => (item._id === form.id ? { ...item, ...payload } : item)));
        } else {
          setRecords((prev) => [{ _id: `mock-${Date.now()}`, files: [], ...payload }, ...prev]);
        }
      } else if (form.id) {
        await updateMyMedicalRecord(form.id, payload, formFiles);
      } else {
        await createMyMedicalRecord(payload, formFiles);
      }
      setFormOpen(false);
      setForm({
        id: null,
        recordType: '',
        condition: '',
        date: today(),
        notes: '',
        status: 'open',
        nextDueDate: '',
        metadata: defaultMetadata(),
        metrics: defaultMetrics(),
      });
      setFormFiles([]);
      refresh();
    } catch (err) {
      console.error('save medical record error', err);
      setFormError('Failed to save medical record');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    const id = record?._id || record?.id;
    if (!id) return;
    if (!window.confirm('Delete this medical record?')) return;
    setDeletingId(id);
    try {
      if (useMocks) {
        setRecords((prev) => prev.filter((item) => (item._id || item.id) !== id));
      } else {
        await deleteMyMedicalRecord(id);
      }
      refresh();
    } catch (err) {
      console.error('delete medical record error', err);
      alert('Failed to delete medical record');
    } finally {
      setDeletingId(null);
    }
  };

  const tableRows = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.map((record) => ({
      id: record._id || record.id,
      recordType: record.recordType,
      condition: record.condition,
      date: record.date,
      notes: record.notes,
      files: record.files || [],
      status: record.status,
      nextDueDate: record.nextDueDate,
      metadata: record.metadata || {},
      metrics: record.metrics || {},
      raw: record,
    }));
  }, [records]);

  const filteredRows = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return tableRows.filter((row) => {
      const typeLabel = TYPE_LABELS[row.recordType] || row.recordType || '';
      const matchesQuery = !lowered
        || typeLabel.toLowerCase().includes(lowered)
        || String(row.condition || '').toLowerCase().includes(lowered)
        || String(row.notes || '').toLowerCase().includes(lowered);
      return matchesQuery;
    });
  }, [tableRows, query]);

  const overviewCards = useMemo(() => {
    const rows = tableRows;
    const total = rows.length;
    const chronic = rows.filter((row) => row.recordType === 'chronic').length;
    const vaccinations = rows.filter((row) => row.recordType === 'vaccination').length;
    const examinations = rows.filter((row) => row.recordType === 'examination').length;
    const mental = rows.filter((row) => row.recordType === 'mental-health').length;
    const dueSoon = rows.filter((row) => isWithinNextDays(row.nextDueDate, 7)).length;
    const overdue = rows.filter((row) => String(row.status).toLowerCase() === 'overdue').length;
    return [
      { title: 'Total Records', value: total },
      { title: 'Chronic Tracking Entries', value: chronic },
      { title: 'Vaccination Records', value: vaccinations },
      { title: 'Examination Records', value: examinations },
      { title: 'Mental Health Entries', value: mental },
      { title: 'Due Within 7 Days', value: dueSoon },
      { title: 'Marked Overdue', value: overdue },
    ];
  }, [tableRows]);

  const renderFileList = (files) => {
    if (!files || files.length === 0) return null;
    return (
      <ul style={{ marginTop: 12 }}>
        {files.map((file, index) => {
          const url = fileUrl(file);
          return (
            <li key={`${file.filename || file.path || index}-${index}`}>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer">
                  {file.originalname || file.filename || 'Attachment'}
                </a>
              ) : (
                <span>{file.originalname || file.filename || 'Attachment'}</span>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // ---------- Download helpers (component scope) ----------
  const buildFlatColumns = (row) => {
    const base = {
      Date: row.date || '',
      Type: TYPE_LABELS[row.recordType] || row.recordType || '',
      Condition: row.condition || '',
      Notes: row.notes || '',
      Status: formatStatus(row.status || ''),
      'Next Due': row.nextDueDate || '',
    };
    const mdEntries = getMetadataEntries(row.metadata || {});
    const mtEntries = getMetricEntries(row.metrics || {});
    const extra = {};
    mdEntries.forEach(({ label, value }) => { extra[label] = String(value ?? ''); });
    mtEntries.forEach(({ label, value }) => { extra[label] = String(value ?? ''); });
    return { ...base, ...extra };
  };

  const downloadRowCSV = (row) => {
    if (!row) return;
    const cols = buildFlatColumns(row);
    const headers = Object.keys(cols);
    const values = headers.map((h) => {
      const v = cols[h] ?? '';
      const s = String(v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    });
    const csv = headers.join(',') + '\n' + values.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = (row.condition || row.recordType || 'record').toString().toLowerCase().replace(/\s+/g, '-');
    a.download = `medical-record-${name}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadRowPDF = (row) => {
    if (!row) return;
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

    (async () => {
      const jsPDF = await ensureJsPDF();
      const cols = buildFlatColumns(row);
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 40; const marginY = 50; const lineH = 18; const keyW = 180; const pageW = doc.internal.pageSize.getWidth();
      let y = marginY;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      const title = `Medical Record - ${cols.Type || ''}`.trim();
      doc.text(title, marginX, y); y += 8;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y + 14);
      y += 28; doc.setTextColor(0);

      // Draw rows as key/value
      Object.entries(cols).forEach(([k, v]) => {
        if (y > doc.internal.pageSize.getHeight() - marginY) {
          doc.addPage(); y = marginY;
        }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text(String(k), marginX, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
        const text = doc.splitTextToSize(String(v ?? ''), pageW - marginX - keyW - 20);
        doc.text(text, marginX + keyW, y);
        y += Math.max(lineH, text.length * 14);
      });

      const name = (row.condition || row.recordType || 'record').toString().toLowerCase().replace(/\s+/g, '-');
      doc.save(`medical-record-${name}.pdf`);
    })().catch(() => alert('PDF export failed. Please try again.'));
  };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Health Records</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <section className="dashboard-section">
            <div className="section-header" style={{ flexWrap: 'wrap' }}>
              <div>
                <div className="section-title">Your Health Records</div>
                <div className="section-subtitle">Access personal medical entries, examinations, and vaccinations</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={refresh}><i className="fas fa-sync"></i> Refresh</button>
                <button className="btn btn-primary" onClick={openCreate}><i className="fas fa-plus"></i> New Record</button>
              </div>
            </div>

            {/* Quick tabs to filter by category (single row, no scrolling) */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', overflowX: 'hidden', marginBottom: 10, paddingBottom: 0, justifyContent: 'space-between', width: '100%' }}>
              {[
                { v: 'all', label: 'All' },
                { v: 'medical-history', label: 'Medical' },
                { v: 'examination', label: 'Exam' },
                { v: 'chronic', label: 'Chronic' },
                { v: 'mental-health', label: 'Mental' },
              ].map(t => (
                <button
                  key={t.v}
                  className={`chip ${filters.recordType === t.v ? 'chip-primary' : ''}`}
                  style={{ flex: '1 1 0', minWidth: 0, textAlign: 'center', padding: '4px 8px', fontSize: 12 }}
                  onClick={() => setFilters(prev => ({ ...prev, recordType: t.v }))}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {error && <div className="empty" style={{ color: 'var(--danger)' }}>{error}</div>}

            {useMocks && (
              <div style={{ background: '#fff7e6', border: '1px solid #ffd591', color: '#ad6800', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>
                Mock data enabled (VITE_USE_MOCKS=true). Showing sample records while backend is offline.
              </div>
            )}

            {overviewCards.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                {overviewCards.map((card) => (
                  <div key={card.title} className="card" style={{ padding: 18, borderRadius: 12, background: '#f9fbff', border: '1px solid #dbeafe' }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{card.title}</div>
                    <div style={{ fontWeight: 600 }}>{card.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Existing things panels by category */}


            <div className="records-filter" style={{ display: 'flex', gap: 15, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className="filter-group" style={{ flex: 2, minWidth: 240 }}>
                <label>Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by type, condition, or notes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
                <label>Record Type</label>
                <select name="recordType" className="form-control" value={filters.recordType} onChange={handleFilterChange}>
                  <option value="all">All Records</option>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 180 }}>
                <label>Status</label>
                <select name="status" className="form-control" value={filters.status} onChange={handleFilterChange}>
                  <option value="all">All Status</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 180 }}>
                <label>From Date</label>
                <input name="dateFrom" type="date" className="form-control" value={filters.dateFrom} onChange={handleFilterChange} />
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 180 }}>
                <label>To Date</label>
                <input name="dateTo" type="date" className="form-control" value={filters.dateTo} onChange={handleFilterChange} />
              </div>
            </div>

            {loading ? (
              <div className="empty"><div className="desc">Loading records...</div></div>
            ) : filteredRows.length === 0 ? (
              <div className="empty">
                <div className="title">No records found</div>
                <div className="desc">Add a record or adjust your filters.</div>
              </div>
            ) : (
              <div className="table-responsive">
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
                    {filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date || '—'}</td>
                        <td>{TYPE_LABELS[row.recordType] || row.recordType || '—'}</td>
                        <td>{row.condition || '—'}</td>
                        <td>{row.notes ? row.notes.slice(0, 80) + (row.notes.length > 80 ? '…' : '') : '—'}</td>
                        <td>
                          <span className={`chip ${STATUS_TO_CLASS[String(row.status || '').toLowerCase()] || 'chip-info'}`}>
                            {formatStatus(row.status)}
                          </span>
                        </td>
                        <td>{row.nextDueDate || '—'}</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => openView(row.raw)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(row.raw)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDelete(row.raw)} disabled={deletingId === row.id}>
                            {deletingId === row.id ? 'Deleting…' : 'Delete'}
                          </button>
                          <button className="btn btn-sm btn-csv" title="Download CSV" onClick={() => downloadRowCSV(row)} style={{ marginLeft: 6 }}>
                            <i className="fas fa-file-download"></i> CSV
                          </button>
                          <button className="btn btn-sm btn-pdf" title="Download PDF" onClick={() => downloadRowPDF(row)} style={{ marginLeft: 6 }}>
                            <i className="fas fa-file-pdf"></i> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {viewOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setViewOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">Medical Record Details</h3>
              <button className="close-modal" onClick={() => setViewOpen(false)}>&times;</button>
            </div>
            {viewLoading || !viewRecord ? (
              <div className="empty"><div className="desc">Loading record...</div></div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Date</div>
                    <div style={{ fontWeight: 600 }}>{viewRecord.date || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Record Type</div>
                    <div style={{ fontWeight: 600 }}>{TYPE_LABELS[viewRecord.recordType] || viewRecord.recordType || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Condition</div>
                    <div>{viewRecord.condition || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Notes</div>
                    <div>{viewRecord.notes || '—'}</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Status</div>
                    <span className={`chip ${STATUS_TO_CLASS[String(viewRecord.status || '').toLowerCase()] || 'chip-info'}`}>
                      {formatStatus(viewRecord.status)}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>Next Due</div>
                    <div>{viewRecord.nextDueDate || '—'}</div>
                  </div>
                </div>
                {(() => {
                  const entries = getMetadataEntries(viewRecord.metadata);
                  if (entries.length === 0) return null;
                  return (
                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Additional Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {entries.map((item) => (
                          <div key={item.key} className="card" style={{ padding: 12 }}>
                            <div style={{ fontSize: 12, color: '#666' }}>{item.label}</div>
                            <div style={{ fontWeight: 600 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const entries = getMetricEntries(viewRecord.metrics);
                  if (entries.length === 0) return null;
                  return (
                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Health Metrics</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                        {entries.map((item) => (
                          <div key={item.key} className="card" style={{ padding: 12 }}>
                            <div style={{ fontSize: 12, color: '#666' }}>{item.label}</div>
                            <div style={{ fontWeight: 600 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {renderFileList(viewRecord.files)}
                <div style={{ marginTop: 20, textAlign: 'right' }}>
                  <button className="btn btn-primary" onClick={() => setViewOpen(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {formOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setFormOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{form.id ? 'Update Medical Record' : 'New Medical Record'}</h3>
              <button className="close-modal" onClick={() => setFormOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Record Type *</label>
                  <select name="recordType" className="form-control" value={form.recordType} onChange={handleFormChange} required>
                    <option value="">Select record type</option>
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Condition / Title *</label>
                  <input name="condition" className="form-control" placeholder="e.g., Blood Pressure Check" value={form.condition} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input name="date" type="date" className="form-control" value={form.date} onChange={handleFormChange} required min={today()} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" className="form-control" value={form.status} onChange={handleFormChange}>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Next Due Date</label>
                <input name="nextDueDate" type="date" className="form-control" value={form.nextDueDate} onChange={handleFormChange} min={today()} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" className="form-control" rows={3} placeholder="Add notes about this record" value={form.notes} onChange={handleFormChange}></textarea>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Additional Details</div>
                <div className="form-grid">
                  {Object.entries(METADATA_LABELS).map(([key, label]) => (
                    <div key={key} className="form-group">
                      <label>{label}</label>
                      <input name={key} className="form-control" value={form.metadata?.[key] || ''} onChange={handleMetadataChange} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Health Metrics</div>
                <div className="form-grid">
                  {Object.entries(METRIC_LABELS).map(([key, label]) => {
                    const props = {};
                    if (key === 'temperature') { props.type = 'number'; props.step = '0.1'; props.min = '30'; props.max = '43'; }
                    if (key === 'heartRate') { props.type = 'number'; props.step = '1'; props.min = '20'; props.max = '220'; }
                    if (key === 'bpSystolic') { props.type = 'number'; props.step = '1'; props.min = '70'; props.max = '260'; }
                    if (key === 'bpDiastolic') { props.type = 'number'; props.step = '1'; props.min = '30'; props.max = '160'; }
                    if (key === 'oxygen') { props.type = 'number'; props.step = '1'; props.min = '50'; props.max = '100'; }
                    if (key === 'weight') { props.type = 'number'; props.step = '0.1'; }
                    return (
                      <div key={key} className="form-group">
                        <label>{label}</label>
                        <input name={key} className="form-control" value={form.metrics?.[key] || ''} onChange={handleMetricsChange} {...props} />
                        {metricErrors[key] && (
                          <div className="error-message" style={{ marginTop: 6 }}><i className="fas fa-exclamation-circle"></i> {metricErrors[key]}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label>Attachments</label>
                <input type="file" multiple onChange={handleFileChange} />
                {formFiles.length > 0 && <div className="hint-message">{formFiles.length} file(s) selected</div>}
                {form.id && !useMocks && renderFileList((records.find((item) => (item._id || item.id) === form.id)?.files) || [])}
              </div>
              {formError && (
                <div className="error-message" style={{ marginBottom: 12 }}>
                  <i className="fas fa-exclamation-circle"></i> {formError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving…' : form.id ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
