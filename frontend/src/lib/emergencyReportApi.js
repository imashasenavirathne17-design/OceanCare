import api from './api';

export const listEmergencyReports = async (params = {}) => {
  const { data } = await api.get('/emergency/reports', { params });
  return data;
};

export const getEmergencyReport = async (id) => {
  const { data } = await api.get(`/emergency/reports/${id}`);
  return data;
};

export const createEmergencyReport = async (payload) => {
  const { data } = await api.post('/emergency/reports', payload);
  return data;
};

export const updateEmergencyReport = async (id, payload) => {
  const { data } = await api.put(`/emergency/reports/${id}`, payload);
  return data;
};

export const deleteEmergencyReport = async (id) => {
  const { data } = await api.delete(`/emergency/reports/${id}`);
  return data;
};
