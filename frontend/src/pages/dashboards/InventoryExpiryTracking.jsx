import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { getUser, getToken } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryExpiryTracking.css';

export default function InventoryExpiryTracking() {
  const user = getUser();
  const token = getToken();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      const res = await fetch(`${API}/api/inventory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      const mapped = (data.items || []).map((it) => ({
        id: it._id || it.id,
        name: it.name,
        category: it.category,
        expiry: it.expiry ? new Date(it.expiry).toISOString().slice(0, 10) : '',
        qty: it.qty ?? 0,
        min: it.min ?? 0,
        supplier: it.supplier || '',
        notes: it.notes || '',
      }));
      setItems(mapped);
    } catch (e) {
      setError(e.message || 'Error loading inventory');
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  useEffect(() => {
    if (token) fetchInventory();
  }, [fetchInventory, token]);

  const now = new Date();
  const daysTo = (d) => {
    if (!d) return Infinity;
    return Math.ceil((new Date(d) - now) / (1000 * 60 * 60 * 24));
  };

  const stats = useMemo(() => {
    let expired = 0, exp30 = 0, exp90 = 0, safe = 0;
    items.forEach(it => {
      const d = daysTo(it.expiry);
      if (d <= 0) expired++; else if (d <= 30) exp30++; else if (d <= 90) exp90++; else safe++;
    });
    return { expired, exp30, exp90, safe };
  }, [items]);

  const [filters, setFilters] = useState({ expiry: 'All Items', category: 'All Categories', search: '' });
  const filtered = useMemo(() => items.filter(it => {
    const d = daysTo(it.expiry);
    const status = d <= 0 ? 'Expired' : d <= 30 ? 'Expiring Soon (30 days)' : d <= 90 ? 'Expiring in 90 Days' : 'Safe';
    const matchExpiry = filters.expiry === 'All Items' || filters.expiry === status;
    const matchCat = filters.category === 'All Categories' || it.category.toLowerCase().includes(filters.category.split(' ')[0].toLowerCase());
    const matchSearch = !filters.search || it.name.toLowerCase().includes(filters.search.toLowerCase());
    return matchExpiry && matchCat && matchSearch;
  }), [items, filters]);

  const [disposal, setDisposal] = useState({
    open: false,
    id: null,
    item: '',
    available: 0,
    expiry: '',
    quantity: 1,
    reason: 'Expired',
    method: 'Incineration',
    notes: '',
    submitting: false,
  });

  const [edit, setEdit] = useState({
    open: false,
    id: null,
    name: '',
    category: '',
    qty: 0,
    min: 0,
    expiry: '',
    supplier: '',
    notes: '',
    submitting: false,
  });

  const openDispose = (item) => {
    setDisposal({
      open: true,
      id: item.id,
      item: item.name,
      available: item.qty,
      expiry: item.expiry || 'N/A',
      quantity: Math.min(item.qty || 1, item.qty || 1),
      reason: 'Expired',
      method: 'Incineration',
      notes: '',
      submitting: false,
    });
  };

  const closeDispose = () => setDisposal(s => ({ ...s, open: false }));

  const confirmDispose = async () => {
    if (disposal.submitting) return;
    const amount = Number(disposal.quantity);
    if (!amount || amount <= 0) {
      alert('Enter a valid disposal quantity.');
      return;
    }
    if (amount > disposal.available) {
      alert('Disposal quantity exceeds available stock.');
      return;
    }
    setDisposal(s => ({ ...s, submitting: true }));
    try {
      const body = {
        qty: Math.max(0, disposal.available - amount),
        notes: disposal.notes || undefined,
      };
      const res = await fetch(`${API}/api/inventory/${disposal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to record disposal');
      await res.json();
      alert('Disposal recorded successfully.');
      closeDispose();
      fetchInventory();
    } catch (e) {
      alert(e.message || 'Failed to record disposal');
      setDisposal(s => ({ ...s, submitting: false }));
    }
  };

  const openEdit = (item) => {
    setEdit({
      open: true,
      id: item.id,
      name: item.name,
      category: item.category,
      qty: item.qty,
      min: item.min ?? 0,
      expiry: item.expiry || '',
      supplier: item.supplier || '',
      notes: item.notes || '',
      submitting: false,
    });
  };

  const closeEdit = () => setEdit(s => ({ ...s, open: false }));

  const saveEdit = async () => {
    if (edit.submitting) return;
    if (!edit.name.trim()) {
      alert('Item name is required.');
      return;
    }
    setEdit(s => ({ ...s, submitting: true }));
    try {
      const body = {
        name: edit.name,
        category: edit.category,
        qty: Number(edit.qty) || 0,
        min: Number(edit.min) || 0,
        expiry: edit.expiry ? new Date(edit.expiry).toISOString() : null,
        supplier: edit.supplier || undefined,
        notes: edit.notes || undefined,
      };
      const res = await fetch(`${API}/api/inventory/${edit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update item');
      await res.json();
      alert('Item updated successfully.');
      closeEdit();
      fetchInventory();
    } catch (e) {
      alert(e.message || 'Failed to update item');
      setEdit(s => ({ ...s, submitting: false }));
    }
  };

  const deleteItem = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      const res = await fetch(`${API}/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete item');
      alert('Item deleted.');
      fetchInventory();
    } catch (e) {
      alert(e.message || 'Failed to delete item');
    }
  };

  const handleExport = () => {
    if (!filtered.length) {
      alert('No data to export.');
      return;
    }
    const escape = (value) => {
      const str = String(value ?? '');
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const header = ['Item Name', 'Category', 'Expiry Date', 'Days Remaining', 'Quantity'];
    const rowsCsv = filtered.map((it) => {
      const days = daysTo(it.expiry);
      return [
        it.name,
        it.category,
        it.expiry || 'N/A',
        Number.isFinite(days) ? days : 'No expiry',
        it.qty,
      ];
    });
    const csv = [header, ...rowsCsv].map(row => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-expiry-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const applyFilters = () => {
    fetchInventory();
  };

  const refresh = () => {
    fetchInventory();
  };

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-container">
        <InventorySidebar onLogout={() => {}} />
        <main className="main-content">
          <div className="header">
            <h2>Expiry Tracking & Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {loading && <div className="info-banner">Loading inventory…</div>}
          {!!error && <div className="error-banner">{error}</div>}

          {/* Stats */}
          <div className="expiry-stats">
            <div className="stat-card"><div className="stat-icon expired"><i className="fas fa-skull-crossbones"/></div><div className="stat-value">{stats.expired}</div><div className="stat-label">Expired Items</div></div>
            <div className="stat-card"><div className="stat-icon expiring"><i className="fas fa-exclamation-triangle"/></div><div className="stat-value">{stats.exp30}</div><div className="stat-label">Expiring in 30 Days</div></div>
            <div className="stat-card"><div className="stat-icon month"><i className="fas fa-clock"/></div><div className="stat-value">{stats.exp90}</div><div className="stat-label">Expiring in 90 Days</div></div>
            <div className="stat-card"><div className="stat-icon safe"><i className="fas fa-check-circle"/></div><div className="stat-value">{stats.safe}</div><div className="stat-label">Safe Items</div></div>
          </div>

          {/* Controls */}
          <div className="expiry-controls">
            <div className="filter-group"><label className="filter-label">Expiry Status</label>
              <select className="filter-select" value={filters.expiry} onChange={(e)=>setFilters(s=>({...s,expiry:e.target.value}))}>
                <option>All Items</option><option>Expired</option><option>Expiring Soon (30 days)</option><option>Expiring in 90 Days</option><option>Safe</option>
              </select>
            </div>
            <div className="filter-group"><label className="filter-label">Category</label>
              <select className="filter-select" value={filters.category} onChange={(e)=>setFilters(s=>({...s,category:e.target.value}))}>
                <option>All Categories</option><option>Medications</option><option>Medical Supplies</option><option>Emergency Equipment</option>
              </select>
            </div>
            <div className="search-box"><i className="fas fa-search"/><input type="text" placeholder="Search items..." value={filters.search} onChange={(e)=>setFilters(s=>({...s,search:e.target.value}))} /></div>
            <button className="btn btn-primary" onClick={applyFilters}><i className="fas fa-filter"/> Apply Filters</button>
            <button className="btn btn-danger" onClick={()=>alert('Bulk disposal workflow is not yet implemented.')}><i className="fas fa-trash-alt"/> Bulk Disposal</button>
          </div>

          {/* Timeline */}
          <div className="expiry-timeline">
            <div className="section-header"><div className="section-title">Expiry Timeline</div><a href="#" style={{color:'var(--primary)',textDecoration:'none',fontSize:14}}>View Calendar</a></div>
            <div className="timeline">
              <div className="timeline-item expired"><div className="timeline-date">Already Expired</div><div className="timeline-count">{stats.expired} items</div><div className="timeline-desc">Require immediate disposal</div></div>
              <div className="timeline-item expiring"><div className="timeline-date">Within 7 Days</div><div className="timeline-count">{Math.min(stats.exp30,5)} items</div><div className="timeline-desc">Critical priority</div></div>
              <div className="timeline-item expiring"><div className="timeline-date">8-30 Days</div><div className="timeline-count">{Math.max(0, stats.exp30 - Math.min(stats.exp30,5))} items</div><div className="timeline-desc">High priority</div></div>
              <div className="timeline-item month"><div className="timeline-date">1-3 Months</div><div className="timeline-count">{stats.exp90}</div><div className="timeline-desc">Monitor closely</div></div>
              <div className="timeline-item"><div className="timeline-date">3+ Months</div><div className="timeline-count">{stats.safe}</div><div className="timeline-desc">Safe for now</div></div>
            </div>
          </div>

          {/* Table */}
          <div className="expiry-table-container">
            <div className="table-header"><div className="table-title">Items by Expiry Status</div><div className="table-actions"><button className="btn btn-primary" onClick={handleExport}><i className="fas fa-download"/> Export</button></div></div>
            <table className="expiry-table">
              <thead><tr><th>Item Name</th><th>Category</th><th>Expiry Date</th><th>Days Remaining</th><th>Quantity</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(it => { const d = daysTo(it.expiry); const status = d<=0?'EXPIRED': d<=30?'CRITICAL': d<=90?'1 MONTH':'SAFE';
                  return (
                    <tr key={it.id}>
                      <td>{it.name}</td><td>{it.category}</td><td>{it.expiry}</td>
                      <td style={{color: d<=0?'var(--danger)': d<=30?'var(--danger)': d<=90?'var(--info)':'inherit', fontWeight:600}}>{d} days</td>
                      <td>{it.qty} units</td>
                      <td><span className={`expiry-status ${d<=0?'status-expired': d<=30?'status-expiring': d<=90?'status-month':'status-safe'}`}>{status}</span></td>
                      <td className="expiry-actions">
                        {d<=30 && (
                          <button className="btn btn-warning btn-sm" onClick={()=>openDispose(it)}><i className="fas fa-trash"/> Dispose</button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={()=>openEdit(it)} style={{ marginLeft: 8 }}><i className="fas fa-pen"/> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>deleteItem(it.id, it.name)} style={{ marginLeft: 8 }}><i className="fas fa-trash-alt"/> Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Disposal Log (static demo) */}
          <div className="disposal-log">
            <div className="section-header"><div className="section-title">Recent Disposal Records</div><a href="#" style={{color:'var(--primary)',textDecoration:'none',fontSize:14}}>View All</a></div>
            <ul className="log-list">
              <li className="log-item"><div className="log-icon"><i className="fas fa-trash"/></div><div className="log-content"><div className="log-title">Disposal - Antiseptic Wipes</div><div className="log-desc">12 units disposed - Expired on 2023-10-15</div><div className="log-time">Disposed: Today, 09:30 AM • By: Alex Johnson</div></div><div className="log-actions"><button className="btn btn-sm">View Details</button></div></li>
            </ul>
          </div>
        </main>
      </div>

      {disposal.open && (
        <div className="modal" style={{display:'flex'}}>
          <div className="modal-content">
            <div className="modal-header"><div className="modal-title">Record Item Disposal</div><button className="close-modal" onClick={closeDispose}>&times;</button></div>
            <div className="modal-body">
              <div className="disposal-info">
                <div className="disposal-item"><span className="disposal-label">Item:</span> {disposal.item}</div>
                <div className="disposal-item"><span className="disposal-label">Available Quantity:</span> {disposal.available} units</div>
                <div className="disposal-item"><span className="disposal-label">Expiry Date:</span> {disposal.expiry}</div>
              </div>
              <div className="form-group"><label className="form-label">Disposal Quantity</label><input type="number" className="form-control" min={1} max={disposal.available} value={disposal.quantity} onChange={(e)=>setDisposal(s=>({...s, quantity: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Disposal Reason</label><select className="form-select" value={disposal.reason} onChange={(e)=>setDisposal(s=>({...s, reason: e.target.value }))}><option>Expired</option><option>Damaged</option><option>Contaminated</option><option>Recall</option><option>Other</option></select></div>
              <div className="form-group"><label className="form-label">Disposal Method</label><select className="form-select" value={disposal.method} onChange={(e)=>setDisposal(s=>({...s, method: e.target.value }))}><option>Incineration</option><option>Chemical Treatment</option><option>Return to Supplier</option><option>Marine Disposal (Approved)</option><option>Other</option></select></div>
              <div className="form-group"><label className="form-label">Disposal Notes</label><textarea className="form-control" rows={3} placeholder="Additional disposal details..." value={disposal.notes} onChange={(e)=>setDisposal(s=>({...s, notes: e.target.value }))}/></div>
            </div>
            <div className="modal-footer"><button className="btn" onClick={closeDispose}>Cancel</button><button className="btn btn-danger" onClick={confirmDispose} disabled={disposal.submitting}>{disposal.submitting ? 'Recording...' : 'Confirm Disposal'}</button></div>
          </div>
        </div>
      )}
      {edit.open && (
        <div className="modal" style={{display:'flex'}}>
          <div className="modal-content">
            <div className="modal-header"><div className="modal-title">Edit Inventory Item</div><button className="close-modal" onClick={closeEdit}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Item Name</label><input type="text" className="form-control" value={edit.name} onChange={(e)=>setEdit(s=>({...s, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Category</label><input type="text" className="form-control" value={edit.category} onChange={(e)=>setEdit(s=>({...s, category: e.target.value }))} /></div>
              <div className="form-row" style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Quantity</label><input type="number" className="form-control" value={edit.qty} onChange={(e)=>setEdit(s=>({...s, qty: e.target.value }))} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Min Stock</label><input type="number" className="form-control" value={edit.min} onChange={(e)=>setEdit(s=>({...s, min: e.target.value }))} /></div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Expiry Date</label><input type="date" className="form-control" value={edit.expiry} onChange={(e)=>setEdit(s=>({...s, expiry: e.target.value }))} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Supplier</label><input type="text" className="form-control" value={edit.supplier} onChange={(e)=>setEdit(s=>({...s, supplier: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={3} value={edit.notes} onChange={(e)=>setEdit(s=>({...s, notes: e.target.value }))}/></div>
            </div>
            <div className="modal-footer"><button className="btn" onClick={closeEdit}>Cancel</button><button className="btn btn-primary" onClick={saveEdit} disabled={edit.submitting}>{edit.submitting ? 'Saving...' : 'Save Changes'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
