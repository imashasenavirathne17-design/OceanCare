import api from './api';

export const acknowledgeEmergencyAlert = async (id) => {
  if (!id) return null;
  const { data } = await api.post(`/emergency-alerts/${id}/ack`);
  return data;
};

export const resolveEmergencyAlert = async (id) => {
  if (!id) return null;
  const { data } = await api.post(`/emergency-alerts/${id}/resolve`);
  return data;
};

export const deleteEmergencyAlert = async (id) => {
  if (!id) return null;
  const { data } = await api.delete(`/emergency-alerts/${id}`);
  return data;
};
