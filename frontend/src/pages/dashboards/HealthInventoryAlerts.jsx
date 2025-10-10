import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthInventoryAlerts() {
  const navigate = useNavigate();
  const user = getUser();

  const [sendAlertOpen, setSendAlertOpen] = useState(false);
  const [priority, setPriority] = useState('medium');

  const onLogout = () => { clearSession(); navigate('/login'); };

  const openModal = () => setSendAlertOpen(true);
  const closeModal = () => setSendAlertOpen(false);

  const selectPriority = (level) => setPriority(level);

  const sendPredefinedAlert = (id) => {
    // In a real app you'd prefill fields via state. For now, open modal.
    setSendAlertOpen(true);
    if (id === 1) setPriority('high');
    if (id === 2) setPriority('medium');
  };

  const useTemplate = (id) => {
    setSendAlertOpen(true);
  };

  const submitAlert = (e) => {
    e.preventDefault();
    alert('Inventory alert has been sent!');
    setSendAlertOpen(false);
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Inventory Alert Notifications</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Send Inventory Alert */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Send Inventory Alert</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-history"></i> Alert History</button>
                <button className="btn btn-alert" onClick={openModal}><i className="fas fa-bell"></i> Send New Alert</button>
              </div>
            </div>

            <p style={{ marginBottom: 20, color: '#666' }}>
              Use this page to notify the Inventory Manager about low stock levels or urgent supply needs.
              Alerts will be sent directly to the Inventory Manager for immediate action.
            </p>

            {/* Alert Cards */}
            <div className="cards-container">
              <div className="card critical">
                <div className="card-header">
                  <div className="card-title">Critical Alert</div>
                  <div className="card-icon danger"><i className="fas fa-exclamation-triangle"></i></div>
                </div>
                <div className="card-content">
                  <div className="card-item">Insulin (Lantus)</div>
                  <div className="card-details">Only 3 doses remaining</div>
                  <div className="card-details">Minimum required: 10 doses</div>
                  <div className="card-stock stock-critical">URGENT RESTOCK NEEDED</div>
                </div>
                <div className="card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => sendPredefinedAlert(1)}>Send Alert</button>
                  <button className="btn btn-outline btn-sm" onClick={() => alert('Viewing details')}>Details</button>
                </div>
              </div>

              <div className="card warning">
                <div className="card-header">
                  <div className="card-title">Low Stock Alert</div>
                  <div className="card-icon warning"><i className="fas fa-box-open"></i></div>
                </div>
                <div className="card-content">
                  <div className="card-item">Bandages (Various sizes)</div>
                  <div className="card-details">Only 22 units remaining</div>
                  <div className="card-details">Minimum required: 25 units</div>
                  <div className="card-stock stock-low">RESTOCK RECOMMENDED</div>
                </div>
                <div className="card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => sendPredefinedAlert(2)}>Send Alert</button>
                  <button className="btn btn-outline btn-sm" onClick={() => alert('Viewing details')}>Details</button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Custom Alert</div>
                  <div className="card-icon inventory"><i className="fas fa-edit"></i></div>
                </div>
                <div className="card-content">
                  <div className="card-item">Create Custom Inventory Alert</div>
                  <div className="card-details">Notify about any supply issue</div>
                  <div className="card-details">Specify item, quantity, and urgency</div>
                  <div className="card-stock">CUSTOM MESSAGE</div>
                </div>
                <div className="card-actions">
                  <button className="btn btn-outline btn-sm" onClick={openModal}>Create Alert</button>
                  <button className="btn btn-outline btn-sm" onClick={() => useTemplate(99)}>Use Template</button>
                </div>
              </div>
            </div>

            {/* Alert History */}
            <div className="history-container">
              <div className="history-title">Recent Alert History</div>

              {[ 
                ['Surgical Gloves - Critical Low Stock', 'Sent to Inventory Manager • 2023-10-24 14:30'],
                ['Adrenaline Auto-injectors - Restock Request', 'Sent to Inventory Manager • 2023-10-22 09:15'],
                ['COVID-19 Vaccines - Monthly Supply', 'Sent to Inventory Manager • 2023-10-18 11:45'],
                ['Paracetamol 500mg - Low Stock Warning', 'Sent to Inventory Manager • 2023-10-15 16:20'],
              ].map(([title, meta], i) => (
                <div className="history-item" key={i}>
                  <div className="history-info">
                    <div className="history-item-name">{title}</div>
                    <div className="history-item-details">{meta}</div>
                  </div>
                  <div className="history-status status-sent">Sent</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Alert Templates */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Quick Alert Templates</div>
            </div>

            <p style={{ marginBottom: 20, color: '#666' }}>
              Use these templates to quickly send common inventory alerts. Customize as needed.
            </p>

            <div className="cards-container">
              <div className="card warning">
                <div className="card-header">
                  <div className="card-title">Medication Low Stock</div>
                  <div className="card-icon warning"><i className="fas fa-pills"></i></div>
                </div>
                <div className="card-content">
                  <div className="card-item">Standard medication restock request</div>
                  <div className="card-details">Includes item, current stock, and minimum required</div>
                </div>
                <div className="card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => useTemplate(1)}>Use Template</button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Medical Supplies Alert</div>
                  <div className="card-icon inventory"><i className="fas fa-first-aid"></i></div>
                </div>
                <div className="card-content">
                  <div className="card-item">Standard supplies restock request</div>
                  <div className="card-details">For bandages, gloves, and other medical supplies</div>
                </div>
                <div className="card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => useTemplate(2)}>Use Template</button>
                </div>
              </div>

              <div className="card critical">
                <div className="card-header">
                  <div className="card-title">Emergency Supply Need</div>
                  <div className="card-icon danger"><i className="fas fa-ambulance"></i></div>
                </div>
                <div className="card-content">
                  <div className="card-item">Urgent emergency supply request</div>
                  <div className="card-details">For critical medications or equipment</div>
                </div>
                <div className="card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => useTemplate(3)}>Use Template</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Send Alert Modal */}
      {sendAlertOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Send Inventory Alert</h3>
              <button className="close-modal" onClick={closeModal}>&times;</button>
            </div>
            <form id="alertForm" onSubmit={submitAlert}>
              <div className="form-group">
                <label htmlFor="alertItem">Item Name *</label>
                <input type="text" id="alertItem" className="form-control" placeholder="Enter item name" required />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="currentStock">Current Stock *</label>
                  <input type="number" id="currentStock" className="form-control" min={0} required />
                </div>
                <div className="form-group">
                  <label htmlFor="minRequired">Minimum Required *</label>
                  <input type="number" id="minRequired" className="form-control" min={1} required />
                </div>
              </div>

              <div className="form-group">
                <label>Priority Level *</label>
                <div className="priority-indicator">
                  <div className={`priority-option priority-high ${priority === 'high' ? 'selected' : ''}`} onClick={() => selectPriority('high')}>
                    <div>High</div>
                    <small>Critical Need</small>
                  </div>
                  <div className={`priority-option priority-medium ${priority === 'medium' ? 'selected' : ''}`} onClick={() => selectPriority('medium')}>
                    <div>Medium</div>
                    <small>Restock Soon</small>
                  </div>
                  <div className={`priority-option ${priority === 'low' ? 'selected' : ''}`} onClick={() => selectPriority('low')}>
                    <div>Low</div>
                    <small>Monitor</small>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="alertMessage">Alert Message *</label>
                <textarea id="alertMessage" className="form-control" rows={4} placeholder="Describe the inventory issue and any urgent needs..." required></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="alertRecipient">Recipient</label>
                <select id="alertRecipient" className="form-control" defaultValue="inventory-manager">
                  <option value="inventory-manager">Inventory Manager (Default)</option>
                  <option value="both">Inventory Manager & Captain</option>
                  <option value="all">All Department Heads</option>
                </select>
              </div>

              <div className="form-group">
                <label>Delivery Method</label>
                <div>
                  <label><input type="checkbox" defaultChecked /> System Notification</label>{' '}
                  <label><input type="checkbox" /> Email</label>{' '}
                  <label><input type="checkbox" /> SMS</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-alert" style={{ flex: 1 }}>Send Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
