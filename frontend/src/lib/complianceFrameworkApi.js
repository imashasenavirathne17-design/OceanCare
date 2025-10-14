import { getToken } from './token';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const CF_BASE = `${API_BASE}/compliance/frameworks`;

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

export const listFrameworks = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  const url = params.toString() ? `${CF_BASE}?${params.toString()}` : CF_BASE;
  const res = await fetch(url, { method: 'GET', headers: getHeaders() });
  return handleResponse(res);
};

export const getFramework = async (id) => {
  const res = await fetch(`${CF_BASE}/${id}`, { method: 'GET', headers: getHeaders() });
  return handleResponse(res);
};

export const createFramework = async (data) => {
  const res = await fetch(CF_BASE, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return handleResponse(res);
};

export const updateFramework = async (id, updates) => {
  const res = await fetch(`${CF_BASE}/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) });
  return handleResponse(res);
};

export const deleteFramework = async (id) => {
  const res = await fetch(`${CF_BASE}/${id}`, { method: 'DELETE', headers: getHeaders() });
  return handleResponse(res);
};
