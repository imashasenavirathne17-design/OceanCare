import React from 'react';
import './footer.css';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <h3>OCEANCARE</h3>
            <p>Comprehensive health tracking for maritime professionals, ensuring wellness and safety during voyages.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f" aria-hidden="true"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter" aria-hidden="true"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram" aria-hidden="true"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
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
  );
}
