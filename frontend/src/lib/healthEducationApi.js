import api from './api';

export const listHealthEducation = async (params = {}) => {
  const { data } = await api.get('/health/education', { params });
  return data;
};

export const getHealthEducation = async (id) => {
  const { data } = await api.get(`/health/education/${id}`);
  return data;
};

export const createHealthEducation = async (payload) => {
  const { data } = await api.post('/health/education', payload);
  return data;
};

export const updateHealthEducation = async (id, payload) => {
  const { data } = await api.put(`/health/education/${id}`, payload);
  return data;
};

export const deleteHealthEducation = async (id) => {
  const { data } = await api.delete(`/health/education/${id}`);
  return data;
};

export const recordHealthEducationEngagement = async (id, payload) => {
  const { data } = await api.post(`/health/education/${id}/engagement`, payload);
  return data;
};
