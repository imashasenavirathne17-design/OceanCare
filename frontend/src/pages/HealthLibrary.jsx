import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './healthLibrary.css';
import Header from '../components/Header';

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <i className={`fas ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true"></i>
      </button>
      <div className={open ? 'faq-answer active' : 'faq-answer'}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

function HealthLibrary() {
  return (
    <div className="healthlib-page">
      <Header />

      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h2>Maritime Health Library</h2>
          <p>Access comprehensive health resources, educational materials, and guides specifically designed for maritime professionals.</p>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-box">
            <input type="text" placeholder="Search health topics, articles, and resources..." aria-label="Search health library" />
            <button type="button"><i className="fas fa-search" aria-hidden="true"></i> Search</button>
          </div>
        </div>
      </section>

      {/* Health Topics */}
      <section className="health-topics">
        <div className="container">
          <div className="section-title">
            <h2>Health Topics</h2>
            <p>Explore our collection of health resources organized by topic</p>
          </div>

          <div className="topics-grid">
            <div className="topic-card">
              <i className="fas fa-heart" aria-hidden="true"></i>
              <h3>Cardiovascular Health</h3>
              <p>Learn how to maintain heart health during long voyages with limited mobility.</p>
            </div>

            <div className="topic-card">
              <i className="fas fa-brain" aria-hidden="true"></i>
              <h3>Mental Wellness</h3>
              <p>Resources for managing stress, isolation, and maintaining mental health at sea.</p>
            </div>

            <div className="topic-card">
              <i className="fas fa-bone" aria-hidden="true"></i>
              <h3>Musculoskeletal</h3>
              <p>Prevent and manage back pain, joint issues, and injuries common in maritime work.</p>
            </div>

            <div className="topic-card">
              <i className="fas fa-apple-alt" aria-hidden="true"></i>
              <h3>Nutrition at Sea</h3>
              <p>Healthy eating strategies with limited fresh food options on long voyages.</p>
            </div>

            <div className="topic-card">
              <i className="fas fa-first-aid" aria-hidden="true"></i>
              <h3>First Aid</h3>
              <p>Essential first aid procedures for common injuries and medical situations onboard.</p>
            </div>

            <div className="topic-card">
              <i className="fas fa-bed" aria-hidden="true"></i>
              <h3>Sleep & Fatigue</h3>
              <p>Manage shift work, improve sleep quality, and combat fatigue during long journeys.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="articles">
        <div className="container">
          <div className="section-title">
            <h2>Featured Articles</h2>
            <p>Latest health information and research relevant to maritime professionals</p>
          </div>

          <div className="articles-grid">
            <div className="article-card">
              <div className="article-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1659366100362-d4547c23ceeb?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170')" }}></div>
              <div className="article-content">
                <div className="article-meta">
                  <span><i className="far fa-calendar" aria-hidden="true"></i> June 15, 2023</span>
                  <span><i className="far fa-clock" aria-hidden="true"></i> 5 min read</span>
                </div>
                <h3>Managing Seasickness: Effective Strategies for Crew Members</h3>
                <p>Learn about prevention techniques and remedies for seasickness that actually work during rough weather conditions.</p>
                <a href="#" className="read-more">Read More <i className="fas fa-arrow-right" aria-hidden="true"></i></a>
              </div>
            </div>

            <div className="article-card">
              <div className="article-image" style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1670426501176-d772b7bcca4d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8aHlkcmF0aW9ufGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600')" }}></div>
              <div className="article-content">
                <div className="article-meta">
                  <span><i className="far fa-calendar" aria-hidden="true"></i> May 28, 2023</span>
                  <span><i className="far fa-clock" aria-hidden="true"></i> 7 min read</span>
                </div>
                <h3>Hydration Strategies for Tropical Voyages</h3>
                <p>Dehydration risks increase in warm climates. Discover how to maintain proper hydration during extended trips in tropical regions.</p>
                <a href="#" className="read-more">Read More <i className="fas fa-arrow-right" aria-hidden="true"></i></a>
              </div>
            </div>

            <div className="article-card">
              <div className="article-image" style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1681823529814-20ffe7df85f2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8SW5qdXJ5fGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600')" }}></div>
              <div className="article-content">
                <div className="article-meta">
                  <span><i className="far fa-calendar" aria-hidden="true"></i> May 10, 2023</span>
                  <span><i className="far fa-clock" aria-hidden="true"></i> 6 min read</span>
                </div>
                <h3>Ergonomic Practices for Reducing Injury Risk</h3>
                <p>Proper lifting techniques and workspace adjustments can significantly reduce musculoskeletal injuries onboard.</p>
                <a href="#" className="read-more">Read More <i className="fas fa-arrow-right" aria-hidden="true"></i></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How-To Guides */}
      <section className="guides">
        <div className="container">
          <div className="section-title">
            <h2>How-To Guides</h2>
            <p>Step-by-step instructions for common health procedures and equipment use</p>
          </div>

          <div className="guide">
            <div className="guide-content">
              <h3>How to Properly Use a Blood Pressure Monitor</h3>
              <p>Accurate blood pressure monitoring is essential for detecting hypertension early. Follow these steps for proper measurement:</p>
              <ol className="step-list">
                <li>Rest for at least 5 minutes before measuring</li>
                <li>Sit comfortably with your back supported and feet flat on the floor</li>
                <li>Position the cuff at heart level on your bare arm</li>
                <li>Remain still and quiet during the measurement</li>
                <li>Record your readings in the OCEANCARE app</li>
              </ol>
            </div>
            <div className="guide-image">
              <img src="https://images.unsplash.com/photo-1640249306698-28854d875b76?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YSUyMEJsb29kJTIwUHJlc3N1cmUlMjBNb25pdG9yfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600" alt="Blood Pressure Monitoring" />
            </div>
          </div>

          <div className="guide reverse">
            <div className="guide-content">
              <h3>How to Perform CPR on an Adult</h3>
              <p>In emergency situations, proper CPR can save lives. Follow these steps if you're trained in CPR:</p>
              <ol className="step-list">
                <li>Check for responsiveness and breathing</li>
                <li>Call for help and activate emergency response</li>
                <li>Place the heel of your hand on the center of the chest</li>
                <li>Perform chest compressions at 100-120 per minute</li>
                <li>Give rescue breaths if trained to do so</li>
                <li>Continue until help arrives or the person shows signs of life</li>
              </ol>
            </div>
            <div className="guide-image">
              <img src="https://media.istockphoto.com/id/174225235/photo/cpr-chest-compressions.webp?a=1&b=1&s=612x612&w=0&k=20&c=kYaFv5_p5tiV-DE6-Nt9Bdkrf0KrhfY0iVwi9VyEI4A=" alt="CPR Procedure" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="container">
          <div className="section-title">
            <h2>Frequently Asked Questions</h2>
            <p>Common questions about maritime health and using the OCEANCARE system</p>
          </div>

          <div className="faq-list">
            <FAQItem
              question="How often should crew members have health check-ups?"
              answer="The frequency of health check-ups depends on age, existing health conditions, and voyage length. Generally, we recommend a comprehensive check-up before long voyages and at least annually for all crew members. Those with pre-existing conditions may need more frequent monitoring."
            />
            <FAQItem
              question="What vaccinations are recommended for maritime workers?"
              answer="Routine vaccinations include MMR, tetanus, diphtheria, and pertussis. Depending on destinations, hepatitis A and B, typhoid, yellow fever, and influenza may be recommended. Consult a maritime medicine specialist for itinerary-specific guidance."
            />
            <FAQItem
              question="How can I access telemedicine services while at sea?"
              answer="Use the OCEANCARE app or web portal when you have satellite internet. Navigate to Telemedicine and request a consultation. You'll be connected with an available specialist."
            />
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
                <li><Link to="/">Home</Link></li>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/health-library">Health Library</Link></li>
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

export default HealthLibrary;
