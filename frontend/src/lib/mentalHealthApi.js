import api from './api';

export const listMentalObservations = async (params = {}) => {
  const { data } = await api.get('/health/mental/observations', { params });
  return data;
};

export const getMentalObservation = async (id) => {
  const { data } = await api.get(`/health/mental/observations/${id}`);
  return data;
};

export const createMentalObservation = async (payload) => {
  const { data } = await api.post('/health/mental/observations', payload);
  return data;
};

export const updateMentalObservation = async (id, payload) => {
  const { data } = await api.put(`/health/mental/observations/${id}`, payload);
  return data;
};

export const deleteMentalObservation = async (id) => {
  const { data } = await api.delete(`/health/mental/observations/${id}`);
  return data;
};

export const listMentalSessions = async (params = {}) => {
  const { data } = await api.get('/health/mental/sessions', { params });
  return data;
};

export const getMentalSession = async (id) => {
  const { data } = await api.get(`/health/mental/sessions/${id}`);
  return data;
};

export const createMentalSession = async (payload) => {
  const { data } = await api.post('/health/mental/sessions', payload);
  return data;
};

export const updateMentalSession = async (id, payload) => {
  const { data } = await api.put(`/health/mental/sessions/${id}`, payload);
  return data;
};

export const deleteMentalSession = async (id) => {
  const { data } = await api.delete(`/health/mental/sessions/${id}`);
  return data;
};

export const uploadMentalSessionAttachments = async (id, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('attachments', file));
  const { data } = await api.put(`/health/mental/sessions/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getMentalSummary = async () => {
  const { data } = await api.get('/health/mental/summary');
  return data;
};
