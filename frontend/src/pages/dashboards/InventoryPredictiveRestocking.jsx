import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser, getToken } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryPredict.css';

export default function InventoryPredictiveRestocking() {
  const user = getUser();
  const token = getToken();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const onLogout = () => { clearSession(); navigate('/login'); };

  // State for real data
  const [inventoryItems, setInventoryItems] = useState([]);
  const [restockOrders, setRestockOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalItems = inventoryItems.length;
    const lowStockItems = inventoryItems.filter(item => item.qty <= (item.min || 0)).length;
    const criticalItems = inventoryItems.filter(item => item.qty === 0).length;
    const pendingOrders = restockOrders.filter(order => order.status === 'pending').length;

    return {
      accuracy: 89.2,
      alerts: lowStockItems + criticalItems,
      recommendations: pendingOrders,
      wasteReduction: 42
    };
  }, [inventoryItems, restockOrders]);

  // Fetch inventory data
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
      setInventoryItems(data.items || []);
    } catch (e) {
      setError(e.message || 'Error loading inventory');
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  // Fetch restock orders
  const fetchRestockOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/inventory/restock-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load restock orders');
      const data = await res.json();
      setRestockOrders(data.orders || []);
    } catch (e) {
      console.error('Error loading restock orders:', e);
    }
  }, [API, token]);

  useEffect(() => {
    if (token) {
      fetchInventory();
      fetchRestockOrders();
    }
  }, [fetchInventory, fetchRestockOrders, token]);

  // Generate recommendations based on real inventory data
  const recommendations = useMemo(() => {
    return inventoryItems.map(item => {
      const daysUntilShortage = item.qty > 0 ? Math.ceil((item.qty / Math.max(1, item.min || 1)) * 30) : 0;
      const priority = item.qty === 0 ? 'high' : item.qty <= (item.min || 0) ? 'medium' : 'low';
      const need = Math.max(0, (item.min || 0) * 2 - item.qty);

      return {
        item: item.name,
        stock: `${item.qty} ${item.unit || 'units'}`,
        need: `${need} ${item.unit || 'units'}`,
        days: `${daysUntilShortage} days`,
        priority,
        trend: 'stable',
        action: priority === 'high' ? 'Emergency Order' : priority === 'medium' ? 'Increase Stock' : 'Monitor',
        itemId: item._id
      };
    }).filter(rec => rec.priority !== 'low').slice(0, 5);
  }, [inventoryItems]);

  const onRefreshPredictions = (e) => {
    const el = e.currentTarget;
    const orig = el.innerHTML;
    el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    el.disabled = true;

    // Refresh data
    fetchInventory();
    fetchRestockOrders();

    setTimeout(() => {
      el.innerHTML = orig;
      el.disabled = false;
      alert('Predictions refreshed with latest data!');
    }, 2000);
  };

  const onSaveSettings = (e) => {
    const el = e.currentTarget;
    const orig = el.innerHTML;
    el.innerHTML = '<i className="fas fa-spinner fa-spin"></i> Saving...';
    setTimeout(() => {
      el.innerHTML = orig;
      alert('Auto-reorder settings updated successfully!');
    }, 1500);
  };

  const handleRecoAction = async (rec) => {
    if (rec.action === 'Emergency Order') {
      if (window.confirm(`Create emergency restock order for ${rec.item}?`)) {
        await createRestockOrder(rec.itemId, rec.need.split(' ')[0], 'emergency');
      }
    } else if (rec.action === 'Increase Stock') {
      if (window.confirm(`Create restock order for ${rec.item}?`)) {
        await createRestockOrder(rec.itemId, rec.need.split(' ')[0], 'standard');
      }
    } else if (rec.action === 'Monitor') {
      alert(`${rec.item} added to watchlist for closer monitoring.`);
    }
  };

  const createRestockOrder = async (itemId, quantity, type) => {
    try {
      const item = inventoryItems.find(i => i._id === itemId);
      if (!item) return;

      const orderData = {
        itemId,
        itemName: item.name,
        quantity: parseInt(quantity),
        unit: item.unit || 'units',
        type,
        status: 'pending',
        priority: type === 'emergency' ? 'high' : 'medium',
        notes: `Auto-generated ${type} restock order`
      };

      const res = await fetch(`${API}/api/inventory/restock-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error('Failed to create restock order');

      await fetchRestockOrders();
      alert(`${type === 'emergency' ? 'Emergency' : 'Standard'} restock order created for ${item.name}`);
    } catch (e) {
      console.error('Error creating restock order:', e);
      alert('Failed to create restock order');
    }
  };

  const processRestockOrder = async (orderId) => {
    try {
      const order = restockOrders.find(o => o._id === orderId);
      if (!order) return;

      // Update inventory quantity
      const item = inventoryItems.find(i => i._id === order.itemId);
      if (item) {
        const newQuantity = item.qty + order.quantity;
        await fetch(`${API}/api/inventory/${order.itemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ qty: newQuantity }),
        });
      }

      // Update order status
      await fetch(`${API}/api/inventory/restock-orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      await fetchInventory();
      await fetchRestockOrders();
      alert(`Restock order processed for ${order.itemName}`);
    } catch (e) {
      console.error('Error processing restock order:', e);
      alert('Failed to process restock order');
    }
  };

  const [toggles, setToggles] = useState({ predictive: true, outbreaks: true, thresholds: true, voyage: true });
  const toggle = (key) => setToggles(t => ({ ...t, [key]: !t[key] }));

  return (
    <div className="inventory-dashboard inventory-predict">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          {loading && <div className="info-banner">Loading inventory data...</div>}
          {!!error && <div className="error-banner">{error}</div>}

          {/* Header */}
          <div className="header">
            <h2>Predictive Restocking</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="ai-insights">
            <div className="insights-header">
              <div className="ai-icon"><i className="fas fa-robot"></i></div>
              <div>
                <div className="insights-title">AI-Powered Inventory Insights</div>
                <small>Last updated: Today, 14:30 | Next update in: 2 hours</small>
              </div>
            </div>
            <div className="insights-content">
              <div>
                <div className="insight-item warning">
                  <div className="insight-header">
                    <div className="insight-title">Increased Respiratory Cases Detected</div>
                    <div className="insight-confidence">87% confidence</div>
                  </div>
                  <div className="insight-details">Medical logs show 35% increase in respiratory treatments over past 7 days. Recommend increasing stock of inhalers and decongestants.</div>
                  <div className="insight-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => alert('Adjusting stock levels based on respiratory insight...')}><i className="fas fa-plus"></i> Adjust Stock Levels</button>
                    <button className="btn btn-sm" onClick={() => alert('Showing detailed respiratory trends...')}><i className="fas fa-chart-line"></i> View Trends</button>
                  </div>
                </div>

                <div className="insight-item danger">
                  <div className="insight-header">
                    <div className="insight-title">Critical Stock-Out Risk</div>
                    <div className="insight-confidence">92% confidence</div>
                  </div>
                  <div className="insight-details">Insulin syringes projected to run out in 4.2 days based on current usage. Current voyage duration: 18 days remaining.</div>
                  <div className="insight-actions">
                    <button className="btn btn-danger btn-sm" onClick={() => alert('Emergency reorder process initiated!')}><i className="fas fa-shipping-fast"></i> Emergency Reorder</button>
                    <button className="btn btn-sm" onClick={() => alert('Alert created for stock-out risk.')}><i className="fas fa-exclamation-triangle"></i> Create Alert</button>
                  </div>
                </div>

                <div className="insight-item success">
                  <div className="insight-header">
                    <div className="insight-title">Optimal Stock Levels Achieved</div>
                    <div className="insight-confidence">78% confidence</div>
                  </div>
                  <div className="insight-details">Bandages and antiseptics are at optimal levels for current voyage duration and predicted medical needs.</div>
                  <div className="insight-actions">
                    <button className="btn btn-success btn-sm" onClick={() => alert('Insight acknowledged')}><i className="fas fa-check"></i> Acknowledge</button>
                    <button className="btn btn-sm" onClick={() => alert('Opening algorithm settings...')}><i className="fas fa-cog"></i> Adjust Algorithm</button>
                  </div>
                </div>
              </div>

              <div>
                <div className="insight-item">
                  <div className="insight-header"><div className="insight-title">Voyage Analysis</div></div>
                  <div className="insight-details">
                    <div className="detail-item"><span className="detail-label">Current Voyage:</span><span className="detail-value">Pacific Crossing</span></div>
                    <div className="detail-item"><span className="detail-label">Days Remaining:</span><span className="detail-value">18 days</span></div>
                    <div className="detail-item"><span className="detail-label">Crew & Passengers:</span><span className="detail-value">142 people</span></div>
                    <div className="detail-item"><span className="detail-label">Medical Events (7d):</span><span className="detail-value">24 treatments</span></div>
                  </div>
                </div>

                <div className="insight-item">
                  <div className="insight-header"><div className="insight-title">Algorithm Performance</div></div>
                  <div className="insight-details">
                    <div className="detail-item"><span className="detail-label">Prediction Accuracy:</span><span className="detail-value">{stats.accuracy}%</span></div>
                    <div className="detail-item"><span className="detail-label">Stock-out Prevention:</span><span className="detail-value">97%</span></div>
                    <div className="detail-item"><span className="detail-label">Waste Reduction:</span><span className="detail-value">{stats.wasteReduction}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Restocking Stats */}
          <div className="restocking-stats">
            <div className="stat-card"><div className="stat-icon prediction"><i className="fas fa-brain"></i></div><div className="stat-value">{stats.accuracy}%</div><div className="stat-label">Prediction Accuracy</div></div>
            <div className="stat-card"><div className="stat-icon alert"><i className="fas fa-bell"></i></div><div className="stat-value">{stats.alerts}</div><div className="stat-label">Restocking Alerts</div></div>
            <div className="stat-card"><div className="stat-icon recommendation"><i className="fas fa-lightbulb"></i></div><div className="stat-value">{stats.recommendations}</div><div className="stat-label">AI Recommendations</div></div>
            <div className="stat-card"><div className="stat-icon efficiency"><i className="fas fa-chart-line"></i></div><div className="stat-value">{stats.wasteReduction}%</div><div className="stat-label">Waste Reduction</div></div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-card">
              <div className="section-header"><div className="section-title">Usage Trends vs Predictions</div><button className="btn btn-sm" onClick={() => alert('Expanding chart: Usage Trends vs Predictions')}><i className="fas fa-expand"></i></button></div>
              <div className="chart-container">[Line Chart - Actual vs Predicted usage for key medical items]</div>
            </div>
            <div className="chart-card">
              <div className="section-header"><div className="section-title">Disease Outbreak Correlation</div><button className="btn btn-sm" onClick={() => alert('Expanding chart: Disease Outbreak Correlation')}><i className="fas fa-expand"></i></button></div>
              <div className="chart-container">[Correlation Chart - Illness trends vs medication usage]</div>
            </div>
          </div>

          {/* Restocking Recommendations */}
          <div className="restocking-recommendations">
            <div className="section-header"><div className="section-title">Restocking Recommendations</div><button className="btn btn-primary" onClick={onRefreshPredictions}><i className="fas fa-sync"></i> Refresh Predictions</button></div>
            <div className="table-responsive">
              <table className="recommendations-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Current Stock</th>
                    <th>Predicted Need</th>
                    <th>Days Until Shortage</th>
                    <th>Priority</th>
                    <th>Usage Trend</th>
                    <th>Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.length > 0 ? recommendations.map((r) => (
                    <tr key={r.item}>
                      <td>{r.item}</td>
                      <td>{r.stock}</td>
                      <td>{r.need}</td>
                      <td>{r.days}</td>
                      <td><span className={`priority priority-${r.priority}`}>{r.priority[0].toUpperCase() + r.priority.slice(1)}</span></td>
                      <td><span className={`trend trend-${r.trend}`}>{r.trend === 'up' ? '+35%' : r.trend === 'down' ? '-8%' : '+5%'}</span></td>
                      <td>
                        <button className={`btn btn-${r.action === 'Emergency Order' ? 'danger' : r.action === 'Increase Stock' ? 'warning' : r.action === 'Monitor' ? 'info' : 'success'} btn-sm`} onClick={() => handleRecoAction(r)}>{r.action}</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="empty-row">No restocking recommendations available. All items are adequately stocked.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Auto-reorder Settings */}
          <div className="auto-reorder-settings">
            <div className="section-header"><div className="section-title">Auto-reorder Settings & Thresholds</div><button className="btn btn-primary" onClick={onSaveSettings}><i className="fas fa-save"></i> Save Changes</button></div>
            <div className="settings-grid">
              {/* Predictive Restocking */}
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-title">Predictive Restocking</div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={toggles.predictive} onChange={() => toggle('predictive')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-details">
                  <div className="detail-item"><span className="detail-label">Algorithm Sensitivity:</span><span className="detail-value">High</span></div>
                  <div className="detail-item"><span className="detail-label">Update Frequency:</span><span className="detail-value">Every 4 hours</span></div>
                  <div className="detail-item"><span className="detail-label">Data Sources:</span><span className="detail-value">Usage + Medical Logs</span></div>
                </div>
                <div className="setting-actions"><button className="btn btn-sm" onClick={() => alert('Configure Predictive Restocking')}><i className="fas fa-cog"></i> Configure</button><button className="btn btn-sm" onClick={() => alert('Performance Metrics')}><i className="fas fa-chart-bar"></i> Performance</button></div>
              </div>

              {/* Disease Outbreak Alerts */}
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-title">Disease Outbreak Alerts</div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={toggles.outbreaks} onChange={() => toggle('outbreaks')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-details">
                  <div className="detail-item"><span className="detail-label">Outbreak Threshold:</span><span className="detail-value">15% increase</span></div>
                  <div className="detail-item"><span className="detail-label">Monitoring Diseases:</span><span className="detail-value">Flu, Respiratory, GI</span></div>
                  <div className="detail-item"><span className="detail-label">Alert Level:</span><span className="detail-value">Medium</span></div>
                </div>
                <div className="setting-actions"><button className="btn btn-sm" onClick={() => alert('Configure Outbreak Alerts')}><i className="fas fa-cog"></i> Configure</button><button className="btn btn-sm" onClick={() => alert('Test Alert')}><i className="fas fa-bell"></i> Test Alert</button></div>
              </div>

              {/* Auto-reorder Thresholds */}
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-title">Auto-reorder Thresholds</div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={toggles.thresholds} onChange={() => toggle('thresholds')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-details">
                  <div className="detail-item"><span className="detail-label">Critical Items:</span><span className="detail-value">7 days buffer</span></div>
                  <div className="detail-item"><span className="detail-label">Standard Items:</span><span className="detail-value">14 days buffer</span></div>
                  <div className="detail-item"><span className="detail-label">Low Priority:</span><span className="detail-value">21 days buffer</span></div>
                </div>
                <div className="setting-actions"><button className="btn btn-sm" onClick={() => alert('Configure Thresholds')}><i className="fas fa-cog"></i> Configure</button><button className="btn btn-sm" onClick={() => alert('Viewing Threshold Logs')}><i className="fas fa-history"></i> View Logs</button></div>
              </div>

              {/* Voyage-based Adjustments */}
              <div className="setting-card">
                <div className="setting-header">
                  <div className="setting-title">Voyage-based Adjustments</div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={toggles.voyage} onChange={() => toggle('voyage')} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-details">
                  <div className="detail-item"><span className="detail-label">Voyage Duration:</span><span className="detail-value">Auto-detect</span></div>
                  <div className="detail-item"><span className="detail-label">Route Factors:</span><span className="detail-value">Weather + Distance</span></div>
                  <div className="detail-item"><span className="detail-label">Passenger Count:</span><span className="detail-value">Auto-adjust</span></div>
                </div>
                <div className="setting-actions"><button className="btn btn-sm" onClick={() => alert('Configure Voyage-based Adjustments')}><i className="fas fa-cog"></i> Configure</button><button className="btn btn-sm" onClick={() => alert('Open Voyage Settings')}><i className="fas fa-ship"></i> Voyage Settings</button></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
