import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../../lib/token';
import {
  listMessagingContacts,
  listThreadMessages,
  sendEmergencyMessage,
  updateEmergencyMessageContent,
  deleteEmergencyMessage,
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

const DEFAULT_THEME = {
  shellClass: 'messaging-shell',
  wrapperClass: 'emergency-dashboard',
  surface: '#fff',
  surfaceAlt: '#fffdfd',
  background: '#fff7f7',
  border: '#f3c2c5',
  softBorder: '#fde1e5',
  primary: '#e63946',
  primaryDark: '#b3202c',
  primaryLight: '#fff5f5',
  text: '#343a40',
  muted: '#6c757d',
  gradient: 'linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(255,240,241,0.82) 100%)',
  panelShadow: '0 18px 32px rgba(230,57,70,0.1)',
  headerShadow: '0 16px 32px rgba(230,57,70,0.12)',
  templateShadow: '0 10px 20px rgba(230,57,70,0.1)',
  templateHoverShadow: '0 14px 26px rgba(230,57,70,0.18)',
  statusBadgeBg: 'rgba(42,157,143,.12)',
  statusBadgeBorder: '1px solid rgba(42,157,143,.35)',
  statusBadgeColor: '#2a9d8f',
  success: '#2a9d8f',
  info: '#3a86ff',
  warning: '#f4a261',
  mineGradient: 'linear-gradient(135deg, #e63946 0%, #b3202c 100%)',
  theirsBg: '#fff7f7',
  theirsBorder: '#fde1e5',
  chatInputBg: '#fff7f7',
  actionBorder: '#f3c2c5',
  actionHoverBg: '#fff0f1',
  primaryButtonBg: 'linear-gradient(135deg, #e63946 0%, #b3202c 100%)',
  primaryShadow: '0 12px 22px rgba(230,57,70,0.22)',
  primaryHoverShadow: '0 16px 28px rgba(230,57,70,0.3)',
  historyHeaderBg: '#fff5f5',
  historyHoverBg: '#fff7f7',
  templateBorder: '#fde1e5',
  templateBg: '#fff7f7',
  templateCriticalAccent: '#e63946',
  templateUrgentAccent: '#f4a261',
  templateDefaultAccent: '#e63946',
  templateShadowHover: '0 14px 26px rgba(230,57,70,0.18)',
  templateDescColor: '#6c757d',
  detailGradient: 'linear-gradient(135deg, rgba(230,57,70,0.15) 0%, rgba(255,240,241,0.9) 100%)',
  detailBorder: '#f3c2c5',
  detailMessageBg: '#fff7f7',
  detailMessageBorder: '#fde1e5',
  detailMessageColor: '#343a40',
  modalOverlay: 'rgba(17,24,39,0.55)',
  priorityUrgentBg: 'rgba(230,57,70,0.18)',
  priorityUrgentColor: '#e63946',
  priorityHighBg: 'rgba(244,162,97,0.2)',
  priorityHighColor: '#f4a261',
  priorityNormalBg: 'rgba(42,157,143,0.18)',
  priorityNormalColor: '#2a9d8f',
  statusSentBg: 'rgba(42,157,143,0.18)',
  statusSentColor: '#2a9d8f',
  statusDeliveredBg: 'rgba(58,134,255,0.18)',
  statusDeliveredColor: '#3a86ff',
  statusReadBg: 'rgba(230,57,70,0.18)',
  statusReadColor: '#e63946',
  statusSendingBg: 'rgba(255,193,7,0.18)',
  statusSendingColor: '#b8860b',
  statusFailedBg: 'rgba(230,57,70,0.22)',
  statusFailedColor: '#b3202c',
  contactGroupBg: '#fff5f5',
  contactActiveBg: 'rgba(230,57,70,0.13)',
  messageSystemBg: '#fff0f1',
  messageSystemColor: '#b3202c',
  messageMineColor: '#fff',
  messageTheirsColor: '#343a40',
  templateUseColor: '#b3202c',
  detailTitleColor: '#b3202c',
  actionButtonColor: '#b3202c',
  primaryButtonColor: '#fff',
  statusOnline: '#2a9d8f',
  statusOffline: '#6c757d',
};

const buildThemeStyles = (theme) => `
.${theme.shellClass} {
  background:${theme.background};
  color:${theme.text};
  min-height:100vh;
  display:flex;
}
.${theme.shellClass} .main-content {
  flex:1;
  padding:24px;
  overflow-y:auto;
}
.${theme.shellClass} .header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:30px;
  padding:18px 22px;
  background:${theme.surface};
  border-radius:14px;
  box-shadow:${theme.headerShadow};
  border:1px solid ${theme.border};
}
.${theme.shellClass} .header h2 {
  color:${theme.primary};
  font-size:24px;
  font-weight:700;
  margin:0;
}
.${theme.shellClass} .user-info {
  display:flex;
  align-items:center;
  gap:10px;
}
.${theme.shellClass} .user-info img {
  width:46px;
  height:46px;
  border-radius:50%;
  object-fit:cover;
  box-shadow:0 10px 18px rgba(0,0,0,0.12);
}
.${theme.shellClass} .user-info .meta {
  display:flex;
  flex-direction:column;
}
.${theme.shellClass} .user-info .name {
  color:${theme.text};
  font-weight:600;
  line-height:1.2;
}
.${theme.shellClass} .user-info small {
  color:${theme.muted};
}
.${theme.shellClass} .status-badge {
  padding:6px 12px;
  border-radius:9999px;
  font-size:12px;
  font-weight:600;
  margin-left:10px;
  background:${theme.statusBadgeBg};
  border:${theme.statusBadgeBorder};
  color:${theme.statusBadgeColor};
}
.${theme.shellClass} .messaging-container {
  display:grid;
  grid-template-columns:350px 1fr;
  gap:25px;
  margin-bottom:30px;
  min-height:520px;
}
.${theme.shellClass} .panel-card {
  background:${theme.surface};
  border-radius:14px;
  border:1px solid ${theme.border};
  box-shadow:${theme.panelShadow};
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.${theme.shellClass} .contacts-panel {
  display:flex;
  flex-direction:column;
}
.${theme.shellClass} .contacts-header {
  padding:20px 22px;
  background:${theme.gradient};
  border-bottom:1px solid ${theme.border};
}
.${theme.shellClass} .contacts-title {
  font-weight:600;
  color:${theme.primary};
  margin-bottom:14px;
  letter-spacing:0.4px;
}
.${theme.shellClass} .contact-search {
  display:flex;
  align-items:center;
  background:${theme.surface};
  border:1px solid ${theme.border};
  border-radius:12px;
  padding:0 12px;
  box-shadow:inset 0 1px 4px rgba(0,0,0,0.05);
}
.${theme.shellClass} .contact-search input {
  border:none;
  padding:8px 0;
  width:100%;
  outline:none;
  background:transparent;
  font-size:14px;
  color:${theme.text};
}
.${theme.shellClass} .contacts-list {
  flex:1;
  overflow-y:auto;
}
.${theme.shellClass} .group-title {
  padding:10px 22px;
  background:${theme.contactGroupBg};
  font-weight:600;
  color:${theme.primary};
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:0.5px;
}
.${theme.shellClass} .contact-item {
  display:flex;
  align-items:center;
  padding:12px 22px;
  border-bottom:1px solid ${theme.softBorder};
  cursor:pointer;
  transition:all .2s;
  background:${theme.surface};
}
.${theme.shellClass} .contact-item:hover,
.${theme.shellClass} .contact-item.active {
  background:${theme.contactActiveBg};
}
.${theme.shellClass} .contact-avatar {
  width:40px;
  height:40px;
  border-radius:50%;
  margin-right:15px;
  object-fit:cover;
  box-shadow:0 6px 12px rgba(0,0,0,0.08);
}
.${theme.shellClass} .contact-info {
  flex:1;
}
.${theme.shellClass} .contact-name {
  font-weight:600;
  margin-bottom:4px;
  color:${theme.text};
}
.${theme.shellClass} .contact-role {
  font-size:13px;
  color:${theme.muted};
}
.${theme.shellClass} .contact-status {
  display:flex;
  align-items:center;
  gap:6px;
  font-size:12px;
  color:${theme.muted};
}
.${theme.shellClass} .status-dot {
  width:10px;
  height:10px;
  border-radius:50%;
}
.${theme.shellClass} .status-dot.online {
  background:${theme.statusOnline};
}
.${theme.shellClass} .status-dot.offline {
  background:${theme.statusOffline};
}
.${theme.shellClass} .chat-panel {
  display:flex;
  flex-direction:column;
}
.${theme.shellClass} .chat-header {
  padding:18px 24px;
  background:${theme.gradient};
  border-bottom:1px solid ${theme.border};
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.${theme.shellClass} .chat-info {
  display:flex;
  align-items:center;
  gap:14px;
}
.${theme.shellClass} .chat-avatar {
  width:50px;
  height:50px;
  border-radius:16px;
  object-fit:cover;
  box-shadow:0 8px 16px rgba(0,0,0,0.12);
}
.${theme.shellClass} .chat-details {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.${theme.shellClass} .chat-name {
  font-weight:700;
  color:${theme.text};
}
.${theme.shellClass} .chat-role {
  font-size:13px;
  color:${theme.muted};
}
.${theme.shellClass} .chat-actions {
  display:flex;
  gap:10px;
}
.${theme.shellClass} .btn {
  padding:10px 16px;
  border:none;
  border-radius:10px;
  cursor:pointer;
  font-weight:600;
  transition:.2s;
  display:inline-flex;
  align-items:center;
  gap:8px;
  background:${theme.surface};
  color:${theme.primaryDark};
  border:1px solid ${theme.border};
}
.${theme.shellClass} .btn i {
  font-size:13px;
}
.${theme.shellClass} .btn-primary {
  background:${theme.primaryButtonBg};
  color:${theme.primaryButtonColor};
  border:none;
  box-shadow:${theme.primaryShadow};
}
.${theme.shellClass} .btn-primary:hover {
  box-shadow:${theme.primaryHoverShadow};
  transform:translateY(-1px);
}
.${theme.shellClass} .btn:disabled {
  opacity:0.6;
  cursor:not-allowed;
  transform:none;
  box-shadow:none;
}
.${theme.shellClass} .chat-messages {
  flex:1;
  padding:24px;
  background:${theme.surfaceAlt};
  display:flex;
  flex-direction:column;
  gap:16px;
  overflow-y:auto;
}
.${theme.shellClass} .message-system {
  align-self:center;
  background:${theme.messageSystemBg};
  color:${theme.messageSystemColor};
  font-size:13px;
  padding:10px 18px;
  border-radius:20px;
  border:1px dashed ${theme.border};
}
.${theme.shellClass} .message {
  max-width:70%;
  padding:14px 16px;
  border-radius:18px;
  position:relative;
  box-shadow:0 6px 14px rgba(0,0,0,0.08);
  font-size:14px;
  line-height:1.5;
}
.${theme.shellClass} .message.mine {
  align-self:flex-end;
  background:${theme.mineGradient};
  color:${theme.messageMineColor};
  border-bottom-right-radius:6px;
}
.${theme.shellClass} .message.theirs {
  align-self:flex-start;
  background:${theme.theirsBg};
  color:${theme.messageTheirsColor};
  border-bottom-left-radius:6px;
  border:1px solid ${theme.theirsBorder};
}
.${theme.shellClass} .message.failed {
  background:${theme.statusFailedBg};
  color:${theme.statusFailedColor};
  border:1px solid ${theme.statusFailedColor};
}
.${theme.shellClass} .message-meta {
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:10px;
  margin-top:6px;
  font-size:11px;
  color:${theme.muted};
  opacity:0.75;
}
.${theme.shellClass} .message-meta .state {
  padding:2px 6px;
  border-radius:999px;
  text-transform:uppercase;
  letter-spacing:0.5px;
  font-weight:600;
}
.${theme.shellClass} .message-meta .state.sent {
  background:${theme.statusSentBg};
  color:${theme.statusSentColor};
}
.${theme.shellClass} .message-meta .state.delivered {
  background:${theme.statusDeliveredBg};
  color:${theme.statusDeliveredColor};
}
.${theme.shellClass} .message-meta .state.read {
  background:${theme.statusReadBg};
  color:${theme.statusReadColor};
}
.${theme.shellClass} .message-meta .state.sending {
  background:${theme.statusSendingBg};
  color:${theme.statusSendingColor};
}
.${theme.shellClass} .message-meta .state.failed {
  background:${theme.statusFailedBg};
  color:${theme.statusFailedColor};
}
.${theme.shellClass} .message-meta-actions {
  display:flex;
  align-items:center;
  gap:6px;
  margin-left:auto;
}
.${theme.shellClass} .message-meta-actions button {
  background:transparent;
  border:1px solid ${theme.softBorder};
  border-radius:6px;
  padding:4px 8px;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.4px;
  cursor:pointer;
  color:${theme.templateUseColor || theme.primary};
  transition:.2s;
}
.${theme.shellClass} .message-meta-actions button:hover:not(:disabled) {
  background:${theme.actionHoverBg};
}
.${theme.shellClass} .message-meta-actions button:disabled {
  opacity:0.6;
  cursor:not-allowed;
}
.${theme.shellClass} .message-edit-area {
  display:flex;
  flex-direction:column;
  gap:10px;
}
.${theme.shellClass} .message-edit-area textarea {
  width:100%;
  min-height:80px;
  border-radius:8px;
  border:1px solid ${theme.border};
  padding:10px 12px;
  resize:vertical;
  font-family:inherit;
}
.${theme.shellClass} .message-edit-actions {
  display:flex;
  justify-content:flex-end;
  gap:8px;
}
.${theme.shellClass} .message-edit-actions button {
  padding:6px 14px;
  border-radius:999px;
  border:1px solid ${theme.border};
  background:${theme.surface};
  cursor:pointer;
  font-size:12px;
  font-weight:600;
}
.${theme.shellClass} .message-edit-actions button.primary {
  background:${theme.primaryButtonBg};
  color:${theme.primaryButtonColor};
  border:none;
}
.${theme.shellClass} .chat-action-error {
  margin:12px 24px 0;
  padding:10px 14px;
  border-radius:10px;
  border:1px solid ${theme.statusFailedColor};
  background:${theme.statusFailedBg};
  color:${theme.statusFailedColor};
  font-size:12px;
}
.${theme.shellClass} .chat-empty {
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:40px;
  color:${theme.muted};
  text-align:center;
}
.${theme.shellClass} .chat-input {
  padding:20px 24px;
  border-top:1px solid ${theme.border};
  background:${theme.chatInputBg};
}
.${theme.shellClass} .message-compose {
  display:flex;
  gap:12px;
}
.${theme.shellClass} .message-input {
  flex:1;
  padding:12px 18px;
  border:1px solid ${theme.border};
  border-radius:999px;
  outline:none;
  resize:none;
  height:52px;
  font-family:inherit;
  background:${theme.surface};
  box-shadow:inset 0 1px 4px rgba(0,0,0,0.05);
}
.${theme.shellClass} .message-actions {
  display:flex;
  gap:8px;
}
.${theme.shellClass} .action-btn {
  width:52px;
  height:52px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:${theme.surface};
  border:1px solid ${theme.actionBorder};
  cursor:pointer;
  transition:.2s;
  color:${theme.actionButtonColor};
}
.${theme.shellClass} .action-btn:hover {
  background:${theme.actionHoverBg};
}
.${theme.shellClass} .action-btn.primary {
  background:${theme.primaryButtonBg};
  color:${theme.primaryButtonColor};
  border:none;
  box-shadow:${theme.primaryShadow};
}
.${theme.shellClass} .quick-templates,
.${theme.shellClass} .message-history {
  background:${theme.surface};
  border-radius:14px;
  border:1px solid ${theme.border};
  box-shadow:${theme.panelShadow};
  padding:26px;
  margin-bottom:30px;
}
.${theme.shellClass} .section-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:20px;
}
.${theme.shellClass} .section-title {
  font-size:20px;
  font-weight:700;
  color:${theme.primary};
}
.${theme.shellClass} .templates-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));
  gap:16px;
}
.${theme.shellClass} .template-card {
  background:${theme.templateBg};
  border-radius:12px;
  padding:18px;
  cursor:pointer;
  transition:.2s;
  border:1px solid ${theme.templateBorder};
  border-left:4px solid ${theme.templateDefaultAccent};
  box-shadow:${theme.templateShadow};
}
.${theme.shellClass} .template-card:hover {
  transform:translateY(-3px);
  box-shadow:${theme.templateHoverShadow};
}
.${theme.shellClass} .template-card.critical {
  border-left-color:${theme.templateCriticalAccent};
}
.${theme.shellClass} .template-card.urgent {
  border-left-color:${theme.templateUrgentAccent};
}
.${theme.shellClass} .template-title {
  font-weight:600;
  margin-bottom:8px;
  color:${theme.text};
}
.${theme.shellClass} .template-desc {
  font-size:14px;
  color:${theme.templateDescColor || theme.muted};
  margin-bottom:12px;
}
.${theme.shellClass} .template-use {
  font-size:12px;
  color:${theme.templateUseColor};
  font-weight:600;
  letter-spacing:0.4px;
}
.${theme.shellClass} .history-table {
  width:100%;
  border-collapse:collapse;
}
.${theme.shellClass} .history-table th,
.${theme.shellClass} .history-table td {
  padding:12px 15px;
  text-align:left;
  border-bottom:1px solid ${theme.softBorder};
  font-size:13px;
  color:${theme.text};
}
.${theme.shellClass} .history-table th {
  background:${theme.historyHeaderBg};
  font-weight:700;
  color:${theme.primary};
  letter-spacing:0.4px;
}
.${theme.shellClass} .history-table tr:hover {
  background:${theme.historyHoverBg};
}
.${theme.shellClass} .message-priority {
  padding:4px 10px;
  border-radius:12px;
  font-size:11px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:0.5px;
  color:${theme.text};
}
.${theme.shellClass} .priority-urgent {
  background:${theme.priorityUrgentBg};
  color:${theme.priorityUrgentColor};
}
.${theme.shellClass} .priority-high {
  background:${theme.priorityHighBg};
  color:${theme.priorityHighColor};
}
.${theme.shellClass} .priority-normal {
  background:${theme.priorityNormalBg};
  color:${theme.priorityNormalColor};
}
.${theme.shellClass} .message-status {
  padding:4px 10px;
  border-radius:12px;
  font-size:11px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:0.5px;
}
.${theme.shellClass} .status-sent {
  background:${theme.statusSentBg};
  color:${theme.statusSentColor};
}
.${theme.shellClass} .status-delivered {
  background:${theme.statusDeliveredBg};
  color:${theme.statusDeliveredColor};
}
.${theme.shellClass} .status-read {
  background:${theme.statusReadBg};
  color:${theme.statusReadColor};
}
.${theme.shellClass} .empty-state {
  padding:20px;
  text-align:center;
  color:${theme.muted};
  font-size:14px;
}
.${theme.shellClass} .detail-modal {
  position:fixed;
  inset:0;
  background:${theme.modalOverlay};
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000;
  padding:32px;
  backdrop-filter:blur(4px);
}
.${theme.shellClass} .detail-card {
  background:${theme.surface};
  border-radius:18px;
  width:min(520px, 95vw);
  box-shadow:0 30px 60px rgba(15,23,42,0.32);
  overflow:hidden;
  border:1px solid ${theme.detailBorder};
}
.${theme.shellClass} .detail-header {
  padding:22px 26px;
  background:${theme.detailGradient};
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.${theme.shellClass} .detail-title {
  font-size:18px;
  font-weight:700;
  color:${theme.detailTitleColor};
}
.${theme.shellClass} .detail-close {
  background:transparent;
  border:none;
  color:${theme.detailTitleColor};
  font-size:18px;
  cursor:pointer;
  padding:6px;
}
.${theme.shellClass} .detail-body {
  padding:24px 26px;
  display:flex;
  flex-direction:column;
  gap:16px;
}
.${theme.shellClass} .detail-row {
  display:flex;
  justify-content:space-between;
  gap:12px;
  font-size:13px;
  color:${theme.text};
}
.${theme.shellClass} .detail-row span:first-child {
  font-weight:600;
  color:${theme.detailTitleColor};
}
.${theme.shellClass} .detail-message {
  background:${theme.detailMessageBg};
  border-radius:14px;
  border:1px solid ${theme.detailMessageBorder};
  padding:16px;
  font-size:14px;
  color:${theme.text};
  line-height:1.6;
}
@media (max-width: 1100px) {
  .${theme.shellClass} .messaging-container {
    grid-template-columns:1fr;
  }
}
@media (max-width: 768px) {
  .${theme.shellClass} .header {
    flex-direction:column;
    align-items:flex-start;
    gap:16px;
  }
  .${theme.shellClass} .user-info {
    margin-top:0;
  }
  .${theme.shellClass} .templates-grid {
    grid-template-columns:1fr;
  }
  .${theme.shellClass} .chat-messages .message {
    max-width:85%;
  }
  .${theme.shellClass} .history-table {
    display:block;
    overflow-x:auto;
  }
}
@media (max-width: 520px) {
  .${theme.shellClass} .chat-actions {
    flex-direction:column;
    gap:8px;
  }
  .${theme.shellClass} .message-compose {
    flex-direction:column;
  }
  .${theme.shellClass} .message-actions {
    justify-content:flex-end;
  }
}
`;

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
  theme,
}) {
  const navigate = useNavigate();
  const user = getUser();
  const currentUserId = user?._id || user?.id || user?.userId || '';
  const currentCrewId = user?.crewId ? String(user.crewId) : '';
  const userFullName = user?.fullName || 'Officer';
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Officer';
  const userVessel = user?.vessel || '';
  const roleFilters = useMemo(() => roleFiltersFromProp(contactFilter), [contactFilter]);
  const resolvedTheme = useMemo(() => ({ ...DEFAULT_THEME, ...(theme || {}) }), [theme]);
  const themeStyles = useMemo(() => buildThemeStyles(resolvedTheme), [resolvedTheme]);
  const userAvatarBg = resolvedTheme.avatarColorOverride || colorFromString(userFullName || userRole || 'Officer');
  const userAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userFullName)}&background=${userAvatarBg}&color=fff`;
  const rootClassName = ['dashboard-container', resolvedTheme.shellClass, resolvedTheme.wrapperClass]
    .filter(Boolean)
    .join(' ');

  const [contactSearch, setContactSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [activeId, setActiveId] = useState('');

  const [threadMessages, setThreadMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef(null);

  const [editingMessageId, setEditingMessageId] = useState('');
  const [editDraft, setEditDraft] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState('');
  const [actionError, setActionError] = useState('');

  const beginEditMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditDraft(msg.text);
    setEditSaving(false);
    setActionError('');
  };


  const cancelEditMessage = () => {
    setEditingMessageId('');
    setEditDraft('');
    setEditSaving(false);
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId) return;
    const trimmed = editDraft.trim();
    if (!trimmed) {
      setActionError('Updated message cannot be empty.');
      return;
    }
    try {
      setEditSaving(true);
      await updateEmergencyMessageContent(editingMessageId, { content: trimmed });
      cancelEditMessage();
      await loadThread(activeId);
    } catch (err) {
      console.error('saveEditedMessage error', err);
      setActionError('Failed to update message.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || deletingMessageId) return;
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Delete this message? This action cannot be undone.');
    if (!confirmed) return;
    try {
      setDeletingMessageId(messageId);
      setActionError('');
      await deleteEmergencyMessage(messageId);
      if (editingMessageId === messageId) {
        cancelEditMessage();
      }
      await loadThread(activeId);
    } catch (err) {
      console.error('handleDeleteMessage error', err);
      setActionError('Failed to delete message.');
    } finally {
      setDeletingMessageId('');
    }
  };

  const departmentLabelForRole = useCallback((role) => {
    const normalized = (role || '').toLowerCase();
    switch (normalized) {
      case 'health':
        return 'Medical Team';
      case 'emergency':
        return 'Emergency Response';
      case 'inventory':
        return 'Logistics & Supply';
      case 'admin':
        return 'Bridge & Command';
      default:
        return 'Crew';
    }
  }, []);

  const roleLabelFor = useCallback((role, fallbackPosition) => {
    if (fallbackPosition) return fallbackPosition;
    const normalized = (role || '').toLowerCase();
    switch (normalized) {
      case 'health':
        return 'Medical Officer';
      case 'emergency':
        return 'Emergency Officer';
      case 'inventory':
        return 'Logistics Coordinator';
      case 'admin':
        return 'Command Officer';
      default:
        return 'Crew Member';
    }
  }, []);

  const loadContacts = async () => {
    setLoadingContacts(true);
    setContactsError('');
    try {
      const data = await listMessagingContacts();
      const formatted = (data || [])
        .map((raw) => ({
          ...raw,
          id: String(raw.id || raw._id || raw.crewId || ''),
        }))
        .filter((c) => {
          if (!c.id) return false;
          if (currentUserId && String(c.id) === String(currentUserId)) return false;
          if (currentCrewId && c.crewId && String(c.crewId) === currentCrewId) return false;
          return true;
        })
        .map((c) => {
          const accountRole = String(c.role || 'crew').toLowerCase();
          const department = c.department || departmentLabelForRole(accountRole);
          const roleLabel = roleLabelFor(accountRole, c.position);
          const avatarSeed = c.crewId || c.fullName || c.email || c.id;
          return {
            id: c.id,
            contactId: c.id,
            crewId: c.crewId || '',
            name: c.fullName,
            department,
            roleLabel,
            avatarBg: colorFromString(String(avatarSeed || 'Crewmate')),
            status: c.status === 'active' ? 'online' : 'offline',
            accountRole,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

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
        rawStatus: m.status,
        canEdit: currentUserId && String(m.fromId) === String(currentUserId) && (!m.status || m.status === 'sent'),
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

    setActionError('');
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
      await loadThread(activeContact.id);
    } catch (err) {
      console.error('sendEmergencyMessage error', err);
      setThreadMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'failed' } : msg)));
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    if (!activeContact) return;
    window.alert(`Calling ${activeContact.name}… (feature coming soon)`);
  };

  const handleVideo = () => {
    if (!activeContact) return;
    window.alert(`Starting video call with ${activeContact.name}… (feature coming soon)`);
  };

  return (
    <div className={rootClassName}>
      <style>{themeStyles}</style>

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
                    <button className="btn btn-primary" onClick={handleCall}><i className="fas fa-phone" /> Call</button>
                    <button className="btn" onClick={handleVideo}><i className="fas fa-video" /> Video</button>
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
                    threadMessages.map((msg) => {
                      const isEditing = editingMessageId === msg.id;
                      const isDeleting = deletingMessageId === msg.id;
                      return (
                        <div
                          key={msg.id}
                          className={`message ${msg.isMine ? 'mine' : 'theirs'} ${msg.status === 'failed' ? 'failed' : ''}`}
                        >
                          {isEditing ? (
                            <div className="message-edit-area">
                              <textarea
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                disabled={editSaving}
                              />
                              <div className="message-edit-actions">
                                <button type="button" onClick={cancelEditMessage} disabled={editSaving}>Cancel</button>
                                <button
                                  type="button"
                                  className="primary"
                                  onClick={saveEditedMessage}
                                  disabled={editSaving}
                                >
                                  {editSaving ? 'Saving…' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="message-text">{msg.text}</div>
                              <div className="message-meta">
                                <span>{msg.time}</span>
                                {msg.status && (
                                  <span className={`state ${msg.status}`}>{msg.status}</span>
                                )}
                                <div className="message-meta-actions">
                                  {msg.canEdit && (
                                    <button type="button" onClick={() => beginEditMessage(msg)} disabled={editSaving || deletingMessageId}>Edit</button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    disabled={isDeleting || editSaving}
                                  >
                                    {isDeleting ? 'Deleting…' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {actionError && (
                  <div className="chat-action-error">{actionError}</div>
                )}

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

          <div className="quick-templates">
            <div className="section-header">
              <div className="section-title">Quick Message Templates</div>
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
        </div>
      </div>
    </div>
  );
}