import { getToken } from './token';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const ADMIN_ANNOUNCEMENTS_BASE = `${API_BASE}/admin/announcements`;

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

export const listAdminAnnouncements = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const url = params.toString()
    ? `${ADMIN_ANNOUNCEMENTS_BASE}?${params.toString()}`
    : ADMIN_ANNOUNCEMENTS_BASE;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const getAdminAnnouncement = async (id) => {
  const response = await fetch(`${ADMIN_ANNOUNCEMENTS_BASE}/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const createAdminAnnouncement = async (data) => {
  const response = await fetch(ADMIN_ANNOUNCEMENTS_BASE, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

export const updateAdminAnnouncement = async (id, updates) => {
  const response = await fetch(`${ADMIN_ANNOUNCEMENTS_BASE}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return handleResponse(response);
};

export const deleteAdminAnnouncement = async (id) => {
  const response = await fetch(`${ADMIN_ANNOUNCEMENTS_BASE}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const publishAdminAnnouncement = async (id, publishAt) => {
  const response = await fetch(`${ADMIN_ANNOUNCEMENTS_BASE}/${id}/publish`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ publishAt })
  });
  return handleResponse(response);
};

export const archiveAdminAnnouncement = async (id) => {
  const response = await fetch(`${ADMIN_ANNOUNCEMENTS_BASE}/${id}/archive`, {
    method: 'POST',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const restoreAdminAnnouncement = async (id, status = 'draft') => {
  const response = await fetch(`${ADMIN_ANNOUNCEMENTS_BASE}/${id}/restore`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  return handleResponse(response);
};

export const acknowledgeAdminAnnouncement = async (id, notes) => {
  const response = await fetch(`${ADMIN_ANNOUNCEMENTS_BASE}/${id}/acknowledge`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ notes })
  });
  return handleResponse(response);
};

export const bulkDeleteAdminAnnouncements = async (ids) => {
  const response = await fetch(`${ADMIN_ANNOUNCEMENTS_BASE}/bulk-delete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ids })
  });
  return handleResponse(response);
};
