import React from 'react';
import HealthSidebar from './HealthSidebar';
import MessagingShell from './messaging/MessagingShell';

const HEALTH_TEMPLATES = [
  {
    key: 'followup',
    title: 'Schedule Follow-up Check',
    desc: 'Reminder: Please schedule a follow-up exam within the next 24 hours for the crew member under observation.',
  },
  {
    key: 'medication',
    title: 'Medication Adherence Alert',
    desc: 'Please confirm the crew member has taken the prescribed medication according to the latest regimen.',
  },
  {
    key: 'report',
    title: 'Submit Vital Report',
    desc: 'Submit the latest vital readings for the assigned crew member before end of shift.',
    cls: 'urgent',
  },
];

const HEALTH_THEME = {
  wrapperClass: 'health-dashboard',
  background: '#f5f7fb',
  surface: '#ffffff',
  surfaceAlt: '#f1fdf9',
  border: '#d6efe8',
  softBorder: '#e3f5ef',
  primary: '#2a9d8f',
  primaryDark: '#1e7d71',
  primaryLight: '#e3f5ef',
  gradient: 'linear-gradient(135deg, rgba(42,157,143,0.12) 0%, rgba(227,245,239,0.9) 100%)',
  headerShadow: '0 16px 32px rgba(42,157,143,0.12)',
  panelShadow: '0 18px 32px rgba(42,157,143,0.1)',
  templateShadow: '0 10px 20px rgba(42,157,143,0.1)',
  templateShadowHover: '0 14px 26px rgba(42,157,143,0.18)',
  statusBadgeBg: 'rgba(42,157,143,0.12)',
  statusBadgeBorder: '1px solid rgba(42,157,143,0.35)',
  statusBadgeColor: '#1e7d71',
  mineGradient: 'linear-gradient(135deg, #2a9d8f 0%, #1e7d71 100%)',
  theirsBg: '#f1fdf9',
  theirsBorder: '#d6efe8',
  chatInputBg: '#edf9f5',
  actionBorder: '#d6efe8',
  actionHoverBg: '#e2f5ef',
  primaryButtonBg: 'linear-gradient(135deg, #2a9d8f 0%, #1e7d71 100%)',
  primaryShadow: '0 12px 22px rgba(42,157,143,0.2)',
  primaryHoverShadow: '0 16px 28px rgba(42,157,143,0.26)',
  historyHeaderBg: '#e3f5ef',
  historyHoverBg: '#edf9f5',
  templateDefaultAccent: '#2a9d8f',
  templateCriticalAccent: '#e63946',
  templateUrgentAccent: '#f4a261',
  templateDescColor: '#3e6b65',
  templateUseColor: '#1e7d71',
  detailGradient: 'linear-gradient(135deg, rgba(42,157,143,0.18) 0%, rgba(227,245,239,0.95) 100%)',
  detailBorder: '#cbe9e1',
  detailMessageBg: '#edf9f5',
  detailMessageBorder: '#d6efe8',
  detailMessageColor: '#2f4f4b',
  messageSystemBg: '#edf9f5',
  messageSystemColor: '#1e7d71',
  contactGroupBg: '#edf9f5',
  contactActiveBg: 'rgba(42,157,143,0.12)',
  actionButtonColor: '#1e7d71',
  statusSentBg: 'rgba(42,157,143,0.18)',
  statusSentColor: '#1e7d71',
  statusDeliveredBg: 'rgba(58,134,255,0.18)',
  statusDeliveredColor: '#3a86ff',
  statusReadBg: 'rgba(230,57,70,0.18)',
  statusReadColor: '#e63946',
  avatarColorOverride: '2a9d8f',
};

export default function HealthMessaging() {
  return (
    <MessagingShell
      SidebarComponent={HealthSidebar}
      pageTitle="Health Officer Messaging"
      contactFilter={['admin', 'health', 'crew']}
      placeholder="Search medical staff or crew"
      statusBadge="Clinic Duty"
      templates={HEALTH_TEMPLATES}
      emptyMessage="Select a health team member or crew profile to begin medical coordination."
      theme={HEALTH_THEME}
      selfInboxWhenContactIsAdmin
    />
  );
}
