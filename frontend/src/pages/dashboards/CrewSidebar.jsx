import React from 'react';
import { NavLink } from 'react-router-dom';
import './CrewSidebar.css';

/*
  Sidebar specifically for the Crew Dashboard.
  Uses existing styles from crewDashboard.css: .sidebar, .logo, .sidebar-menu
*/
export default function CrewSidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <i className="fas fa-user" aria-hidden="true"></i>
        <h1>
          <span>OCEANCARE</span>
          <span>CREW</span>
        </h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/dashboard/crew" className={({ isActive }) => (isActive ? 'active' : '')} end>
            <i className="fas fa-home"></i> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/records" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-file-medical"></i> Health Records
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/examinations" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-stethoscope"></i> Examinations
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/chronic" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-notes-medical"></i> Chronic Tracking
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/mental-health" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-brain"></i> Mental Health
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/vaccinations" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-syringe"></i> Vaccinations
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/reminders" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-bell"></i> Reminders
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/messaging" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-comments"></i> Messaging
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/emergency" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-plus-circle"></i> Emergency
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/education" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-book-medical"></i> Health Education
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/crew/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className="fas fa-user-edit"></i> Profile
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
