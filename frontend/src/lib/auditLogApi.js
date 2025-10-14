import { getToken } from './token';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const AUDIT_BASE = `${API_BASE}/audit/logs`;

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed (${response.status})`);
  }
  return response.json();
};

export const listAuditLogs = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, value);
  });
  const url = params.toString() ? `${AUDIT_BASE}?${params.toString()}` : AUDIT_BASE;
  const response = await fetch(url, { method: 'GET', headers: getHeaders() });
  return handleResponse(response);
};

export const getAuditLog = async (id) => {
  const response = await fetch(`${AUDIT_BASE}/${id}`, { method: 'GET', headers: getHeaders() });
  return handleResponse(response);
};

export const createAuditLog = async (data) => {
  const response = await fetch(AUDIT_BASE, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return handleResponse(response);
};

export const updateAuditLog = async (id, updates) => {
  const response = await fetch(`${AUDIT_BASE}/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) });
  return handleResponse(response);
};

export const deleteAuditLog = async (id) => {
  const response = await fetch(`${AUDIT_BASE}/${id}`, { method: 'DELETE', headers: getHeaders() });
  return handleResponse(response);
};
