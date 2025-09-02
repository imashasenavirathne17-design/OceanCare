import { useEffect, useState } from 'react';
import axios from 'axios';

export default function HealthOfficerDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/healthofficer/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <p>Loading dashboard...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Health Officer Dashboard</h1>
      <p>Pending Exams: {stats.pendingExams}</p>
      <p>Chronic Patients: {stats.chronicPatients}</p>
      <p>Vaccination Alerts: {stats.vaccinationAlerts}</p>
    </div>
  );
}
