import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import './healthReport.css';
import HealthSidebar from './HealthSidebar';
import {
  listHealthReports,
  createHealthReport,
  updateHealthReport,
  deleteHealthReport,
  getHealthReport,
  getHealthReportStats,
  downloadHealthReportPdf,
  downloadHealthReportCsv
} from '../../lib/healthReportApi';

const tabCategoryMap = {
  summary: 'summary',
  analytics: 'analytics',
  certificates: 'certificate',
  scheduled: 'scheduled'
};

const sectionOptions = [
  'Executive Summary',
  'Crew Health Overview',
  'Vaccination Status',
  'Chronic Conditions',
  'Mental Health',
  'Medication Adherence',
  'Incidents & Alerts',
  'Inventory Overview',
  'Recommendations'
];

const formatOptions = ['pdf', 'excel', 'dashboard'];

const statusOptions = [
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' }
];

const createUniqueId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const createInitialFormData = (category = 'summary') => ({
  category,
  reportType: '',
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  generatedAt: '',
  sections: ['Executive Summary', 'Crew Health Overview'],
  formats: ['pdf'],
  status: 'completed',
  metrics: [],
  files: [],
  schedule: { enabled: false },
  certificateInfo: null,
  tags: []
});

const toInputDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '—';
  }
  return date.toLocaleDateString();
};

const getDateRangeBounds = (range) => {
  if (!range || range === 'all') {
    return { from: undefined, to: undefined };
  }
  const days = Number(range);
  if (!Number.isFinite(days)) {
    return { from: undefined, to: undefined };
  }
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
};

