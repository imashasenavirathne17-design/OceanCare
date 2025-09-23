import React, { useState } from 'react';
import './contact.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.id]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const { name, email, subject, message } = form;
    if (!name || !email || !subject || !message) {
      alert('Please fill in all required fields.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    alert('Thank you for your message! We will get back to you within 24 hours.');
    setForm({ name: '', email: '', company: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page">
      <Header />

      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h2>Contact OCEANCARE</h2>
          <p>Get in touch with our team for questions, support, or partnership opportunities</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact">
        <div className="container">
          <div className="section-title">
            <h2>Get In Touch</h2>
            <p>We're here to answer any questions you may have about our maritime health solutions</p>
          </div>

          <div className="contact-content">
            <div className="contact-info">
              <div className="info-card">
                <h3><i className="fas fa-map-marker-alt" aria-hidden="true"></i> Our Headquarters</h3>
                <div className="info-item">
                  <i className="fas fa-building" aria-hidden="true"></i>
                  <div className="info-details">
                    <h4>Main Office</h4>
                    <p>123 Maritime Avenue, Ocean City, OC 12345</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                  <div className="info-details">
                    <h4>Business Hours</h4>
                    <p>Monday - Friday: 8:00 AM - 6:00 PM GMT</p>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3><i className="fas fa-phone-alt" aria-hidden="true"></i> Contact Information</h3>
                <div className="info-item">
                  <i className="fas fa-phone" aria-hidden="true"></i>
                  <div className="info-details">
                    <h4>Phone</h4>
                    <p>+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-envelope" aria-hidden="true"></i>
                  <div className="info-details">
                    <h4>Email</h4>
                    <p>info@oceancare.com</p>
                  </div>
                </div>
                <div className="info-item">
                  <i className="fas fa-headset" aria-hidden="true"></i>
                  <div className="info-details">
                    <h4>Support</h4>
                    <p>support@oceancare.com</p>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3><i className="fas fa-share-alt" aria-hidden="true"></i> Follow Us</h3>
                <div className="social-links">
                  <a href="#"><i className="fab fa-facebook-f" aria-hidden="true"></i></a>
                  <a href="#"><i className="fab fa-twitter" aria-hidden="true"></i></a>
                  <a href="#"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
                  <a href="#"><i className="fab fa-instagram" aria-hidden="true"></i></a>
                  <a href="#"><i className="fab fa-youtube" aria-hidden="true"></i></a>
                </div>
              </div>
            </div>

            <div className="contact-form">
              <h3>Send Us a Message</h3>
              <form onSubmit={onSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input id="name" type="text" className="form-control" placeholder="Your name" value={form.name} onChange={onChange} required />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input id="email" type="email" className="form-control" placeholder="Your email" value={form.email} onChange={onChange} required />
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company Name</label>
                  <input id="company" type="text" className="form-control" placeholder="Your company" value={form.company} onChange={onChange} />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <select id="subject" className="form-control" value={form.subject} onChange={onChange} required>
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="demo">Request a Demo</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" className="form-control" placeholder="Your message" value={form.message} onChange={onChange} required />
                </div>

                <button type="submit" className="submit-btn">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <div className="container">
          <div className="section-title">
            <h2>Frequently Asked Questions</h2>
            <p>Quick answers to common questions about OCEANCARE</p>
          </div>
          <div className="faq-grid">
            <div className="faq-item">
              <h3><i className="fas fa-question-circle" aria-hidden="true"></i> How do I request a demo?</h3>
              <p>You can request a demo by filling out the contact form, selecting "Request a Demo" as your subject. Our team will contact you within 24 hours to schedule a demonstration.</p>
            </div>
            <div className="faq-item">
              <h3><i className="fas fa-question-circle" aria-hidden="true"></i> What support do you offer?</h3>
              <p>We provide 24/7 technical support for all our clients. Our support team includes maritime medical professionals who can assist with both technical and medical inquiries.</p>
            </div>
            <div className="faq-item">
              <h3><i className="fas fa-question-circle" aria-hidden="true"></i> How long does implementation take?</h3>
              <p>Implementation typically takes 2-4 weeks, depending on the size of your fleet and specific requirements. We provide full training and support throughout the process.</p>
            </div>
            <div className="faq-item">
              <h3><i className="fas fa-question-circle" aria-hidden="true"></i> Is OCEANCARE compliant with regulations?</h3>
              <p>Yes, our system is designed to meet all international maritime health regulations, including ILO and IMO requirements for crew health monitoring and medical care.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Offices Section */}
      <section className="offices">
        <div className="container">
          <div className="section-title">
            <h2>Our Global Offices</h2>
            <p>OCEANCARE has a presence in major maritime hubs around the world</p>
          </div>

          <div className="offices-grid">
            <div className="office-card">
              <i className="fas fa-building" aria-hidden="true"></i>
              <h3>North America</h3>
              <p>123 Maritime Avenue</p>
              <p>Ocean City, OC 12345</p>
              <p>+1 (555) 123-4567</p>
            </div>
            <div className="office-card">
              <i className="fas fa-building" aria-hidden="true"></i>
              <h3>Europe</h3>
              <p>456 Harbor Road</p>
              <p>Rotterdam, Netherlands 3011</p>
              <p>+31 10 123 4567</p>
            </div>
            <div className="office-card">
              <i className="fas fa-building" aria-hidden="true"></i>
              <h3>Asia Pacific</h3>
              <p>789 Marina Bay</p>
              <p>Singapore 018956</p>
              <p>+65 6123 4567</p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="support">
        <div className="container">
          <div className="section-title">
            <h2>Support Options</h2>
            <p>Multiple ways to get help with OCEANCARE</p>
          </div>

          <div className="support-grid">
            <div className="support-card">
              <i className="fas fa-book" aria-hidden="true"></i>
              <h3>Knowledge Base</h3>
              <p>Browse our comprehensive documentation and FAQs</p>
              <a href="#" className="btn btn-primary">View Resources</a>
            </div>
            <div className="support-card">
              <i className="fas fa-users" aria-hidden="true"></i>
              <h3>Community Forum</h3>
              <p>Connect with other OCEANCARE users and experts</p>
              <a href="#" className="btn btn-primary">Join Discussion</a>
            </div>
            <div className="support-card">
              <i className="fas fa-headset" aria-hidden="true"></i>
              <h3>Live Support</h3>
              <p>Get immediate help from our technical support team</p>
              <a href="#" className="btn btn-primary">Chat Now</a>
            </div>
            <div className="support-card">
              <i className="fas fa-calendar-alt" aria-hidden="true"></i>
              <h3>Schedule Training</h3>
              <p>Request personalized training for your crew</p>
              <a href="#" className="btn btn-primary">Schedule Now</a>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <div className="container">
          <div className="section-title">
            <h2>Find Us</h2>
            <p>Visit our headquarters or regional offices</p>
          </div>
          <div className="map-container">
            <iframe title="map" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.00425872426992!3d40.75673897138909!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259acb2c9e85d%3A0x5f46e2dd9c2e74f8!2sSouth%20Street%20Seaport!5e0!3m2!1sen!2sus!4v1689879217294!5m2!1sen!2sus" allowFullScreen loading="lazy"></iframe>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Contact;
