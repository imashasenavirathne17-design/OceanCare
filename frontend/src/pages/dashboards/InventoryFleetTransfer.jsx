import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryFleet.css';

export default function InventoryFleetTransfer() {
  const user = getUser();
  const navigate = useNavigate();
  const onLogout = () => { clearSession(); navigate('/login'); };

  const [modalOpen, setModalOpen] = useState(false);

  const fleet = useMemo(() => ([
    { name: 'MV Ocean Explorer', current: true, status: 'current', details: { location: 'Pacific Ocean', items: '142 items', nextPort: 'Honolulu (3 days)', transfers: '2 pending' } },
    { name: 'MV Pacific Star', status: 'online', details: { location: '150 NM East', items: '128 items', nextPort: 'Same Route', capability: 'Available' } },
    { name: 'MV Coral Princess', status: 'transfer', details: { location: '80 NM West', items: '156 items', activeTransfers: '3 items', eta: '6 hours' } },
    { name: 'MV Deep Blue', status: 'offline', details: { location: 'Unknown', items: 'N/A', last: '2 days ago', status: 'No Signal' } },
  ]), []);

  const activeTransfers = useMemo(() => ([
    ['TR-2023-0042', 'Insulin Syringes (12 units)', 'Pacific Star → Ocean Explorer', 'Today, 08:30', 'in-progress', 'High'],
    ['TR-2023-0041', 'Paracetamol 500mg (24 units)', 'Ocean Explorer → Coral Princess', 'Yesterday, 14:15', 'pending', 'Medium'],
    ['TR-2023-0040', 'Emergency Splint Kit (2 units)', 'Coral Princess → Pacific Star', 'Oct 24, 2023', 'in-progress', 'High'],
  ]), []);

  const historyRows = useMemo(() => ([
    ['TR-2023-0039', 'Bandages, Antiseptic Wipes', 'Ocean Explorer → Pacific Star', 'Oct 23, 2023', 'completed', 'Helicopter Transfer'],
    ['TR-2023-0038', 'Saline Solution (8 units)', 'Pacific Star → Coral Princess', 'Oct 22, 2023', 'completed', 'Boat Transfer'],
    ['TR-2023-0037', 'Ibuprofen 400mg (18 units)', 'Coral Princess → Ocean Explorer', 'Oct 20, 2023', 'completed', 'Port Exchange'],
    ['TR-2023-0036', 'Thermometers (3 units)', 'Ocean Explorer → Deep Blue', 'Oct 18, 2023', 'cancelled', 'N/A'],
  ]), []);

  // Simulated periodic vessel updates
  useEffect(() => {
    const iv = setInterval(() => {
      // no-op placeholder for status changes
    }, 45000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="inventory-dashboard inventory-fleet">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Fleet Transfer Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Fleet Overview */}
          <div className="fleet-overview">
            {fleet.map(v => (
              <div key={v.name} className={`vessel-card ${v.current ? 'current' : ''}`}>
                <div className="vessel-header">
                  <div className="vessel-name">{v.name}</div>
                  <div className={`vessel-status ${v.current ? 'status-online' : v.status === 'online' ? 'status-online' : v.status === 'transfer' ? 'status-transfer' : 'status-offline'}`}>
                    {v.current ? 'Current Vessel' : v.status === 'online' ? 'Online' : v.status === 'transfer' ? 'Transfer in Progress' : 'Offline'}
                  </div>
                </div>
                <div className="vessel-details">
                  {Object.entries(v.details).map(([k, val]) => (
                    <div className="detail-item" key={k}><span className="detail-label">{k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')}:</span><span className="detail-value">{val}</span></div>
                  ))}
                </div>
                <div className="vessel-actions">
                  {v.current ? (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => alert('Opening current vessel inventory...')}><i className="fas fa-eye"></i> View Inventory</button>
                      <button className="btn btn-info btn-sm" onClick={(e) => { const el = e.currentTarget; const t = el.innerHTML; el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...'; setTimeout(() => { el.innerHTML = t; alert('Vessel data synchronized successfully!'); }, 1500); }}><i className="fas fa-sync"></i> Sync Data</button>
                    </>
                  ) : v.status === 'online' ? (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => alert(`Initiating transfer request to ${v.name}`)}><i className="fas fa-exchange-alt"></i> Request Transfer</button>
                      <button className="btn btn-sm" onClick={() => alert(`Opening stock comparison with ${v.name}`)}><i className="fas fa-chart-bar"></i> Compare Stock</button>
                    </>
                  ) : v.status === 'transfer' ? (
                    <>
                      <button className="btn btn-warning btn-sm" onClick={() => alert('Opening transfer tracking dashboard...')}><i className="fas fa-truck-loading"></i> Track Transfer</button>
                      <button className="btn btn-sm" onClick={() => alert(`Opening messaging interface for ${v.name} crew`)}><i className="fas fa-comment"></i> Message Crew</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm" disabled><i className="fas fa-wifi-slash"></i> Offline</button>
                      <button className="btn btn-sm" onClick={() => alert(`Showing last known data for ${v.name}`)}><i className="fas fa-history"></i> Last Data</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Transfer Controls */}
          <div className="transfer-controls">
            <div className="section-header">
              <div className="section-title">Create New Transfer</div>
              <button className="btn btn-primary" onClick={() => setModalOpen(true)}><i className="fas fa-bolt"></i> Quick Emergency Transfer</button>
            </div>

            <div className="transfer-form">
              <div>
                <div className="form-group"><label className="form-label">Source Vessel</label>
                  <select className="form-control">
                    <option>MV Ocean Explorer (Current)</option>
                    <option>MV Pacific Star</option>
                    <option>MV Coral Princess</option>
                    <option>MV Deep Blue</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Destination Vessel</label>
                  <select className="form-control">
                    <option>Select destination vessel</option>
                    <option>MV Pacific Star</option>
                    <option>MV Coral Princess</option>
                    <option>MV Deep Blue</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Transfer Priority</label>
                  <select className="form-control">
                    <option>Normal</option>
                    <option>High - Urgent Medical Need</option>
                    <option>Emergency - Critical Shortage</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="form-group"><label className="form-label">Select Items to Transfer</label>
                  <select className="form-control" multiple size={5}>
                    <option>Paracetamol 500mg (42 units available)</option>
                    <option>Insulin Syringes (8 units available)</option>
                    <option>Bandages Medium (18 packs available)</option>
                    <option>Antiseptic Wipes (24 packs available)</option>
                    <option>Saline Solution 500ml (15 units available)</option>
                    <option>Ibuprofen 400mg (36 units available)</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Quantity</label><input type="number" className="form-control" defaultValue={1} min={1} /></div>
                  <div className="form-group"><label className="form-label">Transfer Method</label>
                    <select className="form-control">
                      <option>Helicopter Transfer</option>
                      <option>Boat Transfer</option>
                      <option>Next Port Exchange</option>
                      <option>Emergency Drop</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="transfer-summary">
              <div className="summary-header">Transfer Summary</div>
              <div className="summary-details">
                <div className="detail-item"><span className="detail-label">Estimated Transfer Time:</span><span className="detail-value">4-6 hours</span></div>
                <div className="detail-item"><span className="detail-label">Distance Between Vessels:</span><span className="detail-value">150 NM</span></div>
                <div className="detail-item"><span className="detail-label">Weather Conditions:</span><span className="detail-value">Favorable</span></div>
                <div className="detail-item"><span className="detail-label">Required Approvals:</span><span className="detail-value">2 of 3</span></div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Transfer Notes</label>
              <textarea className="form-control" rows={3} placeholder="Add any special instructions or notes for this transfer..."></textarea>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => alert('Transfer request submitted! Waiting for approval...')}><i className="fas fa-paper-plane"></i> Submit Transfer Request</button>
              <button className="btn" onClick={() => alert('Cancelled')}><i className="fas fa-times"></i> Cancel</button>
              <button className="btn btn-info" onClick={() => alert('Transfer request saved as draft!')}><i className="fas fa-save"></i> Save as Draft</button>
            </div>
          </div>

          {/* Active Transfers */}
          <div className="active-transfers">
            <div className="section-header"><div className="section-title">Active Transfers</div><button className="btn btn-primary" onClick={(e) => { const el = e.currentTarget; const t = el.innerHTML; el.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i> Refreshing...'; setTimeout(() => { el.innerHTML = t; alert('Transfer status updated!'); }, 1500); }}><i className="fas fa-sync"></i> Refresh Status</button></div>
            <div className="table-responsive">
              <table className="transfers-table">
                <thead>
                  <tr><th>Transfer ID</th><th>Items</th><th>From → To</th><th>Initiated</th><th>Status</th><th>Priority</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {activeTransfers.map((r) => (
                    <tr key={r[0]}>
                      <td>{r[0]}</td>
                      <td>{r[1]}</td>
                      <td>{r[2]}</td>
                      <td>{r[3]}</td>
                      <td><span className={`transfer-status ${r[4] === 'pending' ? 'status-pending' : r[4] === 'in-progress' ? 'status-in-progress' : 'status-completed'}`}>{r[4] === 'pending' ? 'Pending Approval' : r[4] === 'in-progress' ? 'In Progress' : 'Completed'}</span></td>
                      <td><span className={`priority ${r[5] === 'High' ? 'priority-high' : r[5] === 'Medium' ? 'priority-medium' : 'priority-low'}`}>{r[5]}</span></td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => alert(`Viewing details for transfer: ${r[0]}`)}><i className="fas fa-eye"></i></button>
                        <button className="btn btn-info btn-sm" onClick={() => alert(`Action on transfer: ${r[0]}`)}><i className="fas fa-pause"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transfer History */}
          <div className="transfer-history">
            <div className="section-header"><div className="section-title">Transfer History</div><button className="btn btn-primary" onClick={() => { alert('Exporting transfer history...'); setTimeout(() => alert('Transfer history exported successfully!'), 1000); }}><i className="fas fa-file-export"></i> Export History</button></div>
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr><th>Transfer ID</th><th>Items</th><th>From → To</th><th>Completed</th><th>Status</th><th>Method</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {historyRows.map((r) => (
                    <tr key={r[0]}>
                      <td>{r[0]}</td>
                      <td>{r[1]}</td>
                      <td>{r[2]}</td>
                      <td>{r[3]}</td>
                      <td><span className={`transfer-status ${r[4] === 'completed' ? 'status-completed' : 'status-cancelled'}`}>{r[4][0].toUpperCase() + r[4].slice(1)}</span></td>
                      <td>{r[5]}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => alert(`Viewing completed transfer: ${r[0]}`)}><i className="fas fa-eye"></i></button>
                        <button className="btn btn-info btn-sm" onClick={() => alert(`Printing certificate for transfer: ${r[0]}`)}><i className="fas fa-print"></i></button>
                        {r[4] === 'cancelled' && (
                          <button className="btn btn-sm" onClick={() => alert(`Reinitiating cancelled transfer: ${r[0]}`)}><i className="fas fa-redo"></i></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">Showing 1-4 of 24 transfers</div>
              <div className="pagination-controls">
                {[1,2,3,4,5].map(p => (
                  <button key={p} className={`page-btn ${p === 1 ? 'active' : ''}`} onClick={() => alert(`Loading page ${p}...`)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => alert('Loading next page...')}>Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Quick Transfer Modal */}
      {modalOpen && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) setModalOpen(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Quick Emergency Transfer</div>
              <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Emergency Type</label>
                <select className="form-control">
                  <option>Medical Emergency - Critical Supplies</option>
                  <option>Vessel Emergency - Equipment Failure</option>
                  <option>Weather Emergency - Evacuation Supplies</option>
                  <option>Other Emergency Situation</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Select Standard Emergency Kit</label>
                <select className="form-control">
                  <option>Critical Medical Supply Kit</option>
                  <option>Emergency Trauma Kit</option>
                  <option>Isolation Medical Kit</option>
                  <option>Custom Emergency Selection</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Destination Vessel</label>
                <select className="form-control">
                  <option>MV Pacific Star (150 NM East)</option>
                  <option>MV Coral Princess (80 NM West)</option>
                  <option>All Available Vessels</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Emergency Priority Level</label>
                <select className="form-control">
                  <option>Priority 1 - Immediate Response Required</option>
                  <option>Priority 2 - Urgent Response Required</option>
                  <option>Priority 3 - Expedited Response</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Emergency Details</label>
                <textarea className="form-control" rows={3} placeholder="Briefly describe the emergency situation and specific needs..."></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { alert('EMERGENCY TRANSFER INITIATED! Notifying all available vessels...'); setModalOpen(false); setTimeout(() => alert('Emergency transfer request sent to 3 vessels. MV Pacific Star responding - ETA 2 hours.'), 2000); }}><i className="fas fa-bolt"></i> Initiate Emergency Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
