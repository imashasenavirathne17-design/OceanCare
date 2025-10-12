import React from 'react';
import InventorySidebar from './InventorySidebar';
import MessagingShell from './messaging/MessagingShell';

const INVENTORY_TEMPLATES = [
  {
    key: 'restock',
    title: 'Restock Alert',
    desc: 'Supplies running low. Please confirm inventory counts and initiate restock request immediately.',
    cls: 'urgent',
  },
  {
    key: 'temperature',
    title: 'Cold Storage Check',
    desc: 'Please verify cold storage temperature logs and report any anomalies.',
  },
  {
    key: 'dispatch',
    title: 'Dispatch Confirmation',
    desc: 'Confirm dispatch of medical kits to the emergency bay and update inventory records.',
  },
];

const INVENTORY_THEME = {
  wrapperClass: 'inventory-dashboard',
  background: '#fff7ef',
  surface: '#ffffff',
  surfaceAlt: '#fffaf3',
  border: '#ffe0c7',
  softBorder: '#ffe9d6',
  primary: '#f4a261',
  primaryDark: '#d8802a',
  primaryLight: '#fff1e4',
  gradient: 'linear-gradient(135deg, rgba(244,162,97,0.12) 0%, rgba(255,241,228,0.9) 100%)',
  headerShadow: '0 16px 32px rgba(244,162,97,0.12)',
  panelShadow: '0 18px 32px rgba(244,162,97,0.1)',
  templateShadow: '0 10px 20px rgba(244,162,97,0.1)',
  templateShadowHover: '0 14px 26px rgba(244,162,97,0.18)',
  statusBadgeBg: 'rgba(244,162,97,0.12)',
  statusBadgeBorder: '1px solid rgba(244,162,97,0.35)',
  statusBadgeColor: '#d8802a',
  mineGradient: 'linear-gradient(135deg, #f4a261 0%, #d8802a 100%)',
  theirsBg: '#fff3e6',
  theirsBorder: '#ffe0c7',
  chatInputBg: '#fff3e6',
  actionBorder: '#ffe0c7',
  actionHoverBg: '#ffe9d6',
  primaryButtonBg: 'linear-gradient(135deg, #f4a261 0%, #d8802a 100%)',
  primaryShadow: '0 12px 22px rgba(244,162,97,0.2)',
  primaryHoverShadow: '0 16px 28px rgba(244,162,97,0.26)',
  historyHeaderBg: '#fff1e4',
  historyHoverBg: '#fff6ea',
  templateDefaultAccent: '#f4a261',
  templateCriticalAccent: '#e63946',
  templateUrgentAccent: '#ff9e00',
  templateDescColor: '#805d42',
  templateUseColor: '#d8802a',
  detailGradient: 'linear-gradient(135deg, rgba(244,162,97,0.18) 0%, rgba(255,241,228,0.95) 100%)',
  detailBorder: '#ffe0c7',
  detailMessageBg: '#fff6ea',
  detailMessageBorder: '#ffe0c7',
  detailMessageColor: '#503b2a',
  messageSystemBg: '#fff3e6',
  messageSystemColor: '#d8802a',
  contactGroupBg: '#fff3e6',
  contactActiveBg: 'rgba(244,162,97,0.12)',
  actionButtonColor: '#d8802a',
  statusSentBg: 'rgba(42,157,143,0.18)',
  statusSentColor: '#2a9d8f',
  statusDeliveredBg: 'rgba(58,134,255,0.18)',
  statusDeliveredColor: '#3a86ff',
  statusReadBg: 'rgba(230,57,70,0.18)',
  statusReadColor: '#e63946',
  avatarColorOverride: 'f4a261',
};

export default function InventoryMessaging() {
  return (
    <MessagingShell
      SidebarComponent={InventorySidebar}
      pageTitle="Inventory Messaging"
      contactFilter={['inventory', 'health', 'emergency']}
      placeholder="Search supply chain contacts"
      statusBadge="Logistics Duty"
      templates={INVENTORY_TEMPLATES}
      emptyMessage="Select supply or medical staff to coordinate inventory tasks."
      theme={INVENTORY_THEME}
    />
  );
}