const formatReportStatus = (status) => {
  if (!status) return '—';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatFileSize = (size) => {
  if (!size) return '—';
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  return `${size} B`;
};

const mapReportToForm = (report) => ({
  category: report.category || 'summary',
  reportType: report.reportType || '',
  title: report.title || '',
  description: report.description || '',
  startDate: toInputDate(report?.dateRange?.start),
  endDate: toInputDate(report?.dateRange?.end),
  generatedAt: toInputDate(report?.generatedAt),
  sections: Array.isArray(report.sections) && report.sections.length ? report.sections : ['Executive Summary'],
  formats: Array.isArray(report.formats) && report.formats.length ? report.formats : ['pdf'],
  status: report.status || 'completed',
  metrics: Array.isArray(report.metrics) ? report.metrics : [],
  files: Array.isArray(report.files) ? report.files : [],
  schedule: report.schedule || { enabled: false },
  certificateInfo: report.certificateInfo || null,
  tags: Array.isArray(report.tags) ? report.tags : []
});

const buildPayloadFromForm = (data) => {
  const formats = Array.isArray(data.formats) && data.formats.length ? data.formats : ['pdf'];

  return {
    category: data.category,
    reportType: data.reportType.trim(),
    title: data.title.trim(),
    description: data.description.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    generatedAt: data.generatedAt,
    status: data.status,
    sections: Array.isArray(data.sections) && data.sections.length ? data.sections : ['Executive Summary'],
    formats,
    metrics: data.metrics || [],
    files: data.files || [],
    schedule: data.schedule || { enabled: false },
    certificateInfo: data.certificateInfo || null,
    tags: data.tags || []
  };
};

const getReportId = (report) => report?._id || report?.id;

export default function HealthReports() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('summary');
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'all', dateRange: '30' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  const loadStats = useCallback(async () => {
    try {
      const data = await getHealthReportStats();
      setStats(data);
    } catch (err) {
      console.error('getHealthReportStats error', err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const handle = setTimeout(() => {
      loadReports();
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.search, filters.status, filters.dateRange]);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        category: tabCategoryMap[activeTab],
        status: filters.status !== 'all' ? filters.status : undefined,
        q: filters.search.trim() || undefined
      };
      const { from, to } = getDateRangeBounds(filters.dateRange);
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();

      const response = await listHealthReports(params);
      const items = Array.isArray(response.items) ? response.items : response;
      setReports(Array.isArray(items) ? items : []);

      if (selectedReportId) {
        const updated = items?.find((item) => getReportId(item) === selectedReportId);
        if (updated) {
          setSelectedReport((prev) => ({ ...(prev || {}), ...updated }));
        }
      }
    } catch (err) {
      console.error('listHealthReports error', err);
      setError(err.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const visibleReports = useMemo(() => {
    return reports.map((report) => ({
      ...report,
      id: getReportId(report)
    }));
  }, [reports]);

  const handleSelectReport = async (report) => {
    if (!report) return;
    const id = getReportId(report);
    if (!id) return;
    setSelectedReportId(id);
    setSelectedReport(report);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const detailed = await getHealthReport(id);
      setSelectedReport((prev) => (getReportId(prev) === id ? detailed : prev));
    } catch (err) {
      console.error('getHealthReport error', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreateModal = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const category = tabCategoryMap[activeTab] || 'summary';
    setModalMode('create');
    setFormError('');
    setFormData({
      ...createInitialFormData(category),
      startDate: toInputDate(firstDay),
      endDate: toInputDate(lastDay),
      generatedAt: toInputDate(today)
    });
    setModalOpen(true);
  };

  const openEditModal = (report) => {
    if (!report) return;
    const mapped = mapReportToForm(report);
    setModalMode('edit');
    setFormError('');
    setFormData(mapped);
    setModalOpen(true);
    setSelectedReportId(getReportId(report));
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError('');
    setSaving(false);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
  };

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section) => {
    setFormData((prev) => {
      const exists = prev.sections.includes(section);
      return {
        ...prev,
        sections: exists ? prev.sections.filter((item) => item !== section) : [...prev.sections, section]
      };
    });
  };

  const toggleFormat = (format) => {
    setFormData((prev) => {
      const exists = prev.formats.includes(format);
      if (exists) {
        const next = prev.formats.filter((item) => item !== format);
        return {
          ...prev,
          formats: next.length ? next : ['pdf']
        };
      }
      return {
        ...prev,
        formats: [...prev.formats, format]
      };
    });
  };

  const handleDeleteReport = async (report) => {
    if (!report) return;
    const id = getReportId(report);
    if (!id) return;
    if (!window.confirm(`Delete report "${report.title}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteHealthReport(id);
      setSelectedReportId((prev) => (prev === id ? null : prev));
      setSelectedReport((prev) => (getReportId(prev) === id ? null : prev));
      await loadReports();
    } catch (err) {
      console.error('deleteHealthReport error', err);
      alert(err.message || 'Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.reportType.trim()) {
      setFormError('Report type is required.');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Report title is required.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setFormError('Please provide both start and end dates.');
      return;
    }

    const payload = buildPayloadFromForm(formData);
    setSaving(true);
    try {
      let savedReport;
      if (modalMode === 'edit' && selectedReportId) {
        savedReport = await updateHealthReport(selectedReportId, payload);
      } else {
        savedReport = await createHealthReport(payload);
      }
      if (savedReport) {
        const savedId = getReportId(savedReport);
        if (modalMode === 'edit' && savedId) {
          setSelectedReportId(savedId);
        }
        if (modalMode === 'edit') {
          setSelectedReport((prev) => (getReportId(prev) === savedId ? savedReport : prev));
        }
      }
      closeModal();
      await loadReports();
      await loadStats();
    } catch (err) {
      console.error('save health report error', err);
      setFormError(err.message || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = async (report, format) => {
    if (!report) return;
    const id = getReportId(report);
    if (!id) return;
    const key = `${id}-${format}`;
    setDownloadingId(key);
    try {
      if (format === 'pdf') {
        await downloadHealthReportPdf(id);
      } else {
        await downloadHealthReportCsv(id);
      }
    } catch (err) {
      console.error(`download health report ${format} error`, err);
      alert(err.message || `Failed to download ${format.toUpperCase()} report`);
    } finally {
      setDownloadingId(null);
    }
  };

  const renderStatusBadge = (status) => (
    <span className={`report-status ${status || 'draft'}`}>
      <span className="dot"></span>
      {formatReportStatus(status)}
    </span>
  );

  const schedulePill = (report) => {
    if (!report?.schedule?.enabled) {
      return 'Manual';
    }
    const frequency = report.schedule.frequency || 'custom';
    const next = report.schedule.nextRunAt ? formatDate(report.schedule.nextRunAt) : '—';
    return `${frequency} • Next: ${next}`;
  };

  const emptyMessages = {
    summary: 'No summary reports found. Generate a new summary to get started.',
    analytics: 'No analytics reports available. Create one to analyze crew health metrics.',
    certificates: 'No health certificates generated yet.',
    scheduled: 'No scheduled reports configured. Use the schedule options to automate.'
  };

  const currentEmptyMessage = emptyMessages[activeTab] || 'No reports available.';

  const categoryCounts = stats?.categoryCounts || {};

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Health Reports & Analytics</h2>
            <div className="user-info">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`}
                alt="User"
              />
              <div>
                <div>{user?.fullName || 'Health Officer'}</div>
                <small>MV Ocean Explorer | Health Division</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Reports Overview */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Reports Dashboard</div>
              <div className="page-actions">
                <button className="btn btn-action btn-sm" type="button">
                  <i className="fas fa-download"></i> Export CSV
                </button>
                <button className="btn btn-action btn-sm" type="button" onClick={openCreateModal}>
                  <i className="fas fa-plus"></i> New Report
                </button>
              </div>
            </div>

            <div className="report-stats">
              <div className="report-card accent">
                <div className="stat-label">Total Reports</div>
                <div className="stat-value">{stats?.totalReports ?? '—'}</div>
                <div className="stat-subtext">Across all categories</div>
              </div>
              <div className="report-card">
                <div className="stat-label">This Month</div>
                <div className="stat-value">{stats?.monthReports ?? '—'}</div>
                <div className="stat-subtext">Generated since {formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}</div>
              </div>
              <div className="report-card">
                <div className="stat-label">Scheduled</div>
                <div className="stat-value">{stats?.scheduledReports ?? '—'}</div>
                <div className="stat-subtext">Automated report workflows</div>
              </div>
              <div className="report-card">
                <div className="stat-label">Compliance</div>
                <div className="stat-value">{stats?.complianceRate !== undefined ? `${stats.complianceRate}%` : '—'}</div>
                <div className="stat-subtext">Completion rate for issued reports</div>
              </div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Health Reports Management</div>
            </div>

            <div className="tabs">
              <div
                className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary Reports ({categoryCounts.summary || 0})
              </div>
              <div
                className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Health Analytics ({categoryCounts.analytics || 0})
              </div>
              <div
                className={`tab ${activeTab === 'certificates' ? 'active' : ''}`}
                onClick={() => setActiveTab('certificates')}
              >
                Health Certificates ({categoryCounts.certificate || 0})
              </div>
              <div
                className={`tab ${activeTab === 'scheduled' ? 'active' : ''}`}
                onClick={() => setActiveTab('scheduled')}
              >
                Scheduled Reports ({categoryCounts.scheduled || 0})
              </div>
            </div>

            <div className="tab-content active">
              <div className="report-filters">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search reports by title, type, or tag..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <select
                  className="filter-select"
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All Status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="filter-select"
                  value={filters.dateRange}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                >
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="180">Last 180 Days</option>
                  <option value="365">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {error && (
                <div
                  className="alert alert-danger"
                  style={{ marginBottom: 16, padding: 12, borderRadius: 10 }}
                >
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>
                  {error}
                </div>
              )}

              {loading ? (
                <div
                  className="alert alert-info"
                  style={{ marginBottom: 16, padding: 12, borderRadius: 10 }}
                >
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                  Loading reports...
                </div>
              ) : visibleReports.length === 0 ? (
                <div className="empty-state">
                  <h4>No Reports Found</h4>
                  <p>{currentEmptyMessage}</p>
                  <button className="btn btn-primary" type="button" onClick={openCreateModal}>
                    Create Report
                  </button>
                </div>
              ) : (
                <div className="report-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Report</th>
                        <th>Type</th>
                        <th>Date Range</th>
                        <th>Status</th>
                        <th>Schedule</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleReports.map((report) => {
                        const id = report.id;
                        const isDeleting = deletingId === id;
                        const isSelected = selectedReportId === id;
                        const dateRange = report.dateRange
                          ? `${formatDate(report.dateRange.start)} – ${formatDate(report.dateRange.end)}`
                          : '—';
                        return (
                          <tr key={id} className={isSelected ? 'selected' : ''}>
                            <td>
                              <div className="report-title">{report.title || 'Untitled Report'}</div>
                              <div className="report-meta">
                                <span>Generated {formatDate(report.generatedAt)}</span>
                                <span>By {report.generatedBy || 'Health Officer'}</span>
                                {Array.isArray(report.tags) && report.tags.length > 0 && (
                                  <span>Tags: {report.tags.join(', ')}</span>
                                )}
                              </div>
                            </td>
                            <td>{report.reportType || 'General'}</td>
                            <td>{dateRange}</td>
                            <td>{renderStatusBadge(report.status)}</td>
                            <td>
                              {report.schedule?.enabled ? (
                                <span className="schedule-pill">{schedulePill(report)}</span>
                              ) : (
                                'Manual'
                              )}
                            </td>
                            <td>
                              <div className="report-actions">
                                <button
                                  type="button"
                                  className="btn btn-action btn-sm"
                                  disabled={downloadingId === `${id}-pdf`}
                                  onClick={() => handleDownloadReport(report, 'pdf')}
                                >
                                  {downloadingId === `${id}-pdf` ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i> Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-file-pdf"></i> PDF
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-action btn-sm"
                                  disabled={downloadingId === `${id}-csv`}
                                  onClick={() => handleDownloadReport(report, 'csv')}
                                >
                                  {downloadingId === `${id}-csv` ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i> Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-file-csv"></i> CSV
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-action btn-sm"
                                  onClick={() => handleSelectReport(report)}
                                >
                                  <i className="fas fa-book"></i> View
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-action btn-sm"
                                  onClick={() => openEditModal(report)}
                                >
                                  <i className="fas fa-pen"></i> Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-action btn-sm delete"
                                  disabled={isDeleting}
                                  onClick={() => handleDeleteReport(report)}
                                >
                                  <i className="fas fa-trash"></i> {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {detailModalOpen && selectedReport && (
                <div
                  className="modal open"
                  onClick={(e) => e.target.classList.contains('modal') && closeDetailModal()}
                >
                  <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3 className="modal-title">{selectedReport.title || 'Report Details'}</h3>
                      <button className="close-modal" onClick={closeDetailModal} type="button">
                        &times;
                      </button>
                    </div>
                    <div className="report-detail-modal">
                      {detailLoading ? (
                        <div className="detail-loading">
                          <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                          Loading details...
                        </div>
                      ) : (
                        <>
                          <div className="report-detail-grid">
                            <div className="report-detail-item">
                              <span>Report Type</span>
                              <span>{selectedReport.reportType || 'General'}</span>
                            </div>
                            <div className="report-detail-item">
                              <span>Date Range</span>
                              <span>
                                {selectedReport.dateRange
                                  ? `${formatDate(selectedReport.dateRange.start)} – ${formatDate(selectedReport.dateRange.end)}`
                                  : '—'}
                              </span>
                            </div>
                            <div className="report-detail-item">
                              <span>Generated On</span>
                              <span>{formatDate(selectedReport.generatedAt)}</span>
                            </div>
                            <div className="report-detail-item">
                              <span>Generated By</span>
                              <span>{selectedReport.generatedBy || 'Health Officer'}</span>
                            </div>
                            <div className="report-detail-item">
                              <span>Status</span>
                              <span>{renderStatusBadge(selectedReport.status)}</span>
                            </div>
                            <div className="report-detail-item">
                              <span>File Size</span>
                              <span>{formatFileSize(selectedReport.fileSize)}</span>
                            </div>
                            <div className="report-detail-item">
                              <span>Schedule</span>
                              <span>{schedulePill(selectedReport)}</span>
                            </div>
                            <div className="report-detail-item">
                              <span>Recipients</span>
                              <span>
                                {Array.isArray(selectedReport?.schedule?.recipients) && selectedReport.schedule.recipients.length
                                  ? selectedReport.schedule.recipients.join(', ')
                                  : '—'}
                              </span>
                            </div>
                          </div>

                          {selectedReport.description && (
                            <div style={{ marginTop: 20 }}>
                              <strong>Description:</strong>
                              <p style={{ marginTop: 6 }}>{selectedReport.description}</p>
                            </div>
                          )}

                          {Array.isArray(selectedReport.sections) && selectedReport.sections.length > 0 && (
                            <div style={{ marginTop: 20 }}>
                              <strong>Sections Included</strong>
                              <div className="report-sections-list">
                                {selectedReport.sections.map((section) => (
                                  <span key={section}>{section}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {Array.isArray(selectedReport.tags) && selectedReport.tags.length > 0 && (
                            <div style={{ marginTop: 20 }}>
                              <strong>Tags</strong>
                              <div className="report-tags-list">
                                {selectedReport.tags.map((tag) => (
                                  <span key={tag}>{tag}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {Array.isArray(selectedReport.metrics) && selectedReport.metrics.length > 0 && (
                            <div className="report-metrics">
                              <strong>Key Metrics</strong>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Metric</th>
                                    <th>Current</th>
                                    <th>Previous</th>
                                    <th>Target</th>
                                    <th>Trend</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedReport.metrics.map((metric) => (
                                    <tr key={metric._id || metric.name || createUniqueId()}>
                                      <td>{metric.name}</td>
                                      <td>
                                        {metric.currentValue !== undefined && metric.currentValue !== null
                                          ? `${metric.currentValue}${metric.unit || ''}`
                                          : '—'}
                                      </td>
                                      <td>
                                        {metric.previousValue !== undefined && metric.previousValue !== null
                                          ? `${metric.previousValue}${metric.unit || ''}`
                                          : '—'}
                                      </td>
                                      <td>
                                        {metric.target !== undefined && metric.target !== null
                                          ? `${metric.target}${metric.unit || ''}`
                                          : '—'}
                                      </td>
                                      <td>{metric.trend !== undefined && metric.trend !== null ? `${metric.trend}` : '—'}</td>
                                      <td>{formatReportStatus(metric.status)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {selectedReport?.certificateInfo && (
                            <div style={{ marginTop: 24 }}>
                              <strong>Certificate Information</strong>
                              <div className="report-detail-grid" style={{ marginTop: 12 }}>
                                <div className="report-detail-item">
                                  <span>Crew Member</span>
                                  <span>{selectedReport.certificateInfo.crewMember || '—'}</span>
                                </div>
                                <div className="report-detail-item">
                                  <span>Certificate Type</span>
                                  <span>{selectedReport.certificateInfo.certificateType || '—'}</span>
                                </div>
                                <div className="report-detail-item">
                                  <span>Issue Date</span>
                                  <span>{formatDate(selectedReport.certificateInfo.issueDate)}</span>
                                </div>
                                <div className="report-detail-item">
                                  <span>Expiry Date</span>
                                  <span>{formatDate(selectedReport.certificateInfo.expiryDate)}</span>
                                </div>
                                <div className="report-detail-item">
                                  <span>Status</span>
                                  <span>{formatReportStatus(selectedReport.certificateInfo.status)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {Array.isArray(selectedReport.files) && selectedReport.files.length > 0 && (
                            <div style={{ marginTop: 24 }}>
                              <strong>Files</strong>
                              <ul style={{ marginTop: 12, paddingLeft: 18 }}>
                                {selectedReport.files.map((file) => (
                                  <li key={file._id || file.label || createUniqueId()}>
                                    <a href={file.url} target="_blank" rel="noreferrer">
                                      {file.label}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* New Report Modal */}
      {modalOpen && (
        <div className="modal open" onClick={(e) => e.target.classList.contains('modal') && closeModal()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'edit' ? 'Update Health Report' : 'Create Health Report'}
              </h3>
              <button className="close-modal" onClick={closeModal} type="button">
                &times;
              </button>
            </div>
            <form className="report-form" onSubmit={handleFormSubmit}>
              {formError && (
                <div className="alert alert-danger" style={{ padding: 12, borderRadius: 10 }}>
                  {formError}
                </div>
              )}

              <div className="report-form-grid">
                <div className="form-group">
                  <label htmlFor="reportCategory">Category</label>
                  <select
                    id="reportCategory"
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => updateFormField('category', e.target.value)}
                  >
                    <option value="summary">Summary</option>
                    <option value="analytics">Analytics</option>
                    <option value="certificate">Certificate</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reportType">Report Type *</label>
                  <input
                    id="reportType"
                    className="form-control"
                    placeholder="e.g. Monthly Health Summary"
                    value={formData.reportType}
                    onChange={(e) => updateFormField('reportType', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reportTitle">Title *</label>
                  <input
                    id="reportTitle"
                    className="form-control"
                    placeholder="Enter report title"
                    value={formData.title}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reportStatus">Status</label>
                  <select
                    id="reportStatus"
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => updateFormField('status', e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="report-form-grid">
                <div className="form-group">
                  <label htmlFor="reportStart">Start Date *</label>
                  <input
                    type="date"
                    id="reportStart"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => updateFormField('startDate', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reportEnd">End Date *</label>
                  <input
                    type="date"
                    id="reportEnd"
                    className="form-control"
                    value={formData.endDate}
                    onChange={(e) => updateFormField('endDate', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="generatedAt">Generated At</label>
                  <input
                    type="date"
                    id="generatedAt"
                    className="form-control"
                    value={formData.generatedAt}
                    onChange={(e) => updateFormField('generatedAt', e.target.value)}
                  />
                  <label htmlFor="reportTags">Tags</label>
                  <input
                    id="reportTags"
                    className="form-control"
                    placeholder="Comma separated tags"
                    value={formData.tagsText}
                    onChange={(e) => updateFormField('tagsText', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reportDescription">Description</label>
                <textarea
                  id="reportDescription"
                  className="form-control"
                  placeholder="Provide context or key highlights for this report"
                  value={formData.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                />
              </div>

              <div className="report-modal-actions">
                <button type="button" className="btn btn-action btn-sm" onClick={closeModal}>
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : modalMode === 'edit' ? 'Update Report' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
