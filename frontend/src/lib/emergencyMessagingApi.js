import api from './api';

export const listMessagingContacts = async () => {
  const { data } = await api.get('/emergency/messaging/contacts');
  return data;
};

export const listMessagingHistory = async (params = {}) => {
  const { data } = await api.get('/emergency/messaging/messages', { params });
  return data;
};

export const listThreadMessages = async (threadId) => {
  if (!threadId) return [];
  const { data } = await api.get(`/emergency/messaging/threads/${threadId}`);
  return data;
};

export const sendEmergencyMessage = async (payload) => {
  const { data } = await api.post('/emergency/messaging/threads', payload);
  return data;
};

export const updateEmergencyMessageStatus = async (id, status) => {
  const { data } = await api.patch(`/emergency/messaging/messages/${id}/status`, { status });
  return data;
};
