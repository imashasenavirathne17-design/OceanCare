import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewHealthEducation() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };

  const educationContent = useMemo(() => ([
    {
      id: 1,
      category: 'hygiene',
      title: 'Food Safety at Sea',
      description: 'Best practices for food handling, storage, and preparation to prevent foodborne illnesses onboard.',
      icon: 'fas fa-utensils',
      content: `
        <h3>Food Safety Guidelines</h3>
        <p>Proper food handling is crucial to prevent foodborne illnesses, especially in the confined environment of a ship.</p>
        <h3>Key Principles</h3>
        <ul>
          <li>Always wash hands thoroughly before handling food</li>
          <li>Keep raw and cooked foods separate</li>
          <li>Cook foods to proper temperatures</li>
          <li>Store foods at correct temperatures</li>
          <li>Use safe water and raw materials</li>
        </ul>
        <h3>Temperature Control</h3>
        <p>Keep refrigerators below 5°C (41°F) and freezers below -18°C (0°F). Hot foods should be kept above 60°C (140°F).</p>
        <h3>Personal Hygiene</h3>
        <p>Food handlers should maintain high standards of personal cleanliness and wear appropriate protective clothing.</p>
      `,
      date: '2025-09-15',
      duration: '5 min read'
    },
    {
      id: 2,
      category: 'prevention',
      title: 'Preventing Sea Sickness',
      description: 'Effective strategies and remedies to manage and prevent motion sickness while at sea.',
      icon: 'fas fa-head-side-mask',
      content: `
        <h3>Understanding Sea Sickness</h3>
        <p>Motion sickness occurs when there\'s a conflict between what your eyes see and what your inner ears sense.</p>
        <h3>Prevention Tips</h3>
        <ul>
          <li>Choose a cabin in the middle of the ship where motion is less pronounced</li>
          <li>Keep your eyes on the horizon when on deck</li>
          <li>Avoid heavy meals before traveling</li>
          <li>Stay hydrated but avoid alcohol</li>
          <li>Get plenty of fresh air</li>
        </ul>
        <h3>Remedies</h3>
        <p>Over-the-counter medications like dimenhydrinate or meclizine can be effective. Natural remedies include ginger and acupressure wristbands.</p>
        <h3>When to Seek Help</h3>
        <p>If symptoms persist for more than 48 hours or include severe dehydration, consult the Health Officer.</p>
      `,
      date: '2025-10-01',
      duration: '4 min read'
    },
    {
      id: 3,
      category: 'first-aid',
      title: 'Basic First Aid Procedures',
      description: 'Essential first aid knowledge for common injuries and emergencies that may occur at sea.',
      icon: 'fas fa-hand-holding-medical',
      content: `
        <h3>Emergency Response Basics</h3>
        <p>In any emergency, remember the three C\'s: Check, Call, Care.</p>
        <h3>Common Maritime Injuries</h3>
        <ul>
          <li><strong>Cuts and wounds:</strong> Clean with soap and water, apply pressure to stop bleeding</li>
          <li><strong>Burns:</strong> Cool with running water for 10-20 minutes</li>
          <li><strong>Fractures:</strong> Immobilize the injury and seek medical attention</li>
          <li><strong>Heat exhaustion:</strong> Move to cool area, hydrate, and rest</li>
        </ul>
        <h3>CPR Basics</h3>
        <p>If someone is unresponsive and not breathing normally, begin CPR with 30 chest compressions followed by 2 rescue breaths.</p>
        <h3>Emergency Equipment</h3>
        <p>Familiarize yourself with the location of first aid kits, AEDs, and emergency communication devices onboard.</p>
      `,
      date: '2025-09-20',
      duration: '7 min read'
    },
    {
      id: 4,
      category: 'mental-health',
      title: 'Managing Stress at Sea',
      description: 'Strategies to maintain mental wellbeing during long voyages and isolated periods.',
      icon: 'fas fa-brain',
      content: `
        <h3>Understanding Maritime Stress</h3>
        <p>Working at sea presents unique challenges including isolation, confined spaces, and separation from family.</p>
        <h3>Coping Strategies</h3>
        <ul>
          <li>Maintain a routine with regular sleep patterns</li>
          <li>Stay connected with loved ones through available communication</li>
          <li>Engage in physical activity regularly</li>
          <li>Practice relaxation techniques like deep breathing</li>
          <li>Take breaks and use leisure time effectively</li>
        </ul>
        <h3>Building Resilience</h3>
        <p>Develop a positive mindset, focus on what you can control, and build strong relationships with crewmates.</p>
        <h3>When to Seek Help</h3>
        <p>If you\'re experiencing persistent sadness, anxiety, or changes in sleep/appetite, don\'t hesitate to speak with the Health Officer.</p>
      `,
      date: '2025-10-05',
      duration: '6 min read'
    },
    {
      id: 5,
      category: 'nutrition',
      title: 'Healthy Eating Onboard',
      description: 'Nutrition guidelines to maintain energy and health during maritime assignments.',
      icon: 'fas fa-apple-alt',
      content: `
        <h3>Balanced Nutrition at Sea</h3>
        <p>Proper nutrition is essential for maintaining energy levels and overall health during long voyages.</p>
        <h3>Key Nutritional Principles</h3>
        <ul>
          <li>Eat a variety of foods from all food groups</li>
          <li>Stay hydrated with water, limiting sugary drinks</li>
          <li>Include protein with each meal for sustained energy</li>
          <li>Choose whole grains over refined carbohydrates</li>
          <li>Incorporate fruits and vegetables daily</li>
        </ul>
        <h3>Meal Planning Tips</h3>
        <p>When possible, participate in meal planning to ensure variety and nutritional balance in ship menus.</p>
        <h3>Special Considerations</h3>
        <p>Account for increased calorie needs during physically demanding tasks and adjust intake during less active periods.</p>
      `,
      date: '2025-09-25',
      duration: '5 min read'
    },
    {
      id: 6,
      category: 'fitness',
      title: 'Staying Active Onboard',
      description: 'Exercise routines and activities suitable for the limited space available on ships.',
      icon: 'fas fa-running',
      content: `
        <h3>Importance of Physical Activity</h3>
        <p>Regular exercise helps maintain physical health, reduces stress, and improves sleep quality.</p>
        <h3>Ship-Friendly Exercises</h3>
        <ul>
          <li>Bodyweight exercises: push-ups, squats, lunges</li>
          <li>Resistance bands for strength training</li>
          <li>Yoga and stretching for flexibility</li>
          <li>Deck walking or running when conditions allow</li>
          <li>Jump rope for cardiovascular fitness</li>
        </ul>
        <h3>Creating a Routine</h3>
        <p>Aim for at least 30 minutes of moderate activity most days. Break it into shorter sessions if needed.</p>
        <h3>Safety Considerations</h3>
        <p>Be mindful of ship movement during exercise. Use appropriate footwear and ensure adequate space for safe movement.</p>
      `,
      date: '2025-10-10',
      duration: '4 min read'
    }
  ]), []);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const categories = [
    { key: 'all', label: 'All Topics' },
    { key: 'hygiene', label: 'Hygiene' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'first-aid', label: 'First Aid' },
    { key: 'mental-health', label: 'Mental Health' },
    { key: 'prevention', label: 'Disease Prevention' },
    { key: 'fitness', label: 'Fitness' },
  ];

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return educationContent
      .filter(item => (category === 'all' ? true : item.category === category))
      .filter(item =>
        term === ''
          ? true
          : item.title.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term)
      );
  }, [educationContent, search, category]);

  const openModal = (id) => {
    const content = educationContent.find((i) => i.id === id);
    if (content) { setSelected(content); setModalOpen(true); }
  };

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <CrewSidebar onLogout={onLogout} />

        {/* Main Content */}
        <main className="main-content">
          <div className="dash-header">
            <h2>Health Education Resources</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="education-container" style={{ background: '#fff', borderRadius: 10, boxShadow: '0 5px 15px rgba(0,0,0,0.05)', padding: 30, marginBottom: 30 }}>
            <h3 className="form-title" style={{ fontSize: 24, marginBottom: 25, color: 'var(--primary)' }}>Health &amp; Wellness Resources</h3>

            <div className="search-bar" style={{ display: 'flex', marginBottom: 25 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics (e.g., food safety, sea sickness, first aid)"
                style={{ flex: 1, padding: '12px 15px', border: '1px solid #ddd', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '1rem' }}
              />
              <button className="btn btn-primary" onClick={() => { /* search handled live */ }} style={{ borderRadius: '0 8px 8px 0' }}>
                <i className="fas fa-search"></i>
              </button>
            </div>

            <div className="category-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 25 }}>
              {categories.map((c) => (
                <button
                  key={c.key}
                  className={`category-filter ${category === c.key ? 'active' : ''}`}
                  onClick={() => setCategory(c.key)}
                  style={{ padding: '8px 15px', borderRadius: 20, cursor: 'pointer', border: 'none', background: category === c.key ? 'var(--primary)' : '#f8f9fa', color: category === c.key ? '#fff' : 'inherit', transition: 'all .3s' }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="education-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 25 }}>
              {list.map((item) => (
                <div key={item.id} className="education-card" style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', transition: 'transform .3s, box-shadow .3s' }}>
                  <div className="education-image" style={{ height: 160, backgroundColor: '#f0f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: 50 }}>
                    <i className={item.icon}></i>
                  </div>
                  <div className="education-content" style={{ padding: 20 }}>
                    <div className="education-category" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>{item.category.replace('-', ' ')}</div>
                    <div className="education-title" style={{ fontWeight: 600, marginBottom: 10, fontSize: 18 }}>{item.title}</div>
                    <div className="education-desc" style={{ fontSize: 14, color: '#777', marginBottom: 15, lineHeight: 1.5 }}>{item.description}</div>
                    <div className="education-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 15 }}>
                      <span>{item.date}</span>
                      <span>{item.duration}</span>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal(item.id)}>Read More</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Education Modal */}
      {modalOpen && selected && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selected.title}</h3>
              <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-image" style={{ height: 200, backgroundColor: '#f0f8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: 60, marginBottom: 20, borderRadius: 8 }}>
              <i className={selected.icon}></i>
            </div>
            <div className="modal-content-text" dangerouslySetInnerHTML={{ __html: selected.content }} />
            <div style={{ marginTop: 25, textAlign: 'center' }}>
              <button className="btn" onClick={() => setModalOpen(false)} style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}>Close</button>
              <button className="btn btn-primary" style={{ marginLeft: 10 }} onClick={() => alert('Downloading resource...')}>
                <i className="fas fa-download"></i> Download Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
