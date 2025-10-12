import React from 'react';
import AdminSidebar from './AdminSidebar';
import MessagingShell from './messaging/MessagingShell';

const ADMIN_TEMPLATES = [
  {
    key: 'broadcast',
    title: 'Broadcast Alert',
    desc: 'Attention all departments: please review the latest operational protocol update and acknowledge receipt.',
    cls: 'critical',
  },
  {
    key: 'inspection',
    title: 'Inspection Schedule Notice',
    desc: 'Reminding department leads of the upcoming safety inspection. Submit readiness checklist today.',
  },
  {
    key: 'staffing',
    title: 'Staffing Update Request',
    desc: 'Please provide staffing availability for the next shift cycle.',
  },
];

const ADMIN_THEME = {
  wrapperClass: 'admin-dashboard',
  background: '#f5f7fb',
  surface: '#ffffff',
  surfaceAlt: '#f7f5ff',
  border: '#e5e7eb',
  softBorder: '#f1f5f9',
  primary: '#8338ec',
  primaryDark: '#6a2bc9',
  primaryLight: '#eef2ff',
  gradient: 'linear-gradient(135deg, rgba(131,56,236,0.12) 0%, rgba(237,242,255,0.9) 100%)',
  headerShadow: '0 16px 32px rgba(131,56,236,0.12)',
  panelShadow: '0 18px 32px rgba(131,56,236,0.1)',
  templateShadow: '0 10px 20px rgba(131,56,236,0.1)',
  templateShadowHover: '0 14px 26px rgba(131,56,236,0.18)',
  statusBadgeBg: 'rgba(131,56,236,0.12)',
  statusBadgeBorder: '1px solid rgba(131,56,236,0.3)',
  statusBadgeColor: '#6a2bc9',
  mineGradient: 'linear-gradient(135deg, #8338ec 0%, #6a2bc9 100%)',
  theirsBg: '#f4f0ff',
  theirsBorder: '#e1d9ff',
  chatInputBg: '#f7f5ff',
  actionBorder: '#e5e7eb',
  actionHoverBg: '#ede6ff',
  primaryButtonBg: 'linear-gradient(135deg, #8338ec 0%, #6a2bc9 100%)',
  primaryShadow: '0 12px 22px rgba(131,56,236,0.2)',
  primaryHoverShadow: '0 16px 28px rgba(131,56,236,0.26)',
  historyHeaderBg: '#f3efff',
  historyHoverBg: '#f8f5ff',
  templateDefaultAccent: '#8338ec',
  templateCriticalAccent: '#ff006e',
  templateUrgentAccent: '#ff9e00',
  templateDescColor: '#5b5f7a',
  templateUseColor: '#6a2bc9',
  detailGradient: 'linear-gradient(135deg, rgba(131,56,236,0.18) 0%, rgba(237,242,255,0.95) 100%)',
  detailBorder: '#e1d9ff',
  detailMessageBg: '#f7f5ff',
  detailMessageBorder: '#e1d9ff',
  detailMessageColor: '#2f2b4a',
  messageSystemBg: '#f0ecff',
  messageSystemColor: '#6a2bc9',
  contactGroupBg: '#f0ecff',
  contactActiveBg: 'rgba(131,56,236,0.12)',
  actionButtonColor: '#6a2bc9',
  statusSentBg: 'rgba(131,56,236,0.18)',
  statusSentColor: '#6a2bc9',
  statusDeliveredBg: 'rgba(58,134,255,0.18)',
  statusDeliveredColor: '#3a86ff',
  statusReadBg: 'rgba(255,0,110,0.18)',
  statusReadColor: '#ff006e',
  avatarColorOverride: '8338ec',
};

export default function AdminMessaging() {
  return (
    <MessagingShell
      SidebarComponent={AdminSidebar}
      pageTitle="Admin Messaging"
      contactFilter="all"
      placeholder="Search departments or crew"
      statusBadge="Bridge Duty"
      templates={ADMIN_TEMPLATES}
      emptyMessage="Select a department or crew member to send administrative communications."
      theme={ADMIN_THEME}
    />
  );
}
