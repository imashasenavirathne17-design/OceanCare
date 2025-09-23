import api from './api';

export async function registerUser(payload) {
  // payload: { fullName, email, password, role, crewId? }
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { token, user }
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}
