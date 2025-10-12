import React from 'react';
import EmergencySidebar from './EmergencySidebar';
import MessagingShell from './messaging/MessagingShell';

const EMERGENCY_TEMPLATES = [
  {
    key: 'critical',
    title: 'Cardiac Emergency Alert',
    desc: 'Critical cardiac event in progress. Request immediate medical assistance and prepare defibrillator.',
    cls: 'critical',
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

export default function EmergencyMessaging() {
  return (
    <MessagingShell
      SidebarComponent={EmergencySidebar}
      pageTitle="Emergency Messaging"
      contactFilter={['emergency', 'health', 'crew']}
      placeholder="Search emergency contacts"
      statusBadge="On Duty"
      templates={EMERGENCY_TEMPLATES}
      emptyMessage="Select an emergency contact or crew member to start coordinating."
    />
  );
}
