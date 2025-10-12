import React from 'react';
import CrewSidebar from './CrewSidebar';
import MessagingShell from './messaging/MessagingShell';

export default function CrewMessaging() {
  return (
    <MessagingShell
      SidebarComponent={CrewSidebar}
      pageTitle="Crew Messaging"
      contactFilter="crew"
      placeholder="Search shipmates or departments"
    />
  );
}
