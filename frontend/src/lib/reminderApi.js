import { getToken } from './token';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const REMINDERS_BASE = `${API_BASE}/health/reminders`;

// Helper function to get headers with auth token
const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// ==================== REMINDER CRUD ====================

// Create new reminder
export const createReminder = async (reminderData) => {
  const response = await fetch(REMINDERS_BASE, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reminderData)
  });
  return handleResponse(response);
};

// Get all reminders with filters
export const listReminders = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const url = params.toString() ? `${REMINDERS_BASE}?${params}` : REMINDERS_BASE;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// Get single reminder
export const getReminder = async (id) => {
  const response = await fetch(`${REMINDERS_BASE}/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// Update reminder
export const updateReminder = async (id, updates) => {
  const response = await fetch(`${REMINDERS_BASE}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return handleResponse(response);
};

// Delete reminder
export const deleteReminder = async (id) => {
  const response = await fetch(`${REMINDERS_BASE}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// ==================== REMINDER ACTIONS ====================

// Mark reminder as completed
export const markReminderCompleted = async (id, notes = '') => {
  const response = await fetch(`${REMINDERS_BASE}/${id}/complete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ notes })
  });
  return handleResponse(response);
};

// Snooze reminder
export const snoozeReminder = async (id, minutes = 60) => {
  const response = await fetch(`${REMINDERS_BASE}/${id}/snooze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ minutes })
  });
  return handleResponse(response);
};

// Reschedule reminder
export const rescheduleReminder = async (id, scheduledDate, scheduledTime) => {
  const response = await fetch(`${REMINDERS_BASE}/${id}/reschedule`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ scheduledDate, scheduledTime })
  });
  return handleResponse(response);
};

// ==================== DASHBOARD & STATISTICS ====================

// Get dashboard summary
export const getReminderDashboard = async () => {
  const response = await fetch(`${REMINDERS_BASE}/dashboard`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// Get reminder statistics
export const getReminderStats = async (days = 30) => {
  const response = await fetch(`${REMINDERS_BASE}/stats?days=${days}`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// ==================== BULK OPERATIONS ====================

// Bulk update reminders
export const bulkUpdateReminders = async (reminderIds, updates) => {
  const response = await fetch(`${REMINDERS_BASE}/bulk-update`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reminderIds, updates })
  });
  return handleResponse(response);
};

// ==================== CONVENIENCE FUNCTIONS ====================

// Get medication reminders
export const getMedicationReminders = async (filters = {}) => {
  return listReminders({ ...filters, type: 'medication' });
};

// Get follow-up reminders
export const getFollowupReminders = async (filters = {}) => {
  return listReminders({ ...filters, type: 'followup' });
};

// Get today's reminders
export const getTodaysReminders = async () => {
  return listReminders({ today: 'true' });
};

// Get overdue reminders
export const getOverdueReminders = async () => {
  return listReminders({ overdue: 'true' });
};

// Get reminders by crew member
export const getRemindersByCrewId = async (crewId) => {
  return listReminders({ crewId });
};

// Get active reminders (scheduled or pending)
export const getActiveReminders = async () => {
  return listReminders({ status: 'active' });
};

// ==================== HELPER FUNCTIONS ====================

// Create medication reminder
export const createMedicationReminder = async (medicationData) => {
  const reminderData = {
    type: 'medication',
    title: `${medicationData.medication.name} - ${medicationData.crewName}`,
    description: `${medicationData.medication.dosage} - ${medicationData.medication.frequency}`,
    crewId: medicationData.crewId,
    crewName: medicationData.crewName,
    scheduledDate: medicationData.scheduledDate,
    scheduledTime: medicationData.scheduledTime,
    medication: medicationData.medication,
    isRecurring: medicationData.isRecurring || false,
    recurrencePattern: medicationData.recurrencePattern,
    notes: medicationData.notes,
    tags: ['medication']
  };
  
  return createReminder(reminderData);
};

// Create follow-up reminder
export const createFollowupReminder = async (followupData) => {
  const reminderData = {
    type: 'followup',
    title: `${followupData.followup.followupType} - ${followupData.crewName}`,
    description: followupData.description || `Follow-up appointment for ${followupData.followup.followupType}`,
    crewId: followupData.crewId,
    crewName: followupData.crewName,
    scheduledDate: followupData.scheduledDate,
    scheduledTime: followupData.scheduledTime,
    followup: followupData.followup,
    notes: followupData.notes,
    tags: ['followup']
  };
  
  return createReminder(reminderData);
};

// Get reminder status display
export const getReminderStatusDisplay = (reminder) => {
  const now = new Date();
  const scheduled = new Date(reminder.scheduledDate);
  
  if (reminder.scheduledTime) {
    const [hours, minutes] = reminder.scheduledTime.split(':');
    scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  if (reminder.status === 'completed') {
    return { status: 'completed', label: 'Completed', class: 'status-success' };
  }
  
  if (reminder.status === 'cancelled') {
    return { status: 'cancelled', label: 'Cancelled', class: 'status-secondary' };
  }
  
  if (reminder.status === 'snoozed') {
    return { status: 'snoozed', label: 'Snoozed', class: 'status-warning' };
  }
  
  if (now > scheduled) {
    return { status: 'overdue', label: 'Overdue', class: 'status-danger' };
  }
  
  const today = new Date();
  if (today.toDateString() === scheduled.toDateString()) {
    return { status: 'due-today', label: 'Due Today', class: 'status-warning' };
  }
  
  return { status: 'scheduled', label: 'Scheduled', class: 'status-active' };
};

// Format reminder time for display
export const formatReminderTime = (reminder) => {
  const date = new Date(reminder.scheduledDate);
  const dateStr = date.toLocaleDateString();
  
  if (reminder.scheduledTime) {
    return `${dateStr} at ${reminder.scheduledTime}`;
  }
  
  return dateStr;
};
