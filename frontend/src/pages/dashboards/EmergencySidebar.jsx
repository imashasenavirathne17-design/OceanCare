import React from 'react';
import { Link } from 'react-router-dom';
import './EmergencySidebar.css';

/*
  Sidebar specifically for the Emergency Officer Dashboard.
*/
export default function EmergencySidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <i className="fas fa-user-shield" aria-hidden="true"></i>
        <h1>OCEANCARE EMERGENCY</h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard/emergency" className="active">
            <i className="fas fa-home"></i> Dashboard
          </Link>
        </li>
        <li><a href="#alerts"><i className="fas fa-triangle-exclamation"></i> Alerts</a></li>
        <li><a href="#protocols"><i className="fas fa-procedures"></i> Protocols</a></li>
        <li><a href="#profiles"><i className="fas fa-id-card"></i> Crew Profiles</a></li>
        <li><a href="#map"><i className="fas fa-map-marked-alt"></i> Live Map</a></li>
        <li><a href="#messaging"><i className="fas fa-comments"></i> Messaging</a></li>
        <li><a href="#incidents"><i className="fas fa-clipboard-list"></i> Incidents</a></li>
        <li><a href="#reports"><i className="fas fa-file-export"></i> Reports</a></li>
        <li>
          <button className="linklike" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
