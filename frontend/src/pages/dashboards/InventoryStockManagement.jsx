import React, { useEffect, useMemo, useState } from 'react';
import { getUser, getToken } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryStockManagement.css';

export default function InventoryStockManagement() {
  const user = getUser();
  const token = getToken();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Rows loaded from backend
  const [rows, setRows] = useState([]);

  // Load from backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load inventory');
        const data = await res.json();
        const items = (data.items || []).map((it) => ({
          id: it._id,
          name: it.name,
          category: it.category,
          current: it.qty,
          min: it.min,
          updated: new Date(it.updatedAt || it.createdAt).toLocaleString(),
        }));
        setRows(items);
      } catch (e) {
        console.error(e);
      }
    };
    if (token) load();
  }, [API, token]);

  // Delete an item from inventory (moved outside useEffect)
  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      const res = await fetch(`${API}/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete item');
    }
  };

  // Edit modal state and handlers (richer form)
  const [edit, setEdit] = useState({
    open: false,
    id: null,
    name: '',
    category: '',
    min: 0,
    qty: 0,
    supplier: '',
    zone: '',
    barcode: '',
    expiry: '', // yyyy-mm-dd
    notes: '',
    loading: false,
  });

  const openEdit = async (row) => {
    // Open immediately with known fields for responsiveness
    setEdit(s => ({
      ...s,
      open: true,
      id: row.id,
      name: row.name,
      category: row.category,
      min: row.min,
      qty: row.current,
      loading: true,
    }));
    // Fetch full item details
    try {
      const res = await fetch(`${API}/api/inventory/${row.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const it = await res.json();
        const exp = it.expiry ? new Date(it.expiry).toISOString().slice(0, 10) : '';
        setEdit(s => ({
          ...s,
          name: it.name || s.name,
          category: it.category || s.category,
          min: typeof it.min === 'number' ? it.min : s.min,
          qty: typeof it.qty === 'number' ? it.qty : s.qty,
          supplier: it.supplier || '',
          zone: it.zone || '',
          barcode: it.barcode || '',
          expiry: exp,
          notes: it.notes || '',
          loading: false,
        }));
      } else {
        setEdit(s => ({ ...s, loading: false }));
      }
    } catch (e) {
      console.error(e);
      setEdit(s => ({ ...s, loading: false }));
    }
  };

  const closeEdit = () => setEdit(s => ({ ...s, open: false }));

  const saveEdit = async () => {
    if (!edit.name.trim()) return alert('Name is required');
    try {
      const body = {
        name: edit.name,
        category: edit.category,
        min: Number(edit.min) || 0,
        qty: Number(edit.qty) || 0,
        supplier: edit.supplier || undefined,
        zone: edit.zone || undefined,
        barcode: edit.barcode || undefined,
        expiry: edit.expiry ? new Date(edit.expiry).toISOString() : undefined,
        notes: edit.notes || undefined,
      };
      const res = await fetch(`${API}/api/inventory/${edit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        if (res.status === 401) return alert('Session expired. Please log in again.');
        if (res.status === 403) return alert('You do not have permission to edit inventory.');
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save');
      }
      const updated = await res.json();
      setRows(prev => prev.map(r => r.id === edit.id ? {
        id: updated._id,
        name: updated.name,
        category: updated.category,
        current: updated.qty,
        min: updated.min,
        updated: new Date(updated.updatedAt || Date.now()).toLocaleString(),
      } : r));
      closeEdit();
    } catch (e) {
      console.error(e);
      alert('Failed to save changes');
    }
  };

  const [filters, setFilters] = useState({ stock: 'All Items', category: 'All Categories', search: '' });

  const statusOf = (row) => {
    if (row.current <= 0 || row.current < Math.min(1, row.min / 4)) return 'CRITICAL';
    if (row.current < row.min) return 'LOW';
    return 'ADEQUATE';
  };

  // When typing/selecting an existing item, prefill known details
  const handleNewStockNameChange = (e) => {
    const name = e.target.value;
    // Always set the typed name first
    setNewStock(s => ({ ...s, name }));
    // Try to find an existing row to prefill details
    const match = rows.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (match) {
      setNewStock(s => ({
        ...s,
        name,
        category: match.category,
        current: match.current,
        min: match.min,
      }));
    }
  };

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const status = statusOf(r);
      const matchStock =
        filters.stock === 'All Items' ||
        (filters.stock === 'Low Stock' && status === 'LOW') ||
        (filters.stock === 'Critical Stock' && status === 'CRITICAL') ||
        (filters.stock === 'Adequate Stock' && status === 'ADEQUATE');
      const matchCat = filters.category === 'All Categories' || r.category.toLowerCase().includes(filters.category.split(' ')[0].toLowerCase());
      const matchSearch = !filters.search || r.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchStock && matchCat && matchSearch;
    });
  }, [rows, filters]);

  const handleExport = () => {
    if (!filtered.length) {
      alert('No stock data to export.');
      return;
    }
    const escape = (value) => {
      const str = String(value ?? '');
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const header = ['Item Name', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Last Updated'];
    const rowsCsv = filtered.map((r) => [
      r.name,
      r.category,
      r.current,
      r.min,
      statusOf(r),
      r.updated,
    ]);
    const csv = [header, ...rowsCsv].map(row => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-stock-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Modal state
  const [modal, setModal] = useState({ open: false, id: null, item: '', current: 0, delta: 0, reason: '', notes: '' });

  const openAdjust = (id, name, current) => setModal({ open: true, id, item: name, current, delta: 0, reason: '', notes: '' });
  const closeAdjust = () => setModal(s => ({ ...s, open: false }));

  const applyFilters = () => {
    alert(`Filters applied:\nStock Status: ${filters.stock}\nCategory: ${filters.category}`);
  };
  // scanToUpdate removed
  // New Stock modal state (matches Edit fields)
  const [newStock, setNewStock] = useState({
    open: false,
    name: '',
    category: 'Medication',
    current: 0,
    min: 0,
    supplier: '',
    zone: '',
    barcode: '',
    expiry: '',
    notes: '',
  });
  const openNewStock = () => setNewStock({ open: true, name: '', category: 'Medication', current: 0, min: 0, supplier: '', zone: '', barcode: '', expiry: '', notes: '' });
  const closeNewStock = () => setNewStock(s => ({ ...s, open: false }));
  const saveNewStock = async () => {
    if (!newStock.name.trim()) { alert('Please enter item name'); return; }
    if (newStock.current < 0 || newStock.min < 0) { alert('Values cannot be negative'); return; }
    try {
      const body = {
        name: newStock.name,
        category: newStock.category,
        qty: Number(newStock.current) || 0,
        min: Number(newStock.min) || 0,
        supplier: newStock.supplier || undefined,
        zone: newStock.zone || undefined,
        barcode: newStock.barcode || undefined,
        expiry: newStock.expiry ? new Date(newStock.expiry).toISOString() : undefined,
        notes: newStock.notes || undefined,
      };
      const res = await fetch(`${API}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save item');
      const it = await res.json();
      setRows(prev => ([...prev, {
        id: it._id,
        name: it.name,
        category: it.category,
        current: it.qty,
        min: it.min,
        updated: 'Just now',
      }]));
      closeNewStock();
    } catch (e) {
      console.error(e);
      alert('Failed to save item');
    }
  };

  const saveAdjustment = async () => {
    if (!modal.reason || modal.reason === 'Select adjustment reason...') return alert('Please select an adjustment reason');
    if (modal.delta === 0) return alert('Please adjust the quantity');
    const target = rows.find(r => r.id === modal.id);
    if (!target) return alert('Item not found');
    const newQty = Math.max(0, target.current + modal.delta);
    try {
      const res = await fetch(`${API}/api/inventory/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qty: newQty }),
      });
      if (!res.ok) {
        if (res.status === 401) return alert('Session expired. Please log in again.');
        if (res.status === 403) return alert('You do not have permission to adjust inventory.');
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update stock');
      }
      const updated = await res.json();
      setRows(prev => prev.map(r => r.id === target.id ? { ...r, current: updated.qty, updated: 'Just now' } : r));
      closeAdjust();
    } catch (e) {
      console.error(e);
      alert('Failed to update stock');
    }
  };

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-container">
        <InventorySidebar onLogout={() => { /* handled upstream */ }} />
        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Stock Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Stock Controls */}
          <div className="stock-controls">
            <div className="filter-group">
              <label className="filter-label">Stock Status</label>
              <select className="filter-select" value={filters.stock} onChange={(e) => setFilters(s => ({ ...s, stock: e.target.value }))}>
                <option>All Items</option>
                <option>Low Stock</option>
                <option>Critical Stock</option>
                <option>Adequate Stock</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select className="filter-select" value={filters.category} onChange={(e) => setFilters(s => ({ ...s, category: e.target.value }))}>
                <option>All Categories</option>
                <option>Medications</option>
                <option>Medical Supplies</option>
              </select>
            </div>
            <div className="search-box">
              <input type="text" placeholder="Search items..." value={filters.search} onChange={(e) => setFilters(s => ({ ...s, search: e.target.value }))} />
            </div>
            <div className="controls-actions">
              <button className="btn btn-primary" onClick={applyFilters}><i className="fas fa-filter"></i> Apply Filters</button>
              <button className="btn btn-success" onClick={openNewStock}><i className="fas fa-plus"></i> New Stock</button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="stock-table-container">
            <div className="table-header">
              <div className="table-title">Current Stock Levels</div>
                <button className="btn btn-primary" onClick={handleExport}><i className="fas fa-download"></i> Export</button>
              </div>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const status = statusOf(r);
                  return (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.category}</td>
                      <td>{r.current}</td>
                      <td>{r.min}</td>
                      <td>
                        <span className={`stock-status ${status === 'CRITICAL' ? 'status-critical' : status === 'LOW' ? 'status-warning' : 'status-adequate'}`}>{status}</span>
                      </td>
                      <td>{r.updated}</td>
                      <td className="stock-actions">
                        <button
                          className="btn btn-warning btn-sm icon-btn"
                          title="Edit"
                          onClick={() => openEdit(r)}
                        >
                          <i className="fas fa-pen-to-square fa-fw"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-sm icon-btn"
                          title="Delete"
                          onClick={() => deleteItem(r.id)}
                        >
                          <i className="fas fa-trash fa-fw"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Stock Alerts removed as requested */}
        {/* New Stock Modal (page-level) */}
        {newStock.open && (
          <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title">Add New Stock Item</div>
                <button className="close-modal" onClick={closeNewStock}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Insulin Vials"
                    value={newStock.name}
                    onChange={handleNewStockNameChange}
                    list="existing-stock-items"
                  />
                  <datalist id="existing-stock-items">
                    {rows.map(r => (
                      <option key={r.id} value={r.name} />
                    ))}
                  </datalist>
                  {(() => {
                    const m = rows.find(r => r.name.toLowerCase() === (newStock.name || '').toLowerCase());
                    return m ? (
                      <small style={{ color: '#6b7280' }}>Existing item: current {m.current}, min {m.min} ({m.category})</small>
                    ) : null;
                  })()}
                </div>
                <div className="form-row" style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Category</label>
                    <select className="form-control" value={newStock.category} onChange={(e) => setNewStock(s => ({ ...s, category: e.target.value }))}>
                      <option>Medication</option>
                      <option>Medical Supply</option>
                      <option>Emergency Equipment</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Current Stock</label>
                    <input type="number" className="form-control" value={newStock.current} onChange={(e) => setNewStock(s => ({ ...s, current: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Min Stock</label>
                    <input type="number" className="form-control" value={newStock.min} onChange={(e) => setNewStock(s => ({ ...s, min: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: 15, marginTop: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Adjustment Type</label>
                    <select className="form-control" value={newStock.adjustmentType} onChange={(e) => setNewStock(s => ({ ...s, adjustmentType: e.target.value }))}>
                      <option>Usage</option>
                      <option>Restock</option>
                      <option>Transfer</option>
                      <option>Waste</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Quantity</label>
                    <input type="number" className="form-control" placeholder="Qty" value={newStock.quantity} onChange={(e) => setNewStock(s => ({ ...s, quantity: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Reason</label>
                    <input type="text" className="form-control" placeholder="Medical event, delivery, etc." value={newStock.reason} onChange={(e) => setNewStock(s => ({ ...s, reason: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={closeNewStock}>Cancel</button>
                <button className="btn btn-primary" onClick={saveNewStock}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Stock Modal (with additional fields) */}
        {edit.open && (
          <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title">Edit Stock Item</div>
                <button className="close-modal" onClick={closeEdit}>&times;</button>
              </div>
              <div className="modal-body">
                {edit.loading && <div style={{ marginBottom: 10, color: '#777' }}>Loading details...</div>}
                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input type="text" className="form-control" value={edit.name} onChange={(e) => setEdit(s => ({ ...s, name: e.target.value }))} />
                </div>
                <div className="form-row" style={{ display: 'flex', gap: 15 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Category</label>
                    <select className="form-control" value={edit.category} onChange={(e) => setEdit(s => ({ ...s, category: e.target.value }))}>
                      <option>Medication</option>
                      <option>Medical Supply</option>
                      <option>Emergency Equipment</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Current Stock</label>
                    <input type="number" className="form-control" value={edit.qty} onChange={(e) => setEdit(s => ({ ...s, qty: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Min Stock</label>
                    <input type="number" className="form-control" value={edit.min} onChange={(e) => setEdit(s => ({ ...s, min: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: 15, marginTop: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Supplier</label>
                    <input type="text" className="form-control" value={edit.supplier} onChange={(e) => setEdit(s => ({ ...s, supplier: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Zone</label>
                    <input type="text" className="form-control" value={edit.zone} onChange={(e) => setEdit(s => ({ ...s, zone: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Barcode</label>
                    <input type="text" className="form-control" value={edit.barcode} onChange={(e) => setEdit(s => ({ ...s, barcode: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: 15, marginTop: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Expiry</label>
                    <input type="date" className="form-control" value={edit.expiry} onChange={(e) => setEdit(s => ({ ...s, expiry: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={3} value={edit.notes} onChange={(e) => setEdit(s => ({ ...s, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={closeEdit}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Adjust Stock Modal */}
      {modal.open && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Adjust Stock Quantity</div>
              <button className="close-modal" onClick={closeAdjust}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                <strong>Item:</strong> <span>{modal.item}</span><br />
                <strong>Current Stock:</strong> <span>{modal.current}</span> units
              </div>
              <div className="quantity-input">
                <button className="quantity-btn" onClick={() => setModal(s => ({ ...s, delta: Math.max(-modal.current, s.delta - 1) }))}>-</button>
                <div className="quantity-display">{modal.delta}</div>
                <button className="quantity-btn" onClick={() => setModal(s => ({ ...s, delta: s.delta + 1 }))}>+</button>
              </div>
              <select className="reason-select" value={modal.reason} onChange={(e) => setModal(s => ({ ...s, reason: e.target.value }))}>
                <option>Select adjustment reason...</option>
                <option>Medical Usage</option>
                <option>Restock Delivery</option>
                <option>Transfer Between Zones</option>
                <option>Waste/Disposal</option>
                <option>Damage/Loss</option>
                <option>Counting Correction</option>
              </select>
              <textarea className="notes-input" placeholder="Additional notes (optional)..." value={modal.notes} onChange={(e) => setModal(s => ({ ...s, notes: e.target.value }))}></textarea>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeAdjust}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAdjustment}>Save Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
