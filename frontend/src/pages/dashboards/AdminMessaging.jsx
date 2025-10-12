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
    />
  );
}
