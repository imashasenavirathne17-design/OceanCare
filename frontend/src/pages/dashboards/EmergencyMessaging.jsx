import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../lib/token';
import EmergencySidebar from './EmergencySidebar';

export default function EmergencyMessaging() {
  const user = getUser();
  const navigate = useNavigate();

  const userFullName = user?.fullName || 'Emergency Officer';
  const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Emergency Officer';
  const userVessel = user?.vessel || '';
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=e63946&color=fff`;

  const [activeId, setActiveId] = useState('sarah-johnson');
  const [input, setInput] = useState('');
  const chatRef = useRef(null);

  const contacts = useMemo(() => ([
    { id: 'sarah-johnson', name: 'Dr. Sarah Johnson', role: 'Chief Medical Officer', avatarBg: '2a9d8f', status: 'online', group: 'Medical Team' },
    { id: 'michael-brown', name: 'Michael Brown', role: 'Medical Assistant', avatarBg: '3a86ff', status: 'online', group: 'Medical Team' },
    { id: 'james-wilson', name: 'James Wilson', role: 'Captain', avatarBg: 'f4a261', status: 'busy', group: 'Command Staff' },
    { id: 'emma-davis', name: 'Emma Davis', role: 'First Officer', avatarBg: 'e63946', status: 'online', group: 'Command Staff' },
    { id: 'medical-team', name: 'Medical Team', role: 'Group', avatarBg: '2a9d8f', status: 'online', group: 'Emergency Response' },
    { id: 'emergency-team', name: 'Emergency Response Team', role: 'Group', avatarBg: 'e63946', status: 'online', group: 'Emergency Response' },
  ]), []);

  const grouped = useMemo(() => {
    const m = new Map();
    contacts.forEach(c => {
      if (!m.has(c.group)) m.set(c.group, []);
      m.get(c.group).push(c);
    });
    return Array.from(m.entries());
  }, [contacts]);

  const [messages, setMessages] = useState([
    { id: 1, from: 'sarah-johnson', type: 'received', text: "Officer, I've reviewed John Davis' latest vitals. His condition is critical." , time: '10:25 AM' },
    { id: 2, from: 'me', type: 'sent', text: 'Understood. Cardiac Emergency Protocol activated.' , time: '10:26 AM' },
    { id: 3, from: 'sarah-johnson', type: 'received', text: "Notify the captain and prepare emergency team. Possible medical evacuation if no stabilization." , time: '10:27 AM' },
  ]);

  const templates = [
    { key: 'critical', title: 'Cardiac Emergency Alert', desc: 'Critical cardiac event in progress. Request immediate medical assistance and prepare defibrillator.', cls: 'critical' },
    { key: 'urgent', title: 'Respiratory Distress', desc: 'Crew member experiencing respiratory distress. Low oxygen saturation detected. Request oxygen support.', cls: 'urgent' },
    { key: 'evac', title: 'Medical Evacuation Request', desc: 'Serious medical emergency requiring evacuation. Prepare helipad and contact coast guard.' },
    { key: 'mobilize', title: 'Emergency Team Mobilization', desc: 'Activate emergency response team. Medical emergency in progress at specified location.' },
  ];

  const activeContact = contacts.find(c => c.id === activeId) || contacts[0];

  function sendMessage(text) {
    const t = text?.trim() || input.trim();
    if (!t) return;
    setMessages((m) => [...m, { id: Date.now(), from: 'me', type: 'sent', text: t, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now()+1, from: activeId, type: 'received', text: 'Message received. Taking appropriate action.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 1500);
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }

  return (
    <div className="dashboard-container emergency-dashboard">
      <style>{`
        .header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding:18px 22px; background:#fff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .header h2{ color:#e63946; font-size:24px; font-weight:700; margin:0; }
        .user-info{ display:flex; align-items:center; gap:10px; }
        .user-info img{ width:40px; height:40px; border-radius:50%; margin-right:8px; }
        .user-info .meta{ display:flex; flex-direction:column; }
        .user-info .name{ color:#343a40; font-weight:600; line-height:1.2; }
        .user-info small{ color:#6c757d; }
        .status-badge{ padding:6px 12px; border-radius:9999px; font-size:12px; font-weight:600; margin-left:10px; border:1px solid rgba(42,157,143,.35); background:rgba(42,157,143,.12); color:#2a9d8f; }

        .messaging-container{ display:grid; grid-template-columns:350px 1fr; gap:25px; margin-bottom:30px; height:calc(100vh - 200px); }
        .contacts-panel, .chat-panel, .quick-templates, .message-history{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); }
        .contacts-panel{ display:flex; flex-direction:column; overflow:hidden; }
        .contacts-header{ padding:20px; background:#f8f9fa; border-bottom:1px solid #eee; }
        .contacts-title{ font-weight:600; color:#e63946; margin-bottom:15px; }
        .contact-search{ display:flex; align-items:center; background:#fff; border:1px solid #ddd; border-radius:4px; padding:0 10px; }
        .contact-search input{ border:none; padding:8px 10px; width:100%; outline:none; }
        .contacts-list{ flex:1; overflow-y:auto; }
        .group-title{ padding:10px 20px; background:#f8f9fa; font-weight:600; color:#666; font-size:14px; }
        .contact-item{ display:flex; align-items:center; padding:12px 20px; border-bottom:1px solid #f0f0f0; cursor:pointer; transition:all .3s; }
        .contact-item:hover, .contact-item.active{ background:rgba(230,57,70,.1); }
        .contact-avatar{ width:40px; height:40px; border-radius:50%; margin-right:15px; object-fit:cover; }
        .contact-info{ flex:1; }
        .contact-name{ font-weight:600; margin-bottom:3px; }
        .contact-role{ font-size:13px; color:#666; }
        .contact-status{ width:10px; height:10px; border-radius:50%; margin-left:10px; }
        .status-online{ background:#2a9d8f; } .status-offline{ background:#ccc; } .status-busy{ background:#f4a261; }

        .chat-panel{ display:flex; flex-direction:column; overflow:hidden; }
        .chat-header{ padding:15px 20px; background:#f8f9fa; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; }
        .chat-info{ display:flex; align-items:center; }
        .chat-avatar{ width:45px; height:45px; border-radius:50%; margin-right:15px; object-fit:cover; }
        .chat-details{ flex:1; }
        .chat-name{ font-weight:600; margin-bottom:3px; }
        .chat-role{ font-size:13px; color:#666; }
        .chat-actions{ display:flex; gap:10px; }
        .btn{ padding:8px 15px; border:none; border-radius:4px; cursor:pointer; font-weight:500; transition:.3s; display:inline-flex; align-items:center; }
        .btn i{ margin-right:5px; }
        .btn-primary{ background:#e63946; color:#fff; }
        .chat-messages{ flex:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:15px; }
        .message{ max-width:70%; padding:12px 15px; border-radius:18px; position:relative; }
        .message.sent{ align-self:flex-end; background:#e63946; color:#fff; border-bottom-right-radius:5px; }
        .message.received{ align-self:flex-start; background:#f0f0f0; color:#333; border-bottom-left-radius:5px; }
        .message-time{ font-size:11px; margin-top:5px; opacity:.7; text-align:right; }
        .message.received .message-time{ text-align:left; }
        .message-system{ align-self:center; background:#fff9e6; color:#666; font-size:13px; padding:8px 15px; border-radius:15px; max-width:80%; text-align:center; }
        .chat-input{ padding:20px; border-top:1px solid #eee; background:#f8f9fa; }
        .message-compose{ display:flex; gap:10px; }
        .message-input{ flex:1; padding:12px 15px; border:1px solid #ddd; border-radius:24px; outline:none; resize:none; height:50px; font-family:inherit; }
        .message-actions{ display:flex; gap:5px; }
        .action-btn{ width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid #ddd; cursor:pointer; transition:.3s; }
        .action-btn:hover{ background:#f0f0f0; }
        .action-btn.primary{ background:#e63946; color:#fff; border-color:#e63946; }

        .quick-templates{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; margin-bottom:30px; }
        .section-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .section-title{ font-size:20px; font-weight:600; color:#e63946; }
        .templates-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:15px; }
        .template-card{ background:#f8f9fa; border-radius:8px; padding:15px; cursor:pointer; transition:.3s; border-left:4px solid #e63946; }
        .template-card:hover{ transform:translateY(-3px); box-shadow:0 3px 10px rgba(0,0,0,.1); }
        .template-card.critical{ border-left-color:#e63946; }
        .template-card.urgent{ border-left-color:#f4a261; }
        .template-title{ font-weight:600; margin-bottom:8px; }
        .template-desc{ font-size:14px; color:#666; margin-bottom:10px; }
        .template-use{ font-size:12px; color:#e63946; font-weight:500; }

        .message-history{ background:#fff; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,.05); padding:25px; }
        .history-table{ width:100%; border-collapse:collapse; }
        .history-table th, .history-table td{ padding:12px 15px; text-align:left; border-bottom:1px solid #eee; }
        .history-table th{ background:#f8f9fa; font-weight:600; color:#555; }
        .history-table tr:hover{ background:#f8f9fa; }
        .message-priority{ padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; }
        .priority-urgent{ background:rgba(230,57,70,.2); color:#e63946; }
        .priority-high{ background:rgba(244,162,97,.2); color:#f4a261; }
        .priority-normal{ background:rgba(42,157,143,.2); color:#2a9d8f; }
        .message-status{ padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; }
        .status-sent{ background:rgba(42,157,143,.2); color:#2a9d8f; }
        .status-delivered{ background:rgba(58,134,255,.2); color:#3a86ff; }
        .status-read{ background:rgba(42,157,143,.2); color:#2a9d8f; }

        @media (max-width:992px){ .dashboard-container{flex-direction:column;} .sidebar{width:100%; height:auto;} .sidebar-menu{display:flex; overflow-x:auto;} .sidebar-menu li{margin-bottom:0; margin-right:10px;} .sidebar-menu a{padding:10px 15px; border-left:none; border-bottom:3px solid transparent;} .sidebar-menu a:hover, .sidebar-menu a.active{border-left:none; border-bottom:3px solid #fff;} .messaging-container{grid-template-columns:1fr; height:auto;} .contacts-panel{height:300px;} }
        @media (max-width:768px){ .header{flex-direction:column; align-items:flex-start;} .user-info{margin-top:15px;} .templates-grid{grid-template-columns:1fr;} .message{max-width:85%;} .history-table{display:block; overflow-x:auto;} }
        @media (max-width:480px){ .chat-actions{flex-direction:column; gap:5px;} .message-compose{flex-direction:column;} .message-actions{justify-content:center;} }
      `}</style>

      {/* Sidebar */}
      <EmergencySidebar onLogout={() => navigate('/')} />

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h2>Emergency Messaging</h2>
          <div className="user-info">
            <img src={userAvatarUrl} alt="User" />
            <div className="meta">
              <div className="name">{userFullName}</div>
              <small>{`${userRole}${userVessel ? ' | ' + userVessel : ''}`}</small>
            </div>
            <div className="status-badge status-active">Online</div>
          </div>
        </div>

        {/* Messaging Layout */}
        <div className="messaging-container">
          {/* Contacts Panel */}
          <div className="contacts-panel">
            <div className="contacts-header">
              <div className="contacts-title">Emergency Contacts</div>
              <div className="contact-search">
                <i className="fas fa-search" />
                <input type="text" placeholder="Search contacts..." onChange={(e) => {/* optional search */}} />
              </div>
            </div>
            <div className="contacts-list">
              {grouped.map(([group, list]) => (
                <div className="contact-group" key={group}>
                  <div className="group-title">{group}</div>
                  {list.map((c) => (
                    <div key={c.id} className={`contact-item ${activeId === c.id ? 'active' : ''}`} onClick={() => setActiveId(c.id)}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=40&background=${c.avatarBg}&color=fff`} alt={c.name} className="contact-avatar" />
                      <div className="contact-info">
                        <div className="contact-name">{c.name}</div>
                        <div className="contact-role">{c.role}</div>
                      </div>
                      <div className={`contact-status status-${c.status}`}></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="chat-panel">
            <div className="chat-header">
              <div className="chat-info">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.name)}&size=45&background=${activeContact.avatarBg}&color=fff`} alt={activeContact.name} className="chat-avatar" />
                <div className="chat-details">
                  <div className="chat-name">{activeContact.name}</div>
                  <div className="chat-role">{activeContact.role} • {activeContact.status === 'online' ? 'Online' : activeContact.status === 'busy' ? 'Busy' : 'Offline'}</div>
                </div>
              </div>
              <div className="chat-actions">
                <button className="btn btn-primary"><i className="fas fa-phone" /> Call</button>
                <button className="btn"><i className="fas fa-video" /> Video</button>
              </div>
            </div>

            <div className="chat-messages" ref={chatRef}>
              <div className="message-system"><i className="fas fa-info-circle" /> This is the start of your conversation with {activeContact.name}</div>
              {messages.map((m) => (
                <div key={m.id} className={`message ${m.type}`}>
                  <div className="message-text">{m.text}</div>
                  <div className="message-time">{m.time}</div>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <div className="message-compose">
                <textarea className="message-input" placeholder="Type your emergency message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                <div className="message-actions">
                  <button className="action-btn"><i className="fas fa-paperclip" /></button>
                  <button className="action-btn primary" onClick={() => sendMessage()}><i className="fas fa-paper-plane" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Message Templates */}
        <div className="quick-templates">
          <div className="section-header">
            <div className="section-title">Quick Message Templates</div>
            <button className="btn btn-primary"><i className="fas fa-plus" /> New Template</button>
          </div>
          <div className="templates-grid">
            {templates.map((t) => (
              <div key={t.key} className={`template-card ${t.cls || ''}`} onClick={() => setInput(t.desc)}>
                <div className="template-title">{t.title}</div>
                <div className="template-desc">{t.desc}</div>
                <div className="template-use">Click to use this template</div>
              </div>
            ))}
          </div>
        </div>

        {/* Message History */}
        <div className="message-history">
          <div className="section-header">
            <div className="section-title">Message History</div>
            <button className="btn"><i className="fas fa-download" /> Export</button>
          </div>
          <table className="history-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Message</th>
                <th>Priority</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Medical Team</td>
                <td>Cardiac emergency - John Davis. HR: 145 bpm. Moving to medical bay.</td>
                <td><span className="message-priority priority-urgent">Urgent</span></td>
                <td>10:24 AM</td>
                <td><span className="message-status status-read">Read by all</span></td>
                <td><button className="btn btn-primary btn-sm"><i className="fas fa-eye" /></button></td>
              </tr>
              <tr>
                <td>Captain Wilson</td>
                <td>Emergency alert: Critical medical situation. Request approval for protocol activation.</td>
                <td><span className="message-priority priority-high">High</span></td>
                <td>10:22 AM</td>
                <td><span className="message-status status-read">Read</span></td>
                <td><button className="btn btn-primary btn-sm"><i className="fas fa-eye" /></button></td>
              </tr>
              <tr>
                <td>Emergency Response Team</td>
                <td>Mobilize to medical bay. Cardiac emergency in progress.</td>
                <td><span className="message-priority priority-urgent">Urgent</span></td>
                <td>10:20 AM</td>
                <td><span className="message-status status-delivered">Delivered</span></td>
                <td><button className="btn btn-primary btn-sm"><i className="fas fa-eye" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
