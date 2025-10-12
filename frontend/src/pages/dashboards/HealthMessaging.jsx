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

export default function HealthMessaging() {
  return (
    <MessagingShell
      SidebarComponent={HealthSidebar}
      pageTitle="Health Officer Messaging"
      contactFilter={['health', 'crew']}
      placeholder="Search medical staff or crew"
      statusBadge="Clinic Duty"
      templates={HEALTH_TEMPLATES}
      emptyMessage="Select a health team member or crew profile to begin medical coordination."
    />
  );
}
