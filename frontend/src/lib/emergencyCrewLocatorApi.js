import api from './api';

export const listCrewLocations = async () => {
  const { data } = await api.get('/emergency/crew-locator');
  return data;
};

export const updateCrewLocation = async (crewId, payload) => {
  const { data } = await api.put(`/emergency/crew-locator/${crewId}`, payload);
  return data;
};
