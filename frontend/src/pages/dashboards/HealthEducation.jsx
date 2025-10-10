import React, { useMemo, useState } from 'react';
import './healthEducation.css';
import HealthSidebar from './HealthSidebar';
import { getUser, clearSession } from '../../lib/token';
import { useNavigate } from 'react-router-dom';

export default function HealthEducation() {
  const user = getUser();
  const navigate = useNavigate();

  // Tabs
  const [activeTab, setActiveTab] = useState('published');
  // Category filters (demo only)
  const categories = ['All Topics', 'Hygiene', 'Nutrition', 'First Aid', 'Mental Wellness', 'Chronic Conditions', 'Preventive Care'];
  const [activeCategory, setActiveCategory] = useState('All Topics');

  // Modals
  const [modal, setModal] = useState({ newContent: false, newCampaign: false });
  const openModal = (k) => setModal((m) => ({ ...m, [k]: true }));
  const closeModal = (k) => setModal((m) => ({ ...m, [k]: false }));

  // Form state
  const [form, setForm] = useState({ title: '', category: '', status: 'draft', publishDate: '', summary: '', body: '', tags: '' });
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.id]: e.target.value }));
  const saveContent = (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.summary || !form.body) return alert('Please fill in all required fields.');
    alert(`"${form.title}" has been saved as ${form.status}!`);
    setForm({ title: '', category: '', status: 'draft', publishDate: '', summary: '', body: '', tags: '' });
    closeModal('newContent');
  };

  const analytics = useMemo(() => ([
    { value: '24', label: 'Published Articles' },
    { value: '1,248', label: 'Total Views' },
    { value: '5', label: 'Drafts' },
    { value: '87%', label: 'Crew Engagement' },
  ]), []);

  const publishedCards = [
    { id: 1, title: 'Hand Hygiene Best Practices', category: 'Hygiene', icon: 'fas fa-hands-wash', featured: true, views: 245, likes: 34, shares: 12, date: '2023-10-15', desc: 'Comprehensive guide to proper hand washing techniques and importance of hand hygiene in preventing illness onboard.' },
    { id: 2, title: 'Healthy Eating at Sea', category: 'Nutrition', icon: 'fas fa-apple-alt', views: 189, likes: 28, shares: 7, date: '2023-10-08', desc: 'Nutritional guidelines and meal planning tips for maintaining a balanced diet during long voyages.' },
    { id: 3, title: 'Managing Stress on Long Voyages', category: 'Mental Wellness', icon: 'fas fa-brain', views: 312, likes: 45, shares: 19, date: '2023-10-01', desc: 'Strategies for coping with stress, anxiety, and homesickness while working at sea for extended periods.' },
    { id: 4, title: 'Basic First Aid for Common Injuries', category: 'First Aid', icon: 'fas fa-first-aid', views: 278, likes: 39, shares: 14, date: '2023-09-24', desc: 'Step-by-step instructions for treating cuts, burns, sprains, and other common injuries that may occur onboard.' },
    { id: 5, title: 'Diabetes Management at Sea', category: 'Chronic Conditions', icon: 'fas fa-vial', views: 156, likes: 22, shares: 8, date: '2023-09-18', desc: 'Guidance for crew members with diabetes on managing blood sugar levels, medication, and diet while working onboard.' },
    { id: 6, title: 'Preventing Seasickness', category: 'Preventive Care', icon: 'fas fa-ship', views: 198, likes: 31, shares: 11, date: '2023-09-12', desc: 'Tips and techniques for preventing and managing seasickness, including dietary recommendations and acupressure points.' },
  ];

  const draftCards = [
    { id: 7, title: 'Sleep Hygiene for Shift Workers', category: 'Mental Wellness', icon: 'fas fa-bed', edited: '2023-10-20', desc: 'Strategies for improving sleep quality while working irregular shifts at sea. Currently in development.' },
    { id: 8, title: 'Hydration in Hot Climates', category: 'Preventive Care', icon: 'fas fa-tint', edited: '2023-10-18', desc: 'Importance of proper hydration and electrolyte balance when working in tropical environments. Outline completed.' },
  ];

  const scheduledCards = [
    { id: 9, title: 'Winter Health Preparedness', category: 'Preventive Care', icon: 'fas fa-snowflake', date: '2023-11-15', desc: 'Preparing for cold weather operations: preventing hypothermia, frostbite, and seasonal illnesses.' },
    { id: 10, title: 'Flu Season Prevention Guide', category: 'Preventive Care', icon: 'fas fa-head-side-cough', date: '2023-12-01', desc: 'Comprehensive guide to preventing influenza spread in confined ship environments during flu season.' },
  ];

  const filterByCategory = (list) => activeCategory === 'All Topics' ? list : list.filter((c) => c.category === activeCategory);

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={() => { clearSession(); navigate('/login'); }} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Health Education Content</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Overview */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Health Education Dashboard</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-chart-bar"></i> View Analytics</button>
                <button className="btn btn-education" onClick={() => openModal('newContent')}><i className="fas fa-plus"></i> Create Content</button>
              </div>
            </div>

            <div className="analytics-container">
              {analytics.map((a, i) => (
                <div key={i} className="analytics-item">
                  <div className="analytics-value">{a.value}</div>
                  <div className="analytics-label">{a.label}</div>
                </div>
              ))}
            </div>

            <div className="categories-container">
              {categories.map((c) => (
                <div key={c} className={`category-filter ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>{c}</div>
              ))}
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Health Education Management</div>
            </div>

            <div className="tabs">
              {['published','drafts','scheduled','campaigns'].map((t) => (
                <div key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)} data-tab={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
              ))}
            </div>

            {/* Published */}
            {activeTab === 'published' && (
              <div className="tab-content active" id="published-tab">
                <div className="cards-container">
                  {filterByCategory(publishedCards).map((c) => (
                    <div key={c.id} className={`card ${c.featured ? 'featured' : ''}`}>
                      <div className="card-header">
                        <div>
                          <div className="card-title">{c.title}</div>
                          <span className="card-category">{c.category}</span>
                        </div>
                        <div className={`card-icon ${c.featured ? 'primary' : 'education'}`}>
                          <i className={c.icon}></i>
                        </div>
                      </div>
                      <div className="card-content">
                        <div className="card-description">{c.desc}</div>
                        <div className="card-stats">
                          <div className="stat"><i className="fas fa-eye"></i> {c.views} views</div>
                          <div className="stat"><i className="fas fa-heart"></i> {c.likes} likes</div>
                          <div className="stat"><i className="fas fa-share"></i> {c.shares} shares</div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <div className="card-date">Published: {c.date}</div>
                        <div className="card-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`Viewing content ${c.id}`)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`Editing content ${c.id}`)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`Analytics for ${c.id}`)}>Analytics</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drafts */}
            {activeTab === 'drafts' && (
              <div className="tab-content active" id="drafts-tab">
                <div className="cards-container">
                  {filterByCategory(draftCards).map((c) => (
                    <div key={c.id} className="card draft">
                      <div className="card-header">
                        <div>
                          <div className="card-title">{c.title}</div>
                          <span className="card-category">{c.category}</span>
                        </div>
                        <div className="card-icon warning"><i className={c.icon}></i></div>
                      </div>
                      <div className="card-content"><div className="card-description">{c.desc}</div></div>
                      <div className="card-footer">
                        <div className="card-date">Last edited: {c.edited}</div>
                        <div className="card-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`Editing ${c.id}`)}>Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`Publishing ${c.id}`)}>Publish</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 30 }}>
                  <button className="btn btn-education" onClick={() => openModal('newContent')}><i className="fas fa-plus"></i> Create New Draft</button>
                </div>
              </div>
            )}

            {/* Scheduled */}
            {activeTab === 'scheduled' && (
              <div className="tab-content active" id="scheduled-tab">
                <div className="cards-container">
                  {filterByCategory(scheduledCards).map((c) => (
                    <div key={c.id} className="card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">{c.title}</div>
                          <span className="card-category">{c.category}</span>
                        </div>
                        <div className="card-icon education"><i className={c.icon}></i></div>
                      </div>
                      <div className="card-content"><div className="card-description">{c.desc}</div></div>
                      <div className="card-footer">
                        <div className="card-date">Scheduled: {c.date}</div>
                        <div className="card-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`Viewing ${c.id}`)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`Reschedule ${c.id}`)}>Reschedule</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campaigns */}
            {activeTab === 'campaigns' && (
              <div className="tab-content active" id="campaigns-tab">
                <div className="page-header">
                  <div className="page-title">Health Education Campaigns</div>
                  <div className="page-actions">
                    <button className="btn btn-education" onClick={() => setModal(m => ({ ...m, newCampaign: true }))}><i className="fas fa-plus"></i> New Campaign</button>
                  </div>
                </div>
                <div className="cards-container">
                  {[{ id: 1, title: 'Mental Health Awareness Month', icon: 'fas fa-brain', desc: 'Month-long campaign focusing on mental wellness, stress management, and reducing stigma around mental health issues.', date: 'Status: Active' }, { id: 2, title: 'Healthy Heart Initiative', icon: 'fas fa-heart', desc: 'Cardiovascular health education focusing on exercise, nutrition, and risk factor management for crew members.', date: 'Status: Completed' }].map((c, i) => (
                    <div key={i} className={`card ${i === 0 ? 'featured' : ''}`}>
                      <div className="card-header">
                        <div><div className="card-title">{c.title}</div><span className="card-category">Campaign</span></div>
                        <div className={`card-icon ${i === 0 ? 'primary' : 'education'}`}><i className={c.icon}></i></div>
                      </div>
                      <div className="card-content">
                        <div className="card-description">{c.desc}</div>
                        <div className="card-stats">
                          {i === 0 ? (
                            <div className="stat"><i className="fas fa-calendar"></i> Oct 1-31, 2023</div>
                          ) : (
                            <div className="stat"><i className="fas fa-calendar"></i> Sep 15-30, 2023</div>
                          )}
                          <div className="stat"><i className="fas fa-users"></i> {i === 0 ? '89% participation' : '76% participation'}</div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <div className="card-date">{c.date}</div>
                        <div className="card-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`View campaign ${c.id}`)}>View</button>
                          <button className="btn btn-outline btn-sm" onClick={() => alert(`${i === 0 ? 'Manage' : 'Results'} for ${c.id}`)}>{i === 0 ? 'Manage' : 'Results'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="page-content">
            <div className="page-header"><div className="page-title">Featured Content Preview</div></div>
            <div className="preview-container">
              <div className="preview-header">
                <div className="preview-title">Hand Hygiene Best Practices</div>
                <div className="preview-meta">Published on October 15, 2023 | 245 views | 34 likes</div>
              </div>
              <div className="preview-image"><i className="fas fa-hands-wash" style={{ fontSize: 48 }}></i></div>
              <div className="preview-content">
                <p>Proper hand hygiene is one of the most effective ways to prevent the spread of infections onboard ships. With crew members living and working in close quarters, maintaining good hand hygiene practices is essential for everyone's health.</p>
                <h3>When to Wash Your Hands</h3>
                <ul>
                  <li>Before and after handling food</li>
                  <li>After using the restroom</li>
                  <li>After coughing, sneezing, or blowing your nose</li>
                  <li>After handling garbage</li>
                  <li>Before and after treating wounds or caring for sick individuals</li>
                  <li>After touching common surfaces</li>
                </ul>
                <h3>Proper Hand Washing Technique</h3>
                <ol>
                  <li>Wet hands with clean, running water</li>
                  <li>Apply soap and lather well</li>
                  <li>Rub hands together for at least 20 seconds</li>
                  <li>Scrub all surfaces: palms, backs, between fingers, under nails</li>
                  <li>Rinse thoroughly under running water</li>
                  <li>Dry hands using a clean towel or air dryer</li>
                </ol>
              </div>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button className="btn btn-education">View Full Article</button>
                <button className="btn btn-outline" style={{ marginLeft: 10 }}>Download PDF</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* New Content Modal */}
      {modal.newContent && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal('newContent')}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Health Education Content</h3>
              <button className="close-modal" onClick={() => closeModal('newContent')}>&times;</button>
            </div>
            <form onSubmit={saveContent} id="contentForm">
              <div className="form-group">
                <label htmlFor="contentTitle">Title *</label>
                <input type="text" id="title" className="form-control" placeholder="Enter content title" value={form.title} onChange={onChange} required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="contentCategory">Category *</label>
                  <select id="category" className="form-control" value={form.category} onChange={onChange} required>
                    <option value="">Select category</option>
                    <option value="Hygiene">Hygiene</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="First Aid">First Aid</option>
                    <option value="Mental Wellness">Mental Wellness</option>
                    <option value="Chronic Conditions">Chronic Conditions</option>
                    <option value="Preventive Care">Preventive Care</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="contentStatus">Status</label>
                  <select id="status" className="form-control" value={form.status} onChange={onChange}>
                    <option value="draft">Draft</option>
                    <option value="published">Publish Immediately</option>
                    <option value="scheduled">Schedule Publication</option>
                  </select>
                </div>
              </div>
              {form.status === 'scheduled' && (
                <div id="scheduleFields">
                  <div className="form-group">
                    <label htmlFor="publishDate">Publish Date & Time</label>
                    <input type="datetime-local" id="publishDate" className="form-control" value={form.publishDate} onChange={onChange} />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="contentSummary">Summary *</label>
                <textarea id="summary" className="form-control" rows={3} placeholder="Brief summary of the content..." value={form.summary} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="contentBody">Content *</label>
                <textarea id="body" className="form-control" rows={10} placeholder="Enter the full content here..." value={form.body} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="contentTags">Tags</label>
                <input type="text" id="tags" className="form-control" placeholder="Add relevant tags (comma separated)" value={form.tags} onChange={onChange} />
              </div>
              <div className="form-group">
                <label htmlFor="contentImage">Featured Image</label>
                <input type="file" id="contentImage" className="form-control" />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => closeModal('newContent')} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-education" style={{ flex: 1 }}>Save Content</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Campaign Modal (placeholder) */}
      {modal.newCampaign && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal('newCampaign')}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Campaign</h3>
              <button className="close-modal" onClick={() => closeModal('newCampaign')}>&times;</button>
            </div>
            <p>Campaign builder will go here.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => closeModal('newCampaign')} style={{ flex: 1 }}>Close</button>
              <button className="btn btn-education" onClick={() => alert('Campaign created')} style={{ flex: 1 }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
