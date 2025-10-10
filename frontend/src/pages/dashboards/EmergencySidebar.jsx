import React from 'react';
import { NavLink } from 'react-router-dom';
import { getToken, getUser } from '../../lib/token';
import './EmergencySidebar.css';

/*
  Sidebar specifically for the Emergency Officer Dashboard.
*/
export default function EmergencySidebar({ onLogout }) {
  const token = getToken();
  const user = getUser();
  const isEmergency = !!token && user?.role === 'emergency';

  return (
    <aside className="sidebar" aria-label="Emergency navigation">
      <div className="logo">
        <i className="fas fa-user-md" aria-hidden="true"></i>
        <h1>OCEANCARE EMERGENCY</h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          {isEmergency ? (
            <NavLink to="/dashboard/emergency" end>
              <i className="fas fa-home" aria-hidden="true"></i> Dashboard
            </NavLink>
          ) : (
            <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} title="Login as Emergency Officer to access">
              <i className="fas fa-home" aria-hidden="true"></i> Dashboard
            </a>
          )}
        </li>
        <li>
          {isEmergency ? (
            <NavLink to="/dashboard/emergency/alerts">
              <i className="fas fa-bell" aria-hidden="true"></i> Emergency Alerts
            </NavLink>
          ) : (
            <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} title="Login as Emergency Officer to access">
              <i className="fas fa-bell" aria-hidden="true"></i> Emergency Alerts
            </a>
          )}
        </li>
        <li>
          <NavLink to={isEmergency ? "/dashboard/emergency/protocols" : "/emergency-protocols"} end>
            <i className="fas fa-play-circle" aria-hidden="true"></i> Emergency Protocols
          </NavLink>
        </li>
        <li>
          {isEmergency ? (
            <NavLink to="/dashboard/emergency/crew-profiles">
              <i className="fas fa-user-injured" aria-hidden="true"></i> Crew Profiles
            </NavLink>
          ) : (
            <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} title="Login as Emergency Officer to access">
              <i className="fas fa-user-injured" aria-hidden="true"></i> Crew Profiles
            </a>
          )}
        </li>
        <li>
          {isEmergency ? (
            <NavLink to="/dashboard/emergency/crew-locator">
              <i className="fas fa-map-marker-alt" aria-hidden="true"></i> Crew Locator
            </NavLink>
          ) : (
            <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} title="Login as Emergency Officer to access">
              <i className="fas fa-map-marker-alt" aria-hidden="true"></i> Crew Locator
            </a>
          )}
        </li>
        <li>
          {isEmergency ? (
            <NavLink to="/dashboard/emergency/messaging">
              <i className="fas fa-comments" aria-hidden="true"></i> Messaging
            </NavLink>
          ) : (
            <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} title="Login as Emergency Officer to access">
              <i className="fas fa-comments" aria-hidden="true"></i> Messaging
            </a>
          )}
        </li>
        <li>
          {isEmergency ? (
            <NavLink to="/dashboard/emergency/incident-log">
              <i className="fas fa-clipboard-list" aria-hidden="true"></i> Incident Log
            </NavLink>
          ) : (
            <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} title="Login as Emergency Officer to access">
              <i className="fas fa-clipboard-list" aria-hidden="true"></i> Incident Log
            </a>
          )}
        </li>
        <li>
          {isEmergency ? (
            <NavLink to="/dashboard/emergency/reports">
              <i className="fas fa-chart-bar" aria-hidden="true"></i> Reports
            </NavLink>
          ) : (
            <a href="#" aria-disabled="true" onClick={(e) => e.preventDefault()} title="Login as Emergency Officer to access">
              <i className="fas fa-chart-bar" aria-hidden="true"></i> Reports
            </a>
          )}
        </li>
        <li>
          <button className="linklike" onClick={onLogout}>
            <i className="fas fa-sign-out-alt" aria-hidden="true"></i> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
