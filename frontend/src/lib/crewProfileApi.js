import api from './api';

export const getCrewProfile = async () => {
  const { data } = await api.get('/crew/profile');
  return data;
};

export const updateCrewProfile = async (payload) => {
  const { data } = await api.put('/crew/profile', payload);
  return data;
};
