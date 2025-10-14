import { getToken } from './token';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const RR_BASE = `${API_BASE}/compliance/reports`;

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

export const listRegulatoryReports = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  const url = params.toString() ? `${RR_BASE}?${params.toString()}` : RR_BASE;
  const res = await fetch(url, { method: 'GET', headers: getHeaders() });
  return handleResponse(res);
};

export const getRegulatoryReport = async (id) => {
  const res = await fetch(`${RR_BASE}/${id}`, { method: 'GET', headers: getHeaders() });
  return handleResponse(res);
};

export const createRegulatoryReport = async (data) => {
  const res = await fetch(RR_BASE, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return handleResponse(res);
};

export const updateRegulatoryReport = async (id, updates) => {
  const res = await fetch(`${RR_BASE}/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) });
  return handleResponse(res);
};

export const deleteRegulatoryReport = async (id) => {
  const res = await fetch(`${RR_BASE}/${id}`, { method: 'DELETE', headers: getHeaders() });
  return handleResponse(res);
};
