import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../../lib/token';
import {
  listMessagingContacts,
  listMessagingHistory,
  listThreadMessages,
  sendEmergencyMessage,
} from '../../../lib/emergencyMessagingApi';

const AVATAR_COLORS = ['e63946', '3a86ff', 'f4a261', '2a9d8f', 'ffb703', '8338ec', 'ff006e'];

const DEFAULT_TEMPLATES = [
  {
    key: 'critical',
    title: 'Cardiac Emergency Alert',
    desc: 'Critical cardiac event in progress. Request immediate medical assistance and prepare defibrillator.',
    cls: 'critical',
  },
  {
    key: 'urgent',
    title: 'Respiratory Distress',
    desc: 'Crew member experiencing respiratory distress. Low oxygen saturation detected. Request oxygen support.',
    cls: 'urgent',
  },
  {
    key: 'evac',
    title: 'Medical Evacuation Request',
    desc: 'Serious medical emergency requiring evacuation. Prepare helipad and contact coast guard.',
  },
  {
    key: 'mobilize',
    title: 'Emergency Team Mobilization',
    desc: 'Activate emergency response team. Medical emergency in progress at specified location.',
  },
];

const priorityLabel = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
};

const roleFiltersFromProp = (filterProp) => {
  if (!filterProp || filterProp === 'all') return null;
  if (Array.isArray(filterProp)) {
    return filterProp.map((r) => String(r).toLowerCase());
  }
  return [String(filterProp).toLowerCase()];
};

const colorFromString = (seed) => {
  if (!seed) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash &= hash;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const formatTime = (value) => {
  if (!value) return 'Unknown';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return 'Unknown';
  }
};

