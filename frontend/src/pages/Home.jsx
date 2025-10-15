import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './home.css';
import Header from '../components/Header';

function Home() {
  const onEmergencyClick = (e) => {
    e.preventDefault();
    alert('In a real implementation, this would connect to emergency services and ship medical staff.');
  };

  return (
    <div className="page">
      <Header />

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="container">
          <h2>Prioritizing Crew Health at Sea</h2>
          <p>OCEANCARE is a comprehensive health tracking solution designed specifically for maritime professionals, ensuring wellness and safety during voyages.</p>
          <a href="#get-started" className="btn btn-primary">Get Started</a>
          <a href="#learn-more" className="btn btn-outline">Learn More</a>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-title">
            <h2>Comprehensive Health Management</h2>
            <p>Our platform offers a range of features designed to keep crew members healthy and ship operations running smoothly.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <i className="fas fa-heartbeat" aria-hidden="true"></i>
              <h3>Vital Signs Monitoring</h3>
              <p>Track and record crew members' vital signs with easy-to-use tools and reminders.</p>
            </div>

            <div className="feature-card">
              <i className="fas fa-pills" aria-hidden="true"></i>
              <h3>Medication Management</h3>
              <p>Schedule medication times, track inventory, and receive refill alerts.</p>
            </div>

            <div className="feature-card">
              <i className="fas fa-video" aria-hidden="true"></i>
              <h3>Telemedicine Integration</h3>
              <p>Connect with medical professionals anywhere in the world for remote consultations.</p>
            </div>

            <div className="feature-card">
              <i className="fas fa-file-medical" aria-hidden="true"></i>
              <h3>Health Records</h3>
              <p>Maintain digital health records for all crew members accessible anytime, anywhere.</p>
            </div>

            <div className="feature-card">
              <i className="fas fa-bell" aria-hidden="true"></i>
              <h3>Emergency Alerts</h3>
              <p>Instant emergency notification system to alert medical teams and onshore support.</p>
            </div>

            <div className="feature-card">
              <i className="fas fa-chart-line" aria-hidden="true"></i>
              <h3>Health Analytics</h3>
              <p>Gain insights into crew health trends and receive predictive health recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="emergency" id="emergency">
        <div className="container">
          <h2>Emergency Medical Assistance</h2>
          <p>In case of a medical emergency onboard, our system provides immediate guidance and connects you with professional medical support.</p>
          <a href="#emergency" className="btn emergency-btn" onClick={onEmergencyClick}>Emergency Assistance</a>
        </div>
      </section>

      {/* Health Tips Section */}
      <section className="health-tips" id="library">
        <div className="container">
          <div className="section-title">
            <h2>Maritime Health Tips</h2>
            <p>Practical advice for maintaining health and wellness during long voyages.</p>
          </div>

          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1662926912257-514bbe9d4ba3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=890')" }}></div>
              <div className="tip-content">
                <h3>Staying Hydrated at Sea</h3>
                <p>Learn the importance of hydration and strategies to ensure adequate water intake during long voyages.</p>
              </div>
            </div>

            <div className="tip-card">
              <div className="tip-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1659366100463-9e29a63adcc2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170')" }}></div>
              <div className="tip-content">
                <h3>Managing Seasickness</h3>
                <p>Effective techniques and remedies to prevent and manage seasickness for crew members.</p>
              </div>
            </div>

            <div className="tip-card">
              <div className="tip-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fEV4ZXJjaXNlfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600')" }}></div>
              <div className="tip-content">
                <h3>Onboard Exercise routines</h3>
                <p>Space-efficient workout routines designed specifically for the limited space available on ships.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>OCEANCARE</h3>
              <p>Comprehensive health tracking for maritime professionals, ensuring wellness and safety during voyages.</p>
              <div className="social-links">
                <a href="#"><i className="fab fa-facebook-f" aria-hidden="true"></i></a>
                <a href="#"><i className="fab fa-twitter" aria-hidden="true"></i></a>
                <a href="#"><i className="fab fa-instagram" aria-hidden="true"></i></a>
                <a href="#"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
              </div>
            </div>

            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#library">Health Library</a></li>
                <li><a href="#emergency">Emergency Guide</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3>Resources</h3>
              <ul>
                <li><a href="#">Blog</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Support Center</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3>Contact Us</h3>
              <ul>
                <li><i className="fas fa-map-marker-alt" aria-hidden="true"></i> 123 Maritime Ave, Ocean City</li>
                <li><i className="fas fa-phone" aria-hidden="true"></i> +1 (555) 123-4567</li>
                <li><i className="fas fa-envelope" aria-hidden="true"></i> info@oceancare.com</li>
              </ul>
            </div>
          </div>

          <div className="copyright">
            <p>&copy; 2025 OCEANCARE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
