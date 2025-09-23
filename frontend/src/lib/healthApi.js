import api from './api';

// Health Officer related API helpers
// Note: Endpoints are placeholders; align with backend when available.

export const saveMedicalRecord = async (record, files = []) => {
  const fd = new FormData();
  Object.entries(record).forEach(([k, v]) => fd.append(k, v ?? ''));
  files.forEach((f) => fd.append('files', f));
  const { data } = await api.post('/health/records', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const saveExamination = async (exam, files = [], nextEval = '') => {
  const fd = new FormData();
  Object.entries(exam).forEach(([k, v]) => fd.append(k, v ?? ''));
  if (nextEval) fd.append('nextEvaluation', nextEval);
  files.forEach((f) => fd.append('files', f));
  const { data } = await api.post('/health/exams', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const addChronicEntry = async ({ crewId, type, value, at }) => {
  const { data } = await api.post('/health/chronic', { crewId, type, value, at });
  return data;
};

export const listVaccinations = async (filter = 'all') => {
  const { data } = await api.get('/health/vaccinations', { params: { filter } });
  return data;
};

export const markVaccinationComplete = async ({ crewId, vaccine }) => {
  const { data } = await api.post('/health/vaccinations/complete', { crewId, vaccine });
  return data;
};

export const createReminder = async (payload) => {
  const { data } = await api.post('/health/reminders', payload);
  return data;
};

export const listInventory = async () => {
  const { data } = await api.get('/inventory/items');
  return data;
};

export const requestRestock = async ({ item, qty }) => {
  const { data } = await api.post('/inventory/restock', { item, qty });
  return data;
};

export const sendEmergencyAlert = async (payload) => {
  const { data } = await api.post('/emergency/alerts', payload);
  return data;
};

export const publishEducation = async (payload, files = []) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ''));
  files.forEach((f) => fd.append('files', f));
  const { data } = await api.post('/health/education', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const generateReport = async ({ from, to }) => {
  const { data } = await api.get('/health/reports', { params: { from, to } });
  return data;
};
