import React from 'react';
import { NavLink } from 'react-router-dom';
import './HealthSidebar.css';

/*
  Sidebar specifically for the Health Officer Dashboard.
  Mirrors CrewSidebar style and IA but with officer-specific sections.
*/
export default function HealthSidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <i className="fas fa-user-nurse" aria-hidden="true"></i>
        <h1>OCEANCARE HEALTH</h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/dashboard/health" className={({ isActive }) => (isActive ? 'active' : '')} end>
            <i className="fas fa-home"></i> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health/medical-records" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-file-medical"></i> Medical Records
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health/examinations" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-stethoscope"></i> Examinations
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health/chronic" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-heartbeat"></i> Chronic Tracking
          </NavLink>
        </li>
        <li><a href="#reminders"><i className="fas fa-bell"></i> Reminders</a></li>
        <li><a href="#mental-health"><i className="fas fa-brain"></i> Mental Health</a></li>
        <li><a href="#vaccinations"><i className="fas fa-syringe"></i> Vaccinations</a></li>
        <li><a href="#reports"><i className="fas fa-file-export"></i> Reports</a></li>
        <li><a href="#inventory"><i className="fas fa-briefcase-medical"></i> Inventory Alerts</a></li>
        <li><a href="#emergency"><i className="fas fa-exclamation-triangle"></i> Emergency</a></li>
        <li><a href="#education"><i className="fas fa-book-medical"></i> Education</a></li>
        <li>
          <button className="linklike" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
