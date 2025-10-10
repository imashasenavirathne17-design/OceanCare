import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './InventorySidebar.css';

/*
  Sidebar for Inventory Manager Dashboard
*/
export default function InventorySidebar({ onLogout }) {
  const { pathname } = useLocation();
  const initialActive = pathname.includes('/dashboard/inventory/items')
    ? 'inventory-items'
    : pathname.includes('/dashboard/inventory/stock')
    ? 'stock-management'
    : pathname.includes('/dashboard/inventory/expiry')
    ? 'expiry-tracking'
    : pathname.includes('/dashboard/inventory/zones')
    ? 'storage-zones'
    : pathname.includes('/dashboard/inventory/reports')
    ? 'reports'
    : pathname.includes('/dashboard/inventory/audit-trail')
    ? 'audit-trail'
    : pathname.includes('/dashboard/inventory/barcode')
    ? 'barcode'
    : pathname.includes('/dashboard/inventory/waste')
    ? 'waste'
    : pathname.includes('/dashboard/inventory/predict')
    ? 'predict'
    : pathname.includes('/dashboard/inventory/transfer')
    ? 'transfer'
    : 'dashboard';
  const [active, setActive] = useState(initialActive);

  // Keep active state in sync with the URL on navigation
  useEffect(() => {
    if (pathname.includes('/dashboard/inventory/items')) setActive('inventory-items');
    else if (pathname.includes('/dashboard/inventory/stock')) setActive('stock-management');
    else if (pathname.includes('/dashboard/inventory/expiry')) setActive('expiry-tracking');
    else if (pathname.includes('/dashboard/inventory/zones')) setActive('storage-zones');
    else if (pathname.includes('/dashboard/inventory/reports')) setActive('reports');
    else if (pathname.includes('/dashboard/inventory/audit-trail')) setActive('audit-trail');
    else if (pathname.includes('/dashboard/inventory/barcode')) setActive('barcode');
    else if (pathname.includes('/dashboard/inventory/waste')) setActive('waste');
    else if (pathname.includes('/dashboard/inventory/predict')) setActive('predict');
    else if (pathname.includes('/dashboard/inventory/transfer')) setActive('transfer');
    else setActive('dashboard');
  }, [pathname]);

  return (
    <aside className="sidebar">
      <div className="logo">
        <i className="fas fa-boxes" aria-hidden="true"></i>
        <h1>OCEANCARE INVENTORY</h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard/inventory" className={active === 'dashboard' ? 'active' : ''} onClick={() => setActive('dashboard')}>
            <i className="fas fa-home"></i> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/items" className={active === 'inventory-items' ? 'active' : ''} onClick={() => setActive('inventory-items')}>
            <i className="fas fa-briefcase"></i> Inventory Items
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/stock" className={active === 'stock-management' ? 'active' : ''} onClick={() => setActive('stock-management')}>
            <i className="fas fa-warehouse"></i> Stock Management
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/expiry" className={active === 'expiry-tracking' ? 'active' : ''} onClick={() => setActive('expiry-tracking')}>
            <i className="fas fa-calendar-days"></i> Expiry Tracking
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/zones" className={active === 'storage-zones' ? 'active' : ''} onClick={() => setActive('storage-zones')}>
            <i className="fas fa-map-marker-alt"></i> Storage Zones
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/reports" className={active === 'reports' ? 'active' : ''} onClick={() => setActive('reports')}>
            <i className="fas fa-chart-bar"></i> Reports
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/audit-trail" className={active === 'audit-trail' ? 'active' : ''} onClick={() => setActive('audit-trail')}>
            <i className="fas fa-history"></i> Audit Trail
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/barcode" className={active === 'barcode' ? 'active' : ''} onClick={() => setActive('barcode')}>
            <i className="fas fa-barcode"></i> Barcode Scanning
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/waste" className={active === 'waste' ? 'active' : ''} onClick={() => setActive('waste')}>
            <i className="fas fa-trash-alt"></i> Waste Disposal
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/predict" className={active === 'predict' ? 'active' : ''} onClick={() => setActive('predict')}>
            <i className="fas fa-chart-line"></i> Predictive Restocking
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory/transfer" className={active === 'transfer' ? 'active' : ''} onClick={() => setActive('transfer')}>
            <i className="fas fa-ship"></i> Fleet Transfer
          </Link>
        </li>
        <li>
          <button className="linklike" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
