import api from './api';

export const listCrewProfiles = async (params = {}) => {
  const { data } = await api.get('/emergency/crew', { params });
  return data;
};

export const getCrewProfile = async (id) => {
  const { data } = await api.get(`/emergency/crew/${id}`);
  return data;
};
