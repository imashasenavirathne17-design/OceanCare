import React from 'react';
import { Link } from 'react-router-dom';
import './AdminSidebar.css';

/*
  Sidebar for Administrator Dashboard
*/
export default function AdminSidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <i className="fas fa-user-cog" aria-hidden="true"></i>
        <h1>OCEANCARE ADMIN</h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard/admin" className="active">
            <i className="fas fa-home"></i> Dashboard
          </Link>
        </li>
        <li><a href="#users"><i className="fas fa-users-cog"></i> User Accounts</a></li>
        <li><a href="#permissions"><i className="fas fa-shield-alt"></i> Permissions</a></li>
        <li><a href="#config"><i className="fas fa-sliders-h"></i> System Config</a></li>
        <li><a href="#compliance"><i className="fas fa-balance-scale"></i> Compliance & Audit</a></li>
        <li>
          <button className="linklike" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
