import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import './healthMental.css';
import HealthSidebar from './HealthSidebar';
import {
  listMentalObservations,
  createMentalObservation,
  updateMentalObservation,
  deleteMentalObservation,
  listMentalSessions,
  createMentalSession,
  updateMentalSession,
  deleteMentalSession,
  getMentalSummary,
} from '../../lib/mentalHealthApi';
import { listCrewMembers } from '../../lib/healthApi';

const riskOptions = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'under_observation', label: 'Under Observation' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'referred', label: 'Referred' },
  { value: 'resolved', label: 'Resolved' },
];

const sessionTypeOptions = [
  { value: 'all', label: 'All Sessions' },
  { value: 'individual', label: 'Individual' },
  { value: 'group', label: 'Group' },
  { value: 'crisis', label: 'Crisis Intervention' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'telehealth', label: 'Telehealth' },
];

const rangeOptions = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '365', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

const riskLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const statusLabels = {
  under_observation: 'Under Observation',
  monitoring: 'Monitoring',
  referred: 'Referred',
  resolved: 'Resolved',
};

const sessionTypeLabels = {
  individual: 'Individual',
  group: 'Group',
  crisis: 'Crisis Intervention',
  followup: 'Follow-up',
  telehealth: 'Telehealth',
};

const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };

const toLocalInputValue = (value, withTime = false) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return withTime ? d.toISOString().slice(0, 16) : d.toISOString().slice(0, 10);
};

const parseListInput = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const getRangeParams = (key) => {
  if (key === 'all') return {};
  const end = new Date();
  const start = new Date(end);
  if (key === '7') start.setDate(start.getDate() - 7);
  else if (key === '30') start.setDate(start.getDate() - 30);
  else if (key === '90') start.setDate(start.getDate() - 90);
  else if (key === '365') start.setFullYear(start.getFullYear() - 1);
  return { from: start.toISOString(), to: end.toISOString() };
};

const defaultSummary = {
  riskCounts: {},
  statusCounts: {},
  recentSessions: [],
  upcomingFollowups: [],
  totalObservations: 0,
  totalSessions: 0,
};

const riskBadgeClass = (risk) => {
  if (risk === 'critical' || risk === 'high') return 'status-danger';
  if (risk === 'medium') return 'status-warning';
  return 'status-active';
};

