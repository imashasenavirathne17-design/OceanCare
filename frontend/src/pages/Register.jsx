import React, { useMemo, useState } from 'react';
import './register.css';
import { registerUser } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

function RoleOption({ id, iconClass, name, desc, selected, onSelect, tone }) {
  return (
    <div
      className={`role-option ${tone} ${selected ? 'selected' : ''}`}
      data-role={id}
      onClick={() => onSelect(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(id)}
      aria-pressed={selected}
      aria-label={`${name} role`}
    >
      <div className="role-icon"><i className={iconClass} aria-hidden="true"></i></div>
      <div className="role-name">{name}</div>
      <div className="role-desc">{desc}</div>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', registerEmail: '', registerPassword: '', confirmPassword: '', vesselName: '', crewId: '', role: '' });
  const [strengthClass, setStrengthClass] = useState('');

  const generateCrewId = () => {
    const y = new Date().getFullYear().toString().slice(-2);
    const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const num = Math.floor(1000 + Math.random() * 9000);
    return `OC-${y}-${rand}-${num}`;
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.id]: e.target.value }));

  const onSelectRole = (role) => setForm((f) => ({ ...f, role }));

  const onPasswordInput = (value) => {
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[a-z]+/.test(value)) strength++;
    if (/[A-Z]+/.test(value)) strength++;
    if (/[0-9]+/.test(value)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]+/.test(value)) strength++;
    if (value.length === 0) setStrengthClass('');
    else if (strength < 3) setStrengthClass('weak');
    else if (strength < 5) setStrengthClass('medium');
    else setStrengthClass('strong');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const { fullName, registerEmail, registerPassword, confirmPassword, role } = form;
    if (!fullName || !registerEmail || !registerPassword || !confirmPassword || !role) {
      alert('Please fill in all required fields');
      return;
    }
    if (registerPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (registerPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    const hasUpperCase = /[A-Z]/.test(registerPassword);
    const hasLowerCase = /[a-z]/.test(registerPassword);
    const hasNumbers = /\d/.test(registerPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(registerPassword);
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      alert('Password must include uppercase, lowercase, number, and special characters');
      return;
    }
    try {
      const crewId = form.crewId || (role === 'crew' ? generateCrewId() : undefined);
      await registerUser({
        fullName,
        email: registerEmail,
        password: registerPassword,
        role,
        crewId,
      });
      alert(`Registration successful!${crewId ? `\nYour Crew ID: ${crewId}` : ''} Please login to continue.`);
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed';
      alert(msg);
    }
  };

  const roles = useMemo(() => ([
    { id: 'crew', icon: 'fas fa-user', name: 'Crew Member', desc: 'Track personal health metrics', tone: 'crew' },
    { id: 'health', icon: 'fas fa-user-md', name: 'Health Officer', desc: 'Monitor crew health status', tone: 'health' },
    { id: 'emergency', icon: 'fas fa-plus-circle', name: 'Emergency Officer', desc: 'Manage emergency responses', tone: 'emergency' },
    { id: 'inventory', icon: 'fas fa-pills', name: 'Inventory Manager', desc: 'Manage medical supplies', tone: 'inventory' },
    { id: 'admin', icon: 'fas fa-cog', name: 'Administrator', desc: 'System configuration', tone: 'admin' },
  ]), []);

  return (
    <div className="register-page">
      <div className="container">
        <div className="auth-header">
          <div className="logo">
            <i className="fas fa-heartbeat" aria-hidden="true"></i>
            <h1>OCEANCARE</h1>
          </div>
          <p>Create an account to access the maritime health tracking system</p>
        </div>

        <div className="auth-container">
          <div className="auth-welcome">
            <h2>Join OCEANCARE</h2>
            <p>OCEANCARE provides specialized health tracking for all maritime professionals with role-based access to ensure the right tools for each team member.</p>
            <ul className="feature-list">
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Track health metrics in real-time</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Access telemedicine services at sea</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Coordinate emergency response plans</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Manage medical inventory efficiently</li>
              <li><i className="fas fa-check-circle" aria-hidden="true"></i> Generate health reports and analytics</li>
            </ul>
          </div>

          <div className="auth-form-container">
            <h2 className="form-title">Create Your Account</h2>
            <form id="registerForm" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input id="fullName" className="form-control" placeholder="Enter your full name" value={form.fullName} onChange={onChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="registerEmail">Email Address</label>
                <input id="registerEmail" type="email" className="form-control" placeholder="your.email@example.com" value={form.registerEmail} onChange={onChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="registerPassword">Password</label>
                <input id="registerPassword" type="password" className="form-control" placeholder="Create a strong password" value={form.registerPassword} onChange={(e) => { onChange(e); onPasswordInput(e.target.value); }} required />
                <div className={`password-strength ${strengthClass}`}>
                  <div className="password-strength-bar"></div>
                </div>
                <div className="password-requirements">Must be at least 8 characters with uppercase, lowercase, number, and special character</div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" className="form-control" placeholder="Confirm your password" value={form.confirmPassword} onChange={onChange} required />
              </div>

              <div className="form-group">
                <label>Select Your Role</label>
                <div className="role-selection">
                  {roles.map((r) => (
                    <RoleOption key={r.id} id={r.id} iconClass={r.icon} name={r.name} desc={r.desc} tone={r.tone} selected={form.role === r.id} onSelect={onSelectRole} />
                  ))}
                </div>
                <input type="hidden" id="selectedRole" value={form.role} required readOnly />
              </div>

              <div className="additional-info">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label htmlFor="vesselName">Vessel Name</label>
                  <input id="vesselName" className="form-control" placeholder="Enter vessel name" value={form.vesselName} onChange={onChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="crewId">Crew ID Number</label>
                  <input id="crewId" className="form-control" placeholder="Enter your crew ID" value={form.crewId} onChange={onChange} />
                </div>
              </div>

              <div className="form-group">
                <div className="form-check">
                  <input type="checkbox" id="termsAgree" className="form-check-input" required />
                  <label htmlFor="termsAgree" className="form-check-label">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
                </div>
              </div>

              <div className="form-group">
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>

              <div className="form-footer">
                Already have an account? <a href="#login">Login here</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
