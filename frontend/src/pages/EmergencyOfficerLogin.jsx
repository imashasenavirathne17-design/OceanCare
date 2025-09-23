import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './emergencyOfficerLogin.css';
import { loginUser } from '../lib/auth';
import { saveSession } from '../lib/token';

function EmergencyOfficerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const navigate = useNavigate();

  const onChange = (e) => {
    const { id, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [id]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = form;
    if (!email || !password) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const { token, user } = await loginUser({ email, password });
      saveSession({ token, user });
      const pathMap = {
        crew: '/dashboard/crew',
        health: '/dashboard/health',
        emergency: '/dashboard/emergency',
        inventory: '/dashboard/inventory',
        admin: '/dashboard/admin',
      };
      navigate(pathMap[user.role] || '/');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      alert(msg);
    }
  };

  return (
    <div className="emergency-login">
      <div className="container">
        <div className="auth-header">
          <div className="logo">
            <i className="fas fa-plus-circle" aria-hidden="true"></i>
            <h1>OCEANCARE EMERGENCY OFFICER</h1>
          </div>
          <p>Login to manage emergency responses and protocols</p>
        </div>

        <div className="auth-container">
          <div className="auth-welcome">
            <h2>Welcome Emergency Officer</h2>
            <p>
              Access the emergency management system to coordinate responses, manage evacuations, and
              ensure crew safety during critical situations.
            </p>
            <ul className="feature-list">
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Coordinate emergency responses</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Manage evacuation procedures</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Access emergency protocols</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Monitor critical situations</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Coordinate with external emergency services</li>
            </ul>
          </div>

          <div className="auth-form-container">
            <h2 className="form-title">Emergency Officer Login</h2>

            <form id="loginForm" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="email">Professional Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="emergency.officer@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-group password-toggle">
                <label htmlFor="password">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={onChange}
                  required
                />
                <i
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-icon`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowPassword((s) => !s)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                ></i>
              </div>

              <div className="form-group">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="remember"
                    className="form-check-input"
                    checked={form.remember}
                    onChange={onChange}
                  />
                  <label htmlFor="remember" className="form-check-label">Remember me on this device</label>
                </div>
              </div>

              <div className="form-group">
                <button type="submit" className="btn btn-primary">Login to Emergency Dashboard</button>
              </div>

              <div className="form-footer">
                <a href="#forgot-password">Forgot your password?</a>
              </div>
            </form>

            <div className="role-switch">
              Not an Emergency Officer? <Link to="/login">Select different role</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmergencyOfficerLogin;
