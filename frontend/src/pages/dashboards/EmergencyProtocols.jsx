import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getUser } from '../../lib/token';
import './emergencyProtocols.css';
import EmergencySidebar from './EmergencySidebar';

export default function EmergencyProtocols() {
  const user = getUser();
  const userFullName = user?.fullName || 'Emergency Officer';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Emergency Officer';
  const userVessel = user?.vessel || '';
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=e63946&color=fff`;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [currentProtocolKey, setCurrentProtocolKey] = useState('');
  const [currentProtocolTitle, setCurrentProtocolTitle] = useState('');
  const [crewMember, setCrewMember] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [protocolNotes, setProtocolNotes] = useState('');

  const [activeProtocols, setActiveProtocols] = useState([
    {
      id: 'resp-1',
      name: 'Respiratory Distress Protocol',
      details: 'Activated for Maria Rodriguez - Low blood oxygen (88%)',
      time: 'Activated: 09:50 AM | Next evaluation: 10:50 AM',
    },
  ]);

  // Category state (UI only demo)
  const [category, setCategory] = useState('All Protocols');

  // Protocols list (for rendering cards)
  const protocolCards = useMemo(
    () => [
      {
        key: 'cardiac',
        iconClass: 'fas fa-heartbeat',
        iconType: 'critical',
        title: 'Cardiac Emergency Response',
        desc: 'For heart attacks, cardiac arrest, and severe arrhythmias',
        steps: [
          'Alert medical team and captain immediately',
          'Retrieve and prepare defibrillator',
          'Clear pathway to medical bay',
          'Prepare emergency medications',
        ],
      },
      {
        key: 'respiratory',
        iconClass: 'fas fa-lungs',
        iconType: 'medical',
        title: 'Respiratory Distress Protocol',
        desc: 'For breathing difficulties, asthma attacks, and anaphylaxis',
        steps: [
          'Administer oxygen immediately',
          'Prepare emergency airway kit',
          'Isolate area if contagious risk',
          'Notify medical evacuation team if needed',
        ],
      },
      {
        key: 'evacuation',
        iconClass: 'fas fa-helicopter',
        iconType: 'safety',
        title: 'Medical Evacuation Procedure',
        desc: 'For serious injuries requiring hospital transfer',
        steps: [
          'Contact coast guard and nearest hospital',
          'Prepare helipad and clear approach path',
          'Stabilize patient for transport',
          'Prepare medical records and documentation',
        ],
      },
      {
        key: 'disease',
        iconClass: 'fas fa-virus',
        iconType: 'environmental',
        title: 'Infectious Disease Containment',
        desc: 'For suspected contagious disease outbreaks',
        steps: [
          'Isolate affected individual(s)',
          'Implement quarantine procedures',
          'Notify health authorities',
          'Initiate contact tracing',
        ],
      },
    ],
    []
  );

  const [cardStatuses, setCardStatuses] = useState(
    protocolCards.reduce((acc, p) => {
      acc[p.key] = 'READY';
      return acc;
    }, /** @type {Record<string, 'READY'|'ACTIVE'>} */ ({}))
  );

  function getNextEvaluationTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function openActivationModal(key, title) {
    setCurrentProtocolKey(key);
    setCurrentProtocolTitle(title);
    setShowModal(true);
  }

  function closeActivationModal() {
    setShowModal(false);
  }

  function confirmActivation() {
    // Basic confirmation UX
    alert(
      `Emergency protocol activated successfully!\n\nProtocol: ${currentProtocolTitle}\nCrew Member: ${crewMember || 'N/A'}\nLocation: ${incidentLocation || 'N/A'}`
    );

    // Reset modal inputs
    setCrewMember('');
    setIncidentLocation('');
    setProtocolNotes('');

    // Update card status
    setCardStatuses((prev) => ({ ...prev, [currentProtocolKey]: 'ACTIVE' }));

    // Add to active list
    setActiveProtocols((prev) => [
      ...prev,
      {
        id: `${currentProtocolKey}-${Date.now()}`,
        name: currentProtocolTitle,
        details: `Activated for ${crewMember || 'Emergency situation'}${
          incidentLocation ? ' - Location: ' + incidentLocation : ''
        }`,
        time: `Activated: Just now | Next evaluation: ${getNextEvaluationTime()}`,
      },
    ]);

    closeActivationModal();
  }

  const navigate = useNavigate();

  return (
    <div className="dashboard-container emergency-dashboard">
      {/* Sidebar */}
      <EmergencySidebar onLogout={() => navigate('/')} />

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h2>Emergency Protocols</h2>
          <div className="user-info">
            <img src={userAvatarUrl} alt="User" />
            <div className="user-meta">
              <div className="name">{userFullName}</div>
              <small>{`${userRole}${userVessel ? ' | ' + userVessel : ''}`}</small>
            </div>
            <div className="status-badge status-active">Online</div>
          </div>
        </header>

        {/* Categories */}
        <div className="protocol-categories">
          {['All Protocols', 'Medical Emergencies', 'Safety Incidents', 'Environmental', 'Security'].map((c) => (
            <button
              key={c}
              className={`category-btn ${category === c ? 'active' : ''}`}
              onClick={() => {
                setCategory(c);
                alert(`Showing protocols for: ${c}`);
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Protocol Grid */}
        <section className="protocol-grid">
          {protocolCards.map((p) => (
            <article className="protocol-card" key={p.key}>
              <div className="protocol-header">
                <div className={`protocol-icon ${p.iconType}`} aria-hidden="true">
                  <i className={p.iconClass}></i>
                </div>
                <div>
                  <div className="protocol-title">{p.title}</div>
                  <div className="protocol-desc">{p.desc}</div>
                </div>
              </div>
              <div className="protocol-body">
                <div className="protocol-steps">
                  {p.steps.map((s, idx) => (
                    <div className="step-item" key={idx}>
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-content">{s}</div>
                    </div>
                  ))}
                </div>
                <div className="protocol-trigger">
                  <div
                    className={`protocol-status ${
                      cardStatuses[p.key] === 'READY' ? 'status-available' : 'status-active'
                    }`}
                  >
                    {cardStatuses[p.key]}
                  </div>
                  {cardStatuses[p.key] === 'READY' ? (
                    <button
                      className="btn btn-danger"
                      onClick={() => openActivationModal(p.key, p.title)}
                    >
                      <i className="fas fa-play-circle" aria-hidden="true"></i> Activate Protocol
                    </button>
                  ) : (
                    <button className="btn btn-warning">
                      <i className="fas fa-pause" aria-hidden="true"></i> Pause
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Active Protocols */}
        <section className="active-protocols">
          <div className="section-header">
            <div className="section-title">Active Protocols</div>
            <button className="btn btn-primary"><i className="fas fa-history" aria-hidden="true"></i> View History</button>
          </div>
          <div className="active-protocols-list">
            {activeProtocols.map((ap) => (
              <div className="active-protocol-item" key={ap.id}>
                <div className="active-protocol-info">
                  <div className="active-protocol-name">{ap.name}</div>
                  <div className="active-protocol-details">{ap.details}</div>
                  <div className="active-protocol-time">{ap.time}</div>
                </div>
                <div className="active-protocol-actions">
                  <button className="btn btn-warning"><i className="fas fa-pause" aria-hidden="true"></i> Pause</button>
                  <button className="btn btn-success"><i className="fas fa-stop" aria-hidden="true"></i> Complete</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Protocol History (static sample) */}
        <section className="protocol-history">
          <div className="section-header">
            <div className="section-title">Recent Protocol Activations</div>
            <button className="btn"><i className="fas fa-download" aria-hidden="true"></i> Export</button>
          </div>

          <table className="history-table">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Activated By</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cardiac Emergency Response</td>
                <td>Officer Smith</td>
                <td>Oct 24, 2023 14:30</td>
                <td><span className="history-status status-completed">Completed</span></td>
                <td><button className="btn btn-primary btn-sm"><i className="fas fa-eye" aria-hidden="true"></i> View</button></td>
              </tr>
              <tr>
                <td>Medical Evacuation Procedure</td>
                <td>Dr. Sarah Johnson</td>
                <td>Oct 22, 2023 11:15</td>
                <td><span className="history-status status-completed">Completed</span></td>
                <td><button className="btn btn-primary btn-sm"><i className="fas fa-eye" aria-hidden="true"></i> View</button></td>
              </tr>
              <tr>
                <td>Infectious Disease Containment</td>
                <td>Officer Smith</td>
                <td>Oct 18, 2023 09:45</td>
                <td><span className="history-status status-cancelled">Cancelled</span></td>
                <td><button className="btn btn-primary btn-sm"><i className="fas fa-eye" aria-hidden="true"></i> View</button></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      {/* Activation Modal */}
      {showModal && (
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) closeActivationModal(); }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Activate Emergency Protocol</div>
              <button className="close-modal" aria-label="Close" onClick={closeActivationModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Protocol</label>
                <input type="text" className="form-control" value={currentProtocolTitle} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="crewMember">Crew Member (Optional)</label>
                <select id="crewMember" className="form-control" value={crewMember} onChange={(e) => setCrewMember(e.target.value)}>
                  <option value="">Select crew member...</option>
                  <option value="John Davis">John Davis (CREW-045)</option>
                  <option value="Maria Rodriguez">Maria Rodriguez (CREW-128)</option>
                  <option value="Robert Chen">Robert Chen (CREW-312)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="incidentLocation">Location</label>
                <input id="incidentLocation" type="text" className="form-control" placeholder="Enter incident location" value={incidentLocation} onChange={(e) => setIncidentLocation(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="protocolNotes">Additional Notes</label>
                <textarea id="protocolNotes" className="form-control" rows={3} placeholder="Add any additional information..." value={protocolNotes} onChange={(e) => setProtocolNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeActivationModal}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmActivation}>Activate Protocol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

