import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencySidebar from './EmergencySidebar';
import { getUser, clearSession } from '../../lib/token';
import {
  listEmergencyReports,
  createEmergencyReport,
  updateEmergencyReport,
  deleteEmergencyReport,
} from '../../lib/emergencyReportApi';
import './emergencyOfficerDashboard.css';
import { jsPDF } from 'jspdf';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const TYPE_OPTIONS = [
  'Incident Analysis',
  'Response Performance',
  'Medical Summary',
  'Evacuation Log',
  'Crew Risk',
  'Protocol Audit',
];

const SCHEDULE_FREQ = ['Daily', 'Weekly', 'Monthly', 'Quarterly'];

const statusBadge = {
  DRAFT: 'pending',
  IN_REVIEW: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'ongoing',
};

const priorityBadge = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
};

const createEmptyReport = (user) => ({
  reportCode: `REP-${Date.now()}`,
  title: '',
  summary: '',
  reportType: TYPE_OPTIONS[0],
  category: 'Emergency Response',
  status: 'DRAFT',
  priority: 'MEDIUM',
  generatedBy: user?.fullName || 'Emergency Officer',
  generatedAt: new Date().toISOString().slice(0, 16),
  timeframeStart: new Date().toISOString().slice(0, 10),
  timeframeEnd: new Date().toISOString().slice(0, 10),
  tags: '',
  sections: '',
  recipients: '',
  notes: '',
});

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function EmergencyReports() {
  const user = getUser();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ status: 'ALL', priority: 'ALL', q: '', type: 'all' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [formData, setFormData] = useState(createEmptyReport(user));
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);

  const selectedReport = useMemo(() => reports.find((r) => r._id === selectedReportId), [reports, selectedReportId]);

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listEmergencyReports({
        status: filters.status,
        priority: filters.priority,
        q: filters.q || undefined,
        reportType: filters.type,
      });
      const items = Array.isArray(data) ? data : [];
      setReports(items);
    } catch (err) {
      setError('Failed to load emergency reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters.status, filters.priority, filters.type]);

  const filteredReports = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return reports.filter((report) => {
      if (filters.status !== 'ALL' && report.status !== filters.status) return false;
      if (filters.priority !== 'ALL' && report.priority !== filters.priority) return false;
      if (filters.type !== 'all' && report.reportType !== filters.type) return false;
      if (!needle) return true;
      const haystack = `${report.title || ''} ${report.reportCode || ''} ${report.summary || ''} ${report.tags?.join(' ') || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [reports, filters]);

  const openCreate = () => {
    setEditorMode('create');
    setSelectedReportId(null);
    setFormData(createEmptyReport(user));
    setFormErrors({});
    setIsEditorOpen(true);
  };

  const openEdit = (report) => {
    if (!report) return;
    setEditorMode('edit');
    setSelectedReportId(report._id);
    setFormData({
      reportCode: report.reportCode || '',
      title: report.title || '',
      summary: report.summary || '',
      reportType: report.reportType || TYPE_OPTIONS[0],
      category: report.category || 'Emergency Response',
      status: report.status || 'DRAFT',
      priority: report.priority || 'MEDIUM',
      generatedBy: report.generatedBy || user?.fullName || '',
      generatedAt: report.generatedAt ? new Date(report.generatedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      timeframeStart: report.timeframe?.start ? new Date(report.timeframe.start).toISOString().slice(0, 10) : '',
      timeframeEnd: report.timeframe?.end ? new Date(report.timeframe.end).toISOString().slice(0, 10) : '',
      tags: Array.isArray(report.tags) ? report.tags.join(', ') : '',
      sections: Array.isArray(report.sections) ? report.sections.join(', ') : '',
      recipients: Array.isArray(report.recipients) ? report.recipients.join(', ') : '',
      notes: report.notes || '',
    });
    setFormErrors({});
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (submitting) return;
    setIsEditorOpen(false);
  };

  const onFormChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.reportCode?.trim()) nextErrors.reportCode = 'Report code is required';
    if (!formData.title?.trim()) nextErrors.title = 'Title is required';
    if (!formData.generatedBy?.trim()) nextErrors.generatedBy = 'Generated by is required';
    if (!formData.generatedAt) nextErrors.generatedAt = 'Generated at is required';
    return nextErrors;
  };

  const buildPayload = () => ({
    reportCode: formData.reportCode.trim(),
    title: formData.title.trim(),
    summary: formData.summary?.trim() || '',
    reportType: formData.reportType,
    category: formData.category?.trim() || 'Emergency Response',
    status: formData.status,
    priority: formData.priority,
    generatedBy: formData.generatedBy?.trim(),
    generatedAt: formData.generatedAt ? new Date(formData.generatedAt).toISOString() : new Date().toISOString(),
    timeframe: {
      start: formData.timeframeStart || undefined,
      end: formData.timeframeEnd || undefined,
    },
    tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    sections: formData.sections.split(',').map((tag) => tag.trim()).filter(Boolean),
    recipients: formData.recipients.split(',').map((item) => item.trim()).filter(Boolean),
    notes: formData.notes || '',
  });

  const submitForm = async () => {
    const nextErrors = validate();
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = buildPayload();
    setSubmitting(true);
    try {
      if (editorMode === 'create') {
        const created = await createEmergencyReport(payload);
        setReports((prev) => [created, ...prev]);
      } else if (selectedReportId) {
        const updated = await updateEmergencyReport(selectedReportId, payload);
        setReports((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      }
      setIsEditorOpen(false);
      setFormData(createEmptyReport(user));
    } catch (err) {
      setError('Failed to save emergency report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (report) => {
    if (!report?._id) return;
    if (!window.confirm('Delete this emergency report?')) return;
    try {
      await deleteEmergencyReport(report._id);
      setReports((prev) => prev.filter((item) => item._id !== report._id));
    } catch (err) {
      setError('Failed to delete emergency report.');
    }
  };

  const handleView = (report) => {
    setPreviewReport(report);
  };

  const downloadReportCSV = (report) => {
    if (!report) return;
    const headers = ['Field', 'Value'];
    const rows = [
      ['Report Code', report.reportCode || ''],
      ['Title', report.title || ''],
      ['Type', report.reportType || ''],
      ['Category', report.category || ''],
      ['Priority', report.priority || ''],
      ['Status', report.status || ''],
      ['Generated By', report.generatedBy || ''],
      ['Generated At', formatDateTime(report.generatedAt)],
      ['Timeframe Start', report.timeframe?.start || ''],
      ['Timeframe End', report.timeframe?.end || ''],
      ['Summary', report.summary || ''],
      ['Tags', Array.isArray(report.tags) ? report.tags.join(', ') : ''],
      ['Sections', Array.isArray(report.sections) ? report.sections.join(', ') : ''],
      ['Recipients', Array.isArray(report.recipients) ? report.recipients.join(', ') : ''],
      ['Notes', report.notes || ''],
    ];
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${report.reportCode || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadReportPDF = (report) => {
    if (!report) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const headerHeight = 96;
    const contentTop = headerHeight + 32;
    const marginBottom = 54;
    const lineHeight = 16;

    const statusColors = {
      DRAFT: { bg: [253, 251, 243], text: [156, 111, 25], border: [239, 200, 85] },
      IN_REVIEW: { bg: [255, 247, 233], text: [192, 86, 33], border: [250, 196, 120] },
      PUBLISHED: { bg: [233, 248, 243], text: [27, 122, 76], border: [122, 199, 164] },
      ARCHIVED: { bg: [237, 239, 241], text: [55, 65, 81], border: [176, 185, 196] },
      default: { bg: [243, 244, 246], text: [55, 65, 81], border: [206, 212, 218] },
    };

    const priorityColors = {
      CRITICAL: { bg: [253, 238, 239], text: [179, 32, 44], border: [227, 82, 96] },
      HIGH: { bg: [255, 244, 229], text: [192, 86, 33], border: [246, 173, 85] },
      MEDIUM: { bg: [231, 244, 255], text: [3, 105, 161], border: [120, 180, 220] },
      LOW: { bg: [236, 253, 245], text: [4, 120, 87], border: [80, 186, 140] },
      default: { bg: [243, 244, 246], text: [55, 65, 81], border: [206, 212, 218] },
    };

    const ensureSpace = (heightNeeded = 0) => {
      if (cursorY + heightNeeded > pageHeight - marginBottom) {
        doc.addPage();
        cursorY = contentTop;
      }
    };

    const drawBadge = (label, colors, x) => {
      const textPaddingX = 12;
      const textPaddingY = 6;
      const textWidth = doc.getTextWidth(label.toUpperCase());
      const badgeWidth = textWidth + textPaddingX * 2;
      const badgeHeight = textPaddingY * 2 + 6;
      doc.setFillColor(...colors.bg);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.8);
      doc.roundedRect(x, headerHeight - badgeHeight + 14, badgeWidth, badgeHeight, 8, 8, 'FD');
      doc.setTextColor(...colors.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label.toUpperCase(), x + textPaddingX, headerHeight - badgeHeight / 2 + 12);
    };

    const drawHeaderBackground = () => {
      const gradientHeight = headerHeight;
      for (let i = 0; i < gradientHeight; i += 2) {
        const ratio = i / gradientHeight;
        const r = Math.round(230 - (230 - 179) * ratio);
        const g = Math.round(57 - (57 - 50) * ratio);
        const b = Math.round(70 - (70 - 52) * ratio);
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(2);
        doc.line(0, i, pageWidth, i);
      }
    };

    drawHeaderBackground();

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(report.title || 'Emergency Report', marginX, 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`${report.reportCode || 'No code'}`, marginX, 52);
    doc.text(`Generated ${formatDateTime(report.generatedAt)}`, marginX, 68);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OCEANCARE EMERGENCY COMMAND', marginX, 84);

    const statusConfig = statusColors[report.status] || statusColors.default;
    const priorityConfig = priorityColors[report.priority] || priorityColors.default;

    if ((report.priority || '').toUpperCase() !== 'LOW') {
      drawBadge((report.priority || 'Unknown Priority'), priorityConfig, pageWidth - marginX - 180);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Priority: ${(report.priority || 'Low').toUpperCase()}`, pageWidth - marginX - 180, 80);
    }

    if ((report.status || '').toUpperCase() !== 'DRAFT') {
      drawBadge((report.status || 'Unknown Status'), statusConfig, pageWidth - marginX - 360);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Status: DRAFT', pageWidth - marginX - 360, 68);
    }

    doc.setDrawColor(230, 57, 70);
    doc.setLineWidth(1.5);
    doc.line(marginX, headerHeight, pageWidth - marginX, headerHeight);

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const drawDivider = () => {
      ensureSpace(12);
      doc.setDrawColor(236, 72, 88);
      doc.setLineWidth(1);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 12;
    };

    const drawField = (label, value) => {
      const safeValue = value && String(value).trim() ? value : '—';
      const labelText = `${label}`;
      ensureSpace(lineHeight * 1.2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(labelText, marginX, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const wrapped = doc.splitTextToSize(safeValue, pageWidth - marginX * 2);
      cursorY += lineHeight;
      wrapped.forEach((line) => {
        ensureSpace(lineHeight);
        doc.text(line, marginX, cursorY);
        cursorY += lineHeight;
      });
      cursorY += 2;
    };

    const drawSection = (title, body) => {
      ensureSpace(lineHeight * 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, marginX, cursorY);
      cursorY += lineHeight + 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const content = body && body.trim() ? body : '—';
      const wrapped = doc.splitTextToSize(content, pageWidth - marginX * 2);
      wrapped.forEach((line) => {
        ensureSpace(lineHeight);
        doc.text(line, marginX, cursorY);
        cursorY += lineHeight;
      });
      cursorY += 4;
    };

    let cursorY = contentTop;
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(222, 226, 230);
    doc.roundedRect(marginX - 10, cursorY - 16, pageWidth - (marginX - 10) * 2, 190, 10, 10, 'DF');
    cursorY += 10;

    drawField('Generated By', report.generatedBy || '—');
    drawField('Report Type', report.reportType || '—');
    drawField('Category', report.category || '—');
    drawField('Timeframe Start', report.timeframe?.start || '—');
    drawField('Timeframe End', report.timeframe?.end || '—');

    drawDivider();

    drawField('Tags', Array.isArray(report.tags) && report.tags.length ? report.tags.join(', ') : '—');
    drawField('Sections', Array.isArray(report.sections) && report.sections.length ? report.sections.join(', ') : '—');
    drawField('Recipients', Array.isArray(report.recipients) && report.recipients.length ? report.recipients.join(', ') : '—');

    drawDivider();

    drawSection('Executive Summary', report.summary || '—');
    drawSection('Operational Notes & Recommendations', report.notes || '—');

    if (report.sections && report.sections.length) {
      drawDivider();
      ensureSpace(lineHeight * 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Section Breakdown', marginX, cursorY);
      cursorY += lineHeight + 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      report.sections.forEach((sectionTitle, index) => {
        ensureSpace(lineHeight * 1.5);
        doc.circle(marginX + 4, cursorY - 4, 2, 'F');
        doc.text(`${index + 1}. ${sectionTitle}`, marginX + 12, cursorY);
        cursorY += lineHeight;
      });
    }

    ensureSpace(lineHeight * 2);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Generated via OceanCare Emergency Intelligence Suite', marginX, pageHeight - marginBottom);

    const fileName = `${report.reportCode || 'EmergencyReport'}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="dashboard-container emergency-dashboard incident-log-screen emergency-reports-screen">
      <EmergencySidebar onLogout={onLogout} />

      <div className={`dashboard-main emergency-reports ${(isEditorOpen || previewReport) ? 'editor-open' : ''}`}>
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Emergency Reports</h1>
            <div className="dashboard-meta">
              <span><i className="fas fa-shield-alt" /> Incident intelligence and analytics</span>
              <span><i className="fas fa-clipboard-list" /> {reports.length} total reports</span>
            </div>
            {error && <div className="incident-error">{error}</div>}
          </div>
          <div className="dashboard-actions">
            <button className="btn btn-outline" onClick={fetchReports}><i className="fas fa-sync" /> Refresh</button>
            <button className="btn btn-primary" onClick={openCreate}><i className="fas fa-plus-circle" /> Create Report</button>
          </div>
        </header>

        <section className="incident-filters">
          <div className="filters-inline">
            <input
              className="form-control"
              placeholder="Search reports"
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            />
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              className="form-control"
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              className="form-control"
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="all">All Types</option>
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="filters-summary">
            {loading ? 'Loading reports…' : `${filteredReports.length} result${filteredReports.length === 1 ? '' : 's'} found`}
          </div>
        </section>

        <section className="reports-table-panel">
          <div className="section-header">
            <div>
              <div className="section-title">Reports Table View</div>
              <div className="section-subtitle">Quick snapshot of all filtered reports.</div>
            </div>
            <div className="section-meta">Showing {filteredReports.length} report{filteredReports.length === 1 ? '' : 's'}</div>
          </div>
          <div className="table-responsive">
            {filteredReports.length === 0 ? (
              <div className="incident-empty">No reports available for the current filters.</div>
            ) : (
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Report Code</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Generated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr
                      key={`table-${report._id}`}
                      className={report._id === selectedReportId ? 'row-highlight' : ''}
                      onClick={() => setSelectedReportId(report._id)}
                    >
                      <td>{report.reportCode}</td>
                      <td>{report.title || 'Untitled report'}</td>
                      <td>{report.reportType || '—'}</td>
                      <td>
                        <span className={`badge badge-${priorityBadge[report.priority] || 'info'}`}>
                          {report.priority || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${statusBadge[report.status] || 'ongoing'}`}>
                          {report.status?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td>{formatDateTime(report.generatedAt)}</td>
                      <td>
                        <div className="reports-table-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleView(report);
                            }}
                          >
                            <i className="fas fa-eye" /> View
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-small"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEdit(report);
                            }}
                          >
                            <i className="fas fa-pen" /> Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-small"
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadReportCSV(report);
                            }}
                          >
                            <i className="fas fa-file-csv" /> CSV
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-small"
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadReportPDF(report);
                            }}
                          >
                            <i className="fas fa-file-pdf" /> PDF
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(report);
                            }}
                          >
                            <i className="fas fa-trash" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {isEditorOpen && (
        <div className="incident-editor">
          <div className="editor-backdrop" onClick={closeEditor} />
          <div className="editor-card report-editor">
            <header className="editor-header">
              <h2>{editorMode === 'create' ? 'Create Emergency Report' : 'Update Emergency Report'}</h2>
              <button className="editor-close" onClick={closeEditor} aria-label="Close"><i className="fas fa-times" /></button>
            </header>
            <form className="editor-body" onSubmit={(event) => { event.preventDefault(); submitForm(); }}>
              <div className="editor-grid compact">
                <label>
                  <span>Report Code</span>
                  <input value={formData.reportCode} onChange={onFormChange('reportCode')} />
                  {formErrors.reportCode && <small className="error">{formErrors.reportCode}</small>}
                </label>
                <label>
                  <span>Title</span>
                  <input value={formData.title} onChange={onFormChange('title')} />
                  {formErrors.title && <small className="error">{formErrors.title}</small>}
                </label>
                <label>
                  <span>Status</span>
                  <select value={formData.status} onChange={onFormChange('status')}>
                    {STATUS_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Priority</span>
                  <select value={formData.priority} onChange={onFormChange('priority')}>
                    {PRIORITY_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Generated By</span>
                  <input value={formData.generatedBy} onChange={onFormChange('generatedBy')} />
                  {formErrors.generatedBy && <small className="error">{formErrors.generatedBy}</small>}
                </label>
                <label>
                  <span>Generated At</span>
                  <input type="datetime-local" value={formData.generatedAt} onChange={onFormChange('generatedAt')} />
                  {formErrors.generatedAt && <small className="error">{formErrors.generatedAt}</small>}
                </label>
                <label>
                  <span>Timeframe Start</span>
                  <input type="date" value={formData.timeframeStart} onChange={onFormChange('timeframeStart')} />
                </label>
                <label>
                  <span>Timeframe End</span>
                  <input type="date" value={formData.timeframeEnd} onChange={onFormChange('timeframeEnd')} />
                </label>
              </div>
              <label className="full">
                <span>Summary</span>
                <textarea rows={4} value={formData.summary} onChange={onFormChange('summary')} />
              </label>
              <div className="editor-grid compact">
                <label>
                  <span>Tags</span>
                  <input value={formData.tags} onChange={onFormChange('tags')} placeholder="Comma separated" />
                </label>
                <label>
                  <span>Sections</span>
                  <input value={formData.sections} onChange={onFormChange('sections')} placeholder="Comma separated" />
                </label>
                <label className="full">
                  <span>Recipients</span>
                  <input value={formData.recipients} onChange={onFormChange('recipients')} placeholder="Comma separated" />
                </label>
              </div>
              <footer className="editor-footer">
                <button type="button" className="btn btn-outline" onClick={closeEditor} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editorMode === 'create' ? 'Create Report' : 'Update Report'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {previewReport && (
        <div className="incident-editor">
          <div className="editor-backdrop" onClick={() => setPreviewReport(null)} />
          <div className="editor-card report-editor">
            <header className="editor-header">
              <h2>Report Overview</h2>
              <button className="editor-close" onClick={() => setPreviewReport(null)} aria-label="Close"><i className="fas fa-times" /></button>
            </header>
            <div className="editor-body">
              <div className="editor-grid compact">
                <div className="incident-meta">
                  <span className="label">Report Code</span>
                  <span className="value">{previewReport.reportCode || '—'}</span>
                </div>
                <div className="incident-meta">
                  <span className="label">Status</span>
                  <span className="value">{previewReport.status || '—'}</span>
                </div>
                <div className="incident-meta">
                  <span className="label">Priority</span>
                  <span className="value">{previewReport.priority || '—'}</span>
                </div>
                <div className="incident-meta">
                  <span className="label">Generated</span>
                  <span className="value">{formatDateTime(previewReport.generatedAt)}</span>
                </div>
              </div>
              <div className="incident-section">
                <h3 className="incident-section-title">Summary</h3>
                <p className="incident-description">{previewReport.summary || 'No summary provided.'}</p>
              </div>
              <div className="incident-section">
                <h3 className="incident-section-title">Details</h3>
                <div className="incident-meta-grid">
                  <div className="incident-meta"><span className="label">Type</span><span className="value">{previewReport.reportType || '—'}</span></div>
                  <div className="incident-meta"><span className="label">Category</span><span className="value">{previewReport.category || '—'}</span></div>
                  <div className="incident-meta"><span className="label">Generated By</span><span className="value">{previewReport.generatedBy || '—'}</span></div>
                  <div className="incident-meta"><span className="label">Timeframe Start</span><span className="value">{previewReport.timeframe?.start || '—'}</span></div>
                  <div className="incident-meta"><span className="label">Timeframe End</span><span className="value">{previewReport.timeframe?.end || '—'}</span></div>
                </div>
              </div>
              <div className="incident-section">
                <h3 className="incident-section-title">Tags & Recipients</h3>
                <p className="incident-description"><strong>Tags:</strong> {Array.isArray(previewReport.tags) ? previewReport.tags.join(', ') : '—'}</p>
                <p className="incident-description"><strong>Recipients:</strong> {Array.isArray(previewReport.recipients) ? previewReport.recipients.join(', ') : '—'}</p>
              </div>
              <div className="incident-section">
                <h3 className="incident-section-title">Notes</h3>
                <p className="incident-description">{previewReport.notes || 'No additional notes.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
