import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './inventoryDashboard.css';
import InventorySidebar from './InventorySidebar';

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  // Add item state
  const [item, setItem] = useState({ supplier: '', name: '', qty: '', exp: '', location: '', zone: 'medical-room' });
  const [items, setItems] = useState([
    { id: 'I-1001', name: 'Bandages', qty: 12, exp: '2026-01-10', location: 'Med Room Shelf A', zone: 'medical-room' },
    { id: 'I-1002', name: 'Insulin', qty: 4, exp: '2025-10-12', location: 'Fridge B', zone: 'medical-room' },
    { id: 'I-1003', name: 'Flu Vaccine', qty: 30, exp: '2026-05-01', location: 'Med Room Shelf C', zone: 'medical-room' },
  ]);
  const [history, setHistory] = useState([]);

  // Offline sync flag (demo)
  const [offline, setOffline] = useState(false);

  // Auto logout
  useEffect(() => {
    let timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { clearSession(); navigate('/login'); }, 30 * 60 * 1000); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(timer); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [navigate]);

  const onLogout = () => { clearSession(); navigate('/login'); };
  const scrollToId = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };

  // Derived
  const lowThresholds = useMemo(() => ({ Bandages: 20, Insulin: 10, 'Flu Vaccine': 15 }), []);
  const lowStock = items.filter(it => (lowThresholds[it.name] ?? 10) > it.qty);
  const nearExpiry = items.filter(it => {
    const diff = (new Date(it.exp) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  });

  const addHistory = (action, payload) => setHistory(h => [{ ts: new Date().toISOString(), user: user?.fullName || 'Inventory', action, payload }, ...h]);

  const onAddItem = (e) => {
    e.preventDefault();
    if (!item.name || !item.qty || !item.exp) return alert('Name, quantity and expiry are required');
    const newItem = { ...item, id: 'I-' + Math.floor(Math.random() * 90000 + 10000) };
    setItems((is) => [newItem, ...is]);
    addHistory('add', newItem);
    setItem({ supplier: '', name: '', qty: '', exp: '', location: '', zone: 'medical-room' });
  };

  const onUpdateQty = (id, delta) => {
    setItems((is) => is.map((it) => it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it));
    addHistory('update_qty', { id, delta });
  };

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          {/* Header */}
          <div className="dash-header">
            <h2>Inventory Manager Dashboard</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Role: Inventory</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* Quick actions */}
          <section className="quick-actions">
            <button className="btn btn-primary" onClick={() => scrollToId('add-item')}><i className="fas fa-plus-circle"></i> Add Item</button>
            <button className="btn btn-primary" onClick={() => scrollToId('alerts')}><i className="fas fa-bell"></i> View Alerts</button>
            <button className="btn btn-success" onClick={() => setOffline((o) => !o)}><i className="fas fa-sync"></i> {offline ? 'Go Online' : 'Go Offline'}</button>
          </section>

          {/* 1. Add New Inventory Item */}
          <section className="panel" id="add-item">
            <h3 className="form-title">Add New Inventory Item</h3>
            <form onSubmit={onAddItem}>
              <div className="form-grid">
                <div className="form-group"><label>Supplier</label><input className="form-control" value={item.supplier} onChange={(e) => setItem((s) => ({ ...s, supplier: e.target.value }))} placeholder="Supplier name" /></div>
                <div className="form-group"><label>Item Name</label><input className="form-control" value={item.name} onChange={(e) => setItem((s) => ({ ...s, name: e.target.value }))} placeholder="e.g., Insulin" required /></div>
                <div className="form-group"><label>Quantity</label><input type="number" min="0" className="form-control" value={item.qty} onChange={(e) => setItem((s) => ({ ...s, qty: e.target.valueAsNumber || 0 }))} required /></div>
                <div className="form-group"><label>Expiry</label><input type="date" className="form-control" value={item.exp} onChange={(e) => setItem((s) => ({ ...s, exp: e.target.value }))} required /></div>
                <div className="form-group"><label>Storage Location</label><input className="form-control" value={item.location} onChange={(e) => setItem((s) => ({ ...s, location: e.target.value }))} placeholder="e.g., Med Room Shelf A" /></div>
                <div className="form-group"><label>Zone</label>
                  <select className="form-control" value={item.zone} onChange={(e) => setItem((s) => ({ ...s, zone: e.target.value }))}>
                    <option value="medical-room">Main Medical Room</option>
                    <option value="life-raft">Life Raft Kits</option>
                    <option value="crew-locker">Crew Deck Lockers</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" type="submit">Add Item</button>
            </form>
          </section>

          {/* 2. Update Inventory Quantities */}
          <section className="panel" id="update-qty">
            <h3 className="form-title">Update Inventory Quantities</h3>
            <div className="table-responsive">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Qty</th><th>Expiry</th><th>Location</th><th>Zone</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.id}</td><td>{it.name}</td><td>{it.qty}</td><td>{it.exp}</td><td>{it.location}</td><td>{it.zone}</td>
                      <td>
                        <button className="btn btn-success" onClick={() => onUpdateQty(it.id, +1)}>+1</button>
                        <button className="btn btn-danger" onClick={() => onUpdateQty(it.id, -1)} style={{ marginLeft: 8 }}>-1</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Low Stock Alerts */}
          <section className="panel" id="alerts">
            <h3 className="form-title">Low Stock Alerts</h3>
            {lowStock.length === 0 ? <div>No low stock items.</div> : (
              <ul className="alert-list">
                {lowStock.map((it) => (
                  <li key={it.id}><span className="badge badge-warning">Low</span> {it.name}: {it.qty} (threshold {(lowThresholds[it.name] ?? 10)})</li>
                ))}
              </ul>
            )}
          </section>

          {/* 4. Expired / Near-Expiry */}
          <section className="panel" id="expiry">
            <h3 className="form-title">Expired and Near-Expiry Items</h3>
            <div className="table-responsive">
              <table>
                <thead><tr><th>Name</th><th>Expiry</th><th>Status</th></tr></thead>
                <tbody>
                  {items.map((it) => {
                    const d = new Date(it.exp);
                    const diff = (d - new Date()) / (1000 * 60 * 60 * 24);
                    let status = 'ok';
                    if (diff <= 0) status = 'expired'; else if (diff <= 30) status = 'near';
                    return (
                      <tr key={it.id} className={`row-${status}`}>
                        <td>{it.name}</td><td>{it.exp}</td>
                        <td>{status === 'ok' ? '-' : <span className={`badge ${status === 'expired' ? 'badge-danger' : 'badge-warning'}`}>{status}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Storage Zones */}
          <section className="panel" id="zones">
            <h3 className="form-title">Storage Zones</h3>
            <div className="zones-grid">
              {['medical-room', 'life-raft', 'crew-locker'].map((z) => (
                <div key={z} className="zone-card">
                  <div className="zone-title">{z.replace('-', ' ')}</div>
                  <div className="zone-list">
                    {items.filter(it => it.zone === z).map(it => <div key={it.id} className="zone-item">{it.name} <span className="qty">{it.qty}</span></div>)}
                    {items.filter(it => it.zone === z).length === 0 && <div className="muted">No items</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Usage monitor (linked to medical events) */}
          <section className="panel" id="usage">
            <h3 className="form-title">Usage Monitor</h3>
            <p>When medical treatments are logged, linked inventory will decrement automatically. (Integration placeholder)</p>
          </section>

          {/* 7. Reports */}
          <section className="panel" id="reports">
            <h3 className="form-title">Reports</h3>
            <div className="form-grid">
              <div className="form-group"><label>Type</label>
                <select className="form-control">
                  <option>Stock</option>
                  <option>Expiry</option>
                  <option>Usage</option>
                </select>
              </div>
              <div className="form-group"><label>From</label><input type="date" className="form-control" /></div>
              <div className="form-group"><label>To</label><input type="date" className="form-control" /></div>
            </div>
            <div>
              <button className="btn btn-success"><i className="fas fa-file-excel"></i> Export CSV</button>
              <button className="btn btn-primary" style={{ marginLeft: 10 }}><i className="fas fa-file-pdf"></i> Export PDF</button>
            </div>
          </section>

          {/* 8. History / Audit */}
          <section className="panel" id="history">
            <h3 className="form-title">History / Audit Trail</h3>
            <div className="table-responsive">
              <table>
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Payload</th></tr></thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}><td>{new Date(h.ts).toLocaleString()}</td><td>{h.user}</td><td>{h.action}</td><td><code>{JSON.stringify(h.payload)}</code></td></tr>
                  ))}
                  {history.length === 0 && <tr><td colSpan={4}>No history yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {/* 9. Offline Sync */}
          <section className="panel" id="sync">
            <h3 className="form-title">Offline Sync</h3>
            <p>{offline ? 'You are offline. Changes will be queued and synced when connection resumes.' : 'You are online. Changes sync in real-time.'}</p>
          </section>

          {/* 10-11. Predictive & Thresholds */}
          <section className="panel" id="predict">
            <h3 className="form-title">Predictive Restocking</h3>
            <p>Recommendations based on past voyages and disease trends (placeholder).</p>
          </section>
          <section className="panel" id="thresholds">
            <h3 className="form-title">Auto-reorder Threshold Adjustment</h3>
            <p>Automatically adjusts ordering levels using historical consumption and trip length (placeholder).</p>
          </section>

          {/* 12. Transfer Between Ships */}
          <section className="panel" id="transfer">
            <h3 className="form-title">Inventory Transfer</h3>
            <p>Share or transfer stock between ships if multiple vessels are connected (placeholder).</p>
          </section>

          {/* 13. Barcode / QR Scanning */}
          <section className="panel" id="scan">
            <h3 className="form-title">Barcode / QR Scanning</h3>
            <p>Quick check-in/out and expiry validation integration (placeholder).</p>
          </section>

          {/* 14. Waste & Disposal */}
          <section className="panel" id="waste">
            <h3 className="form-title">Waste & Disposal Logging</h3>
            <p>Log damaged/expired goods and disposal details for audits (placeholder).</p>
          </section>

        </main>
      </div>
    </div>
  );
}
