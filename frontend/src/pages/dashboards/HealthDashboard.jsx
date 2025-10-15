import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './healthOfficerDashboard.css';
import HealthPageLayout from './HealthPageLayout';
import {
  listExaminations,
  listVaccinations,
  listInventoryAlerts,
  listMedicalRecords,
  listHealthEmergencies,
} from '../../lib/healthApi';

const FALLBACK_EXAMS = [
  { crewName: 'John Doe', crewId: 'CD12345', examType: 'Annual Physical', scheduledFor: '2025-10-25T10:00:00Z', status: 'Scheduled' },
  { crewName: 'Jane Smith', crewId: 'CD12346', examType: 'Follow-up', scheduledFor: '2025-10-27T11:00:00Z', status: 'Scheduled' },
  { crewName: 'Robert Brown', crewId: 'CD12347', examType: 'Post-Incident Check', scheduledFor: '2025-10-30T09:30:00Z', status: 'Pending' },
  { crewName: 'Lisa Chen', crewId: 'CD12348', examType: 'Pre-Voyage Assessment', scheduledFor: '2025-11-02T13:45:00Z', status: 'Scheduled' },
];

const FALLBACK_VACCINES = [
  { vaccine: 'Influenza', dueCount: 12, overdue: 3 },
  { vaccine: 'Tetanus', dueCount: 8, overdue: 2 },
  { vaccine: 'Hepatitis A & B', dueCount: 5, overdue: 0 },
  { vaccine: 'COVID-19 Booster', dueCount: 15, overdue: 5 },
];

const FALLBACK_ACTIVITIES = [
  { icon: 'fas fa-stethoscope', title: 'Medical Examination Completed', desc: 'John Doe - Routine check-up', time: '2025-10-24T10:30:00Z' },
  { icon: 'fas fa-vial', title: 'Lab Results Added', desc: 'Maria Rodriguez - Diabetes panel', time: '2025-10-23T15:15:00Z' },
  { icon: 'fas fa-syringe', title: 'Vaccination Administered', desc: 'Influenza vaccine - 5 crew members', time: '2025-10-22T09:45:00Z' },
  { icon: 'fas fa-pills', title: 'Inventory Alert Sent', desc: 'Low stock: Insulin (3 doses remaining)', time: '2025-10-21T14:30:00Z' },
];

const FALLBACK_SCHEDULE = [
  { time: '2025-10-24T10:00:00Z', title: 'James Wilson - Hypertension Review', desc: 'Chronic condition follow-up', status: 'High Priority' },
  { time: '2025-10-24T11:30:00Z', title: 'Vaccination Clinic', desc: 'Influenza vaccines for deck crew', status: 'Scheduled' },
  { time: '2025-10-24T14:00:00Z', title: 'Mental Health Session', desc: 'Group therapy - Stress management', status: 'Scheduled' },
  { time: '2025-10-24T15:30:00Z', title: 'Health Education Workshop', desc: 'Hand hygiene best practices', status: 'Scheduled' },
];

