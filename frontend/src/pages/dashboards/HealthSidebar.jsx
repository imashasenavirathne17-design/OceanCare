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
        <li>
          <NavLink to="/dashboard/health/reminders" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-bell"></i> Reminders
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health/mental-health" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-brain"></i> Mental Health
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health/vaccination" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-syringe"></i> Vaccinations
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-file-export"></i> Reports
          </NavLink>
        </li>
        
        <li>
          <NavLink to="/dashboard/health/inventory-alerts" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-bell"></i> Inventory Alerts
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health/emergency" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-exclamation-triangle"></i> Emergency
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/health/education" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-book-medical"></i> Education
          </NavLink>
        </li>
        <li>
          <button className="linklike" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
