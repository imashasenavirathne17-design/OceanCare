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

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to load inventory';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If we can't parse error as JSON, use status text
          errorMessage = `${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setInventoryItems(data.items || []);
    } catch (e) {
      setError(e.message || 'Error loading inventory');
      console.error('Error loading inventory:', e);
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

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to load restock orders';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If we can't parse error as JSON, use status text
          errorMessage = `${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setRestockOrders(data.orders || []);
    } catch (e) {
      console.error('Error loading restock orders:', e);
      setError(e.message || 'Error loading restock orders');
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
      if (window.confirm(`Create emergency restock order for ${rec.item} and add ${rec.need.split(' ')[0]} ${rec.need.split(' ')[1]} to inventory?`)) {
        await createRestockOrderAndUpdateInventory(rec.itemId, rec.need.split(' ')[0], 'emergency');
      }
    } else if (rec.action === 'Increase Stock') {
      if (window.confirm(`Create restock order for ${rec.item} and add ${rec.need.split(' ')[0]} ${rec.need.split(' ')[1]} to inventory?`)) {
        await createRestockOrderAndUpdateInventory(rec.itemId, rec.need.split(' ')[0], 'standard');
      }
    } else if (rec.action === 'Monitor') {
      alert(`${rec.item} added to watchlist for closer monitoring.`);
    }
  };

  const createRestockOrderAndUpdateInventory = async (itemId, quantity, type) => {
    try {
      const item = inventoryItems.find(i => i._id === itemId);
      if (!item) return;

      // Ask user for expiry date
      const expiryDate = prompt('Enter expiry date for this restock (YYYY-MM-DD):', '');
      if (!expiryDate) {
        alert('Expiry date is required for restocking.');
        return;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expiryDate)) {
        alert('Please enter expiry date in YYYY-MM-DD format.');
        return;
      }

      // Create the restock order record - backend will handle inventory update
      const orderData = {
        itemId,
        itemName: item.name,
        quantity: parseInt(quantity),
        unit: item.unit || 'units',
        type,
        status: 'completed', // Mark as completed since inventory is updated immediately
        priority: type === 'emergency' ? 'high' : 'medium',
        expiry: new Date(expiryDate).toISOString(),
        notes: `Auto-generated ${type} restock order - Inventory updated immediately. Expiry: ${expiryDate}`
      };

      const orderRes = await fetch(`${API}/api/inventory/restock-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      // Check if response is JSON
      const orderContentType = orderRes.headers.get('content-type');
      if (!orderContentType || !orderContentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${orderRes.status} ${orderRes.statusText}`);
      }

      if (!orderRes.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to create restock order';
        try {
          const errorData = await orderRes.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If we can't parse error as JSON, use status text
          errorMessage = `${orderRes.status}: ${orderRes.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Refresh data to show updated quantities
      await fetchInventory();
      await fetchRestockOrders();

      alert(`${type === 'emergency' ? 'Emergency' : 'Standard'} restock completed! Added ${quantity} ${item.unit || 'units'} to ${item.name} inventory with expiry date ${expiryDate}.`);
    } catch (e) {
      console.error('Error in restock operation:', e);
      alert(`Failed to complete restock operation: ${e.message}`);
    }
  };

  const processRestockOrder = async (orderId) => {
    try {
      const order = restockOrders.find(o => o._id === orderId);
      if (!order) return;

      // For existing pending orders, mark them as completed
      // The backend will handle any necessary inventory updates
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

        </main>
      </div>
    </div>
  );
}
