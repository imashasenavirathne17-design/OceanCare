import React from 'react';
import { Link } from 'react-router-dom';
import './login.css';

function Login() {
  return (
    <div className="login-page">
      <div className="container">
        <div className="auth-header">
          <div className="logo">
            <i className="fas fa-heartbeat" aria-hidden="true"></i>
            <h1>OCEANCARE</h1>
          </div>
          <p>Select your role to access the maritime health tracking system</p>
        </div>

        <div className="role-selection-container">
          <h2 className="role-selection-title">Access Your Account</h2>

          <div className="role-grid">
            <Link to="/login/crew" className="role-card crew" aria-label="Crew Member Login">
              <div className="role-icon">
                <i className="fas fa-user" aria-hidden="true"></i>
              </div>
              <div className="role-name">Crew Member</div>
              <div className="role-desc">Access your personal health dashboard, submit health reports, and view medical history.</div>
              <div className="btn btn-login">Login as Crew</div>
            </Link>

            <Link to="/login/health-officer" className="role-card health" aria-label="Health Officer Login">
              <div className="role-icon">
                <i className="fas fa-user-md" aria-hidden="true"></i>
              </div>
              <div className="role-name">Health Officer</div>
              <div className="role-desc">Monitor crew health status, review medical reports, and provide telemedicine services.</div>
              <div className="btn btn-login">Login as Health Officer</div>
            </Link>

            <Link to="/login/emergency-officer" className="role-card emergency" aria-label="Emergency Officer Login">
              <div className="role-icon">
                <i className="fas fa-plus-circle" aria-hidden="true"></i>
              </div>
              <div className="role-name">Emergency Officer</div>
              <div className="role-desc">Manage emergency responses, coordinate evacuations, and access emergency protocols.</div>
              <div className="btn btn-login">Login as Emergency Officer</div>
            </Link>

            <Link to="/login/inventory-manager" className="role-card inventory" aria-label="Inventory Manager Login">
              <div className="role-icon">
                <i className="fas fa-pills" aria-hidden="true"></i>
              </div>
              <div className="role-name">Inventory Manager</div>
              <div className="role-desc">Manage medical supplies, track inventory levels, and process replenishment orders.</div>
              <div className="btn btn-login">Login as Inventory Manager</div>
            </Link>

            <Link to="/login/administrator" className="role-card admin" aria-label="Administrator Login">
              <div className="role-icon">
                <i className="fas fa-cog" aria-hidden="true"></i>
              </div>
              <div className="role-name">Administrator</div>
              <div className="role-desc">System configuration, user management, and access control settings.</div>
              <div className="btn btn-login">Login as Administrator</div>
            </Link>
          </div>

          <div className="form-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
