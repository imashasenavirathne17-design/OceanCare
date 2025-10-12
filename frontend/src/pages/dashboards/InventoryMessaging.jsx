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
    />
  );
}
