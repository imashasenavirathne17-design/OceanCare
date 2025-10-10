import api from './api';

export const listUsers = async (params = {}) => {
  const { data } = await api.get('/users', { params });
  return data; // { items, total, page, pages }
};

export const createUser = async (payload) => {
  const { data } = await api.post('/users', payload);
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const setStatus = async (id, status) => {
  const { data } = await api.patch(`/users/${id}/status`, { status });
  return data;
};

export const setMFA = async (id, enabled) => {
  const { data } = await api.patch(`/users/${id}/mfa`, { enabled });
  return data;
};

export const resetPassword = async (id, newPassword) => {
  const { data } = await api.post(`/users/${id}/reset-password`, { newPassword });
  return data;
};
