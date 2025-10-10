import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';

export default function HealthInventory() {
  const navigate = useNavigate();
  const user = getUser();

  const [tab, setTab] = useState('stock');
  const [newItemOpen, setNewItemOpen] = useState(false);

  const onLogout = () => { clearSession(); navigate('/login'); };

  const addItem = (e) => {
    e.preventDefault();
    alert('Inventory item added successfully!');
    setNewItemOpen(false);
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        <HealthSidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Medical Inventory Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Alert Banner */}
          <div className="alert-banner">
            <i className="fas fa-exclamation-triangle"></i>
            <div className="alert-content">
              <div className="alert-title">3 Items Critically Low, 7 Items Need Reordering</div>
              <div>Insulin supply is critically low (only 3 doses remaining)</div>
            </div>
            <button className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: '#fff' }}>View All</button>
          </div>

          {/* Inventory Overview */}
          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Inventory Overview</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-sync-alt"></i> Refresh Stock</button>
                <button className="btn btn-inventory" onClick={() => setNewItemOpen(true)}><i className="fas fa-plus"></i> Add Item</button>
              </div>
            </div>

            <div className="overview-container">
              {[
                ['142', 'Total Items'],
                ['3', 'Critical Stock'],
                ['7', 'Low Stock'],
                ['$2,847', 'Inventory Value'],
              ].map(([v, l], i) => (
                <div key={i} className="overview-item">
                  <div className="overview-value">{v}</div>
                  <div className="overview-label">{l}</div>
                </div>
              ))}
            </div>

            <div className="stock-container">
              <div className="stock-header">
                <div className="stock-title">Overall Stock Health</div>
                <div>Target: 95% Adequate Stock</div>
              </div>
              <div className="stock-bar"><div className="stock-fill" style={{ width: '87%' }}></div></div>
              <div className="stock-labels">
                <span>Critical</span>
                <span>Low</span>
                <span>Adequate</span>
                <span>Optimal</span>
              </div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header"><div className="page-title">Inventory Management</div></div>

            <div className="tabs">
              <div className={`tab ${tab === 'stock' ? 'active' : ''}`} onClick={() => setTab('stock')}>Current Stock</div>
              <div className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>Restock Requests</div>
              <div className={`tab ${tab === 'usage' ? 'active' : ''}`} onClick={() => setTab('usage')}>Usage Analytics</div>
              <div className={`tab ${tab === 'suppliers' ? 'active' : ''}`} onClick={() => setTab('suppliers')}>Suppliers</div>
            </div>

            {tab === 'stock' && (
              <div className="tab-content active" id="stock-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search medications or supplies..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Categories</option>
                      <option>Medications</option>
                      <option>Medical Supplies</option>
                      <option>Vaccines</option>
                      <option>Emergency Equipment</option>
                      <option>First Aid</option>
                    </select>
                    <select className="filter-select">
                      <option>All Stock Levels</option>
                      <option>Critical</option>
                      <option>Low</option>
                      <option>Adequate</option>
                      <option>Overstocked</option>
                    </select>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card critical">
                    <div className="card-header">
                      <div className="card-title">Critical Stock</div>
                      <div className="card-icon danger"><i className="fas fa-exclamation-circle"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-item">Insulin (Lantus)</div>
                      <div className="card-details">Category: Medications</div>
                      <div className="card-details">Minimum Required: 10 doses</div>
                      <div className="card-stock stock-critical">CURRENT STOCK: 3 doses</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Request Restock</button>
                      <button className="btn btn-outline btn-sm">Adjust Stock</button>
                    </div>
                  </div>

                  <div className="card low">
                    <div className="card-header">
                      <div className="card-title">Low Stock</div>
                      <div className="card-icon warning"><i className="fas fa-box-open"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-item">Bandages (Various sizes)</div>
                      <div className="card-details">Category: Medical Supplies</div>
                      <div className="card-details">Minimum Required: 25 units</div>
                      <div className="card-stock stock-low">CURRENT STOCK: 22 units</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Request Restock</button>
                      <button className="btn btn-outline btn-sm">Adjust Stock</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Adequate Stock</div>
                      <div className="card-icon inventory"><i className="fas fa-pills"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-item">Paracetamol 500mg</div>
                      <div className="card-details">Category: Medications</div>
                      <div className="card-details">Minimum Required: 30 tablets</div>
                      <div className="card-stock stock-adequate">CURRENT STOCK: 45 tablets</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Request Restock</button>
                      <button className="btn btn-outline btn-sm">Adjust Stock</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Minimum Required</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Insulin (Lantus)</td>
                        <td>Medications</td>
                        <td>3 doses</td>
                        <td>10 doses</td>
                        <td><span className="status-badge status-danger">Critical</span></td>
                        <td>2023-10-24</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Request Restock</button>
                          <button className="btn btn-outline btn-sm">Adjust</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Paracetamol 500mg</td>
                        <td>Medications</td>
                        <td>45 tablets</td>
                        <td>30 tablets</td>
                        <td><span className="status-badge status-active">Adequate</span></td>
                        <td>2023-10-22</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Request Restock</button>
                          <button className="btn btn-outline btn-sm">Adjust</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Bandages (Various sizes)</td>
                        <td>Medical Supplies</td>
                        <td>22 units</td>
                        <td>25 units</td>
                        <td><span className="status-badge status-warning">Low</span></td>
                        <td>2023-10-20</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Request Restock</button>
                          <button className="btn btn-outline btn-sm">Adjust</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'requests' && (
              <div className="tab-content active" id="requests-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search restock requests..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>All Status</option>
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Ordered</option>
                      <option>Received</option>
                    </select>
                    <select className="filter-select">
                      <option>All Priorities</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>

                <div className="cards-container">
                  <div className="card critical">
                    <div className="card-header">
                      <div className="card-title">High Priority Request</div>
                      <div className="card-icon danger"><i className="fas fa-arrow-up"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-item">Insulin (Lantus)</div>
                      <div className="card-details">Requested: 20 doses</div>
                      <div className="card-details">Submitted: 2023-10-24</div>
                      <div className="card-stock stock-critical">STATUS: Pending Approval</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Approve</button>
                      <button className="btn btn-outline btn-sm">Details</button>
                    </div>
                  </div>

                  <div className="card low">
                    <div className="card-header">
                      <div className="card-title">Medium Priority Request</div>
                      <div className="card-icon warning"><i className="fas fa-clock"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-item">Bandages</div>
                      <div className="card-details">Requested: 50 units</div>
                      <div className="card-details">Submitted: 2023-10-22</div>
                      <div className="card-stock stock-low">STATUS: Approved</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Mark Ordered</button>
                      <button className="btn btn-outline btn-sm">Details</button>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Completed Request</div>
                      <div className="card-icon inventory"><i className="fas fa-check-circle"></i></div>
                    </div>
                    <div className="card-content">
                      <div className="card-item">Paracetamol 500mg</div>
                      <div className="card-details">Received: 100 tablets</div>
                      <div className="card-details">Completed: 2023-10-18</div>
                      <div className="card-stock stock-adequate">STATUS: Received</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-outline btn-sm">Details</button>
                      <button className="btn btn-outline btn-sm">New Request</button>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity Requested</th>
                        <th>Request Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Requested By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Insulin (Lantus)</td>
                        <td>20 doses</td>
                        <td>2023-10-24</td>
                        <td><span className="status-badge status-danger">High</span></td>
                        <td><span className="status-badge status-warning">Pending</span></td>
                        <td>Dr. Johnson</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Approve</button>
                          <button className="btn btn-outline btn-sm">Details</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Bandages</td>
                        <td>50 units</td>
                        <td>2023-10-22</td>
                        <td><span className="status-badge status-warning">Medium</span></td>
                        <td><span className="status-badge status-active">Approved</span></td>
                        <td>Dr. Johnson</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Mark Ordered</button>
                          <button className="btn btn-outline btn-sm">Details</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'usage' && (
              <div className="tab-content active" id="usage-tab">
                <div className="search-filter">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search usage analytics..." />
                  </div>
                  <div className="filter-group">
                    <select className="filter-select">
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Last 6 Months</option>
                      <option>Year to Date</option>
                    </select>
                    <select className="filter-select">
                      <option>All Categories</option>
                      <option>Medications</option>
                      <option>Medical Supplies</option>
                      <option>Vaccines</option>
                    </select>
                  </div>
                </div>

                <div className="page-content">
                  <div className="page-header"><div className="page-title">Medication Usage Trends</div></div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Monthly Usage</th>
                          <th>Trend</th>
                          <th>Stockout Risk</th>
                          <th>Reorder Point</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Paracetamol 500mg</td>
                          <td>45 tablets</td>
                          <td><i className="fas fa-arrow-up" style={{ color: 'var(--danger)' }}></i> Increased 15%</td>
                          <td><span className="status-badge status-active">Low</span></td>
                          <td>30 tablets</td>
                          <td className="action-buttons"><button className="btn btn-outline btn-sm">View History</button></td>
                        </tr>
                        <tr>
                          <td>Insulin (Lantus)</td>
                          <td>8 doses</td>
                          <td><i className="fas fa-arrow-right" style={{ color: 'var(--warning)' }}></i> Stable</td>
                          <td><span className="status-badge status-danger">High</span></td>
                          <td>10 doses</td>
                          <td className="action-buttons"><button className="btn btn-outline btn-sm">View History</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="page-content" style={{ marginTop: 30 }}>
                  <div className="page-header"><div className="page-title">Restock History</div></div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Restock Date</th>
                          <th>Quantity</th>
                          <th>Supplier</th>
                          <th>Cost</th>
                          <th>Received By</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Paracetamol 500mg</td>
                          <td>2023-10-18</td>
                          <td>100 tablets</td>
                          <td>MediSupply Co.</td>
                          <td>$45.00</td>
                          <td>Dr. Johnson</td>
                        </tr>
                        <tr>
                          <td>Bandages</td>
                          <td>2023-10-10</td>
                          <td>50 units</td>
                          <td>First Aid Direct</td>
                          <td>$32.50</td>
                          <td>Dr. Johnson</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'suppliers' && (
              <div className="tab-content active" id="suppliers-tab">
                <div className="page-header">
                  <div className="page-title">Medical Suppliers</div>
                  <div className="page-actions">
                    <button className="btn btn-outline"><i className="fas fa-file-export"></i> Export List</button>
                    <button className="btn btn-inventory" onClick={() => setNewItemOpen(true)}><i className="fas fa-plus"></i> Add Supplier</button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Supplier Name</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Specialization</th>
                        <th>Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>MediSupply Co.</td>
                        <td>John Smith</td>
                        <td>+1-555-0123</td>
                        <td>jsmith@medisupply.com</td>
                        <td>Medications & Supplies</td>
                        <td>4.8/5</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Contact</button>
                          <button className="btn btn-outline btn-sm">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>PharmaGlobal</td>
                        <td>Sarah Johnson</td>
                        <td>+1-555-0124</td>
                        <td>s.johnson@pharmaglobal.com</td>
                        <td>Vaccines & Specialty Meds</td>
                        <td>4.6/5</td>
                        <td className="action-buttons">
                          <button className="btn btn-outline btn-sm">Contact</button>
                          <button className="btn btn-outline btn-sm">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Item Modal */}
      {newItemOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && setNewItemOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Inventory Item</h3>
              <button className="close-modal" onClick={() => setNewItemOpen(false)}>&times;</button>
            </div>
            <form id="itemForm" onSubmit={addItem}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="itemName">Item Name *</label>
                  <input type="text" id="itemName" className="form-control" placeholder="Enter item name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="itemCategory">Category *</label>
                  <select id="itemCategory" className="form-control" required defaultValue="">
                    <option value="">Select category</option>
                    <option value="medications">Medications</option>
                    <option value="supplies">Medical Supplies</option>
                    <option value="vaccines">Vaccines</option>
                    <option value="equipment">Emergency Equipment</option>
                    <option value="first-aid">First Aid</option>
                    <option value="other">Other</option>
                  </select>
                </div>
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
                <div className="form-group">
                  <label htmlFor="unitType">Unit Type *</label>
                  <select id="unitType" className="form-control" required defaultValue="">
                    <option value="">Select unit</option>
                    <option value="tablets">Tablets</option>
                    <option value="doses">Doses</option>
                    <option value="units">Units</option>
                    <option value="pairs">Pairs</option>
                    <option value="bottles">Bottles</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="supplier">Preferred Supplier</label>
                  <select id="supplier" className="form-control" defaultValue="">
                    <option value="">Select supplier</option>
                    <option value="medisupply">MediSupply Co.</option>
                    <option value="pharmaglobal">PharmaGlobal</option>
                    <option value="firstaid">First Aid Direct</option>
                    <option value="labequip">LabEquip Inc.</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input type="date" id="expiryDate" className="form-control" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="itemNotes">Notes</label>
                <textarea id="itemNotes" className="form-control" rows={3} placeholder="Any additional information..."></textarea>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setNewItemOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-inventory" style={{ flex: 1 }}>Add Item to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
