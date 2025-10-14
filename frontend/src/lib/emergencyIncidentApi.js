import api from './api';

export const listIncidents = async (params = {}) => {
  const { data } = await api.get('/emergency/incidents', { params });
  return data;
};

export const getIncident = async (id) => {
  const { data } = await api.get(`/emergency/incidents/${id}`);
  return data;
};

export const createIncident = async (payload) => {
  const { data } = await api.post('/emergency/incidents', payload);
  return data;
};

export const updateIncident = async (id, payload) => {
  const { data } = await api.put(`/emergency/incidents/${id}`, payload);
  return data;
};

export const resolveIncident = async (id, payload = {}) => {
  const { data } = await api.patch(`/emergency/incidents/${id}/resolve`, payload);
  return data;
};

export const deleteIncident = async (id) => {
  const { data } = await api.delete(`/emergency/incidents/${id}`);
  return data;
};

export const appendTimelineEntry = async (id, entry) => {
  const { data } = await api.patch(`/emergency/incidents/${id}/timeline`, entry);
  return data;
};

export const appendActionLogEntry = async (id, entry) => {
  const { data } = await api.patch(`/emergency/incidents/${id}/action-log`, entry);
  return data;
};
