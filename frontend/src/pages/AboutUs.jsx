import React from 'react';
import './about.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

function AboutUs() {
  return (
    <div className="about-page">
      <Header />

      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h2>About OCEANCARE</h2>
          <p>Dedicated to improving the health and wellbeing of maritime professionals worldwide</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission">
        <div className="container">
          <div className="section-title">
            <h2>Our Mission</h2>
            <p>We're committed to transforming maritime healthcare through innovation and technology</p>
          </div>

          <div className="mission-content">
            <div className="mission-text">
              <h3>Protecting Those Who Work at Sea</h3>
              <p>OCEANCARE was founded in 2018 by a team of maritime medical professionals and technology experts who recognized the unique health challenges faced by seafarers. With millions of people working aboard ships worldwide, we saw a critical need for specialized health solutions.</p>
              <p>Our mission is to ensure that every maritime professional has access to quality healthcare resources, regardless of their location at sea. We combine medical expertise with cutting-edge technology to create comprehensive health management solutions tailored to the maritime environment.</p>
              <p>Today, OCEANCARE serves over 200 shipping companies and protects the health of more than 50,000 seafarers across the globe. Our systems are designed to meet international maritime health regulations while providing compassionate care to those who spend their lives at sea.</p>
            </div>
            <div className="mission-image">
              <img src="https://images.unsplash.com/photo-1467810563316-b5476525c0f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="OCEANCARE Mission" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values">
        <div className="container">
          <div className="section-title">
            <h2>Our Values</h2>
            <p>The principles that guide everything we do at OCEANCARE</p>
          </div>

          <div className="values-grid">
            <div className="value-card">
              <i className="fas fa-shield-alt" aria-hidden="true"></i>
              <h3>Safety First</h3>
              <p>The wellbeing of maritime professionals is our highest priority. We design all our systems with safety as the foundational principle.</p>
            </div>

            <div className="value-card">
              <i className="fas fa-lightbulb" aria-hidden="true"></i>
              <h3>Innovation</h3>
              <p>We continuously explore new technologies and approaches to solve the unique health challenges of the maritime industry.</p>
            </div>

            <div className="value-card">
              <i className="fas fa-hand-holding-heart" aria-hidden="true"></i>
              <h3>Compassion</h3>
              <p>We understand the difficulties of life at sea and approach every solution with empathy and understanding.</p>
            </div>

            <div className="value-card">
              <i className="fas fa-globe" aria-hidden="true"></i>
              <h3>Global Reach</h3>
              <p>We're committed to making quality maritime healthcare accessible to all seafarers, regardless of location or flag.</p>
            </div>

            <div className="value-card">
              <i className="fas fa-users" aria-hidden="true"></i>
              <h3>Collaboration</h3>
              <p>We work closely with shipping companies, medical professionals, and maritime organizations to develop the best solutions.</p>
            </div>

            <div className="value-card">
              <i className="fas fa-lock" aria-hidden="true"></i>
              <h3>Privacy</h3>
              <p>We maintain the highest standards of data security and medical confidentiality for all our users.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team">
        <div className="container">
          <div className="section-title">
            <h2>Our Leadership Team</h2>
            <p>Experienced professionals dedicated to maritime health</p>
          </div>

          <div className="team-grid">
            <div className="team-member">
              <div className="member-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')" }}></div>
              <div className="member-info">
                <h3>Dr. Sarah Chen</h3>
                <div className="member-role">Chief Medical Officer</div>
                <p>Former WHO public health specialist with 15 years of experience in maritime medicine.</p>
                <div className="social-links">
                  <a href="#"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
                  <a href="#"><i className="fab fa-twitter" aria-hidden="true"></i></a>
                </div>
              </div>
            </div>

            <div className="team-member">
              <div className="member-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')" }}></div>
              <div className="member-info">
                <h3>Michael Robertson</h3>
                <div className="member-role">CEO & Founder</div>
                <p>Maritime technology entrepreneur with a background in naval engineering.</p>
                <div className="social-links">
                  <a href="#"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
                  <a href="#"><i className="fab fa-twitter" aria-hidden="true"></i></a>
                </div>
              </div>
            </div>

            <div className="team-member">
              <div className="member-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')" }}></div>
              <div className="member-info">
                <h3>Elena Rodriguez</h3>
                <div className="member-role">Head of Technology</div>
                <p>Software engineer specializing in health informatics and remote monitoring systems.</p>
                <div className="social-links">
                  <a href="#"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
                  <a href="#"><i className="fab fa-twitter" aria-hidden="true"></i></a>
                </div>
              </div>
            </div>

            <div className="team-member">
              <div className="member-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')" }}></div>
              <div className="member-info">
                <h3>Captain James Wilson</h3>
                <div className="member-role">Maritime Operations</div>
                <p>Former container ship captain with 25 years of experience in international shipping.</p>
                <div className="social-links">
                  <a href="#"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
                  <a href="#"><i className="fab fa-twitter" aria-hidden="true"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story">
        <div className="container">
          <div className="section-title">
            <h2>Our Story</h2>
            <p>The journey of OCEANCARE from concept to industry leader</p>
          </div>

          <div className="timeline">
            {[
              { date: '2018', title: 'Foundation', text: 'OCEANCARE was founded by Michael Robertson after witnessing the medical challenges faced by crew members during his years in the shipping industry.' },
              { date: '2019', title: 'First Prototype', text: 'Developed our first health monitoring system prototype and conducted trials with two partner shipping companies.' },
              { date: '2020', title: 'COVID-19 Response', text: 'Rapidly adapted our technology to help ships manage pandemic-related health challenges, adding remote diagnosis features.' },
              { date: '2021', title: 'Series A Funding', text: 'Secured $8M in funding to expand our technology platform and grow our team of maritime health specialists.' },
              { date: '2022', title: 'International Expansion', text: 'Launched services in Asia and Europe, partnering with major port medical facilities in 12 countries.' },
              { date: '2023', title: 'AI Integration', text: 'Implemented artificial intelligence for predictive health analytics and early warning systems for crew health issues.' },
            ].map((item, idx) => (
              <div className="timeline-item" key={idx}>
                <div className="timeline-content">
                  <div className="timeline-date">{item.date}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="partners">
        <div className="container">
          <div className="section-title">
            <h2>Our Partners</h2>
            <p>Working with leading organizations in maritime and healthcare</p>
          </div>

          <div className="partners-grid">
            <div className="partner-logo">
              <img src="https://via.placeholder.com/150x80/1a4b8c/ffffff?text=IMO" alt="International Maritime Organization" />
            </div>
            <div className="partner-logo">
              <img src="https://via.placeholder.com/150x80/2a9d8f/ffffff?text=WHO" alt="World Health Organization" />
            </div>
            <div className="partner-logo">
              <img src="https://via.placeholder.com/150x80/1a4b8c/ffffff?text=MAERSK" alt="Maersk" />
            </div>
            <div className="partner-logo">
              <img src="https://via.placeholder.com/150x80/2a9d8f/ffffff?text=MSC" alt="Mediterranean Shipping Company" />
            </div>
            <div className="partner-logo">
              <img src="https://via.placeholder.com/150x80/1a4b8c/ffffff?text=MITAG" alt="Maritime Health Research" />
            </div>
            <div className="partner-logo">
              <img src="https://via.placeholder.com/150x80/2a9d8f/ffffff?text=Telemed" alt="Telemedicine Association" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Join the OCEANCARE Community</h2>
          <p>Become part of the movement to improve maritime health and safety standards worldwide</p>
          <a href="#contact" className="btn btn-primary">Contact Us</a>
          <a href="#demo" className="btn btn-outline">Request a Demo</a>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default AboutUs;
