import React, { useEffect, useMemo, useState } from 'react';
import './announcements.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { listAdminAnnouncements } from '../lib/adminAnnouncementApi';

const demoAnnouncements = [
  { id: 1, title: 'Telemedicine Upgrade', date: '2025-09-25', tag: 'Update', text: 'New telemedicine features will roll out next week with improved video stability.' },
  { id: 2, title: 'Safety Drill', date: '2025-09-26', tag: 'Safety', text: 'Ship-wide safety drill scheduled for Friday 10:00. Participation is mandatory.' },
  { id: 3, title: 'Maintenance Window', date: '2025-09-28', tag: 'Maintenance', text: 'System maintenance Sunday 02:00–03:00 UTC. Brief downtime expected.' },
];

function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Primary fetch: ask API for published
        let res = await listAdminAnnouncements({ status: 'published', sort: '-publishAt', limit: 50 });
        let list = Array.isArray(res.announcements) ? res.announcements : [];
        // Fallback: if empty, fetch all and filter client-side by status
        if (list.length === 0) {
          const resAll = await listAdminAnnouncements({ sort: '-publishAt', limit: 50 });
          list = (resAll.announcements || []).filter((a) => a.status === 'published');
        }
        // Do not strictly filter by time window to avoid TZ mismatches; just show published
        if (mounted) setItems(list);
      } catch (e) {
        console.error('Failed to fetch announcements, showing demo items.', e);
        if (mounted) {
          setError('Unable to load announcements. Showing demo items.');
          setItems([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const cards = useMemo(() => {
    if (items.length === 0) {
      return demoAnnouncements.map((d) => ({
        id: d.id,
        title: d.title,
        date: d.date,
        tag: d.tag,
        text: d.text
      }));
    }
    return items.map((a) => ({
      id: a._id,
      title: a.title,
      date: a.publishAt ? new Date(a.publishAt).toISOString().slice(0, 10) : '',
      tag: (a.tags && a.tags.length ? a.tags[0] : a.priority || 'Update'),
      text: a.message
    }));
  }, [items]);

  return (
    <div className="announcements-page">
      <Header />

      <section className="page-header">
        <div className="container">
          <h2>Announcements</h2>
          <p>Public notices and updates for all crew members and stakeholders</p>
          {loading && <small>Loading…</small>}
          {!loading && error && <small className="text-warning">{error}</small>}
        </div>
      </section>

      <section className="announcements-section">
        <div className="container">
          <div className="announcements-list">
            {cards.map((a) => {
              const tagKey = String(a.tag || 'Update').toLowerCase();
              return (
                <article className="announcement-card" key={a.id}>
                  <div className={`tag tag-${tagKey}`}>{a.tag}</div>
                  <h3>{a.title}</h3>
                  <div className="meta"><i className="far fa-calendar" aria-hidden="true"></i> {a.date}</div>
                  <p>{a.text}</p>
                  <a className="read-more" href="#">Read more <i className="fas fa-arrow-right" aria-hidden="true"></i></a>
                </article>
              );
            })}
            {!loading && cards.length === 0 && (
              <div className="empty">
                <p>No announcements available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Announcements;
