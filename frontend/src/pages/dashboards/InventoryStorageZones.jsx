import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getUser, getToken } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryStorageZones.css';

export default function InventoryStorageZones() {
  const user = getUser();
  const token = getToken();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeZone, setActiveZone] = useState('All Zones');
  const [search, setSearch] = useState('');
  const [moveModal, setMoveModal] = useState({ open: false, id: null, name: '', zone: '', submitting: false });
  const [editModal, setEditModal] = useState({
    open: false,
    id: null,
    name: '',
    category: '',
    qty: '0',
    min: '0',
    zone: '',
    expiry: '',
    supplier: '',
    notes: '',
    submitting: false,
  });
  const [createModal, setCreateModal] = useState({
    open: false,
    name: '',
    category: 'Medication',
    qty: '0',
    min: '0',
    zone: '',
    expiry: '',
    supplier: '',
    notes: '',
    submitting: false,
  });

  const fetchInventory = useCallback(async () => {
    if (!token) return;
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
        qty: it.qty ?? 0,
        min: it.min ?? 0,
        zone: (it.zone || '').trim(),
        expiry: it.expiry ? new Date(it.expiry).toISOString().slice(0, 10) : '',
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
    if (!token) {
      setItems([]);
      return;
    }
    fetchInventory();
  }, [fetchInventory, token]);

  const zoneGroups = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const zoneName = it.zone || 'Unassigned';
      if (!map.has(zoneName)) map.set(zoneName, []);
      map.get(zoneName).push(it);
    });
    return Array.from(map.entries())
      .map(([name, list]) => {
        const totalStock = list.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
        const low = list.some((it) => Number(it.qty) < Number(it.min));
        const expiring = list.some((it) => {
          if (!it.expiry) return false;
          const diff = (new Date(it.expiry) - new Date()) / (1000 * 60 * 60 * 24);
          return diff <= 30;
        });
        return {
          name,
          items: list.sort((a, b) => a.name.localeCompare(b.name)),
          totalStock,
          low,
          expiring,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const zoneNames = useMemo(() => ['All Zones', ...zoneGroups.map((z) => z.name)], [zoneGroups]);

  useEffect(() => {
    if (!zoneNames.includes(activeZone)) {
      setActiveZone('All Zones');
    }
  }, [zoneNames, activeZone]);

  const visibleItems = useMemo(() => {
    const base = activeZone === 'All Zones' ? items : zoneGroups.find((z) => z.name === activeZone)?.items || [];
    if (!search.trim()) return base;
    const term = search.trim().toLowerCase();
    return base.filter((it) => it.name.toLowerCase().includes(term) || it.category.toLowerCase().includes(term));
  }, [items, zoneGroups, activeZone, search]);

  const stats = useMemo(() => {
    const totalUnits = items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
    const lowZones = zoneGroups.filter((z) => z.low).length;
    const expZones = zoneGroups.filter((z) => z.expiring).length;
    return {
      totalUnits,
      lowZones,
      expZones,
      zoneCount: zoneGroups.length,
    };
  }, [items, zoneGroups]);

  const statusMeta = (it) => {
    if (Number(it.qty) <= 0) return { label: 'EMPTY', cls: 'status-critical' };
    if (Number(it.qty) < Number(it.min)) return { label: 'LOW', cls: 'status-warning' };
    if (it.expiry) {
      const diff = (new Date(it.expiry) - new Date()) / (1000 * 60 * 60 * 24);
      if (diff <= 0) return { label: 'EXPIRED', cls: 'status-critical' };
      if (diff <= 30) return { label: 'EXPIRING', cls: 'status-expiring' };
    }
    return { label: 'ADEQUATE', cls: 'status-adequate' };
  };

  const handleExport = () => {
    if (!visibleItems.length) {
      alert('No items to export.');
      return;
    }
    const escape = (value) => {
      const str = String(value ?? '');
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const header = ['Item Name', 'Category', 'Quantity', 'Min Stock', 'Zone', 'Expiry'];
    const rowsCsv = visibleItems.map((it) => [
      it.name,
      it.category,
      it.qty,
      it.min,
      it.zone || 'Unassigned',
      it.expiry || 'N/A',
    ]);
    const csv = [header, ...rowsCsv].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-zones-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const openMove = (item) => {
    setMoveModal({ open: true, id: item.id, name: item.name, zone: item.zone || '', submitting: false });
  };

  const closeMove = () => setMoveModal((s) => ({ ...s, open: false }));

  const submitMove = async () => {
    if (!moveModal.zone?.trim()) {
      alert('Please choose a destination zone.');
      return;
    }
    setMoveModal((s) => ({ ...s, submitting: true }));
    try {
      const res = await fetch(`${API}/api/inventory/${moveModal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ zone: moveModal.zone }),
      });
      if (!res.ok) throw new Error('Failed to move item');
      await res.json();
      closeMove();
      fetchInventory();
    } catch (e) {
      alert(e.message || 'Failed to move item');
      setMoveModal((s) => ({ ...s, submitting: false }));
    }
  };

  const openEdit = (item) => {
    setEditModal({
      open: true,
      id: item.id,
      name: item.name,
      category: item.category,
      qty: String(item.qty ?? 0),
      min: String(item.min ?? 0),
      zone: item.zone || '',
      expiry: item.expiry || '',
      supplier: item.supplier || '',
      notes: item.notes || '',
      submitting: false,
    });
  };

  const closeEdit = () => setEditModal((s) => ({ ...s, open: false }));

  const saveEdit = async () => {
    if (!editModal.name.trim()) {
      alert('Name is required.');
      return;
    }
    setEditModal((s) => ({ ...s, submitting: true }));
    try {
      const body = {
        name: editModal.name,
        category: editModal.category,
        qty: Number(editModal.qty) || 0,
        min: Number(editModal.min) || 0,
        zone: editModal.zone || '',
        supplier: editModal.supplier || undefined,
        notes: editModal.notes || undefined,
        expiry: editModal.expiry ? new Date(editModal.expiry).toISOString() : null,
      };
      const res = await fetch(`${API}/api/inventory/${editModal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update item');
      await res.json();
      closeEdit();
      fetchInventory();
    } catch (e) {
      alert(e.message || 'Failed to update item');
      setEditModal((s) => ({ ...s, submitting: false }));
    }
  };

  const openCreate = () => {
    setCreateModal({
      open: true,
      name: '',
      category: 'Medication',
      qty: '0',
      min: '0',
      zone: activeZone === 'All Zones' ? '' : activeZone,
      expiry: '',
      supplier: '',
      notes: '',
      submitting: false,
    });
  };

  const closeCreate = () => setCreateModal((s) => ({ ...s, open: false }));

  const saveCreate = async () => {
    if (!createModal.name.trim()) {
      alert('Name is required.');
      return;
    }
    setCreateModal((s) => ({ ...s, submitting: true }));
    try {
      const body = {
        name: createModal.name,
        category: createModal.category,
        qty: Number(createModal.qty) || 0,
        min: Number(createModal.min) || 0,
        zone: createModal.zone || '',
        supplier: createModal.supplier || undefined,
        notes: createModal.notes || undefined,
        expiry: createModal.expiry ? new Date(createModal.expiry).toISOString() : undefined,
      };
      const res = await fetch(`${API}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create item');
      await res.json();
      closeCreate();
      fetchInventory();
    } catch (e) {
      alert(e.message || 'Failed to create item');
      setCreateModal((s) => ({ ...s, submitting: false }));
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      const res = await fetch(`${API}/api/inventory/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete item');
      fetchInventory();
    } catch (e) {
      alert(e.message || 'Failed to delete item');
    }
  };

  const markerPalette = [
    { top: '20%', left: '30%', background: '#e3f2fd', borderColor: '#3a86ff', icon: 'fas fa-hospital', color: '#3a86ff' },
    { top: '60%', left: '25%', background: '#fff5f5', borderColor: '#e63946', icon: 'fas fa-first-aid', color: '#e63946' },
    { top: '40%', left: '60%', background: '#e8f5e8', borderColor: '#2a9d8f', icon: 'fas fa-archive', color: '#2a9d8f' },
    { top: '70%', left: '65%', background: '#e3f2fd', borderColor: '#3a86ff', icon: 'fas fa-snowflake', color: '#3a86ff' },
    { top: '15%', left: '75%', background: '#fff4e5', borderColor: '#f4a261', icon: 'fas fa-briefcase-medical', color: '#f4a261' },
  ];

  const markerZones = useMemo(() => zoneGroups.slice(0, markerPalette.length), [zoneGroups]);

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-container">
        <InventorySidebar onLogout={() => {}} />

        <main className="main-content">
          <div className="header">
            <h2>Storage Zones Management</h2>
            <div className="user-info">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`}
                alt="User"
              />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {loading && <div className="info-banner">Loading storage zones…</div>}
          {!!error && <div className="error-banner">{error}</div>}

          <div className="ship-layout">
            <div className="section-header">
              <div className="section-title">Ship Storage Layout</div>
              <button className="btn btn-primary" onClick={openCreate}>
                <i className="fas fa-plus"/> Add Inventory Item
              </button>
            </div>
            <div className="deck-navigation">
              {zoneNames.map((name) => (
                <button
                  key={name}
                  className={`deck-btn ${activeZone === name ? 'active' : ''}`}
                  onClick={() => setActiveZone(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="ship-map">
              {markerZones.map((zone, idx) => {
                const palette = markerPalette[idx];
                return (
                  <div
                    key={zone.name}
                    className={`zone-marker ${activeZone === zone.name ? 'active' : ''}`}
                    style={{ top: palette.top, left: palette.left, background: palette.background, borderColor: palette.borderColor }}
                    onClick={() => setActiveZone(zone.name)}
                  >
                    <div className="zone-icon" style={{ color: palette.color }}><i className={palette.icon}/></div>
                    <div className="zone-name">{zone.name}</div>
                    <div className="zone-count">{zone.items.length} items</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="zone-stats">
            <div className="stat-card"><div className="stat-icon items"><i className="fas fa-boxes"/></div><div className="stat-value">{stats.totalUnits}</div><div className="stat-label">Total Units Onboard</div></div>
            <div className="stat-card"><div className="stat-icon low"><i className="fas fa-exclamation-triangle"/></div><div className="stat-value">{stats.lowZones}</div><div className="stat-label">Zones With Low Stock</div></div>
            <div className="stat-card"><div className="stat-icon expiring"><i className="fas fa-clock"/></div><div className="stat-value">{stats.expZones}</div><div className="stat-label">Zones With Expiring Items</div></div>
            <div className="stat-card"><div className="stat-icon categories"><i className="fas fa-tags"/></div><div className="stat-value">{stats.zoneCount}</div><div className="stat-label">Active Zones</div></div>
          </div>

          <div className="zone-details active">
            <div className="zone-header">
              <div className="zone-info">
                <div className="zone-title">{activeZone === 'All Zones' ? 'All Storage Zones' : activeZone}</div>
                <div className="zone-meta">
                  <div className="zone-meta-item"><i className="fas fa-cubes"/> <span>{visibleItems.length} items listed</span></div>
                  <div className="zone-meta-item"><i className="fas fa-layer-group"/> <span>{zoneNames.length - 1} total zones</span></div>
                </div>
                <div className="zone-status" style={{ color: 'var(--success)', fontWeight: 600 }}>
                  <i className="fas fa-check-circle"/> Synced with backend
                </div>
              </div>
              <div className="zone-actions">
                <button className="btn btn-success" onClick={openCreate}><i className="fas fa-plus"/> New Item</button>
                <button className="btn" onClick={handleExport}><i className="fas fa-download"/> Export</button>
                <button className="btn btn-primary" onClick={fetchInventory}><i className="fas fa-sync-alt"/> Refresh</button>
              </div>
            </div>

            <div className="zone-table-container">
              <div className="table-header">
                <div className="table-title">Inventory Items</div>
                <div className="table-actions">
                  <div className="search-box">
                    <i className="fas fa-search"/>
                    <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
              </div>
              <table className="zone-table">
                <thead><tr><th>Item Name</th><th>Category</th><th>Quantity</th><th>Min Stock</th><th>Expiry</th><th>Status</th><th>Zone</th><th>Actions</th></tr></thead>
                <tbody>
                  {visibleItems.map((it) => {
                    const status = statusMeta(it);
                    return (
                      <tr key={it.id}>
                        <td>{it.name}</td>
                        <td>{it.category}</td>
                        <td>{it.qty}</td>
                        <td>{it.min}</td>
                        <td>{it.expiry || '—'}</td>
                        <td><span className={`item-status ${status.cls}`}>{status.label}</span></td>
                        <td>{it.zone || 'Unassigned'}</td>
                        <td className="item-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => openEdit(it)}><i className="fas fa-edit"/> Edit</button>
                          <button className="btn btn-sm" onClick={() => openMove(it)}><i className="fas fa-exchange-alt"/> Move</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteItem(it)}><i className="fas fa-trash"/> Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                  {!visibleItems.length && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>No items for the current selection.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {moveModal.open && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header"><div className="modal-title">Move Inventory Item</div><button className="close-modal" onClick={closeMove}>&times;</button></div>
            <div className="modal-body">
              <div className="disposal-info">
                <div className="disposal-item"><span className="disposal-label">Item:</span> {moveModal.name}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Destination Zone</label>
                <select className="form-select" value={moveModal.zone} onChange={(e) => setMoveModal((s) => ({ ...s, zone: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {zoneNames.filter((z) => z !== 'All Zones').map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeMove}>Cancel</button>
              <button className="btn btn-primary" onClick={submitMove} disabled={moveModal.submitting}>{moveModal.submitting ? 'Moving…' : 'Move Item'}</button>
            </div>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header"><div className="modal-title">Edit Inventory Item</div><button className="close-modal" onClick={closeEdit}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Item Name</label><input type="text" className="form-control" value={editModal.name} onChange={(e) => setEditModal((s) => ({ ...s, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Category</label><input type="text" className="form-control" value={editModal.category} onChange={(e) => setEditModal((s) => ({ ...s, category: e.target.value }))} /></div>
              <div className="form-row" style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Quantity</label><input type="number" className="form-control" value={editModal.qty} onChange={(e) => setEditModal((s) => ({ ...s, qty: e.target.value }))} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Min Stock</label><input type="number" className="form-control" value={editModal.min} onChange={(e) => setEditModal((s) => ({ ...s, min: e.target.value }))} /></div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Zone</label><input type="text" className="form-control" value={editModal.zone} onChange={(e) => setEditModal((s) => ({ ...s, zone: e.target.value }))} placeholder="Unassigned" /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Expiry Date</label><input type="date" className="form-control" value={editModal.expiry} onChange={(e) => setEditModal((s) => ({ ...s, expiry: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Supplier</label><input type="text" className="form-control" value={editModal.supplier} onChange={(e) => setEditModal((s) => ({ ...s, supplier: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={3} value={editModal.notes} onChange={(e) => setEditModal((s) => ({ ...s, notes: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeEdit}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={editModal.submitting}>{editModal.submitting ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {createModal.open && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header"><div className="modal-title">Add Inventory Item</div><button className="close-modal" onClick={closeCreate}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Item Name</label><input type="text" className="form-control" value={createModal.name} onChange={(e) => setCreateModal((s) => ({ ...s, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Category</label><input type="text" className="form-control" value={createModal.category} onChange={(e) => setCreateModal((s) => ({ ...s, category: e.target.value }))} /></div>
              <div className="form-row" style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Quantity</label><input type="number" className="form-control" value={createModal.qty} onChange={(e) => setCreateModal((s) => ({ ...s, qty: e.target.value }))} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Min Stock</label><input type="number" className="form-control" value={createModal.min} onChange={(e) => setCreateModal((s) => ({ ...s, min: e.target.value }))} /></div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Zone</label><input type="text" className="form-control" value={createModal.zone} onChange={(e) => setCreateModal((s) => ({ ...s, zone: e.target.value }))} placeholder="Unassigned" /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Expiry Date</label><input type="date" className="form-control" value={createModal.expiry} onChange={(e) => setCreateModal((s) => ({ ...s, expiry: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Supplier</label><input type="text" className="form-control" value={createModal.supplier} onChange={(e) => setCreateModal((s) => ({ ...s, supplier: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" rows={3} value={createModal.notes} onChange={(e) => setCreateModal((s) => ({ ...s, notes: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeCreate}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCreate} disabled={createModal.submitting}>{createModal.submitting ? 'Creating…' : 'Create Item'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
