import api from './api';

export const listCrewEmergencyAlerts = async (params = {}) => {
  const { data } = await api.get('/crew/emergency-alerts', { params });
  return data;
};

export const getCrewEmergencyAlert = async (id) => {
  if (!id) return null;
  const { data } = await api.get(`/crew/emergency-alerts/${id}`);
  return data;
};

export const createCrewEmergencyAlert = async (payload) => {
  const { data } = await api.post('/crew/emergency-alerts', payload);
  return data;
};

export const updateCrewEmergencyAlert = async (id, payload) => {
  const { data } = await api.put(`/crew/emergency-alerts/${id}`, payload);
  return data;
};

export const deleteCrewEmergencyAlert = async (id) => {
  const { data } = await api.delete(`/crew/emergency-alerts/${id}`);
  return data;
};
