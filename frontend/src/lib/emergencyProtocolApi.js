import api from './api';

export const listProtocols = async (params = {}) => {
  const { data } = await api.get('/emergency-protocols', { params });
  return data;
};

export const getProtocol = async (id) => {
  const { data } = await api.get(`/emergency-protocols/${id}`);
  return data;
};

export const createProtocol = async (payload) => {
  const { data } = await api.post('/emergency-protocols', payload);
  return data;
};

export const updateProtocol = async (id, payload) => {
  const { data } = await api.patch(`/emergency-protocols/${id}`, payload);
  return data;
};

export const deleteProtocol = async (id) => {
  const { data } = await api.delete(`/emergency-protocols/${id}`);
  return data;
};
