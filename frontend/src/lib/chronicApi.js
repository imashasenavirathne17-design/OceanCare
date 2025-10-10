import { getToken } from './token';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// ==================== CHRONIC ILLNESS PATIENTS ====================

// Get all chronic illness patients with filters
export const listChronicPatients = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/health/chronic/patients${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

// Get single patient details
export const getChronicPatient = async (id) => {
  const response = await fetch(`${API_BASE}/health/chronic/patients/${id}`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

// Create new chronic illness patient
export const createChronicPatient = async (patientData, files = []) => {
  const formData = new FormData();
  
  // Add patient data fields
  Object.keys(patientData).forEach(key => {
    if (patientData[key] !== undefined && patientData[key] !== null) {
      if (Array.isArray(patientData[key])) {
        patientData[key].forEach(item => {
          formData.append(`${key}[]`, typeof item === 'object' ? JSON.stringify(item) : item);
        });
      } else if (typeof patientData[key] === 'object') {
        formData.append(key, JSON.stringify(patientData[key]));
      } else {
        formData.append(key, patientData[key]);
      }
    }
  });
  
  // Add files if any
  files.forEach(file => {
    formData.append('attachments', file);
  });
  
  const response = await fetch(`${API_BASE}/health/chronic/patients`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  
  return handleResponse(response);
};

// Update chronic illness patient
export const updateChronicPatient = async (id, patientData, files = []) => {
  const formData = new FormData();
  
  // Add patient data fields
  Object.keys(patientData).forEach(key => {
    if (patientData[key] !== undefined && patientData[key] !== null) {
      if (Array.isArray(patientData[key])) {
        patientData[key].forEach(item => {
          formData.append(`${key}[]`, typeof item === 'object' ? JSON.stringify(item) : item);
        });
      } else if (typeof patientData[key] === 'object') {
        formData.append(key, JSON.stringify(patientData[key]));
      } else {
        formData.append(key, patientData[key]);
      }
    }
  });
  
  // Add files if any
  files.forEach(file => {
    formData.append('attachments', file);
  });
  
  const response = await fetch(`${API_BASE}/health/chronic/patients/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: formData,
  });
  
  return handleResponse(response);
};

// Delete chronic illness patient
export const deleteChronicPatient = async (id) => {
  const response = await fetch(`${API_BASE}/health/chronic/patients/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

// ==================== HEALTH READINGS ====================

// Get all health readings with filters
export const listChronicReadings = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/health/chronic/readings${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

// Get single reading
export const getChronicReading = async (id) => {
  const response = await fetch(`${API_BASE}/health/chronic/readings/${id}`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

// Create new health reading
export const createChronicReading = async (readingData, files = []) => {
  const formData = new FormData();
  
  // Add reading data fields
  Object.keys(readingData).forEach(key => {
    if (readingData[key] !== undefined && readingData[key] !== null) {
      if (Array.isArray(readingData[key])) {
        readingData[key].forEach(item => {
          formData.append(`${key}[]`, item);
        });
      } else {
        formData.append(key, readingData[key]);
      }
    }
  });
  
  // Add files if any
  files.forEach(file => {
    formData.append('attachments', file);
  });
  
  const response = await fetch(`${API_BASE}/health/chronic/readings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  
  return handleResponse(response);
};

// Update health reading
export const updateChronicReading = async (id, readingData, files = []) => {
  const formData = new FormData();
  
  // Add reading data fields
  Object.keys(readingData).forEach(key => {
    if (readingData[key] !== undefined && readingData[key] !== null) {
      if (Array.isArray(readingData[key])) {
        readingData[key].forEach(item => {
          formData.append(`${key}[]`, item);
        });
      } else {
        formData.append(key, readingData[key]);
      }
    }
  });
  
  // Add files if any
  files.forEach(file => {
    formData.append('attachments', file);
  });
  
  const response = await fetch(`${API_BASE}/health/chronic/readings/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: formData,
  });
  
  return handleResponse(response);
};

// Delete health reading
export const deleteChronicReading = async (id) => {
  const response = await fetch(`${API_BASE}/health/chronic/readings/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

// ==================== STATISTICS & REPORTS ====================

// Get condition statistics
export const getConditionStats = async () => {
  const response = await fetch(`${API_BASE}/health/chronic/stats/conditions`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

// Get progress tracking data
export const getProgressData = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/health/chronic/stats/progress${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};