export default function MessagingShell({
  SidebarComponent,
  pageTitle,
  contactFilter = 'all',
  placeholder = 'Search contacts...',
  statusBadge = 'On Duty',
  templates = DEFAULT_TEMPLATES,
  emptyMessage = 'Select a contact to start communicating.',
}) {
  const navigate = useNavigate();
  const user = getUser();
  const currentUserId = user?._id || user?.id || user?.userId || '';
  const userFullName = user?.fullName || 'Officer';
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Officer';
  const userVessel = user?.vessel || '';
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=e63946&color=fff`;

  const roleFilters = useMemo(() => roleFiltersFromProp(contactFilter), [contactFilter]);

  const [contactSearch, setContactSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [activeId, setActiveId] = useState('');

  const [threadMessages, setThreadMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef(null);

  const [showDetail, setShowDetail] = useState(false);
  const [detailMessage, setDetailMessage] = useState(null);

  const loadContacts = async () => {
    setLoadingContacts(true);
    setContactsError('');
    try {
      const data = await listMessagingContacts();
      const formatted = (data || []).map((c) => ({
        id: c.crewId || c.id,
        name: c.fullName,
        department: c.department || 'Crew',
        roleLabel: c.position || c.department || 'Crew Member',
        avatarBg: colorFromString(c.crewId || c.fullName),
        status: c.status === 'active' ? 'online' : 'offline',
        accountRole: c.role || 'crew',
      }));

      const filteredByRole = roleFilters
        ? formatted.filter((c) => roleFilters.includes(String(c.accountRole).toLowerCase()))
        : formatted;

      setContacts(filteredByRole);
      if (filteredByRole.length) {
        setActiveId((prev) => prev || filteredByRole[0].id);
      } else {
        setActiveId('');
      }
    } catch (err) {
      console.error('listMessagingContacts error', err);
      setContactsError('Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await listMessagingHistory({ limit: 10 });
      setHistory(data || []);
    } catch (err) {
      console.error('listMessagingHistory error', err);
      setHistoryError('Failed to load message history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadThread = async (threadId) => {
    if (!threadId) {
      setThreadMessages([]);
      return;
    }
    setThreadLoading(true);
    setThreadError('');
    try {
      const data = await listThreadMessages(threadId);
      const formatted = (data || []).map((m) => ({
        id: m._id,
        from: m.fromId,
        isMine: currentUserId && String(m.fromId) === String(currentUserId),
        text: m.content,
        time: formatTime(m.sentAt),
        status: m.status,
        priority: m.priority,
      }));
      setThreadMessages(formatted);
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    } catch (err) {
      console.error('listThreadMessages error', err);
      setThreadError('Failed to load conversation');
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeId) {
      loadThread(activeId);
    }
  }, [activeId]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [threadMessages]);

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(query)
      || (c.roleLabel || '').toLowerCase().includes(query)
      || (c.department || '').toLowerCase().includes(query)
    );
  }, [contacts, contactSearch]);

  const groupedContacts = useMemo(() => {
    const map = new Map();
    filteredContacts.forEach((contact) => {
      const key = contact.department || 'Crew';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(contact);
    });
    return Array.from(map.entries());
  }, [filteredContacts]);

  const activeContact = contacts.find((c) => c.id === activeId) || null;

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !activeContact || sending) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      from: currentUserId,
      isMine: true,
      text: content,
      time: formatTime(new Date()),
      status: 'sending',
    };
    setThreadMessages((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    try {
      await sendEmergencyMessage({
        threadId: activeContact.id,
        toId: activeContact.id,
        toName: activeContact.name,
        content,
      });
      await Promise.all([loadThread(activeContact.id), loadHistory()]);
    } catch (err) {
      console.error('sendEmergencyMessage error', err);
      setThreadMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'failed' } : msg)));
    } finally {
      setSending(false);
    }
  };

  const openDetail = (message) => {
    setDetailMessage(message);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailMessage(null);
  };

  return (
    <div className="dashboard-container emergency-dashboard">
      <style>{`
        .header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; padding:18px 22px; background:#fff; border-radius:14px; box-shadow:0 16px 32px rgba(230,57,70,0.12); border:1px solid #f3c2c5; }
        .header h2{ color:#b3202c; font-size:24px; font-weight:700; margin:0; }
        .user-info{ display:flex; align-items:center; gap:10px; }
        .user-info img{ width:46px; height:46px; border-radius:50%; object-fit:cover; box-shadow:0 10px 18px rgba(230,57,70,0.25); }
        .user-info .meta{ display:flex; flex-direction:column; }
        .user-info .name{ color:#343a40; font-weight:600; line-height:1.2; }
        .user-info small{ color:#6c757d; }
        .status-badge{ padding:6px 12px; border-radius:9999px; font-size:12px; font-weight:600; margin-left:10px; border:1px solid rgba(42,157,143,.35); background:rgba(42,157,143,.12); color:#2a9d8f; }

        .messaging-container{ display:grid; grid-template-columns:350px 1fr; gap:25px; margin-bottom:30px; min-height:520px; }
        .panel-card{ background:#fff; border-radius:14px; border:1px solid #f3c2c5; box-shadow:0 18px 32px rgba(230,57,70,0.1); overflow:hidden; display:flex; flex-direction:column; }
        .contacts-panel{ display:flex; flex-direction:column; }
        .contacts-header{ padding:20px 22px; background:linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(255,240,241,0.82) 100%); border-bottom:1px solid #f3c2c5; }
        .contacts-title{ font-weight:600; color:#b3202c; margin-bottom:14px; letter-spacing:0.4px; }
        .contact-search{ display:flex; align-items:center; background:#fff; border:1px solid #f3c2c5; border-radius:12px; padding:0 12px; box-shadow:inset 0 1px 4px rgba(0,0,0,0.05); }
        .contact-search input{ border:none; padding:8px 0; width:100%; outline:none; background:transparent; font-size:14px; color:#495057; }
        .contacts-list{ flex:1; overflow-y:auto; }
        .group-title{ padding:10px 22px; background:#fff5f5; font-weight:600; color:#b3202c; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; }
        .contact-item{ display:flex; align-items:center; padding:12px 22px; border-bottom:1px solid #fde1e5; cursor:pointer; transition:all .2s; }
        .contact-item:hover, .contact-item.active{ background:rgba(230,57,70,0.13); }
        .contact-avatar{ width:40px; height:40px; border-radius:50%; margin-right:15px; object-fit:cover; box-shadow:0 6px 12px rgba(0,0,0,0.08); }
        .contact-info{ flex:1; }
        .contact-name{ font-weight:600; margin-bottom:4px; color:#343a40; }
        .contact-role{ font-size:13px; color:#6c757d; }
        .contact-status{ display:flex; align-items:center; gap:6px; font-size:12px; color:#6c757d; }
        .status-dot{ width:10px; height:10px; border-radius:50%; }
        .status-dot.online{ background:#2a9d8f; }
        .status-dot.offline{ background:#6c757d; }

        .chat-panel{ display:flex; flex-direction:column; }
        .chat-header{ padding:18px 24px; background:linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(255,240,241,0.82) 100%); border-bottom:1px solid #f3c2c5; display:flex; justify-content:space-between; align-items:center; }
        .chat-info{ display:flex; align-items:center; gap:14px; }
        .chat-avatar{ width:50px; height:50px; border-radius:16px; object-fit:cover; box-shadow:0 8px 16px rgba(0,0,0,0.12); }
        .chat-details{ display:flex; flex-direction:column; gap:4px; }
        .chat-name{ font-weight:700; color:#343a40; }
        .chat-role{ font-size:13px; color:#6c757d; }
        .chat-actions{ display:flex; gap:10px; }
        .btn{ padding:10px 16px; border:none; border-radius:10px; cursor:pointer; font-weight:600; transition:.2s; display:inline-flex; align-items:center; gap:8px; background:#fff; color:#b3202c; border:1px solid #f3c2c5; }
        .btn i{ font-size:13px; }
        .btn-primary{ background:linear-gradient(135deg, #e63946 0%, #b3202c 100%); color:#fff; border:none; box-shadow:0 12px 22px rgba(230,57,70,0.22); }
        .btn-primary:hover{ box-shadow:0 16px 28px rgba(230,57,70,0.3); transform:translateY(-1px); }
        .btn:disabled{ opacity:0.6; cursor:not-allowed; transform:none; box-shadow:none; }

        .chat-messages{ flex:1; padding:24px; background:#fffdfd; display:flex; flex-direction:column; gap:16px; overflow-y:auto; }
        .message-system{ align-self:center; background:#fff0f1; color:#b3202c; font-size:13px; padding:10px 18px; border-radius:20px; border:1px dashed #f3c2c5; }
        .message{ max-width:70%; padding:14px 16px; border-radius:18px; position:relative; box-shadow:0 6px 14px rgba(0,0,0,0.08); font-size:14px; line-height:1.5; }
        .message.mine{ align-self:flex-end; background:linear-gradient(135deg, #e63946 0%, #b3202c 100%); color:#fff; border-bottom-right-radius:6px; }
        .message.theirs{ align-self:flex-start; background:#fff7f7; color:#343a40; border-bottom-left-radius:6px; border:1px solid #fde1e5; }
        .message.failed{ background:#fff0f1; color:#b3202c; border:1px solid #f3c2c5; }
        .message-meta{ display:flex; justify-content:flex-end; align-items:center; gap:10px; margin-top:6px; font-size:11px; opacity:0.75; }
        .message-meta .state{ padding:2px 6px; border-radius:999px; text-transform:uppercase; letter-spacing:0.5px; font-weight:600; }
        .message-meta .state.sent{ background:rgba(42,157,143,0.18); color:#2a9d8f; }
        .message-meta .state.delivered{ background:rgba(58,134,255,0.18); color:#3a86ff; }
        .message-meta .state.read{ background:rgba(230,57,70,0.18); color:#e63946; }
        .message-meta .state.sending{ background:rgba(255,193,7,0.18); color:#b8860b; }
        .message-meta .state.failed{ background:rgba(230,57,70,0.22); color:#b3202c; }

        .chat-empty{ flex:1; display:flex; align-items:center; justify-content:center; padding:40px; color:#6c757d; text-align:center; }

        .chat-input{ padding:20px 24px; border-top:1px solid #f3c2c5; background:#fff7f7; }
        .message-compose{ display:flex; gap:12px; }
        .message-input{ flex:1; padding:12px 18px; border:1px solid #f3c2c5; border-radius:999px; outline:none; resize:none; height:52px; font-family:inherit; background:#fff; box-shadow:inset 0 1px 4px rgba(0,0,0,0.05); }
        .message-actions{ display:flex; gap:8px; }
        .action-btn{ width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid #f3c2c5; cursor:pointer; transition:.2s; color:#b3202c; }
        .action-btn:hover{ background:#fff0f1; }
        .action-btn.primary{ background:linear-gradient(135deg, #e63946 0%, #b3202c 100%); color:#fff; border:none; box-shadow:0 12px 22px rgba(230,57,70,0.22); }

        .quick-templates, .message-history{ background:#fff; border-radius:14px; border:1px solid #f3c2c5; box-shadow:0 18px 32px rgba(230,57,70,0.1); padding:26px; margin-bottom:30px; }
        .section-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .section-title{ font-size:20px; font-weight:700; color:#b3202c; }
        .templates-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px; }
        .template-card{ background:#fff7f7; border-radius:12px; padding:18px; cursor-pointer; transition:.2s; border:1px solid #fde1e5; border-left:4px solid #e63946; box-shadow:0 10px 20px rgba(230,57,70,0.1); }
        .template-card:hover{ transform:translateY(-3px); box-shadow:0 14px 26px rgba(230,57,70,0.18); }
        .template-card.critical{ border-left-color:#e63946; }
        .template-card.urgent{ border-left-color:#f4a261; }
        .template-title{ font-weight:600; margin-bottom:8px; color:#343a40; }
        .template-desc{ font-size:14px; color:#6c757d; margin-bottom:12px; }
        .template-use{ font-size:12px; color:#b3202c; font-weight:600; letter-spacing:0.4px; }

        .history-table{ width:100%; border-collapse:collapse; }
        .history-table th, .history-table td{ padding:12px 15px; text-align:left; border-bottom:1px solid #fde1e5; font-size:13px; color:#495057; }
        .history-table th{ background:#fff5f5; font-weight:700; color:#b3202c; letter-spacing:0.4px; }
        .history-table tr:hover{ background:#fff7f7; }
        .message-priority{ padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .priority-urgent{ background:rgba(230,57,70,0.18); color:#e63946; }
        .priority-high{ background:rgba(244,162,97,0.2); color:#f4a261; }
        .priority-normal{ background:rgba(42,157,143,0.18); color:#2a9d8f; }
        .message-status{ padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .status-sent{ background:rgba(42,157,143,0.18); color:#2a9d8f; }
        .status-delivered{ background:rgba(58,134,255,0.18); color:#3a86ff; }
        .status-read{ background:rgba(230,57,70,0.18); color:#e63946; }

        .empty-state{ padding:20px; text-align:center; color:#6c757d; font-size:14px; }

        .detail-modal{ position:fixed; inset:0; background:rgba(17,24,39,0.55); display:flex; align-items:center; justify-content:center; z-index:1000; padding:32px; backdrop-filter:blur(4px); }
        .detail-card{ background:#fff; border-radius:18px; width:min(520px, 95vw); box-shadow:0 30px 60px rgba(15,23,42,0.32); overflow:hidden; border:1px solid #f3c2c5; }
        .detail-header{ padding:22px 26px; background:linear-gradient(135deg, rgba(230,57,70,0.15) 0%, rgba(255,240,241,0.9) 100%); display:flex; justify-content:space-between; align-items:center; }
        .detail-title{ font-size:18px; font-weight:700; color:#b3202c; }
        .detail-close{ background:transparent; border:none; color:#b3202c; font-size:18px; cursor:pointer; padding:6px; }
        .detail-body{ padding:24px 26px; display:flex; flex-direction:column; gap:16px; }
        .detail-row{ display:flex; justify-content:space-between; gap:12px; font-size:13px; color:#495057; }
        .detail-row span:first-child{ font-weight:600; color:#b3202c; }
        .detail-message{ background:#fff7f7; border-radius:14px; border:1px solid #fde1e5; padding:16px; font-size:14px; color:#343a40; line-height:1.6; }

        @media (max-width: 1100px){ .messaging-container{ grid-template-columns:1fr; } }
        @media (max-width: 768px){
          .header{ flex-direction:column; align-items:flex-start; gap:16px; }
          .user-info{ margin-top:0; }
          .templates-grid{ grid-template-columns:1fr; }
          .chat-messages .message{ max-width:85%; }
          .history-table{ display:block; overflow-x:auto; }
        }
        @media (max-width: 520px){
          .chat-actions{ flex-direction:column; gap:8px; }
          .message-compose{ flex-direction:column; }
          .message-actions{ justify-content:flex-end; }
        }
      `}</style>

      <SidebarComponent onLogout={() => navigate('/')} />

      <div className="main-content">
        <div className="header">
          <h2>{pageTitle}</h2>
          <div className="user-info">
            <img src={userAvatarUrl} alt={userFullName} />
            <div className="meta">
              <div className="name">{userFullName}</div>
              <small>{`${userRole}${userVessel ? ` | ${userVessel}` : ''}`}</small>
            </div>
            <div className="status-badge">{statusBadge}</div>
          </div>
        </div>

        <div className="messaging-container">
          <div className="panel-card contacts-panel">
            <div className="contacts-header">
              <div className="contacts-title">Contacts</div>
              <div className="contact-search">
                <i className="fas fa-search" />
                <input
                  type="text"
                  placeholder={placeholder}
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="contacts-list">
              {loadingContacts ? (
                <div className="empty-state">Loading contacts…</div>
              ) : contactsError ? (
                <div className="empty-state" style={{ color: '#b3202c' }}>{contactsError}</div>
              ) : groupedContacts.length === 0 ? (
                <div className="empty-state">No contacts match the search filters.</div>
              ) : (
                groupedContacts.map(([dept, members]) => (
                  <div className="contact-group" key={dept}>
                    <div className="group-title">{dept}</div>
                    {members.map((c) => (
                      <div
                        key={c.id}
                        className={`contact-item ${activeId === c.id ? 'active' : ''}`}
                        onClick={() => setActiveId(c.id)}
                      >
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=48&background=${c.avatarBg}&color=fff`}
                          alt={c.name}
                          className="contact-avatar"
                        />
                        <div className="contact-info">
                          <div className="contact-name">{c.name}</div>
                          <div className="contact-role">{c.roleLabel}</div>
                        </div>
                        <div className="contact-status">
                          <span className={`status-dot ${c.status}`} />
                          <span>{c.status === 'online' ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel-card chat-panel">
            {activeContact ? (
              <>
                <div className="chat-header">
                  <div className="chat-info">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.name)}&size=56&background=${activeContact.avatarBg}&color=fff`}
                      alt={activeContact.name}
                      className="chat-avatar"
                    />
                    <div className="chat-details">
                      <div className="chat-name">{activeContact.name}</div>
                      <div className="chat-role">{activeContact.roleLabel} • {activeContact.status === 'online' ? 'Online now' : 'Offline'}</div>
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button className="btn btn-primary"><i className="fas fa-phone" /> Call</button>
                    <button className="btn"><i className="fas fa-video" /> Video</button>
                  </div>
                </div>

                <div className="chat-messages" ref={chatRef}>
                  {threadLoading ? (
                    <div className="message-system">Loading conversation…</div>
                  ) : threadError ? (
                    <div className="message-system" style={{ color: '#b3202c' }}>{threadError}</div>
                  ) : threadMessages.length === 0 ? (
                    <div className="message-system">
                      <i className="fas fa-info-circle" /> This is the start of your conversation with {activeContact.name}
                    </div>
                  ) : (
                    threadMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`message ${msg.isMine ? 'mine' : 'theirs'} ${msg.status === 'failed' ? 'failed' : ''}`}
                      >
                        <div className="message-text">{msg.text}</div>
                        <div className="message-meta">
                          <span>{msg.time}</span>
                          {msg.status && (
                            <span className={`state ${msg.status}`}>{msg.status}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="chat-input">
                  <div className="message-compose">
                    <textarea
                      className="message-input"
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <div className="message-actions">
                      <button className="action-btn" title="Attach file">
                        <i className="fas fa-paperclip" />
                      </button>
                      <button
                        className="action-btn primary"
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        title="Send message"
                      >
                        <i className="fas fa-paper-plane" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="chat-empty">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>

        <div className="quick-templates">
          <div className="section-header">
            <div className="section-title">Quick Message Templates</div>
            <button className="btn btn-primary"><i className="fas fa-plus" /> New Template</button>
          </div>
          <div className="templates-grid">
            {templates.map((template) => (
              <div
                key={template.key}
                className={`template-card ${template.cls || ''}`}
                onClick={() => setInput(template.desc)}
              >
                <div className="template-title">{template.title}</div>
                <div className="template-desc">{template.desc}</div>
                <div className="template-use">Click to populate compose area</div>
              </div>
            ))}
          </div>
        </div>

        <div className="message-history">
          <div className="section-header">
            <div className="section-title">Recent Message History</div>
            <button className="btn" onClick={loadHistory}><i className="fas fa-sync" /> Refresh</button>
          </div>
          {historyLoading ? (
            <div className="empty-state">Loading history…</div>
          ) : historyError ? (
            <div className="empty-state" style={{ color: '#b3202c' }}>{historyError}</div>
          ) : history.length === 0 ? (
            <div className="empty-state">No messages have been sent yet.</div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Message</th>
                  <th>Sent</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((message) => {
                  const id = message.id || message._id || message.threadId;
                  const recipient = message.toName || message.recipientName || message.to || 'Unknown recipient';
                  const text = message.content || message.message || '';
                  const sentAt = message.sentAt || message.createdAt || message.updatedAt;
                  const sentLabel = sentAt ? new Date(sentAt).toLocaleString() : 'Unknown';
                  const priority = message.priority;
                  const status = message.status;

                  return (
                    <tr
                      key={id || `${recipient}-${sentAt}`}
                      onClick={() => openDetail(message)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{recipient}</td>
                      <td>{text}</td>
                      <td>{sentLabel}</td>
                      <td>
                        {priority ? (
                          <span className={`message-priority priority-${priority}`}>
                            {priorityLabel[priority] || priority}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {status ? (
                          <span className={`message-status status-${status}`}>
                            {status}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDetail && detailMessage && (
        <div className="detail-modal" onClick={closeDetail}>
          <div
            className="detail-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="detail-header">
              <div className="detail-title">Message details</div>
              <button className="detail-close" onClick={closeDetail}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="detail-body">
              <div className="detail-row">
                <span>Recipient</span>
                <span>{detailMessage.toName || detailMessage.recipientName || detailMessage.to || 'Unknown recipient'}</span>
              </div>
              <div className="detail-row">
                <span>Sent</span>
                <span>
                  {detailMessage.sentAt || detailMessage.createdAt || detailMessage.updatedAt
                    ? new Date(detailMessage.sentAt || detailMessage.createdAt || detailMessage.updatedAt).toLocaleString()
                    : 'Unknown'}
                </span>
              </div>
              <div className="detail-row">
                <span>Priority</span>
                <span>{detailMessage.priority ? (priorityLabel[detailMessage.priority] || detailMessage.priority) : '—'}</span>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <span>{detailMessage.status || '—'}</span>
              </div>
              <div className="detail-message">
                {detailMessage.content || detailMessage.message || 'No message content available.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