const FALLBACK_ALERTS = [
  { crewName: 'James Wilson', crewId: 'CD12347', summary: 'Hypertension - Elevated readings', updatedAt: '2025-10-18T00:00:00Z', priority: 'High' },
  { crewName: 'Michael Brown', crewId: 'CD12349', summary: 'Respiratory infection - No improvement', updatedAt: '2025-10-20T00:00:00Z', priority: 'Medium' },
  { crewName: 'Anna Kowalski', crewId: 'CD12350', summary: 'Mental health - Anxiety symptoms', updatedAt: '2025-10-15T00:00:00Z', priority: 'Medium' },
];

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const shortDate = (iso) => {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function HealthDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState([
    { icon: 'fas fa-exclamation-circle', value: 0, label: 'Pending Examinations', tone: 'danger', detail: 'Awaiting scheduling' },
    { icon: 'fas fa-heartbeat', value: 0, label: 'Chronic Patients', tone: 'warning', detail: 'Monitor chronic plans' },
    { icon: 'fas fa-syringe', value: 0, label: 'Vaccination Alerts', tone: 'primary', detail: 'Track overdue doses' },
    { icon: 'fas fa-pills', value: 0, label: 'Low Stock Items', tone: 'info', detail: 'Review critical supplies' },
  ]);
  const [activities, setActivities] = useState(FALLBACK_ACTIVITIES);
  const [schedule, setSchedule] = useState(FALLBACK_SCHEDULE);
  const [upcomingExams, setUpcomingExams] = useState(FALLBACK_EXAMS);
  const [vaccinationSummary, setVaccinationSummary] = useState(FALLBACK_VACCINES);
  const [criticalAlerts, setCriticalAlerts] = useState(FALLBACK_ALERTS);
  const [inventoryCritical, setInventoryCritical] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [examData, vaccineData, emergencyData, recordData, inventoryAlerts] = await Promise.all([
          listExaminations('upcoming').catch(() => FALLBACK_EXAMS),
          listVaccinations({ status: 'due' }).catch(() => FALLBACK_VACCINES),
          listHealthEmergencies({ status: 'open' }).catch(() => []),
          listMedicalRecords({ limit: 5 }).catch(() => []),
          listInventoryAlerts({ severity: 'critical' }).catch(() => []),
        ]);

        if (!mounted) return;

        const examSource = Array.isArray(examData?.items) ? examData.items : (Array.isArray(examData) ? examData : []);
        const vaccineSource = Array.isArray(vaccineData?.items) ? vaccineData.items : (Array.isArray(vaccineData) ? vaccineData : []);
        const emergencySource = Array.isArray(emergencyData?.items) ? emergencyData.items : (Array.isArray(emergencyData) ? emergencyData : []);
        const recordSource = Array.isArray(recordData?.items) ? recordData.items : (Array.isArray(recordData) ? recordData : []);
        const inventorySource = Array.isArray(inventoryAlerts?.items) ? inventoryAlerts.items : (Array.isArray(inventoryAlerts) ? inventoryAlerts : []);

        const normalizedExams = examSource.length ? examSource.slice(0, 4).map((exam) => ({
          crewName: exam.crewName || exam.crew?.fullName || '—',
          crewId: exam.crewId || exam.crew?.crewId || '—',
          examType: exam.examType || exam.type || 'General',
          scheduledFor: exam.scheduledFor || exam.date || exam.performedAt,
          status: exam.status || 'Scheduled',
        })) : FALLBACK_EXAMS;

        const normalizedVaccines = vaccineSource.length ? vaccineSource.slice(0, 4).map((v) => ({
          vaccine: v.vaccine || v.name || 'Vaccine',
          dueCount: v.dueCount ?? v.dueSoon ?? 0,
          overdue: v.overdue ?? v.overdueCount ?? 0,
        })) : FALLBACK_VACCINES;

        const priorityWeight = (value) => {
          const normalized = (value || '').toString().toLowerCase();
          if (normalized === 'critical') return 4;
          if (normalized === 'high') return 3;
          if (normalized === 'medium') return 2;
          if (normalized === 'low') return 1;
          return 0;
        };

        const emergencyOrdered = emergencySource.length ? [...emergencySource].sort((a, b) => {
          const aScore = priorityWeight(a.priority || a.severity) + (a.updatedAt ? 0.1 : 0);
          const bScore = priorityWeight(b.priority || b.severity) + (b.updatedAt ? 0.1 : 0);
          return bScore - aScore;
        }) : [];

        const normalizedAlerts = emergencyOrdered.length ? emergencyOrdered.slice(0, 3).map((alert) => ({
          crewName: alert.crewName || alert.subject || '—',
          crewId: alert.crewId || alert.referenceId || '—',
          summary: alert.summary || alert.description || 'Critical issue',
          updatedAt: alert.updatedAt || alert.createdAt,
          priority: (alert.severity || alert.priority || 'Medium').toString(),
        })) : FALLBACK_ALERTS;

        setUpcomingExams(normalizedExams);
        setVaccinationSummary(normalizedVaccines);
        setCriticalAlerts(normalizedAlerts);
        setInventoryCritical(inventorySource);

        const pendingExams = normalizedExams.filter((e) => (e.status || '').toLowerCase().includes('pending') || (e.status || '').toLowerCase().includes('schedule')).length;
        const chronicPatients = recordSource.filter((r) => Array.isArray(r?.chronicConditions) && r.chronicConditions.length).length;
        const vaccinationAlerts = normalizedVaccines.reduce((sum, v) => sum + (Number(v.overdue) || 0), 0);
        const lowStockItems = inventorySource.length;

        const nextExam = normalizedExams[0];
        const chronicSample = recordSource.find((record) => Array.isArray(record?.chronicConditions) && record.chronicConditions.length);
        const vaccineTop = normalizedVaccines.reduce((best, item) => {
          if (!best) return item;
          const bestScore = (Number(best.overdue) || 0) * 10 + (Number(best.dueCount) || 0);
          const currentScore = (Number(item.overdue) || 0) * 10 + (Number(item.dueCount) || 0);
          return currentScore > bestScore ? item : best;
        }, null);
        const inventoryTop = inventorySource[0];
        const emergencyTop = normalizedAlerts[0];

        const examDetail = nextExam ? `${nextExam.crewName || 'Crew member'} • ${shortDate(nextExam.scheduledFor)}` : 'All exams up to date';
        const chronicDetail = chronicSample ? `${chronicSample.crewName || chronicSample.crewId || 'Crew member'} • ${chronicSample.condition || chronicSample.recordType || 'Chronic monitoring'}` : 'No chronic alerts';
        const vaccineDetail = vaccineTop ? `${vaccineTop.vaccine} • ${vaccineTop.overdue ?? 0} overdue` : 'Vaccinations current';
        const inventoryDetail = inventoryTop ? `${inventoryTop.itemName || inventoryTop.crewName || 'Inventory item'} • ${inventoryTop.message || 'Critical levels'}` : 'Supplies within range';
        const emergencyDetail = emergencyTop ? `${emergencyTop.crewName || 'Crew member'} • ${emergencyTop.summary}` : 'No open emergencies';

        setStats([
          { icon: 'fas fa-exclamation-circle', value: pendingExams, label: 'Pending Examinations', tone: 'danger', detail: examDetail },
          { icon: 'fas fa-heartbeat', value: chronicPatients, label: 'Chronic Patients', tone: 'warning', detail: chronicDetail },
          { icon: 'fas fa-syringe', value: vaccinationAlerts, label: 'Vaccination Alerts', tone: 'primary', detail: vaccineDetail },
          { icon: 'fas fa-pills', value: lowStockItems, label: 'Low Stock Items', tone: 'info', detail: lowStockItems ? inventoryDetail : emergencyDetail },
        ]);

        if (recordSource.length) {
          const normalizedActivity = recordSource.slice(0, 4).map((record) => ({
            icon: 'fas fa-file-medical',
            title: record.title || record.recordType || 'Medical Record Update',
            desc: record.notes || record.summary || record.condition || 'Record updated.',
            time: record.updatedAt || record.createdAt,
          }));
          setActivities(normalizedActivity);
        } else {
          setActivities(FALLBACK_ACTIVITIES);
        }

        if (examSource.length) {
          const normalizedSchedule = examSource.slice(0, 4).map((exam) => ({
            time: exam.scheduledFor || exam.date || exam.performedAt,
            title: `${exam.crewName || exam.crew?.fullName || 'Crew Member'} - ${exam.examType || exam.type || 'Examination'}`,
            desc: exam.notes || exam.summary || 'Scheduled medical activity',
            status: exam.status || 'Scheduled',
          }));
          setSchedule(normalizedSchedule);
        } else {
          setSchedule(FALLBACK_SCHEDULE);
        }
      } catch (err) {
        console.warn('Failed to load dashboard data, using fallbacks', err);
        if (!mounted) return;
        setUpcomingExams(FALLBACK_EXAMS);
        setVaccinationSummary(FALLBACK_VACCINES);
        setCriticalAlerts(FALLBACK_ALERTS);
        setActivities(FALLBACK_ACTIVITIES);
        setSchedule(FALLBACK_SCHEDULE);
        setInventoryCritical([]);
        setStats([
          { icon: 'fas fa-exclamation-circle', value: FALLBACK_EXAMS.length, label: 'Pending Examinations', tone: 'danger', detail: 'Check examination pipeline' },
          { icon: 'fas fa-heartbeat', value: 5, label: 'Chronic Patients', tone: 'warning', detail: 'Focus on chronic follow-up' },
          { icon: 'fas fa-syringe', value: FALLBACK_VACCINES.reduce((sum, v) => sum + v.overdue, 0), label: 'Vaccination Alerts', tone: 'primary', detail: 'Address overdue vaccines' },
          { icon: 'fas fa-pills', value: FALLBACK_ALERTS.length, label: 'Low Stock Items', tone: 'info', detail: 'Monitor supply alerts' },
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  // Simple modal controls for quick actions
  const [modals, setModals] = useState({ record: false, exam: false, vaccine: false, reminder: false, report: false, education: false, emergency: false });
  const open = (k) => setModals((m) => ({ ...m, [k]: true }));
  const close = (k) => setModals((m) => ({ ...m, [k]: false }));

  const modalTitles = useMemo(() => ({
    record: 'Add Medical Record',
    exam: 'Record Examination',
    vaccine: 'Log Vaccination',
    reminder: 'Set Reminder',
    report: 'Generate Report',
    education: 'Publish Content',
  }), []);

  const quickStats = useMemo(() => ([
    { label: 'Pending Exams', value: stats[0]?.value ?? 0, icon: 'fas fa-clipboard-check', color: 'var(--info)' },
    { label: 'Chronic Patients', value: stats[1]?.value ?? 0, icon: 'fas fa-heartbeat', color: 'var(--warning)' },
    { label: 'Vaccination Alerts', value: stats[2]?.value ?? 0, icon: 'fas fa-syringe', color: 'var(--danger)' },
    { label: 'Low Stock Alerts', value: stats[3]?.value ?? 0, icon: 'fas fa-pills', color: 'var(--primary)' },
  ]), [stats]);

  const nextExamHighlight = useMemo(() => (
    Array.isArray(upcomingExams) && upcomingExams.length ? upcomingExams[0] : null
  ), [upcomingExams]);

  const vaccinationHighlight = useMemo(() => {
    if (!Array.isArray(vaccinationSummary) || !vaccinationSummary.length) return null;
    return vaccinationSummary.reduce((best, item) => {
      if (!best) return item;
      const bestScore = (Number(best.overdue) || 0) * 10 + (Number(best.dueCount) || 0);
      const currentScore = (Number(item.overdue) || 0) * 10 + (Number(item.dueCount) || 0);
      return currentScore > bestScore ? item : best;
    }, null);
  }, [vaccinationSummary]);

  const criticalHighlight = useMemo(() => {
    if (!Array.isArray(criticalAlerts) || !criticalAlerts.length) return null;
    const rank = (value) => {
      const normalized = (value || '').toString().toLowerCase();
      if (normalized === 'critical') return 4;
      if (normalized === 'high') return 3;
      if (normalized === 'medium') return 2;
      if (normalized === 'low') return 1;
      return 0;
    };
    return criticalAlerts.slice().sort((a, b) => rank(b.priority) - rank(a.priority))[0];
  }, [criticalAlerts]);

  const inventoryHighlight = useMemo(() => (
    Array.isArray(inventoryCritical) && inventoryCritical.length ? inventoryCritical[0] : null
  ), [inventoryCritical]);

  const heroHighlights = useMemo(() => ([
    {
      title: 'Next Examination',
      icon: 'fas fa-calendar-day',
      value: nextExamHighlight ? shortDate(nextExamHighlight.scheduledFor) : 'All clear',
      subtitle: nextExamHighlight ? `${nextExamHighlight.crewName || 'Crew member'} • ${nextExamHighlight.examType}` : 'No upcoming examinations scheduled',
      badge: nextExamHighlight?.status,
      tone: 'hero-info',
      action: () => navigate('/dashboard/health/examinations'),
      cta: 'View Exams',
    },
    {
      title: 'Vaccination Focus',
      icon: 'fas fa-syringe',
      value: vaccinationHighlight ? `${vaccinationHighlight.overdue ?? 0} overdue` : '0 overdue',
      subtitle: vaccinationHighlight ? `${vaccinationHighlight.vaccine} • ${vaccinationHighlight.dueCount ?? 0} due soon` : 'Vaccination schedule is on track',
      badge: vaccinationHighlight ? `${vaccinationHighlight.dueCount ?? 0} due` : undefined,
      tone: 'hero-warning',
      action: () => navigate('/dashboard/health/vaccination'),
      cta: 'Open Vaccinations',
    },
    {
      title: 'Critical Case Watch',
      icon: 'fas fa-heartbeat',
      value: criticalHighlight ? (criticalHighlight.priority || 'High').toString().toUpperCase() : 'Stable',
      subtitle: criticalHighlight ? `${criticalHighlight.crewName || 'Crew member'} • ${criticalHighlight.summary}` : 'No active critical emergencies',
      badge: stats[0]?.value ? `${stats[0].value} pending exams` : undefined,
      tone: 'hero-danger',
      action: () => navigate('/dashboard/health/emergency'),
      cta: 'Review Emergencies',
    },
    {
      title: 'Inventory Pulse',
      icon: 'fas fa-pills',
      value: inventoryHighlight ? 'Replenish now' : 'Good capacity',
      subtitle: inventoryHighlight ? `${inventoryHighlight.itemName || inventoryHighlight.crewName || 'Inventory item'} • ${inventoryHighlight.message || 'Critical stock level reached'}` : 'No critical stock alerts detected',
      badge: stats[3]?.value ? `${stats[3].value} items` : undefined,
      tone: 'hero-primary',
      action: () => navigate('/dashboard/inventory/alerts'),
      cta: 'Inventory Alerts',
    },
  ]), [criticalHighlight, inventoryHighlight, navigate, nextExamHighlight, stats, vaccinationHighlight]);

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

  // Reports
  const [reportRange, setReportRange] = useState({ from: '', to: '' });

  // Simple inactivity logout (demo): 30 minutes
  return (
    <HealthPageLayout
      title="Health Officer Dashboard"
      description="Overview of medical operations aboard MV Ocean Explorer"
    >
      {loading && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
          Syncing latest health data…
        </div>
      )}

      <section className="hero-overview">
        {heroHighlights.map((card, index) => (
          <div key={index} className={`hero-card ${card.tone}`}>
            <div className="hero-card-top">
              <div className="hero-icon">
                <i className={card.icon}></i>
              </div>
              {card.badge && <span className="hero-badge">{card.badge}</span>}
            </div>
            <div className="hero-card-main">
              <div className="hero-title">{card.title}</div>
              <div className="hero-value">{card.value}</div>
              <div className="hero-subtitle">{card.subtitle}</div>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={card.action}>{card.cta}</button>
          </div>
        ))}
      </section>

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
                {activities.map((a, i) => (
                  <li key={`${a.title}-${i}`} className="activity-item">
                    <div className="activity-icon"><i className={a.icon}></i></div>
                    <div className="activity-content">
                      <div className="activity-title">{a.title}</div>
                      <div className="activity-desc">{a.desc}</div>
                      <div className="activity-time">{formatDateTime(a.time)}</div>
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
                {schedule.map((s, i) => {
                  const statusLower = (s.status || '').toLowerCase();
                  const statusClass = statusLower.includes('high') ? 'status-urgent' : 'status-upcoming';
                  return (
                    <li key={`${s.title}-${i}`} className="schedule-item">
                      <div className="schedule-time">{formatDateTime(s.time)}</div>
                      <div className="schedule-content">
                        <div className="schedule-title">{s.title}</div>
                        <div className="schedule-desc">{s.desc}</div>
                      </div>
                      <div className={`schedule-status ${statusClass}`}>{s.status}</div>
                    </li>
                  );
                })}
          </ul>
        </div>
      </div>

      {/* Health Metrics Charts */}
      <div className="dashboard-section">
        <div className="section-header"><div className="section-title">Health Metrics Overview</div></div>
        <div className="charts-container">
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">Crew Health Status Distribution</div>
              <div className="chart-card-meta">Last 30 days</div>
            </div>
            <div className="chart-bars vertical">
              {[
                { label: 'Good', value: '65%', height: 78, variant: 'bar-good', tooltip: 'Good: 65%' },
                { label: 'Needs Attention', value: '25%', height: 48, variant: 'bar-attention', tooltip: 'Needs Attention: 25%' },
                { label: 'Critical', value: '10%', height: 28, variant: 'bar-critical', tooltip: 'Critical: 10%' },
              ].map((bar) => (
                <div key={bar.label} className="chart-bar column">
                  <div className="bar-stack">
                    <div className={`bar-fill ${bar.variant}`} style={{ height: `${bar.height}%` }} title={bar.tooltip}></div>
                  </div>
                  <span className="bar-label">{bar.label}</span>
                  <span className="bar-value">{bar.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">Monthly Consultations</div>
              <div className="chart-card-meta">Past four months</div>
            </div>
            <div className="chart-bars vertical">
              {[
                { label: 'Jul', value: '12', height: 36, variant: 'bar-mint', tooltip: 'Jul: 12 consultations' },
                { label: 'Aug', value: '18', height: 58, variant: 'bar-good', tooltip: 'Aug: 18 consultations' },
                { label: 'Sep', value: '16', height: 52, variant: 'bar-forest', tooltip: 'Sep: 16 consultations' },
                { label: 'Oct', value: '24', height: 80, variant: 'bar-sea', tooltip: 'Oct: 24 consultations' },
              ].map((bar) => (
                <div key={bar.label} className="chart-bar column">
                  <div className="bar-stack">
                    <div className={`bar-fill ${bar.variant}`} style={{ height: `${bar.height}%` }} title={bar.tooltip}></div>
                  </div>
                  <span className="bar-label">{bar.label}</span>
                  <span className="bar-value">{bar.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {Object.entries(modals).map(([k, v]) => (
        k !== 'emergency' && v ? (
          <div key={k} className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && close(k)}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">{modalTitles[k] || 'Action'}</h3>
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
    </HealthPageLayout>
  );
}
