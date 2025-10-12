import { getToken } from './token';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const REPORTS_BASE = `${API_BASE}/health/reports`;

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

export const listHealthReports = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const url = params.toString() ? `${REPORTS_BASE}?${params}` : REPORTS_BASE;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getHealthReport = async (id) => {
  const response = await fetch(`${REPORTS_BASE}/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

const handleBlobDownload = async (response, defaultName) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const fileName = match ? match[1] : defaultName;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const createHealthReport = async (reportData) => {
  const response = await fetch(REPORTS_BASE, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reportData)
  });
  return handleResponse(response);
};

export const updateHealthReport = async (id, reportData) => {
  const response = await fetch(`${REPORTS_BASE}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(reportData)
  });
  return handleResponse(response);
};

export const deleteHealthReport = async (id) => {
  const response = await fetch(`${REPORTS_BASE}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getHealthReportStats = async () => {
  const response = await fetch(`${REPORTS_BASE}/stats`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const downloadHealthReportPdf = async (id) => {
  const response = await fetch(`${REPORTS_BASE}/${id}/export/pdf`, {
    method: 'GET',
    headers: getHeaders()
  });
  await handleBlobDownload(response, 'health-report.pdf');
};

export const downloadHealthReportCsv = async (id) => {
  const response = await fetch(`${REPORTS_BASE}/${id}/export/csv`, {
    method: 'GET',
    headers: getHeaders()
  });
  await handleBlobDownload(response, 'health-report.csv');
};