const statusBadgeClass = (status) => {
  if (status === 'referred') return 'status-danger';
  if (status === 'monitoring') return 'status-warning';
  if (status === 'resolved') return 'status-success';
  return 'status-mental';
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

const buildObservationForm = (defaults = {}) => ({
  id: defaults._id || null,
  crewId: defaults.crewId || '',
  crewName: defaults.crewName || '',
  observationDate: toLocalInputValue(defaults.observationDate || new Date(), true),
  concerns: defaults.concerns || '',
  symptoms: Array.isArray(defaults.symptoms) ? defaults.symptoms.join(', ') : defaults.symptoms || '',
  riskLevel: defaults.riskLevel || 'medium',
  status: defaults.status || 'under_observation',
  moodScore: defaults.moodScore ?? 50,
  stressLevel: defaults.stressLevel ?? 50,
  notes: defaults.notes || '',
  interventions: defaults.interventions || '',
  recommendations: defaults.recommendations || '',
  tags: Array.isArray(defaults.tags) ? defaults.tags.join(', ') : defaults.tags || '',
  lastSessionDate: toLocalInputValue(defaults.lastSessionDate, false),
});

const buildSessionForm = (defaults = {}) => ({
  id: defaults._id || null,
  crewId: defaults.crewId || '',
  crewName: defaults.crewName || '',
  sessionDate: toLocalInputValue(defaults.sessionDate || new Date(), true),
  durationMinutes: defaults.durationMinutes || 45,
  sessionType: defaults.sessionType || 'individual',
  focusAreas: Array.isArray(defaults.focusAreas) ? defaults.focusAreas.join(', ') : defaults.focusAreas || '',
  notes: defaults.notes || '',
  recommendations: defaults.recommendations || '',
  riskAssessment: defaults.riskAssessment || 'low',
  followUpDate: toLocalInputValue(defaults.followUpDate, false),
});

function HealthMental() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('observations');
  const [observations, setObservations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);

  const [obFilters, setObFilters] = useState({ search: '', risk: 'all', status: 'all', range: '30' });
  const [sessionFilters, setSessionFilters] = useState({ search: '', type: 'all', range: '30' });

  const [observationLoading, setObservationLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');

  const [crewOptions, setCrewOptions] = useState([]);
  const [crewLoading, setCrewLoading] = useState(false);

  const [observationModalOpen, setObservationModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [obForm, setObForm] = useState(() => buildObservationForm());
  const [sessionForm, setSessionForm] = useState(() => buildSessionForm());
  const [savingObservation, setSavingObservation] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  const onLogout = () => { clearSession(); navigate('/login'); };

  const crewNameById = useMemo(() => {
    const map = {};
    crewOptions.forEach((crew) => {
      if (crew?.crewId) map[crew.crewId] = crew.fullName || crew.crewId;
    });
    return map;
  }, [crewOptions]);

  const highlightedObservations = useMemo(() => {
    return [...observations]
      .sort((a, b) => {
        const riskDiff = (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
        if (riskDiff !== 0) return riskDiff;
        return new Date(b.observationDate || 0) - new Date(a.observationDate || 0);
      })
      .slice(0, 3);
  }, [observations]);

  const filteredObservations = useMemo(() => {
    const search = obFilters.search.trim().toLowerCase();
    return observations.filter((obs) => {
      const matchesSearch = !search || [obs.crewName, obs.crewId, obs.concerns, obs.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
      const matchesRisk = obFilters.risk === 'all' || obs.riskLevel === obFilters.risk;
      const matchesStatus = obFilters.status === 'all' || obs.status === obFilters.status;
      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [observations, obFilters]);

  const filteredSessions = useMemo(() => {
    const search = sessionFilters.search.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchesSearch = !search || [session.crewName, session.crewId, session.notes, session.focusAreas]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
      const matchesType = sessionFilters.type === 'all' || session.sessionType === sessionFilters.type;
      return matchesSearch && matchesType;
    });
  }, [sessions, sessionFilters]);

  const stressAverage = useMemo(() => {
    if (!observations.length) return 45;
    const total = observations.reduce((acc, obs) => acc + (typeof obs.stressLevel === 'number' ? obs.stressLevel : 45), 0);
    return Math.round(total / observations.length);
  }, [observations]);

  const sessionsThisMonth = useMemo(() => {
    const now = new Date();
    return sessions.filter((session) => {
      const date = new Date(session.sessionDate);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
  }, [sessions]);

  const loadCrew = useCallback(async () => {
    try {
      setCrewLoading(true);
      const data = await listCrewMembers('');
      setCrewOptions(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      console.error('listCrewMembers error', err);
    } finally {
      setCrewLoading(false);
    }
  }, []);

  const loadObservations = useCallback(async () => {
    try {
      setObservationLoading(true);
      setError('');
      const { search, risk, status, range } = obFilters;
      const params = {
        q: search || undefined,
        riskLevel: risk !== 'all' ? risk : undefined,
        status: status !== 'all' ? status : undefined,
        limit: 250,
      };
      const { from, to } = getRangeParams(range);
      if (from) params.from = from;
      if (to) params.to = to;
      const data = await listMentalObservations(params);
      setObservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('listMentalObservations error', err);
      setError('Failed to load mental health observations.');
    } finally {
      setObservationLoading(false);
    }
  }, [obFilters]);

  const loadSessions = useCallback(async () => {
    try {
      setSessionLoading(true);
      setError('');
      const { search, type, range } = sessionFilters;
      const params = {
        q: search || undefined,
        sessionType: type !== 'all' ? type : undefined,
        limit: 250,
      };
      const { from, to } = getRangeParams(range);
      if (from) params.from = from;
      if (to) params.to = to;
      const data = await listMentalSessions(params);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('listMentalSessions error', err);
      setError('Failed to load counseling sessions.');
    } finally {
      setSessionLoading(false);
    }
  }, [sessionFilters]);

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await getMentalSummary();
      setSummary(data || defaultSummary);
    } catch (err) {
      console.error('getMentalSummary error', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrew();
    loadSummary();
  }, [loadCrew, loadSummary]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const openObservationModal = (obs = null) => {
    setObservationModalOpen(true);
    setObForm(buildObservationForm(obs || {}));
  };

  const openSessionModal = (session = null) => {
    setSessionModalOpen(true);
    setSessionForm(buildSessionForm(session || {}));
  };

  const openSessionForObservation = (obs) => {
    openSessionModal({
      crewId: obs.crewId,
      crewName: obs.crewName,
      sessionType: 'followup',
      focusAreas: obs.concerns,
      followUpDate: obs.lastSessionDate,
    });
  };

  const closeObservationModal = () => {
    if (savingObservation) return;
    setObservationModalOpen(false);
    setObForm(buildObservationForm());
  };

  const closeSessionModal = () => {
    if (savingSession) return;
    setSessionModalOpen(false);
    setSessionForm(buildSessionForm());
  };

  const handleObservationSubmit = async (event) => {
    event.preventDefault();
    setSavingObservation(true);
    try {
      const payload = {
        crewId: obForm.crewId,
        crewName: crewNameById[obForm.crewId] || obForm.crewName,
        observationDate: obForm.observationDate ? new Date(obForm.observationDate).toISOString() : undefined,
        concerns: obForm.concerns,
        symptoms: parseListInput(obForm.symptoms),
        riskLevel: obForm.riskLevel,
        status: obForm.status,
        moodScore: Number(obForm.moodScore) || 0,
        stressLevel: Number(obForm.stressLevel) || 0,
        notes: obForm.notes,
        interventions: obForm.interventions,
        recommendations: obForm.recommendations,
        tags: parseListInput(obForm.tags),
        lastSessionDate: obForm.lastSessionDate ? new Date(`${obForm.lastSessionDate}T00:00:00`).toISOString() : undefined,
      };

      if (!payload.crewId || !payload.observationDate || !payload.concerns) {
        alert('Crew member, observation date, and concerns are required.');
        return;
      }

      if (obForm.id) {
        await updateMentalObservation(obForm.id, payload);
        alert('Observation updated successfully.');
      } else {
        await createMentalObservation(payload);
        alert('Observation recorded successfully.');
      }

      closeObservationModal();
      await Promise.all([loadObservations(), loadSummary()]);
    } catch (err) {
      console.error('save observation error', err);
      alert('Failed to save observation. Please try again.');
    } finally {
      setSavingObservation(false);
    }
  };

  const handleSessionSubmit = async (event) => {
    event.preventDefault();
    setSavingSession(true);
    try {
      const payload = {
        crewId: sessionForm.crewId,
        crewName: crewNameById[sessionForm.crewId] || sessionForm.crewName,
        sessionDate: sessionForm.sessionDate ? new Date(sessionForm.sessionDate).toISOString() : undefined,
        durationMinutes: Number(sessionForm.durationMinutes) || 0,
        sessionType: sessionForm.sessionType,
        focusAreas: parseListInput(sessionForm.focusAreas),
        notes: sessionForm.notes,
        recommendations: sessionForm.recommendations,
        riskAssessment: sessionForm.riskAssessment,
        followUpDate: sessionForm.followUpDate ? new Date(`${sessionForm.followUpDate}T00:00:00`).toISOString() : undefined,
      };

      if (!payload.crewId || !payload.sessionDate || !payload.durationMinutes) {
        alert('Crew member, session date, and duration are required.');
        return;
      }

      if (sessionForm.id) {
        await updateMentalSession(sessionForm.id, payload);
        alert('Session updated successfully.');
      } else {
        await createMentalSession(payload);
        alert('Session recorded successfully.');
      }

      closeSessionModal();
      await Promise.all([loadSessions(), loadSummary()]);
    } catch (err) {
      console.error('save session error', err);
      alert('Failed to save session. Please try again.');
    } finally {
      setSavingSession(false);
    }
  };

  const handleDeleteObservation = async (obs) => {
    if (!window.confirm(`Delete observation for ${obs.crewName || obs.crewId}?`)) return;
    try {
      await deleteMentalObservation(obs._id || obs.id);
      await Promise.all([loadObservations(), loadSummary()]);
    } catch (err) {
      console.error('delete observation error', err);
      alert('Failed to delete observation.');
    }
  };

  const handleDeleteSession = async (session) => {
    if (!window.confirm(`Delete session for ${session.crewName || session.crewId}?`)) return;
    try {
      await deleteMentalSession(session._id || session.id);
      await Promise.all([loadSessions(), loadSummary()]);
    } catch (err) {
      console.error('delete session error', err);
      alert('Failed to delete session.');
    }
  };

  const handleEditObservation = (obs) => openObservationModal(obs);
  const handleEditSession = (session) => openSessionModal(session);

  const handleViewObservation = (obs) => {
    const lines = [
      `Crew: ${obs.crewName || obs.crewId}`,
      `Observed: ${formatDateTime(obs.observationDate)}`,
      `Concerns: ${obs.concerns}`,
      `Risk: ${riskLabels[obs.riskLevel] || obs.riskLevel}`,
      `Status: ${statusLabels[obs.status] || obs.status}`,
      obs.notes ? `Notes: ${obs.notes}` : null,
      obs.recommendations ? `Recommendations: ${obs.recommendations}` : null,
    ].filter(Boolean);
    alert(lines.join('\n'));
  };

  const handleViewSession = (session) => {
    const lines = [
      `Crew: ${session.crewName || session.crewId}`,
      `Date: ${formatDateTime(session.sessionDate)}`,
      `Type: ${sessionTypeLabels[session.sessionType] || session.sessionType}`,
      `Duration: ${session.durationMinutes} minutes`,
      session.focusAreas?.length ? `Focus: ${Array.isArray(session.focusAreas) ? session.focusAreas.join(', ') : session.focusAreas}` : null,
      session.notes ? `Notes: ${session.notes}` : null,
      session.recommendations ? `Recommendations: ${session.recommendations}` : null,
    ].filter(Boolean);
    alert(lines.join('\n'));
  };

  const observationStats = summary.statusCounts || {};
  const highRiskCount = (summary.riskCounts?.high || 0) + (summary.riskCounts?.critical || 0);
  const wellnessScore = (() => {
    const total = summary.totalObservations || observations.length;
    if (!total) return 92;
    const maxPenalty = Math.max(total, 1);
    const penalty = Math.min(40, Math.round((highRiskCount / maxPenalty) * 45));
    return Math.max(40, 95 - penalty);
  })();

  const resources = [
    {
      icon: 'fas fa-book',
      title: 'Coping Strategies Guide',
      desc: 'Practical techniques for managing stress and anxiety during long voyages.',
    },
    {
      icon: 'fas fa-hand-holding-heart',
      title: 'Crisis Intervention Protocol',
      desc: 'Step-by-step playbook for responding to acute mental health incidents.',
    },
    {
      icon: 'fas fa-users',
      title: 'Group Session Toolkit',
      desc: 'Templates and activities for ongoing crew group check-ins.',
    },
    {
      icon: 'fas fa-phone-alt',
      title: 'Emergency Support Contacts',
      desc: 'Global 24/7 helplines and maritime mental health resources.',
    },
  ];

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          <div className="header">
            <h2>Mental Health Oversight</h2>
            <div className="user-info">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`}
                alt="User"
              />
              <div>
                <div>{user?.fullName || 'Health Officer'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Crew Mental Wellness Overview</div>
              <div className="page-actions">
                <button className="btn btn-mental" onClick={() => openObservationModal()}>
                  <i className="fas fa-plus"></i> New Observation
                </button>
                <button className="btn btn-outline" onClick={() => openSessionModal()}>
                  <i className="fas fa-plus"></i> New Counseling Session
                </button>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="wellness-container">
              <div className="wellness-item">
                <div className="wellness-value">{wellnessScore}%</div>
                <div className="wellness-label">Wellness Score</div>
              </div>
              <div className="wellness-item">
                <div className="wellness-value">{observationStats.under_observation || 0}</div>
                <div className="wellness-label">Under Observation</div>
              </div>
              <div className="wellness-item">
                <div className="wellness-value">{sessionsThisMonth}</div>
                <div className="wellness-label">Sessions This Month</div>
              </div>
              <div className="wellness-item">
                <div className="wellness-value">{highRiskCount}</div>
                <div className="wellness-label">High Risk Cases</div>
              </div>
            </div>

            <div className="scale-container">
              <div className="scale-header">
                <div className="scale-title">Average Stress Level</div>
                <div>{stressAverage}/100 ({stressAverage <= 35 ? 'Low' : stressAverage <= 70 ? 'Moderate' : 'High'})</div>
              </div>
              <div className="scale-bar">
                <div className="scale-fill" style={{ width: `${Math.min(Math.max(stressAverage, 5), 95)}%` }}></div>
              </div>
              <div className="scale-labels">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Severe</span>
              </div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Mental Health Management</div>
            </div>

            <div className="tabs tabs-mental">
              <div className={`tab ${activeTab === 'observations' ? 'active' : ''}`} onClick={() => setActiveTab('observations')} role="button" tabIndex={0}>
                Observations
              </div>
              <div className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')} role="button" tabIndex={0}>
                Counseling Sessions
              </div>
              <div className={`tab ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')} role="button" tabIndex={0}>
                Resources
              </div>
            </div>

            {activeTab === 'observations' && (
              <div className="tab-content active">
                <div className="search-filter observation-inline">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                      type="text"
                      placeholder="Search crew or observations..."
                      value={obFilters.search}
                      onChange={(e) => setObFilters((prev) => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <select value={obFilters.status} onChange={(e) => setObFilters((prev) => ({ ...prev, status: e.target.value }))} className="filter-select">
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select value={obFilters.risk} onChange={(e) => setObFilters((prev) => ({ ...prev, risk: e.target.value }))} className="filter-select">
                    {riskOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select value={obFilters.range} onChange={(e) => setObFilters((prev) => ({ ...prev, range: e.target.value }))} className="filter-select">
                    {rangeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {observationLoading && <div className="loading">Loading observations...</div>}

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crew Member</th>
                        <th>Observation Date</th>
                        <th>Concerns</th>
                        <th>Risk Level</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredObservations.map((obs) => (
                        <tr key={obs._id}>
                          <td>{obs.crewName || obs.crewId || '—'}</td>
                          <td>{formatDate(obs.observationDate)}</td>
                          <td>{obs.concerns}</td>
                          <td><span className={`status-badge ${riskBadgeClass(obs.riskLevel)}`}>{riskLabels[obs.riskLevel] || obs.riskLevel}</span></td>
                          <td><span className={`status-badge ${statusBadgeClass(obs.status)}`}>{statusLabels[obs.status] || obs.status}</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm" onClick={() => handleViewObservation(obs)}>View</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleEditObservation(obs)}>Edit</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleDeleteObservation(obs)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {!filteredObservations.length && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                            No observations found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="tab-content active">
                <div className="search-filter session-inline">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={sessionFilters.search}
                      onChange={(e) => setSessionFilters((prev) => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <select value={sessionFilters.type} onChange={(e) => setSessionFilters((prev) => ({ ...prev, type: e.target.value }))} className="filter-select">
                    {sessionTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select value={sessionFilters.range} onChange={(e) => setSessionFilters((prev) => ({ ...prev, range: e.target.value }))} className="filter-select">
                    {rangeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {sessionLoading && <div className="loading">Loading sessions...</div>}

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Patient</th>
                        <th>Session Type</th>
                        <th>Duration</th>
                        <th>Focus Areas</th>
                        <th>Risk</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr key={session._id}>
                          <td>{formatDateTime(session.sessionDate)}</td>
                          <td>{session.crewName || session.crewId || '—'}</td>
                          <td>{sessionTypeLabels[session.sessionType] || session.sessionType}</td>
                          <td>{session.durationMinutes || '—'} min</td>
                          <td>{Array.isArray(session.focusAreas) ? session.focusAreas.join(', ') : session.focusAreas || '—'}</td>
                          <td><span className={`status-badge ${riskBadgeClass(session.riskAssessment)}`}>{riskLabels[session.riskAssessment] || session.riskAssessment}</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-outline btn-sm" onClick={() => handleViewSession(session)}>View</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleEditSession(session)}>Edit</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleDeleteSession(session)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {!filteredSessions.length && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                            No counseling sessions match the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="cards-container" style={{ marginTop: 30 }}>
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Recent Sessions</div>
                      <div className="card-icon primary"><i className="fas fa-history"></i></div>
                    </div>
                    <div className="card-content">
                      {summary.recentSessions?.length ? (
                        summary.recentSessions.map((session) => (
                          <div key={session._id || session.id} className="card-details" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{session.crewName || session.crewId}</span>
                            <span>{formatDate(session.sessionDate)} · {sessionTypeLabels[session.sessionType] || session.sessionType}</span>
                          </div>
                        ))
                      ) : (
                        <div className="card-details">No recent sessions recorded.</div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Upcoming Follow-ups</div>
                      <div className="card-icon primary"><i className="fas fa-calendar-check"></i></div>
                    </div>
                    <div className="card-content">
                      {summary.upcomingFollowups?.length ? (
                        summary.upcomingFollowups.map((session) => (
                          <div key={session._id || session.id} className="card-details" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{session.crewName || session.crewId}</span>
                            <span>{formatDate(session.followUpDate)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="card-details">No scheduled follow-up sessions.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="tab-content active">
                <div className="page-header">
                  <div className="page-title">Mental Health Resources</div>
                </div>
                <div className="resources-grid">
                  {resources.map((resource, idx) => (
                    <div key={idx} className="resource-card">
                      <div className="resource-icon"><i className={resource.icon}></i></div>
                      <div className="resource-title">{resource.title}</div>
                      <div className="resource-desc">{resource.desc}</div>
                      <button className="btn btn-outline btn-sm">Open</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Observation Modal */}
      {observationModalOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeObservationModal()}>
          <div className="modal-content" style={{ maxWidth: 860 }}>
            <div className="modal-header">
              <h3 className="modal-title">{obForm.id ? 'Update Observation' : 'Record New Observation'}</h3>
              <button className="close-modal" onClick={closeObservationModal}>&times;</button>
            </div>
            <form onSubmit={handleObservationSubmit} className="form-grid">
              <div className="form-group">
                <label>Crew Member *</label>
                <select
                  value={obForm.crewId}
                  onChange={(e) => setObForm((prev) => ({ ...prev, crewId: e.target.value }))}
                  className="form-control"
                  required
                >
                  <option value="">Select crew</option>
                  {crewOptions.map((crew) => (
                    <option key={crew.crewId} value={crew.crewId}>{crew.fullName || crew.crewId}</option>
                  ))}
                </select>
                {crewLoading && <small>Loading crew directory…</small>}
              </div>
              <div className="form-group">
                <label>Observation Date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={obForm.observationDate}
                  onChange={(e) => setObForm((prev) => ({ ...prev, observationDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Risk Level</label>
                <select
                  className="form-control"
                  value={obForm.riskLevel}
                  onChange={(e) => setObForm((prev) => ({ ...prev, riskLevel: e.target.value }))}
                >
                  {riskOptions.slice(1).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={obForm.status}
                  onChange={(e) => setObForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  {statusOptions.slice(1).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Primary Concerns *</label>
                <input
                  type="text"
                  className="form-control"
                  value={obForm.concerns}
                  onChange={(e) => setObForm((prev) => ({ ...prev, concerns: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Symptoms</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Comma separated (e.g. anxiety, insomnia)"
                  value={obForm.symptoms}
                  onChange={(e) => setObForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Comma separated"
                  value={obForm.tags}
                  onChange={(e) => setObForm((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Mood Score</label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  max={100}
                  value={obForm.moodScore}
                  onChange={(e) => setObForm((prev) => ({ ...prev, moodScore: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Stress Level</label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  max={100}
                  value={obForm.stressLevel}
                  onChange={(e) => setObForm((prev) => ({ ...prev, stressLevel: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Observation Notes</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={obForm.notes}
                  onChange={(e) => setObForm((prev) => ({ ...prev, notes: e.target.value }))}
                ></textarea>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Interventions</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={obForm.interventions}
                  onChange={(e) => setObForm((prev) => ({ ...prev, interventions: e.target.value }))}
                ></textarea>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Recommendations & Follow-up</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={obForm.recommendations}
                  onChange={(e) => setObForm((prev) => ({ ...prev, recommendations: e.target.value }))}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Last Session Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={obForm.lastSessionDate}
                  onChange={(e) => setObForm((prev) => ({ ...prev, lastSessionDate: e.target.value }))}
                />
              </div>
              <div className="form-actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={closeObservationModal} disabled={savingObservation} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-mental" disabled={savingObservation} style={{ flex: 1 }}>
                  {savingObservation ? 'Saving…' : obForm.id ? 'Update Observation' : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {sessionModalOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeSessionModal()}>
          <div className="modal-content" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 className="modal-title">{sessionForm.id ? 'Update Counseling Session' : 'Log Counseling Session'}</h3>
              <button className="close-modal" onClick={closeSessionModal}>&times;</button>
            </div>
            <form onSubmit={handleSessionSubmit} className="form-grid">
              <div className="form-group">
                <label>Crew Member *</label>
                <select
                  value={sessionForm.crewId}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, crewId: e.target.value }))}
                  className="form-control"
                  required
                >
                  <option value="">Select crew</option>
                  {crewOptions.map((crew) => (
                    <option key={crew.crewId} value={crew.crewId}>{crew.fullName || crew.crewId}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Session Date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={sessionForm.sessionDate}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  className="form-control"
                  min={15}
                  max={240}
                  value={sessionForm.durationMinutes}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Session Type</label>
                <select
                  className="form-control"
                  value={sessionForm.sessionType}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionType: e.target.value }))}
                >
                  {sessionTypeOptions.slice(1).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Focus Areas *</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Comma separated focus areas"
                  value={sessionForm.focusAreas}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, focusAreas: e.target.value }))}
                  required
                ></textarea>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Session Notes</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, notes: e.target.value }))}
                ></textarea>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Recommendations</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={sessionForm.recommendations}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, recommendations: e.target.value }))}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Risk Assessment</label>
                <select
                  className="form-control"
                  value={sessionForm.riskAssessment}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, riskAssessment: e.target.value }))}
                >
                  {riskOptions.slice(1, 4).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Follow-up Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={sessionForm.followUpDate}
                  onChange={(e) => setSessionForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                />
              </div>
              <div className="form-actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={closeSessionModal} disabled={savingSession} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-mental" disabled={savingSession} style={{ flex: 1 }}>
                  {savingSession ? 'Saving…' : sessionForm.id ? 'Update Session' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthMental;
