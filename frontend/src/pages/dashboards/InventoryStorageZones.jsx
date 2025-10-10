import React, { useState } from 'react';
import { getUser } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryStorageZones.css';

export default function InventoryStorageZones() {
  const user = getUser();

  const [activeDeck, setActiveDeck] = useState('Upper Deck');
  const [modalOpen, setModalOpen] = useState(false);

  const openAssignItems = () => setModalOpen(true);
  const closeAssignItems = () => setModalOpen(false);

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-container">
        <InventorySidebar onLogout={() => {}} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Storage Zones Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Ship Layout */}
          <div className="ship-layout">
            <div className="section-header">
              <div className="section-title">Ship Storage Layout</div>
              <button className="btn btn-primary" id="addNewZone" onClick={() => alert('Opening new storage zone creation interface...')}>
                <i className="fas fa-plus"/> Add New Zone
              </button>
            </div>

            <div className="deck-navigation">
              {['Upper Deck','Main Deck','Lower Deck','Engine Room','Emergency Stations'].map(d => (
                <button key={d} className={`deck-btn ${activeDeck===d?'active':''}`} onClick={()=>{ setActiveDeck(d); alert(`Loading ${d} layout...`); }}>{d}</button>
              ))}
            </div>

            <div className="ship-map">
              {/* Medical Bay */}
              <div className="zone-marker active" style={{top:'20%', left:'30%', background:'#e3f2fd', borderColor:'#3a86ff'}} onClick={()=>alert('Loading details for medical bay...')}>
                <div className="zone-icon" style={{color:'#3a86ff'}}><i className="fas fa-hospital"/></div>
                <div className="zone-name">Medical Bay</div>
                <div className="zone-count">24 items</div>
              </div>
              {/* Emergency Cart */}
              <div className="zone-marker" style={{top:'60%', left:'25%', background:'#fff5f5', borderColor:'#e63946'}} onClick={()=>alert('Loading details for emergency cart...')}>
                <div className="zone-icon" style={{color:'#e63946'}}><i className="fas fa-first-aid"/></div>
                <div className="zone-name">Emergency Cart</div>
                <div className="zone-count">18 items</div>
              </div>
              {/* Medical Storage A */}
              <div className="zone-marker" style={{top:'40%', left:'60%', background:'#e8f5e8', borderColor:'#2a9d8f'}} onClick={()=>alert('Loading details for medical storage A...')}>
                <div className="zone-icon" style={{color:'#2a9d8f'}}><i className="fas fa-archive"/></div>
                <div className="zone-name">Medical Storage A</div>
                <div className="zone-count">42 items</div>
              </div>
              {/* Refrigerated Storage */}
              <div className="zone-marker" style={{top:'70%', left:'65%', background:'#e3f2fd', borderColor:'#3a86ff'}} onClick={()=>alert('Loading details for refrigerated storage...')}>
                <div className="zone-icon" style={{color:'#3a86ff'}}><i className="fas fa-snowflake"/></div>
                <div className="zone-name">Refrigerated Storage</div>
                <div className="zone-count">12 items</div>
              </div>
              {/* Bridge First Aid */}
              <div className="zone-marker" style={{top:'15%', left:'75%', background:'#fff4e5', borderColor:'#f4a261'}} onClick={()=>alert('Loading details for bridge first aid...')}>
                <div className="zone-icon" style={{color:'#f4a261'}}><i className="fas fa-first-aid"/></div>
                <div className="zone-name">Bridge First Aid</div>
                <div className="zone-count">8 items</div>
              </div>
            </div>
          </div>

          {/* Zone Statistics */}
          <div className="zone-stats">
            <div className="stat-card"><div className="stat-icon items"><i className="fas fa-boxes"/></div><div className="stat-value">142</div><div className="stat-label">Total Items Across Zones</div></div>
            <div className="stat-card"><div className="stat-icon low"><i className="fas fa-exclamation-triangle"/></div><div className="stat-value">8</div><div className="stat-label">Zones with Low Stock</div></div>
            <div className="stat-card"><div className="stat-icon expiring"><i className="fas fa-clock"/></div><div className="stat-value">5</div><div className="stat-label">Zones with Expiring Items</div></div>
            <div className="stat-card"><div className="stat-icon categories"><i className="fas fa-tags"/></div><div className="stat-value">12</div><div className="stat-label">Active Storage Zones</div></div>
          </div>

          {/* Zone Details (Medical Bay demo) */}
          <div className="zone-details active" id="medical-bay-details">
            <div className="zone-header">
              <div className="zone-info">
                <div className="zone-title">Medical Bay</div>
                <div className="zone-meta">
                  <div className="zone-meta-item"><i className="fas fa-map-marker-alt"/> <span>Upper Deck, Starboard Side</span></div>
                  <div className="zone-meta-item"><i className="fas fa-thermometer-half"/> <span>Temperature Controlled: 18-22°C</span></div>
                  <div className="zone-meta-item"><i className="fas fa-user-shield"/> <span>Access: Medical Staff Only</span></div>
                </div>
                <div className="zone-status" style={{ color:'var(--success)', fontWeight:600 }}>
                  <i className="fas fa-check-circle"/> All items adequately stocked
                </div>
              </div>
              <div className="zone-actions">
                <button className="btn btn-primary"><i className="fas fa-edit"/> Edit Zone</button>
                <button className="btn btn-success" id="assignItems" onClick={openAssignItems}><i className="fas fa-plus"/> Assign Items</button>
                <button className="btn"><i className="fas fa-print"/> Print Label</button>
              </div>
            </div>

            <div className="zone-table-container">
              <div className="table-header">
                <div className="table-title">Items in Medical Bay</div>
                <div className="table-actions">
                  <button className="btn"><i className="fas fa-download"/> Export</button>
                  <button className="btn btn-primary"><i className="fas fa-sync-alt"/> Refresh</button>
                </div>
              </div>
              <table className="zone-table">
                <thead><tr><th>Item Name</th><th>Category</th><th>Current Stock</th><th>Min Stock</th><th>Expiry Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr>
                    <td>Sterile Bandages</td><td>Medical Supply</td><td>125</td><td>50</td><td>2025-08-20</td>
                    <td><span className="item-status status-adequate">ADEQUATE</span></td>
                    <td className="item-actions"><button className="btn btn-primary btn-sm"><i className="fas fa-edit"/> Edit</button><button className="btn btn-sm"><i className="fas fa-exchange-alt"/> Move</button></td>
                  </tr>
                  <tr>
                    <td>Insulin Vials</td><td>Medication</td><td>15</td><td>30</td><td>2024-03-15</td>
                    <td><span className="item-status status-low">LOW STOCK</span></td>
                    <td className="item-actions"><button className="btn btn-primary btn-sm"><i className="fas fa-edit"/> Edit</button><button className="btn btn-sm"><i className="fas fa-exchange-alt"/> Move</button></td>
                  </tr>
                  <tr>
                    <td>Antibiotic Ointment</td><td>Medication</td><td>22</td><td>25</td><td>2023-10-28</td>
                    <td><span className="item-status status-expiring">EXPIRING</span></td>
                    <td className="item-actions"><button className="btn btn-primary btn-sm"><i className="fas fa-edit"/> Edit</button><button className="btn btn-sm"><i className="fas fa-exchange-alt"/> Move</button></td>
                  </tr>
                  <tr>
                    <td>Pain Relievers</td><td>Medication</td><td>45</td><td>20</td><td>2023-10-20</td>
                    <td><span className="item-status status-expiring">EXPIRED</span></td>
                    <td className="item-actions"><button className="btn btn-primary btn-sm"><i className="fas fa-edit"/> Edit</button><button className="btn btn-sm"><i className="fas fa-exchange-alt"/> Move</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Assign Items Modal */}
      {modalOpen && (
        <div className="modal" style={{display:'flex'}}>
          <div className="modal-content">
            <div className="modal-header"><div className="modal-title">Assign Items to Storage Zone</div><button className="close-modal" onClick={closeAssignItems}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Target Zone</label>
                <select className="form-select" id="targetZone">
                  <option>Medical Bay</option><option>Emergency Cart</option><option>Medical Storage A</option><option>Refrigerated Storage</option><option>Bridge First Aid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Select Items to Assign</label>
                <div className="item-list">
                  {[
                    'Defibrillator Pads (8 units) - Emergency Cart',
                    'Epinephrine Auto-injectors (5 units) - Emergency Cart',
                    'Saline Solution (30 units) - Medical Storage A',
                    'Antiseptic Wipes (50 units) - Medical Storage A',
                    'Surgical Gloves (100 units) - Medical Storage A',
                  ].map((label, idx) => (
                    <div className="item-checkbox" key={idx}>
                      <input type="checkbox" id={`item${idx+1}`} />
                      <label htmlFor={`item${idx+1}`}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Transfer Reason</label>
                <select className="form-select" id="transferReason">
                  <option>Restocking</option><option>Emergency Preparedness</option><option>Expiry Management</option><option>Space Optimization</option><option>Medical Event Requirement</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" id="transferNotes" rows={3} placeholder="Additional notes about this transfer..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeAssignItems}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>{ alert('Items successfully assigned to storage zone'); closeAssignItems(); }}>
                Assign Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
