import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './crewLogin.css';
import { loginUser } from '../lib/auth';
import { saveSession } from '../lib/token';

function CrewLogin() {
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
      // Redirect by role
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
    <div className="crew-login">
      <div className="container">
        <div className="auth-header">
          <div className="logo">
            <i className="fas fa-user" aria-hidden="true"></i>
            <h1>OCEANCARE CREW</h1>
          </div>
          <p>Login to access your personal health dashboard</p>
        </div>

        <div className="auth-container">
          <div className="auth-welcome">
            <h2>Welcome Crew Member</h2>
            <p>
              Access your personal health dashboard to track your wellness, submit health reports, and
              communicate with health officers.
            </p>
            <ul className="feature-list">
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Track personal health metrics</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Submit daily health reports</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> View medical history and records</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Request telemedicine consultations</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Access health education resources</li>
            </ul>
          </div>

          <div className="auth-form-container">
            <h2 className="form-title">Crew Member Login</h2>
            <form id="loginForm" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address or Crew ID</label>
                <input
                  type="text"
                  id="email"
                  className="form-control"
                  placeholder="your.email@example.com"
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
                <button type="submit" className="btn btn-primary">Login to Dashboard</button>
              </div>

              <div className="form-footer">
                <a href="#forgot-password">Forgot your password?</a>
              </div>
            </form>

            <div className="role-switch">
              Not a Crew Member? <Link to="/login">Select different role</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrewLogin;
