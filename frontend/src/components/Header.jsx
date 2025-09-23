import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import './header.css';

function Header() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const isLogin = location.pathname === '/login';
  return (
    <header>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo" aria-label="OCEANCARE Home">
            <i className="fas fa-heartbeat" aria-hidden="true"></i>
            <h1>OCEANCARE</h1>
          </Link>

          <nav aria-label="Primary">
            <ul>
              <li><NavLink to="/" end>Home</NavLink></li>
              <li><NavLink to="/features">Features</NavLink></li>
              <li><NavLink to="/health-library">Health Library</NavLink></li>
              <li><NavLink to="/announcements">Announcements</NavLink></li>
              <li><NavLink to="/emergency">Emergency</NavLink></li>
              <li><NavLink to="/about">About Us</NavLink></li>
              <li><NavLink to="/contact">Contact</NavLink></li>
            </ul>
          </nav>

          <div className="auth-buttons">
            <Link to="/login" className={`btn btn-outline${isLogin ? ' current' : ''}`}>Login</Link>
            <Link to="/register" className={`btn btn-primary${isRegister ? ' current' : ''}`}>Register</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
