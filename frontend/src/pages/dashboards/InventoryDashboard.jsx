import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser, getToken } from '../../lib/token';
import './inventoryDashboard.css';
import InventorySidebar from './InventorySidebar';

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const token = getToken();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Hardcoded fallback data
  const [items, setItems] = useState([
    { id: 'I-1001', name: 'Bandages', qty: 12, exp: '2026-01-10', location: 'Med Room Shelf A', zone: 'medical-room' },
    { id: 'I-1002', name: 'Insulin', qty: 4, exp: '2025-10-12', location: 'Fridge B', zone: 'medical-room' },
    { id: 'I-1003', name: 'Flu Vaccine', qty: 30, exp: '2026-05-01', location: 'Med Room Shelf C', zone: 'medical-room' },
  ]);

  // Real inventory data state
  const [realItems, setRealItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [history, setHistory] = useState([]);

  // Offline sync flag (demo)
  const [offline, setOffline] = useState(false);

  // Fetch real inventory data from API
  const fetchInventory = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ limit: '200' });
      const res = await fetch(`${API}/api/inventory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load inventory: ${res.status}`);
      }

      const data = await res.json();
      const mappedItems = (data.items || []).map((item) => ({
        id: item._id || item.id,
        name: item.name,
        qty: item.qty || 0,
        min: item.min || 0,
        exp: item.expiry ? new Date(item.expiry).toISOString().slice(0, 10) : '',
        location: item.zone || 'General storage',
        zone: item.zone || 'general',
        category: item.category || 'General',
        supplier: item.supplier || '',
        barcode: item.barcode || '',
        notes: item.notes || '',
      }));

      setRealItems(mappedItems);
      // Optionally update the main items state with real data
      // setItems(mappedItems);
    } catch (err) {
      setError(err.message || 'Error loading inventory');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  // Initial data fetch
  useEffect(() => {
    if (token) {
      fetchInventory();
    }
  }, [fetchInventory, token]);

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

  // Derived calculations - use real data when available, fallback to hardcoded
  const currentItems = realItems.length > 0 ? realItems : items;

  const lowThresholds = useMemo(() => {
    if (realItems.length > 0) {
      // Create dynamic thresholds based on real item minimum stock levels
      const thresholds = {};
      realItems.forEach(item => {
        if (item.name && item.min > 0) {
          thresholds[item.name] = item.min;
        }
      });
      return thresholds;
    } else {
      // Fallback to hardcoded thresholds
      return { Bandages: 20, Insulin: 10, 'Flu Vaccine': 15 };
    }
  }, [realItems, items]);

  const lowStock = useMemo(() => {
    return currentItems.filter(item => {
      const threshold = lowThresholds[item.name] ?? 10;
      return item.qty <= (item.min || threshold);
    });
  }, [currentItems, lowThresholds]);

  const nearExpiry = useMemo(() => {
    return currentItems.filter(item => {
      if (!item.exp) return false;
      const diff = (new Date(item.exp) - new Date()) / (1000 * 60 * 60 * 24);
      return diff <= 30 && diff > 0;
    });
  }, [currentItems]);

  const expiredCount = useMemo(() => {
    return currentItems.filter(item => {
      if (!item.exp) return false;
      return (new Date(item.exp) - new Date()) <= 0;
    }).length;
  }, [currentItems]);

  const totalItems = useMemo(() => currentItems.length, [currentItems]);

  const totalQuantity = useMemo(() => {
    return currentItems.reduce((sum, item) => sum + (item.qty || 0), 0);
  }, [currentItems]);

  const categoriesCount = useMemo(() => {
    const categories = {};
    currentItems.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    return categories;
  }, [currentItems]);

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'Medical': 'stethoscope',
      'Medication': 'pills',
      'Equipment': 'tools',
      'Supplies': 'boxes',
      'Emergency': 'ambulance',
      'Surgical': 'syringe',
      'Diagnostic': 'microscope',
      'General': 'box',
      'Pharmaceutical': 'capsules',
      'Consumables': 'clipboard-list',
      'Instruments': 'wrench',
      'Linens': 'tshirt',
      'Cleaning': 'broom',
      'Office': 'file-alt',
      'IT': 'laptop',
      'Safety': 'shield-alt',
      'Food': 'utensils',
      'Beverages': 'coffee',
      'Chemicals': 'flask',
      'Electrical': 'bolt'
    };

    return categoryIcons[category] || 'box';
  };

  // Simulate real-time updates (demo) - can be enhanced to use WebSocket for live updates
  useEffect(() => {
    const t = setTimeout(() => {
      setHistory(h => [
        { ts: new Date().toISOString(), user: user?.fullName || 'Inventory', action: 'system_update', payload: { note: 'Dashboard refreshed with latest data' } },
        ...h,
      ]);
    }, 10000);
    return () => clearTimeout(t);
  }, [user]);

  const addHistory = (action, payload) => setHistory(h => [{ ts: new Date().toISOString(), user: user?.fullName || 'Inventory', action, payload }, ...h]);

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

          

          {/* Inventory Summary */}
          <div style={{ marginBottom: 30 }}>
            <div className="expiring-container">
              <div className="section-header">
                <div className="section-title">Inventory Summary</div>
                <div style={{ color: 'var(--primary)', fontSize: 14 }}>
                  {Object.keys(categoriesCount).length} Categories • {totalItems} Total Items
                </div>
              </div>
              <div className="category-summary">
                {Object.keys(categoriesCount).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15 }}>
                    {Object.entries(categoriesCount).map(([category, count]) => (
                      <div key={category} className="category-card">
                        <div className="category-icon">
                          <i className={`fas fa-${getCategoryIcon(category)}`}></i>
                        </div>
                        <div className="category-content">
                          <div className="category-name">{category}</div>
                          <div className="category-count">{count} items</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-categories">
                    <div className="empty-icon">
                      <i className="fas fa-box-open"></i>
                    </div>
                    <div className="empty-content">
                      <div className="empty-title">No Categories Found</div>
                      <div className="empty-desc">Categories will appear as items are added to inventory</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Low Stock Alerts */}
          <section className="panel" id="alerts">
            <h3 className="form-title">Low Stock Alerts</h3>
            {loading && <div className="info-banner">Loading inventory data...</div>}
            {error && <div className="error-banner">{error}</div>}
            {lowStock.length === 0 ? (
              <div>No low stock items.</div>
            ) : (
              <ul className="alert-list">
                {lowStock.map((it) => {
                  const threshold = lowThresholds[it.name] ?? it.min ?? 10;
                  return (
                    <li key={it.id}>
                      <span className="badge badge-warning">Low</span>
                      {it.name}: {it.qty} units (threshold: {threshold})
                      {realItems.length > 0 && <small style={{ marginLeft: 10, color: '#666' }}>Real-time data</small>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* 4. Expired / Near-Expiry */}
          <section className="panel" id="expiry">
            <h3 className="form-title">Expired and Nearly Expired Items</h3>
            <div className="table-responsive">
              <table>
                <thead><tr><th>Name</th><th>Expiry</th><th>Status</th></tr></thead>
                <tbody>
                  {currentItems
                    .filter(it => it.exp)
                    .map(it => ({
                      ...it,
                      days: Math.ceil((new Date(it.exp) - new Date()) / (1000 * 60 * 60 * 24)),
                    }))
                    .filter(it => it.days <= 30) // Only show items expiring within 30 days or already expired
                    .map((it) => {
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
                  {currentItems.filter(it => it.exp && Math.ceil((new Date(it.exp) - new Date()) / (1000 * 60 * 60 * 24)) <= 30).length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: 20, color: '#777' }}>
                        No items expiring within 30 days.
                        {realItems.length > 0 && <small style={{ display: 'block', marginTop: 5 }}>Using real-time data</small>}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          

          

          

          

          

        </main>
      </div>
    </div>
  );
}
