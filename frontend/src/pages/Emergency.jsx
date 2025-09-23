import React from 'react';
import { NavLink } from 'react-router-dom';
import './emergency.css';
import Header from '../components/Header';

function Emergency() {
  const onEmergencyClick = (e) => {
    e.preventDefault();
    alert('EMERGENCY ALERT ACTIVATED!\n\nYour location and emergency request have been sent to the bridge, ship medic, and telemedical assistance service.\n\nPlease proceed to the designated emergency station.');
  };

  return (
    <div className="emergency-page">
      <Header />

      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h2>Emergency Medical Guide</h2>
          <p>Critical information and procedures for medical emergencies at sea</p>
        </div>
      </section>

      {/* Emergency Alert */}
      <section className="emergency-alert">
        <div className="container">
          <div className="alert-content">
            <h3><i className="fas fa-exclamation-triangle" aria-hidden="true"></i> IN CASE OF EMERGENCY:</h3>
            <a href="#call" className="btn btn-emergency" onClick={onEmergencyClick}><i className="fas fa-phone-alt" aria-hidden="true"></i> CALL FOR HELP</a>
          </div>
        </div>
      </section>

      {/* Emergency Procedures */}
      <section className="emergency-procedures">
        <div className="container">
          <div className="section-title">
            <h2>Emergency Procedures</h2>
            <p>Follow these steps in case of a medical emergency onboard</p>
          </div>

          <div className="procedures-grid">
            <div className="procedure-card">
              <i className="fas fa-first-aid" aria-hidden="true"></i>
              <h3>Basic Life Support</h3>
              <ol className="step-list">
                <li>Check for responsiveness and breathing</li>
                <li>Call for help and activate emergency response</li>
                <li>Begin chest compressions (100-120 per minute)</li>
                <li>Provide rescue breaths if trained</li>
                <li>Continue until help arrives or person revives</li>
              </ol>
            </div>

            <div className="procedure-card">
              <i className="fas fa-tint" aria-hidden="true"></i>
              <h3>Severe Bleeding</h3>
              <ol className="step-list">
                <li>Apply direct pressure to the wound</li>
                <li>Elevate the injured area above heart level</li>
                <li>Use a tourniquet if bleeding doesn't stop</li>
                <li>Keep the victim warm and calm</li>
                <li>Monitor for signs of shock</li>
              </ol>
            </div>

            <div className="procedure-card">
              <i className="fas fa-burn" aria-hidden="true"></i>
              <h3>Burns</h3>
              <ol className="step-list">
                <li>Cool the burn with running water for 10+ minutes</li>
                <li>Remove jewelry or tight clothing</li>
                <li>Cover with sterile non-stick dressing</li>
                <li>Do not apply creams or break blisters</li>
                <li>Seek medical attention for serious burns</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* First Aid Guides */}
      <section className="first-aid">
        <div className="container">
          <div className="section-title">
            <h2>First Aid Guides</h2>
            <p>Step-by-step instructions for common medical situations</p>
          </div>

          <div className="aid-grid">
            <div className="aid-card">
              <div className="aid-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160557-22c4d2c4c6c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')" }}></div>
              <div className="aid-content">
                <h3>CPR for Adults</h3>
                <p>Learn the proper technique for cardiopulmonary resuscitation on adults in emergency situations.</p>
                <a href="#" className="read-more">View Guide <i className="fas fa-arrow-right" aria-hidden="true"></i></a>
              </div>
            </div>

            <div className="aid-card">
              <div className="aid-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')" }}></div>
              <div className="aid-content">
                <h3>Choking Response</h3>
                <p>How to perform the Heimlich maneuver and assist someone who is choking.</p>
                <a href="#" className="read-more">View Guide <i className="fas fa-arrow-right" aria-hidden="true"></i></a>
              </div>
            </div>

            <div className="aid-card">
              <div className="aid-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582719471384-8946dc3c9f44?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')" }}></div>
              <div className="aid-content">
                <h3>Fracture Management</h3>
                <p>How to stabilize fractures and sprains until professional medical help is available.</p>
                <a href="#" className="read-more">View Guide <i className="fas fa-arrow-right" aria-hidden="true"></i></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="emergency-contacts">
        <div className="container">
          <div className="section-title">
            <h2>Emergency Contacts</h2>
            <p>Critical contact information for emergency situations</p>
          </div>

          <div className="contacts-grid">
            <div className="contact-card">
              <i className="fas fa-ship" aria-hidden="true"></i>
              <h3>Onboard Medic</h3>
              <div className="contact-info">CABIN 104</div>
              <p>Direct line to the ship's medical officer</p>
            </div>

            <div className="contact-card">
              <i className="fas fa-bridge" aria-hidden="true"></i>
              <h3>Ship's Bridge</h3>
              <div className="contact-info">EXT. 111</div>
              <p>Contact the bridge for emergency coordination</p>
            </div>

            <div className="contact-card">
              <i className="fas fa-satellite" aria-hidden="true"></i>
              <h3>Telemedical Assistance</h3>
              <div className="contact-info">EXT. 911</div>
              <p>24/7 connection to medical professionals</p>
            </div>

            <div className="contact-card">
              <i className="fas fa-globe-americas" aria-hidden="true"></i>
              <h3>Coastal Radio</h3>
              <div className="contact-info">VHF CH 16</div>
              <p>International distress and calling channel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Kit */}
      <section className="emergency-kit">
        <div className="container">
          <div className="section-title">
            <h2>Emergency Medical Kit</h2>
            <p>Essential items that should be available in every ship's medical kit</p>
          </div>

          <div className="kit-content">
            <div className="kit-list">
              <h3>Recommended Supplies</h3>
              <ul>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Various sizes of sterile dressings and bandages</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Adhesive tape and hypoallergenic tape</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Sterile eye pads and eye wash solution</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Triangular bandages for slings</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Disposable gloves and CPR mask</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Tweezers, scissors, and safety pins</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Alcohol-free cleansing wipes</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Thermometer and blood pressure monitor</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Pain relievers and essential medications</li>
                <li><i className="fas fa-check-circle" aria-hidden="true"></i> Emergency blanket and instant cold packs</li>
              </ul>
            </div>
            <div className="kit-image">
              <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Emergency Medical Kit" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
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
                <li><NavLink to="/" end>Home</NavLink></li>
                <li><NavLink to="/features">Features</NavLink></li>
                <li><NavLink to="/health-library">Health Library</NavLink></li>
                <li><NavLink to="/emergency">Emergency Guide</NavLink></li>
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

export default Emergency;
