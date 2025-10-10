import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryAuditTrail.css';

export default function InventoryAuditTrail() {
  const user = getUser();
  const navigate = useNavigate();
  const onLogout = () => { clearSession(); navigate('/login'); };

  // Filters state
  const [actionType, setActionType] = useState('All Actions');
  const [userRole, setUserRole] = useState('All Roles');
  const [fromDate, setFromDate] = useState('2023-10-01');
  const [toDate, setToDate] = useState('2023-10-26');

  const [page, setPage] = useState(1);

  const stats = { added: 42, updates: 156, deleted: 8, usage: 87 };

  const timeline = useMemo(() => [
    { type: 'update', title: 'Inventory Quantity Updated', time: 'Today, 14:25', details: 'Quantity of Paracetamol 500mg changed from 42 to 38 units', user: 'Dr. Sarah Wilson', role: 'Medical Staff', avatar: 'Medical+Staff' },
    { type: 'usage', title: 'Medical Treatment Recorded', time: 'Today, 13:40', details: 'Bandages (Medium) used for crew member treatment (Case #MC-2310)', user: 'Nurse Johnson', role: 'Medical Staff', avatar: 'Nurse+Johnson' },
    { type: 'add', title: 'New Item Added to Inventory', time: 'Yesterday, 16:15', details: 'Added Antiseptic Wipes (Box of 100) to Medical Storage - Zone B', user: 'Alex Johnson', role: 'Inventory Manager', avatar: 'Alex+Johnson' },
    { type: 'delete', title: 'Expired Item Disposed', time: 'Oct 24, 2023 11:30', details: 'Disposed Saline Solution 500ml (Expired: Oct 22, 2023) - Proper disposal logged', user: 'Mark Davis', role: 'Crew Member', avatar: 'Crew+Member' },
    { type: 'update', title: 'Storage Zone Updated', time: 'Oct 23, 2023 09:45', details: 'Moved Emergency Splint Kit from Life Raft Storage to Main Medical Room', user: 'Alex Johnson', role: 'Inventory Manager', avatar: 'Alex+Johnson' },
  ], []);

  const tableRows = useMemo(() => [
    ['2023-10-26 14:25', 'Update', 'Paracetamol 500mg', 'Quantity changed from 42 to 38', 'Dr. Sarah Wilson', 'Medical Staff'],
    ['2023-10-26 13:40', 'Usage', 'Bandages (Medium)', 'Medical treatment - Case #MC-2310', 'Nurse Johnson', 'Medical Staff'],
    ['2023-10-25 16:15', 'Add', 'Antiseptic Wipes', 'Added to Medical Storage - Zone B', 'Alex Johnson', 'Inventory Manager'],
    ['2023-10-24 11:30', 'Disposal', 'Saline Solution 500ml', 'Expired item properly disposed', 'Mark Davis', 'Crew Member'],
    ['2023-10-23 09:45', 'Update', 'Emergency Splint Kit', 'Moved to Main Medical Room', 'Alex Johnson', 'Inventory Manager'],
    ['2023-10-22 15:20', 'Usage', 'Ibuprofen 400mg', 'Medical treatment - Case #MC-2309', 'Dr. Sarah Wilson', 'Medical Staff'],
    ['2023-10-21 10:10', 'Update', 'Antibiotic Ointment', 'Low stock alert triggered', 'System', 'System Admin'],
    ['2023-10-20 14:35', 'Add', 'Thermometer (Digital)', 'New equipment added to inventory', 'Alex Johnson', 'Inventory Manager'],
  ], []);

  const applyFilters = () => {
    alert(`Applying filters: Action Type = ${actionType}, User Role = ${userRole}`);
    setTimeout(() => alert('Filters applied successfully!'), 1000);
  };

  const exportAudit = () => {
    alert('Exporting audit log...');
    setTimeout(() => alert('Audit log exported successfully!'), 1500);
  };

  const pages = [1, 2, 3, 4, 5];

  return (
    <div className="inventory-dashboard inventory-audit">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Audit Trail</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Controls */}
          <div className="audit-controls">
            <div className="filter-group">
              <label className="filter-label">Action Type</label>
              <select className="filter-select" value={actionType} onChange={(e) => setActionType(e.target.value)}>
                <option>All Actions</option>
                <option>Add Item</option>
                <option>Update Quantity</option>
                <option>Delete Item</option>
                <option>Usage Record</option>
                <option>Disposal</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">User Role</label>
              <select className="filter-select" value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                <option>All Roles</option>
                <option>Inventory Manager</option>
                <option>Medical Staff</option>
                <option>Crew Member</option>
                <option>System Admin</option>
              </select>
            </div>

            <div className="date-range">
              <div className="filter-group">
                <label className="filter-label">From Date</label>
                <input type="date" className="date-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="filter-label">To Date</label>
                <input type="date" className="date-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={applyFilters}>
              <i className="fas fa-filter"></i> Apply Filters
            </button>

            <button className="btn btn-success" onClick={exportAudit}>
              <i className="fas fa-file-export"></i> Export Log
            </button>
          </div>

          {/* Stats */}
          <div className="audit-stats">
            <div className="stat-card">
              <div className="stat-icon add"><i className="fas fa-plus"></i></div>
              <div className="stat-value">{stats.added}</div>
              <div className="stat-label">Items Added</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon update"><i className="fas fa-sync"></i></div>
              <div className="stat-value">{stats.updates}</div>
              <div className="stat-label">Quantity Updates</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon delete"><i className="fas fa-trash"></i></div>
              <div className="stat-value">{stats.deleted}</div>
              <div className="stat-label">Items Deleted</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon usage"><i className="fas fa-pills"></i></div>
              <div className="stat-value">{stats.usage}</div>
              <div className="stat-label">Medical Usage</div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="activity-timeline">
            <div className="section-header">
              <div className="section-title">Recent Activity Timeline</div>
              <button className="btn" onClick={() => setTimeout(() => alert('Full activity history loaded!'), 1000)}>
                <i className="fas fa-history"></i> View Full History
              </button>
            </div>

            <div className="timeline">
              {timeline.map((t, idx) => (
                <div className="timeline-item" key={idx}>
                  <div className={`timeline-marker ${t.type}`}></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <div className="timeline-title">{t.title}</div>
                      <div className="timeline-time">{t.time}</div>
                    </div>
                    <div className="timeline-details">
                      <span className={`timeline-badge badge-${t.type}`}>{t.type.toUpperCase()}</span>
                      {t.details}
                    </div>
                    <div className="timeline-user">
                      <img src={`https://ui-avatars.com/api/?name=${t.avatar}&background=3a86ff&color=fff`} alt="User" />
                      {t.user} ({t.role})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Table */}
          <div className="audit-table-section">
            <div className="section-header">
              <div className="section-title">Detailed Audit Log</div>
              <button className="btn btn-primary" onClick={(e) => {
                const el = e.currentTarget; const orig = el.innerHTML; el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
                setTimeout(() => { el.innerHTML = orig; alert('Audit data refreshed successfully!'); }, 1500);
              }}>
                <i className="fas fa-sync"></i> Refresh
              </button>
            </div>

            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Item</th>
                    <th>Details</th>
                    <th>User</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r, i) => (
                    <tr key={i}>
                      <td>{r[0]}</td>
                      <td><span className={`action-type action-${r[1].toLowerCase()}`}>{r[1]}</span></td>
                      <td>{r[2]}</td>
                      <td>{r[3]}</td>
                      <td>{r[4]}</td>
                      <td><span className="user-role">{r[5]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">Showing 1-8 of 42 entries</div>
              <div className="pagination-controls">
                {pages.map((p) => (
                  <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => { if (page !== p) { setPage(p); alert(`Loading page ${p}...`); } }}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => { const n = page + 1; setPage(n); alert('Loading next page...'); }}>Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
