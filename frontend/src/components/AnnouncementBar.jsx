import React, { useState } from 'react';
import './announcements.css';

function AnnouncementBar({ items = [] }) {
  const [hidden, setHidden] = useState(false);
  if (hidden || items.length === 0) return null;

  return (
    <div className="announcement-bar" role="region" aria-label="Announcements">
      <div className="container">
        <div className="announcement-content">
          <i className="fas fa-bullhorn" aria-hidden="true"></i>
          <div className="announcement-items">
            {items.map((it, idx) => (
              <div key={idx} className="announcement-item">
                {it.link ? (
                  <a href={it.link} target={it.external ? '_blank' : undefined} rel={it.external ? 'noopener noreferrer' : undefined}>
                    {it.text}
                  </a>
                ) : (
                  <span>{it.text}</span>
                )}
              </div>
            ))}
          </div>
          <button className="announcement-close" aria-label="Dismiss announcements" onClick={() => setHidden(true)}>
            <i className="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementBar;
