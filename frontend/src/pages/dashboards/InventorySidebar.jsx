import React from 'react';
import { Link } from 'react-router-dom';
import './InventorySidebar.css';

/*
  Sidebar for Inventory Manager Dashboard
*/
export default function InventorySidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <i className="fas fa-boxes" aria-hidden="true"></i>
        <h1>OCEANCARE INVENTORY</h1>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard/inventory" className="active">
            <i className="fas fa-home"></i> Dashboard
          </Link>
        </li>
        <li><a href="#add-item"><i className="fas fa-plus-circle"></i> Add Item</a></li>
        <li><a href="#update-qty"><i className="fas fa-edit"></i> Update Stock</a></li>
        <li><a href="#alerts"><i className="fas fa-bell"></i> Low Stock Alerts</a></li>
        <li><a href="#expiry"><i className="fas fa-hourglass-end"></i> Expiry Monitor</a></li>
        <li><a href="#zones"><i className="fas fa-layer-group"></i> Storage Zones</a></li>
        <li><a href="#usage"><i className="fas fa-clinic-medical"></i> Usage Monitor</a></li>
        <li><a href="#reports"><i className="fas fa-file-alt"></i> Reports</a></li>
        <li><a href="#history"><i className="fas fa-history"></i> History / Audit</a></li>
        <li><a href="#sync"><i className="fas fa-sync"></i> Offline Sync</a></li>
        <li><a href="#predict"><i className="fas fa-chart-line"></i> Predictive Restock</a></li>
        <li><a href="#thresholds"><i className="fas fa-sliders-h"></i> Auto Threshold</a></li>
        <li><a href="#transfer"><i className="fas fa-shipping-fast"></i> Transfer</a></li>
        <li><a href="#scan"><i className="fas fa-qrcode"></i> Scan</a></li>
        <li><a href="#waste"><i className="fas fa-trash"></i> Waste/Disposal</a></li>
        <li>
          <button className="linklike" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
