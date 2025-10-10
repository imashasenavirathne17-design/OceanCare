import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryWaste.css';

export default function InventoryWasteDisposal() {
  const user = getUser();
  const navigate = useNavigate();
  const onLogout = () => { clearSession(); navigate('/login'); };

  const stats = { expired: 23, damaged: 7, completed: 42, pending: 15 };

  const pending = useMemo(() => [
    { type: 'expired', title: 'Paracetamol 500mg Tablets', qty: '42 units', expiry: 'Oct 22, 2023', location: 'Medical Room - Shelf A2', overdue: '4 days' },
    { type: 'damaged', title: 'Saline Solution 500ml', qty: '12 units', damage: 'Packaging Compromised', location: 'Medical Room - Shelf B1', reporter: 'Dr. Sarah Wilson' },
    { type: 'expired', title: 'Antibiotic Ointment', qty: '8 tubes', expiry: 'Oct 25, 2023', location: 'First Aid Kit - Deck 3', overdue: '1 day' },
  ], []);

  const historyRows = useMemo(() => [
    ['Insulin Syringes (10pk)', 'Expired', '15 units', 'Oct 25, 2023', 'Medical Waste', 'Completed'],
    ['Bandages (Large)', 'Damaged', '5 units', 'Oct 24, 2023', 'General Waste', 'Completed'],
    ['Thermometer (Mercury)', 'Damaged', '1 unit', 'Oct 23, 2023', 'Hazardous Waste', 'Completed'],
    ['Antiseptic Wipes', 'Expired', '24 packs', 'Oct 22, 2023', 'General Waste', 'Completed'],
    ['Ibuprofen 400mg', 'Expired', '18 units', 'Oct 20, 2023', 'Medical Waste', 'Completed'],
  ], []);

  const [filters, setFilters] = useState({ type: 'All Types', status: 'All Status', from: '2023-10-01', to: '2023-10-26' });

  const applyFilters = () => {
    alert(`Applying filters: Type = ${filters.type}, Status = ${filters.status}`);
    setTimeout(() => alert('Filters applied successfully!'), 1000);
  };

  const openNewDisposal = () => setModalOpen(true);
  const [modalOpen, setModalOpen] = useState(false);

  const onConfirmDisposal = () => {
    alert('Disposal record created successfully!');
    setModalOpen(false);
    setTimeout(() => alert('Disposal record has been logged in the system.'), 1000);
  };

  const onProcessDisposal = (itemName) => {
    if (!window.confirm(`Are you sure you want to process disposal for ${itemName}?`)) return;
    alert(`${itemName} has been successfully disposed and recorded.`);
  };

  return (
    <div className="inventory-dashboard inventory-waste">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Waste Disposal Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Disposal Stats */}
          <div className="disposal-stats">
            <div className="stat-card"><div className="stat-icon expired"><i className="fas fa-calendar-times"></i></div><div className="stat-value">{stats.expired}</div><div className="stat-label">Expired Items</div></div>
            <div className="stat-card"><div className="stat-icon damaged"><i className="fas fa-ban"></i></div><div className="stat-value">{stats.damaged}</div><div className="stat-label">Damaged Items</div></div>
            <div className="stat-card"><div className="stat-icon completed"><i className="fas fa-check-circle"></i></div><div className="stat-value">{stats.completed}</div><div className="stat-label">Completed Disposals</div></div>
            <div className="stat-card"><div className="stat-icon pending"><i className="fas fa-clock"></i></div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Disposals</div></div>
          </div>

          {/* Disposal Controls */}
          <div className="disposal-controls">
            <div className="filter-group">
              <label className="filter-label">Disposal Type</label>
              <select className="filter-select" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                <option>All Types</option>
                <option>Expired Items</option>
                <option>Damaged Items</option>
                <option>Recalled Items</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select className="filter-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                <option>All Status</option>
                <option>Pending</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div className="date-range">
              <div className="filter-group">
                <label className="filter-label">From Date</label>
                <input type="date" className="date-input" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="filter-group">
                <label className="filter-label">To Date</label>
                <input type="date" className="date-input" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={applyFilters}><i className="fas fa-filter"></i> Apply Filters</button>
            <button className="btn btn-danger" onClick={openNewDisposal}><i className="fas fa-plus"></i> New Disposal Record</button>
          </div>

          {/* Pending Disposals */}
          <div className="pending-disposals">
            <div className="section-header">
              <div className="section-title">Pending Disposals</div>
              <button className="btn btn-warning" onClick={() => setTimeout(() => alert('Urgent disposal items displayed!'), 1000)}><i className="fas fa-exclamation-triangle"></i> Urgent Actions Needed</button>
            </div>

            <div className="disposal-grid">
              {pending.map((p) => (
                <div key={p.title} className={`disposal-card ${p.type}`}>
                  <div className="disposal-header">
                    <div className="disposal-title">{p.title}</div>
                    <div className={`disposal-badge ${p.type === 'expired' ? 'badge-expired' : 'badge-damaged'}`}>{p.type === 'expired' ? 'Expired' : 'Damaged'}</div>
                  </div>
                  <div className="disposal-details">
                    <div className="detail-item"><span className="detail-label">Quantity:</span><span className="detail-value">{p.qty}</span></div>
                    {p.expiry && <div className="detail-item"><span className="detail-label">Expiry Date:</span><span className="detail-value">{p.expiry}</span></div>}
                    {p.damage && <div className="detail-item"><span className="detail-label">Damage Type:</span><span className="detail-value">{p.damage}</span></div>}
                    <div className="detail-item"><span className="detail-label">Storage Location:</span><span className="detail-value">{p.location}</span></div>
                    {p.reporter && <div className="detail-item"><span className="detail-label">Reported By:</span><span className="detail-value">{p.reporter}</span></div>}
                    {p.overdue && <div className="detail-item"><span className="detail-label">Days Overdue:</span><span className="detail-value">{p.overdue}</span></div>}
                  </div>
                  <div className="disposal-actions">
                    <button className="btn btn-success btn-sm" onClick={() => onProcessDisposal(p.title)}><i className="fas fa-check"></i> Process Disposal</button>
                    <button className="btn btn-info btn-sm" onClick={() => alert(`Showing details for ${p.title}...`)}><i className="fas fa-info-circle"></i> Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disposal History */}
          <div className="disposal-history">
            <div className="section-header">
              <div className="section-title">Disposal History</div>
              <button className="btn btn-primary" onClick={() => { alert('Exporting disposal records...'); setTimeout(() => alert('Disposal records exported successfully!'), 1500); }}><i className="fas fa-file-export"></i> Export Records</button>
            </div>

            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Disposal Date</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((r, i) => (
                    <tr key={i}>
                      <td>{r[0]}</td>
                      <td><span className={`disposal-type ${r[1] === 'Expired' ? 'type-expired' : 'type-damaged'}`}>{r[1]}</span></td>
                      <td>{r[2]}</td>
                      <td>{r[3]}</td>
                      <td><span className="disposal-method">{r[4]}</span></td>
                      <td><span className={`disposal-status ${r[5] === 'Completed' ? 'status-completed' : 'status-pending'}`}>{r[5]}</span></td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => alert(`Viewing details for: ${r[0]}`)}><i className="fas fa-eye"></i></button>
                        <button className="btn btn-info btn-sm" onClick={() => alert(`Printing disposal certificate for: ${r[0]}`)}><i className="fas fa-print"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">Showing 1-5 of 42 records</div>
              <div className="pagination-controls">
                {[1,2,3,4,5].map((p) => (
                  <button key={p} className={`page-btn ${p === 1 ? 'active' : ''}`} onClick={() => alert(`Loading page ${p}...`)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => alert('Loading next page...')}>Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* New Disposal Modal */}
      {modalOpen && (
        <div className="modal" onClick={(e) => { if (e.target.classList.contains('modal')) setModalOpen(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Create New Disposal Record</div>
              <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Item</label>
                <select className="form-control">
                  <option>-- Select Item to Dispose --</option>
                  <option>Paracetamol 500mg Tablets (Expired)</option>
                  <option>Saline Solution 500ml (Damaged)</option>
                  <option>Antibiotic Ointment (Expired)</option>
                  <option>Bandages Medium (Damaged)</option>
                  <option>Insulin Syringes (Expired)</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Disposal Type</label>
                  <select className="form-control">
                    <option>Expired Item</option>
                    <option>Damaged Item</option>
                    <option>Recalled Item</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" className="form-control" defaultValue={1} min={1} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Disposal Method</label>
                <select className="form-control">
                  <option>Medical Waste</option>
                  <option>Hazardous Waste</option>
                  <option>General Waste</option>
                  <option>Recycling</option>
                  <option>Incineration</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Disposal Reason</label>
                <textarea className="form-control" rows={3} placeholder="Provide details about why this item is being disposed..."></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Compliance Documentation</label>
                <div className="checkbox-group">
                  <label className="checkbox-item"><input type="checkbox" /> Waste Disposal Form Completed</label>
                  <label className="checkbox-item"><input type="checkbox" /> Safety Protocols Followed</label>
                  <label className="checkbox-item"><input type="checkbox" /> Supervisor Approval Obtained</label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Attach Photos (Optional)</label>
                <input type="file" className="form-control" accept="image/*" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={onConfirmDisposal}>Confirm Disposal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
