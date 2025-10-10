import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import HealthSidebar from './HealthSidebar';
import './healthOfficerDashboard.css';

export default function HealthPermissions() {
  const navigate = useNavigate();
  const user = getUser();

  const onLogout = () => { clearSession(); navigate('/login'); };

  const [permissions, setPermissions] = useState({
    viewMedicalRecords: true,
    editMedicalRecords: true,
    manageExaminations: true,
    manageVaccinations: true,
    sendInventoryAlerts: false,
    generateReports: true,
  });

  const toggle = (k) => setPermissions((p) => ({ ...p, [k]: !p[k] }));

  const save = () => {
    // In a real app, send to backend
    alert('Permissions saved for Health Officer.');
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="header">
            <h2>Health Officer Permissions</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <section className="dashboard-section">
            <div className="section-header">
              <div className="section-title">Role Permissions</div>
              <div className="section-actions">
                <button className="btn btn-primary" onClick={save}><i className="fas fa-save"></i> Save</button>
              </div>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Description</th>
                    <th style={{ width: 140 }}>Allowed</th>
                  </tr>
                </thead>
                <tbody>
                  {[{
                    key: 'viewMedicalRecords', label: 'View Medical Records', desc: 'Access to view crew medical records'
                  },{
                    key: 'editMedicalRecords', label: 'Edit Medical Records', desc: 'Create and update crew medical records'
                  },{
                    key: 'manageExaminations', label: 'Manage Examinations', desc: 'Record examinations and results'
                  },{
                    key: 'manageVaccinations', label: 'Manage Vaccinations', desc: 'Log and schedule vaccinations'
                  },{
                    key: 'sendInventoryAlerts', label: 'Send Inventory Alerts', desc: 'Send stock alerts to Inventory Manager'
                  },{
                    key: 'generateReports', label: 'Generate Reports', desc: 'Generate health-related reports'
                  }].map((row) => (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td>{row.desc}</td>
                      <td>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={!!permissions[row.key]}
                            onChange={() => toggle(row.key)}
                          />
                          <span className="slider"></span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
