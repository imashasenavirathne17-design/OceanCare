import React, { useEffect, useMemo, useState } from 'react';
import { getUser, getToken } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryItems.css';

export default function InventoryItems() {
  const user = getUser();

  const [filters, setFilters] = useState({ category: 'All Categories', zone: 'All Zones', status: 'All Statuses', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [modalMode, setModalMode] = useState('list'); // 'create' | 'edit' | 'view'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('name'); // name | qty | min | expiry | zone | category
  const [sortDir, setSortDir] = useState('asc'); // asc | desc
  const [form, setForm] = useState({
    name: '',
    category: 'Medication',
    type: '',
    qty: 0,
    min: 0,
    expiry: '',
    supplier: '',
    zone: 'Medical Bay - Refrigerator',
    barcode: '',
    notes: '',
    icon: 'box',
    iconClass: 'supplies',
  });

  // Live dataset
  const [items, setItems] = useState([]);

  // Fetch items from backend
  useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          category: filters.category,
          zone: filters.zone,
          status: filters.status,
          search: filters.search,
          page: String(page),
          limit: String(limit),
        });
        const res = await fetch(`/api/inventory?${params.toString()}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('Failed to load inventory');
        const data = await res.json();
        const mapped = (data.items || []).map((it) => ({
          id: it._id || it.id,
          name: it.name,
          category: it.category,
          icon: it.icon || 'box',
          iconClass: it.iconClass || 'supplies',
          qty: it.qty,
          min: it.min,
          expiry: it.expiry ? String(it.expiry).slice(0, 10) : '',
          zone: it.zone,
          supplier: it.supplier,
          barcode: it.barcode,
          notes: it.notes,
        }));
        if (!abort) {
          setItems(mapped);
          setTotal(data.total || mapped.length);
        }
      } catch (e) {
        if (!abort) setError(e.message || 'Error loading inventory');
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => { abort = true; };
  }, [filters, page, limit]);

  // Reset page when filters change basics
  useEffect(() => { setPage(1); }, [filters.category, filters.zone, filters.status, filters.search]);

  const filtered = useMemo(() => {
    // client-side filter (on current page data) + sort
    const base = items.filter(it => {
      const matchCategory = filters.category === 'All Categories' || it.category.toLowerCase().includes(filters.category.split(' ')[0].toLowerCase());
      const matchZone = filters.zone === 'All Zones' || it.zone.toLowerCase().includes(filters.zone.toLowerCase());
      const status = it.qty < it.min ? 'Low Stock' : (new Date(it.expiry) - new Date()) / (1000*60*60*24) <= 30 ? 'Expiring Soon' : 'Adequate';
      const matchStatus = filters.status === 'All Statuses' || status.toLowerCase() === filters.status.toLowerCase();
      const matchSearch = !filters.search || it.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchCategory && matchZone && matchStatus && matchSearch;
    });
    const sorted = [...base].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const val = (key) => {
        if (key === 'expiry') return new Date(a.expiry || 0) - new Date(b.expiry || 0);
        if (key === 'qty' || key === 'min') return (a[key] || 0) - (b[key] || 0);
        return String(a[key] || '').localeCompare(String(b[key] || ''), undefined, { sensitivity: 'base' });
      };
      const valB = (key) => {
        if (key === 'expiry') return new Date(b.expiry || 0) - new Date(a.expiry || 0);
        if (key === 'qty' || key === 'min') return (b[key] || 0) - (a[key] || 0);
        return String(b[key] || '').localeCompare(String(a[key] || ''), undefined, { sensitivity: 'base' });
      };
      // compute based on sortBy
      if (sortDir === 'asc') return val(sortBy);
      return valB(sortBy);
    });
    return sorted;
  }, [items, filters, sortBy, sortDir]);

  const onApplyFilters = () => {
    // No-op; filtering triggers useEffect to reload
    // Optional toast could be added here
  };

  const onAddNewItem = () => {
    setEditingId(null);
    setForm({
      name: '', category: 'Medication', type: '', qty: 0, min: 0, expiry: '',
      supplier: '', zone: 'Medical Bay - Refrigerator', barcode: '', notes: '',
      icon: 'box', iconClass: 'supplies',
    });
    setModalMode('create');
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setModalMode('list'); };

  const saveItem = async () => {
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/inventory/${editingId}` : '/api/inventory';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...form,
          // Ensure numbers
          qty: Number(form.qty || 0),
          min: Number(form.min || 0),
          expiry: form.expiry || null,
        }),
      });
      if (!res.ok) {
        let msg = 'Failed to save item';
        try {
          const err = await res.json();
          if (err && err.message) msg = `${msg} (status ${res.status}): ${err.message}`;
        } catch {
          // ignore json parse error
        }
        console.error('Save item failed', { status: res.status, statusText: res.statusText });
        throw new Error(msg);
      }
      const saved = await res.json();
      const normalized = {
        id: saved._id || saved.id,
        name: saved.name,
        category: saved.category,
        icon: saved.icon || 'box',
        iconClass: saved.iconClass || 'supplies',
        qty: saved.qty,
        min: saved.min,
        expiry: saved.expiry ? String(saved.expiry).slice(0, 10) : '',
        zone: saved.zone,
        supplier: saved.supplier,
        barcode: saved.barcode,
        notes: saved.notes,
      };
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.id === normalized.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = normalized;
          return copy;
        }
        return [normalized, ...prev];
      });
      setModalOpen(false);
      setEditingId(null);
    } catch (e) {
      alert(e.message || 'Failed to save item');
    }
  };

  const startScanner = () => {
    alert('Barcode scanner activated. Point camera at barcode...');
    setTimeout(() => {
      alert('Barcode scanned: MED-INS-2024-001');
      setModalOpen(true);
    }, 1500);
  };

  const editItem = (it) => {
    setEditingId(it.id);
    setForm({
      name: it.name || '',
      category: it.category || 'Medication',
      type: it.type || '',
      qty: it.qty ?? 0,
      min: it.min ?? 0,
      expiry: it.expiry ? String(it.expiry).slice(0, 10) : '',
      supplier: it.supplier || '',
      zone: it.zone || 'Medical Bay - Refrigerator',
      barcode: it.barcode || '',
      notes: it.notes || '',
      icon: it.icon || 'box',
      iconClass: it.iconClass || 'supplies',
    });
    setModalMode('edit');
    setModalOpen(true);
  };

  const viewItem = (it) => {
    setEditingId(it.id);
    setForm({
      name: it.name || '',
      category: it.category || 'Medication',
      type: it.type || '',
      qty: it.qty ?? 0,
      min: it.min ?? 0,
      expiry: it.expiry ? String(it.expiry).slice(0, 10) : '',
      supplier: it.supplier || '',
      zone: it.zone || 'Medical Bay - Refrigerator',
      barcode: it.barcode || '',
      notes: it.notes || '',
      icon: it.icon || 'box',
      iconClass: it.iconClass || 'supplies',
    });
    setModalMode('view');
    setModalOpen(true);
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete item');
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.message || 'Failed to delete item');
    }
  };

  const statusMeta = (it) => {
    const days = Math.ceil((new Date(it.expiry) - new Date()) / (1000*60*60*24));
    if (it.qty < it.min) return { label: 'LOW STOCK', cls: 'status-low', pct: Math.round((it.qty / it.min) * 100) };
    if (days <= 30) return { label: 'EXPIRING SOON', cls: 'status-expiring', pct: Math.round((it.qty / it.min) * 100) };
    return { label: 'ADEQUATE', cls: 'status-adequate', pct: Math.min(100, Math.round((it.qty / it.min) * 100)) };
  };

  const headerCell = (label, key, alignLeft = false) => (
    <th style={{ textAlign: alignLeft ? 'left' : 'center', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => {
          if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
          else { setSortBy(key); setSortDir('asc'); }
        }}>
      <span>{label}</span>
      {sortBy === key && <span style={{ marginLeft: 6 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );

  const initials = (name) => {
    const parts = String(name || '').trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-container">
        <InventorySidebar onLogout={() => { /* handled by parent */ }} />

        <main className="main-content">
          {/* Header */}
          <div className="header">
            <h2>Inventory Items Management</h2>
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

          {/* Quick Barcode Scanner */}
          <div className="barcode-scanner">
            <div className="scanner-placeholder">
              <div className="scanner-icon"><i className="fas fa-barcode"></i></div>
              <div>Point camera at barcode/QR code to quickly add or update items</div>
            </div>
            <button className="btn btn-primary" onClick={startScanner}><i className="fas fa-camera"></i> Start Barcode Scanner</button>
          </div>

          {/* Item Controls */}
          <div className="item-controls">
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select className="filter-select" value={filters.category} onChange={(e) => setFilters(s => ({ ...s, category: e.target.value }))}>
                <option>All Categories</option>
                <option>Medications</option>
                <option>Medical Supplies</option>
                <option>Emergency Equipment</option>
                <option>First Aid</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Storage Zone</label>
              <select className="filter-select" value={filters.zone} onChange={(e) => setFilters(s => ({ ...s, zone: e.target.value }))}>
                <option>All Zones</option>
                <option>Medical Bay</option>
                <option>Emergency Kits</option>
                <option>Crew Quarters</option>
                <option>Bridge</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select className="filter-select" value={filters.status} onChange={(e) => setFilters(s => ({ ...s, status: e.target.value }))}>
                <option>All Statuses</option>
                <option>Low Stock</option>
                <option>Adequate</option>
                <option>Expiring Soon</option>
              </select>
            </div>

            <div className="search-box">
              <input type="text" placeholder="Search items…" value={filters.search} onChange={(e) => setFilters(s => ({ ...s, search: e.target.value }))} />
            </div>
            <div className="controls-actions">
              <button className="btn btn-primary" onClick={onApplyFilters}><i className="fas fa-filter"></i> Apply Filters</button>
              <button className="btn btn-success" onClick={onAddNewItem}><i className="fas fa-plus"></i> Add New Item</button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="inventory-table-wrapper">
            <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {headerCell('Item', 'name', true)}
                  {headerCell('Category', 'category', true)}
                  {headerCell('Qty', 'qty')}
                  {headerCell('Min', 'min')}
                  {headerCell('Expiry', 'expiry', true)}
                  {headerCell('Zone', 'zone', true)}
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const meta = statusMeta(it);
                  const pct = it.min ? Math.min(100, Math.round((it.qty / it.min) * 100)) : 0;
                  return (
                    <tr key={it.id} style={{ borderTop: '1px solid #eee' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="chip-avatar" title={it.name}>
                            {initials(it.name) || 'I'}
                          </span>
                          <div>
                            <div className="item-name" style={{ fontWeight: 600 }}>{it.name}</div>
                            <div className="progress-text" style={{ fontSize: 12, color: '#777' }}>{pct}% of minimum</div>
                          </div>
                        </div>
                      </td>
                      <td>{it.category}</td>
                      <td style={{ textAlign: 'center' }}>{it.qty}</td>
                      <td style={{ textAlign: 'center' }}>{it.min}</td>
                      <td>{it.expiry}</td>
                      <td>{it.zone}</td>
                      <td>
                        <span className={`item-status ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-group">
                          <button className="btn btn-round btn-view" title="View" onClick={() => viewItem(it)}><i className="fas fa-eye"></i></button>
                          <button className="btn btn-round btn-edit" title="Edit" onClick={() => editItem(it)}><i className="fas fa-edit"></i></button>
                          <button className="btn btn-round btn-delete" title="Delete" onClick={() => deleteItem(it.id)}><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#777' }}>No items match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="inventory-table-footer">
              <div>Page {page} of {Math.max(1, Math.ceil(total / limit))} • {total} items</div>
              <div className="pager">
                <label className="rows-select">
                  <span>Rows</span>
                  <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>
                <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                <button className="btn btn-primary" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Item Modal */}
      {modalOpen && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">{modalMode === 'view' ? 'View Inventory Item' : editingId ? 'Edit Inventory Item' : 'Add New Inventory Item'}</div>
              <button className="close-modal" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input type="text" className="form-control" placeholder="Enter item name" value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} disabled={modalMode==='view'} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category} onChange={(e) => setForm(s => ({ ...s, category: e.target.value }))} disabled={modalMode==='view'}>
                    <option>Medication</option>
                    <option>Medical Supply</option>
                    <option>Emergency Equipment</option>
                    <option>First Aid</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Item Type</label>
                  <input type="text" className="form-control" placeholder="e.g., Antibiotic, Bandage" value={form.type} onChange={(e) => setForm(s => ({ ...s, type: e.target.value }))} disabled={modalMode==='view'} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Quantity</label>
                  <input type="number" className="form-control" placeholder="Enter quantity" value={form.qty} onChange={(e) => setForm(s => ({ ...s, qty: e.target.value }))} disabled={modalMode==='view'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Stock Level</label>
                  <input type="number" className="form-control" placeholder="Alert threshold" value={form.min} onChange={(e) => setForm(s => ({ ...s, min: e.target.value }))} disabled={modalMode==='view'} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Expiration Date</label>
                  <input type="date" className="form-control" value={form.expiry} onChange={(e) => setForm(s => ({ ...s, expiry: e.target.value }))} disabled={modalMode==='view'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input type="text" className="form-control" placeholder="Supplier name" value={form.supplier} onChange={(e) => setForm(s => ({ ...s, supplier: e.target.value }))} disabled={modalMode==='view'} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <select className="form-control" value={form.zone} onChange={(e) => setForm(s => ({ ...s, zone: e.target.value }))} disabled={modalMode==='view'}>
                  <option>Medical Bay - Refrigerator</option>
                  <option>Medical Bay - Cabinet A</option>
                  <option>Medical Bay - Cabinet B</option>
                  <option>Emergency Cart</option>
                  <option>Bridge First Aid Kit</option>
                  <option>Crew Quarters Medical Locker</option>
                  <option>Life Raft Emergency Kit</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Barcode/QR Code</label>
                <input type="text" className="form-control" placeholder="Scan or enter barcode" value={form.barcode} onChange={(e) => setForm(s => ({ ...s, barcode: e.target.value }))} disabled={modalMode==='view'} />
                <small style={{ color: '#666', marginTop: 5, display: 'block' }}>Use barcode scanner or manually enter product code</small>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={3} placeholder="Additional information..." value={form.notes} onChange={(e) => setForm(s => ({ ...s, notes: e.target.value }))} disabled={modalMode==='view'}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>{modalMode==='view' ? 'Close' : 'Cancel'}</button>
              {modalMode!=='view' && (
                <button className="btn btn-primary" onClick={saveItem}>Save Item</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
