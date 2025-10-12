import api from './api';

export const listMyMedicalRecords = async (params = {}) => {
  const { data } = await api.get('/crew/records', { params });
  return data;
};

export const getMyMedicalRecord = async (id) => {
  const { data } = await api.get(`/crew/records/${id}`);
  return data;
};

export const createMyMedicalRecord = async (record, files = []) => {
  const fd = new FormData();
  Object.entries(record).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, value);
    }
  });
  files.forEach((file) => fd.append('files', file));
  const { data } = await api.post('/crew/records', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateMyMedicalRecord = async (id, record, files = []) => {
  const fd = new FormData();
  Object.entries(record).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, value);
    }
  });
  files.forEach((file) => fd.append('files', file));
  const { data } = await api.put(`/crew/records/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteMyMedicalRecord = async (id) => {
  const { data } = await api.delete(`/crew/records/${id}`);
  return data;
};
