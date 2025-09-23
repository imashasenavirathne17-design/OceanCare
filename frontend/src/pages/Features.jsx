import React from 'react';
import './features.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Features() {
  return (
    <div className="features-page">
      <Header />

      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h2>Comprehensive Health Management Features</h2>
          <p>Discover how OCEANCARE provides complete health tracking and medical support for maritime professionals</p>
        </div>
      </section>

      {/* Features Overview */}
      <section className="features">
        <div className="container">
          <div className="section-title">
            <h2>Powerful Features for Crew Wellness</h2>
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

      {/* Detailed Features */}
      <section className="detailed-features">
        <div className="container">
          <div className="feature-detail">
            <div className="feature-content">
              <h3>Comprehensive Health Monitoring</h3>
              <p>Our system allows for continuous monitoring of crew health parameters with easy-to-use interfaces and automated reminders.</p>
              <ul className="feature-list">
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Track vital signs including heart rate, blood pressure, and temperature</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Set custom reminders for regular health check-ups</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Generate health reports for individual crew members or the entire team</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Historical data tracking to identify health trends over time</li>
              </ul>
            </div>
            <div className="feature-image">
              <img src="https://images.unsplash.com/photo-1582719471384-8946dc3c9f44?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Health Monitoring" />
            </div>
          </div>

          <div className="feature-detail reverse">
            <div className="feature-content">
              <h3>Telemedicine Capabilities</h3>
              <p>Connect with medical professionals around the world even when you're in the middle of the ocean.</p>
              <ul className="feature-list">
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Secure video consultations with licensed physicians</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Digital prescription services for non-emergency situations</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Medical image sharing for remote diagnosis</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> 24/7 access to medical specialists in various fields</li>
              </ul>
            </div>
            <div className="feature-image">
              <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d15?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Telemedicine" />
            </div>
          </div>

          <div className="feature-detail">
            <div className="feature-content">
              <h3>Emergency Response System</h3>
              <p>Our emergency features ensure that help is always available when you need it most.</p>
              <ul className="feature-list">
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> One-touch emergency alert system</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Automated distress signals to nearby vessels and ports</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Step-by-step emergency medical guidance</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Direct connection to maritime rescue services</li>
              </ul>
            </div>
            <div className="feature-image">
              <img src="https://images.unsplash.com/photo-1583309219338-a582f1f9ca6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Emergency Response" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <div className="section-title">
            <h2>What Our Users Say</h2>
            <p>Hear from maritime professionals who have experienced the benefits of OCEANCARE firsthand.</p>
          </div>

          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="testimonial-text">
                <p>OCEANCARE has revolutionized how we manage crew health on our vessels. The telemedicine feature alone has saved us multiple emergency diversions.</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">CD</div>
                <div className="author-details">
                  <h4>Captain David Miller</h4>
                  <p>Merchant Marine Officer</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-text">
                <p>As a ship medic, having access to complete health records and remote specialists has dramatically improved the care I can provide to our crew.</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">SM</div>
                <div className="author-details">
                  <h4>Sarah Johnson</h4>
                  <p>Maritime Medical Officer</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-text">
                <p>The health analytics have helped us identify patterns in crew wellness that we were previously unaware of. This proactive approach has reduced sick days by 23%.</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">RF</div>
                <div className="author-details">
                  <h4>Robert Fitzgerald</h4>
                  <p>Fleet Operations Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Enhance Your Crew's Health?</h2>
          <p>Join hundreds of maritime companies that trust OCEANCARE with their most valuable asset - their crew.</p>
          <a href="#get-started" className="btn btn-primary">Get Started Today</a>
          <a href="#demo" className="btn btn-outline">Request a Demo</a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Features;
