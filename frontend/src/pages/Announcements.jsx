import React from 'react';
import './announcements.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const demoAnnouncements = [
  { id: 1, title: 'Telemedicine Upgrade', date: '2025-09-25', tag: 'Update', text: 'New telemedicine features will roll out next week with improved video stability.' },
  { id: 2, title: 'Safety Drill', date: '2025-09-26', tag: 'Safety', text: 'Ship-wide safety drill scheduled for Friday 10:00. Participation is mandatory.' },
  { id: 3, title: 'Maintenance Window', date: '2025-09-28', tag: 'Maintenance', text: 'System maintenance Sunday 02:00–03:00 UTC. Brief downtime expected.' },
];

function Announcements() {
  return (
    <div className="announcements-page">
      <Header />

      <section className="page-header">
        <div className="container">
          <h2>Announcements</h2>
          <p>Public notices and updates for all crew members and stakeholders</p>
        </div>
      </section>

      <section className="announcements-section">
        <div className="container">
          <div className="announcements-list">
            {demoAnnouncements.map((a) => (
              <article className="announcement-card" key={a.id}>
                <div className={`tag tag-${a.tag.toLowerCase()}`}>{a.tag}</div>
                <h3>{a.title}</h3>
                <div className="meta"><i className="far fa-calendar" aria-hidden="true"></i> {a.date}</div>
                <p>{a.text}</p>
                <a className="read-more" href="#">Read more <i className="fas fa-arrow-right" aria-hidden="true"></i></a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Announcements;
