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

// Medical Records CRUD
export const listMedicalRecords = async (params = {}) => {
  const { data } = await api.get('/health/records', { params });
  return data;
};

export const getMedicalRecord = async (id) => {
  const { data } = await api.get(`/health/records/${id}`);
  return data;
};

export const updateMedicalRecord = async (id, patch = {}, files = []) => {
  const fd = new FormData();
  Object.entries(patch).forEach(([k, v]) => v !== undefined && fd.append(k, v ?? ''));
  files.forEach((f) => fd.append('files', f));
  const { data } = await api.put(`/health/records/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteMedicalRecord = async (id) => {
  const { data } = await api.delete(`/health/records/${id}`);
  return data;
};

// Local mock data for examinations when backend is unavailable
const __mockExams = () => {
  const now = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  return [
    { type: 'Annual Physical', date: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5)), status: 'Scheduled', notes: 'Bring previous reports' },
    { type: 'Vision Test', date: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14)), status: 'Upcoming', notes: '' },
    { type: 'Hearing Test', performedAt: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20)), status: 'Completed', notes: 'Normal' },
    { type: 'Cardiac Evaluation', performedAt: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 45)), status: 'Completed', notes: 'Follow-up in 6 months' },
  ];
};

export const listExaminations = async (filter = 'all') => {
  // Use mocks if explicitly enabled
  if (String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true') {
    return __mockExams();
  }
  try {
    const { data } = await api.get('/health/exams', { params: { filter } });
    return data;
  } catch (e) {
    // Graceful fallback to mocks to keep the frontend usable during backend development
    return __mockExams();
  }
};

export const listMyExaminations = async (crewId) => {
  if (String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true') {
    return __mockExams();
  }
  try {
    const { data } = await api.get('/health/exams/my', { params: crewId ? { crewId } : {} });
    return data;
  } catch (e) {
    return __mockExams();
  }
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

export const getExamination = async (id) => {
  const { data } = await api.get(`/health/exams/${id}`);
  return data;
};

export const updateExamination = async (id, patch, files = []) => {
  const fd = new FormData();
  Object.entries(patch).forEach(([k, v]) => fd.append(k, v ?? ''));
  files.forEach((f) => fd.append('files', f));
  const { data } = await api.put(`/health/exams/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteExamination = async (id) => {
  const { data } = await api.delete(`/health/exams/${id}`);
  return data;
};

export const addChronicEntry = async ({ crewId, type, value, at }) => {
  const { data } = await api.post('/health/chronic', { crewId, type, value, at });
  return data;
};

// Local mock data for vaccinations when backend is unavailable
const __mockVaccinations = () => {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const nextMonth = new Date(today); nextMonth.setMonth(today.getMonth() + 1);
  return [
    { vaccine: 'COVID-19 Booster', status: 'completed', date: fmt(new Date(today.getFullYear(), today.getMonth() - 5, 15)), notes: 'Booster taken, valid 1 year' },
    { vaccine: 'Influenza', status: 'overdue', scheduledAt: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 10)), notes: 'Please schedule as soon as possible' },
    { vaccine: 'Yellow Fever', status: 'completed', date: fmt(new Date(today.getFullYear() - 2, 1, 20)), notes: 'Certificate valid for 10 years' },
    { vaccine: 'Tetanus', status: 'due-soon', scheduledAt: fmt(nextMonth), notes: 'Booster due next month' },
  ];
};

export const listVaccinations = async (filter = 'all') => {
  if (String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true') {
    return __mockVaccinations();
  }
  try {
    const { data } = await api.get('/health/vaccinations', { params: { filter } });
    return data;
  } catch (e) {
    return __mockVaccinations();
  }
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

// Crew directory for HealthExamination modal
export const listCrewMembers = async (q = '') => {
  const { data } = await api.get('/health/crew-members', { params: q ? { q } : {} });
  return data; // [{_id, fullName, crewId, email, status}]
};
