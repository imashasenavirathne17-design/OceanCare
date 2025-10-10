import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryBarcode.css';

export default function InventoryBarcodeScanning() {
  const user = getUser();
  const navigate = useNavigate();
  const onLogout = () => { clearSession(); navigate('/login'); };

  // Simulated scanner states
  const [checkinActive, setCheckinActive] = useState(false);
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [results, setResults] = useState([
    {
      icon: 'fa-pills',
      title: 'Paracetamol 500mg Tablets',
      barcode: 'MED-2023-00124',
      meta: [
        { icon: 'fa-box', text: 'Current Stock: 42 units' },
        { icon: 'fa-map-marker-alt', text: 'Storage: Medical Room - Shelf A2' },
        { icon: 'fa-calendar', text: 'Expiry: Mar 2024' },
      ],
      status: { cls: 'status-ok', text: 'Stock Adequate' },
      actions: ['checkin', 'checkout', 'details'],
    },
    {
      icon: 'fa-syringe',
      iconStyle: { background: 'var(--warning)' },
      title: 'Insulin Syringes (10pk)',
      barcode: 'MED-2023-00087',
      meta: [
        { icon: 'fa-box', text: 'Current Stock: 8 units' },
        { icon: 'fa-map-marker-alt', text: 'Storage: Refrigerated - Zone C' },
        { icon: 'fa-calendar', text: 'Expiry: Dec 2023' },
      ],
      status: { cls: 'status-warning', text: 'Low Stock & Expiring Soon' },
      actions: ['checkin', 'checkout', 'alert'],
    },
  ]);

  const [recent, setRecent] = useState([
    ['Bandages (Medium)', 'MED-2023-00156', 'checkout', 'Today, 14:25', 'Dr. Sarah Wilson', '-5 units'],
    ['Antiseptic Wipes', 'MED-2023-00234', 'checkin', 'Today, 13:40', 'Alex Johnson', '+100 units'],
    ['Saline Solution 500ml', 'MED-2023-00045', 'expiry', 'Today, 11:15', 'System', 'N/A'],
    ['Ibuprofen 400mg', 'MED-2023-00112', 'checkout', 'Yesterday, 16:30', 'Nurse Johnson', '-12 units'],
    ['Thermometer (Digital)', 'EQP-2023-00078', 'checkin', 'Oct 24, 2023', 'Alex Johnson', '+3 units'],
  ]);

  const onStart = (type) => {
    if (type === 'in') { setCheckinActive(true); setTimeout(simulateScanIn, 2000); }
    else { setCheckoutActive(true); setTimeout(simulateScanOut, 2000); }
  };
  const onStop = (type) => { if (type === 'in') setCheckinActive(false); else setCheckoutActive(false); };

  const addRecent = (item, barcode, type, qty) => {
    const now = new Date();
    const timeString = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setRecent((r) => [[item, barcode, type, timeString, user?.fullName || 'Alex Johnson', qty], ...r].slice(0, 5));
  };

  function simulateScanIn() {
    if (!checkinActive) return;
    alert('Barcode scanned successfully! MED-2023-00124 - Paracetamol 500mg');
    addRecent('Paracetamol 500mg', 'MED-2023-00124', 'checkin', '+10 units');
    setTimeout(() => setCheckinActive(false), 1500);
  }

  function simulateScanOut() {
    if (!checkoutActive) return;
    alert('Barcode scanned successfully! MED-2023-00156 - Bandages (Medium)');
    addRecent('Bandages (Medium)', 'MED-2023-00156', 'checkout', '-5 units');
    setTimeout(() => setCheckoutActive(false), 1500);
  }

  const typeChip = (t) => t === 'checkin' ? 'type-checkin' : t === 'checkout' ? 'type-checkout' : 'type-expiry';

  return (
    <div className="inventory-dashboard inventory-barcode">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Barcode Scanning</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Scanner Section */}
          <div className="scanner-section">
            {/* Check-In */}
            <div className="scanner-card">
              <div className="section-header">
                <div className="section-title">Check-In Scanner</div>
                <button className="btn btn-info" onClick={() => alert('Generating QR code for selected item...')}>
                  <i className="fas fa-qrcode"></i> Generate QR Code
                </button>
              </div>
              <div className={`scanner-container ${checkinActive ? 'scanner-active' : ''}`}>
                {!checkinActive ? (
                  <div className="scanner-placeholder">
                    <i className="fas fa-camera"></i>
                    <div>Check-In Scanner Ready</div>
                    <small>Point camera at barcode to check items in</small>
                  </div>
                ) : (
                  <div className="scanner-overlay">
                    <div>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: 48, marginBottom: 15 }}></i>
                      <div>Scanning Barcode...</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="scanner-controls">
                <button className="btn btn-primary" onClick={() => onStart('in')} disabled={checkinActive}>
                  <i className="fas fa-play"></i> Start Check-In
                </button>
                <button className="btn btn-danger" onClick={() => onStop('in')} disabled={!checkinActive}>
                  <i className="fas fa-stop"></i> Stop Scanner
                </button>
                <button className="btn btn-success" onClick={() => alert('Opening manual check-in form...')}>
                  <i className="fas fa-keyboard"></i> Manual Entry
                </button>
              </div>
            </div>

            {/* Check-Out */}
            <div className="scanner-card">
              <div className="section-header">
                <div className="section-title">Check-Out Scanner</div>
                <button className="btn btn-info" onClick={() => alert('Printing barcode labels...')}>
                  <i className="fas fa-barcode"></i> Print Barcode
                </button>
              </div>
              <div className={`scanner-container ${checkoutActive ? 'scanner-active' : ''}`}>
                {!checkoutActive ? (
                  <div className="scanner-placeholder">
                    <i className="fas fa-camera"></i>
                    <div>Check-Out Scanner Ready</div>
                    <small>Point camera at barcode to check items out</small>
                  </div>
                ) : (
                  <div className="scanner-overlay">
                    <div>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: 48, marginBottom: 15 }}></i>
                      <div>Scanning Barcode...</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="scanner-controls">
                <button className="btn btn-primary" onClick={() => onStart('out')} disabled={checkoutActive}>
                  <i className="fas fa-play"></i> Start Check-Out
                </button>
                <button className="btn btn-danger" onClick={() => onStop('out')} disabled={!checkoutActive}>
                  <i className="fas fa-stop"></i> Stop Scanner
                </button>
                <button className="btn btn-success" onClick={() => alert('Opening manual check-out form...')}>
                  <i className="fas fa-keyboard"></i> Manual Entry
                </button>
              </div>
            </div>
          </div>

          {/* Scan Results */}
          <div className="scan-results">
            <div className="section-header">
              <div className="section-title">Scan Results</div>
              <button className="btn" onClick={() => alert('Scan results cleared!')}>
                <i className="fas fa-sync"></i> Clear Results
              </button>
            </div>

            {results.map((r, idx) => (
              <div className="result-card" key={idx}>
                <div className="result-icon" style={r.iconStyle}><i className={`fas ${r.icon}`}></i></div>
                <div className="result-details">
                  <div className="result-header">
                    <div className="result-title">{r.title}</div>
                    <div className="result-barcode">{r.barcode}</div>
                  </div>
                  <div className="result-meta">
                    {r.meta.map((m, i) => (
                      <div className="meta-item" key={i}><i className={`fas ${m.icon}`}></i> {m.text}</div>
                    ))}
                  </div>
                  <div className={`status-badge ${r.status.cls}`}>{r.status.text}</div>
                  <div className="result-actions">
                    {r.actions.includes('checkin') && (
                      <button className="btn btn-primary btn-sm"><i className="fas fa-arrow-down"></i> Check In</button>
                    )}
                    {r.actions.includes('checkout') && (
                      <button className="btn btn-info btn-sm"><i className="fas fa-arrow-up"></i> Check Out</button>
                    )}
                    {r.actions.includes('details') && (
                      <button className="btn btn-sm"><i className="fas fa-info-circle"></i> Details</button>
                    )}
                    {r.actions.includes('alert') && (
                      <button className="btn btn-warning btn-sm"><i className="fas fa-exclamation-triangle"></i> Alert</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Scans */}
          <div className="recent-scans">
            <div className="section-header">
              <div className="section-title">Recent Scans</div>
              <button className="btn btn-primary" onClick={() => alert('Loading full scan history...')}>
                <i className="fas fa-history"></i> View All
              </button>
            </div>

            <div className="table-responsive">
              <table className="scans-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Barcode</th>
                    <th>Type</th>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row, i) => (
                    <tr key={i}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td><span className={`scan-type ${typeChip(row[2])}`}>{row[2] === 'checkin' ? 'Check-In' : row[2] === 'checkout' ? 'Check-Out' : 'Expiry Check'}</span></td>
                      <td>{row[3]}</td>
                      <td>{row[4]}</td>
                      <td>{row[5]}</td>
                      <td>
                        <button className="btn btn-primary btn-sm"><i className="fas fa-redo"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="manual-entry">
            <div className="section-header">
              <div className="section-title">Manual Barcode Entry</div>
              <button className="btn btn-info" onClick={() => alert('Opening scan history...')}>
                <i className="fas fa-barcode"></i> Scan History
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Barcode Number</label>
                <input type="text" className="form-control" placeholder="Enter barcode manually" />
              </div>
              <div className="form-group">
                <label className="form-label">Action Type</label>
                <select className="form-control">
                  <option>Check-In</option>
                  <option>Check-Out</option>
                  <option>Stock Count</option>
                  <option>Expiry Check</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-control" defaultValue={1} min={1} />
              </div>
              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <select className="form-control">
                  <option>Main Medical Room</option>
                  <option>Life Raft Kits</option>
                  <option>Crew Deck Lockers</option>
                  <option>Refrigerated Storage</option>
                  <option>Emergency Cabinet</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} placeholder="Add any notes about this transaction"></textarea>
            </div>

            <div className="scanner-controls">
              <button className="btn btn-primary"><i className="fas fa-check"></i> Submit Manual Entry</button>
              <button className="btn"><i className="fas fa-times"></i> Cancel</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
