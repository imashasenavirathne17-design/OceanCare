import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './adminLogin.css';
import { loginUser } from '../lib/auth';
import { saveSession } from '../lib/token';

function AdminLogin() {
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
    <div className="admin-login">
      <div className="container">
        <div className="auth-header">
          <div className="logo">
            <i className="fas fa-cog" aria-hidden="true"></i>
            <h1>OCEANCARE ADMINISTRATOR</h1>
          </div>
          <p>Login to manage system configuration and user access</p>
        </div>

        <div className="auth-container">
          <div className="auth-welcome">
            <h2>Welcome Administrator</h2>
            <p>
              Access the system administration panel to manage users, configure settings, and monitor overall
              system performance.
            </p>
            <ul className="feature-list">
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Manage user accounts and permissions</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Configure system settings</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Monitor system performance and usage</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Generate system-wide reports</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Manage security and access controls</li>
            </ul>
          </div>

          <div className="auth-form-container">
            <h2 className="form-title">Administrator Login</h2>
            <form id="loginForm" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="email">Administrator Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="admin@example.com"
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
                <button type="submit" className="btn btn-primary">Login to Admin Panel</button>
              </div>

              <div className="form-footer">
                <a href="#forgot-password">Forgot your password?</a>
              </div>
            </form>

            <div className="role-switch">
              Not an Administrator? <Link to="/login">Select different role</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
