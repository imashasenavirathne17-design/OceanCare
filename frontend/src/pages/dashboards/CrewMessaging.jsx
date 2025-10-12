import React from 'react';
import CrewSidebar from './CrewSidebar';
import MessagingShell from './messaging/MessagingShell';

const CREW_THEME = {
  wrapperClass: 'crew-dashboard',
  background: '#f5f7fb',
  surface: '#ffffff',
  surfaceAlt: '#f0f4ff',
  border: '#d6e4ff',
  softBorder: '#e5edff',
  primary: '#3a86ff',
  primaryDark: '#2a6ec9',
  primaryLight: '#eef4ff',
  gradient: 'linear-gradient(135deg, rgba(58,134,255,0.12) 0%, rgba(226,240,255,0.9) 100%)',
  headerShadow: '0 16px 32px rgba(58,134,255,0.12)',
  panelShadow: '0 18px 32px rgba(58,134,255,0.1)',
  templateShadow: '0 10px 20px rgba(58,134,255,0.1)',
  templateShadowHover: '0 14px 26px rgba(58,134,255,0.18)',
  statusBadgeBg: 'rgba(58,134,255,0.12)',
  statusBadgeBorder: '1px solid rgba(58,134,255,0.35)',
  statusBadgeColor: '#2a6ec9',
  mineGradient: 'linear-gradient(135deg, #3a86ff 0%, #2a6ec9 100%)',
  theirsBg: '#f4f8ff',
  theirsBorder: '#dce8ff',
  chatInputBg: '#eef4ff',
  actionBorder: '#d6e4ff',
  actionHoverBg: '#e3edff',
  primaryButtonBg: 'linear-gradient(135deg, #3a86ff 0%, #2a6ec9 100%)',
  primaryShadow: '0 12px 22px rgba(58,134,255,0.2)',
  primaryHoverShadow: '0 16px 28px rgba(58,134,255,0.26)',
  historyHeaderBg: '#eef4ff',
  historyHoverBg: '#f4f8ff',
  templateDefaultAccent: '#3a86ff',
  templateCriticalAccent: '#e63946',
  templateUrgentAccent: '#f4a261',
  templateDescColor: '#5a6b8c',
  templateUseColor: '#2a6ec9',
  detailGradient: 'linear-gradient(135deg, rgba(58,134,255,0.18) 0%, rgba(228,240,255,0.95) 100%)',
  detailBorder: '#d6e4ff',
  detailMessageBg: '#eef4ff',
  detailMessageBorder: '#d6e4ff',
  detailMessageColor: '#2c3e60',
  messageSystemBg: '#eef4ff',
  messageSystemColor: '#2a6ec9',
  contactGroupBg: '#eef4ff',
  contactActiveBg: 'rgba(58,134,255,0.12)',
  actionButtonColor: '#2a6ec9',
  statusSentBg: 'rgba(58,134,255,0.18)',
  statusSentColor: '#2a6ec9',
  statusDeliveredBg: 'rgba(42,157,143,0.18)',
  statusDeliveredColor: '#2a9d8f',
  statusReadBg: 'rgba(230,57,70,0.18)',
  statusReadColor: '#e63946',
  avatarColorOverride: '3a86ff',
};

export default function CrewMessaging() {
  return (
    <MessagingShell
      SidebarComponent={CrewSidebar}
      pageTitle="Crew Messaging"
      contactFilter="crew"
      placeholder="Search shipmates or departments"
      statusBadge="Watch Duty"
      theme={CREW_THEME}
    />
  );
}
