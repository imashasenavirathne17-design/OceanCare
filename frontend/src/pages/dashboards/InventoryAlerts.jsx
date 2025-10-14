import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import {
  listInventoryAlerts,
  acknowledgeInventoryAlert,
  resolveInventoryAlert,
  deleteInventoryAlert,
  createInventoryAlert,
  updateInventoryAlert
} from '../../lib/healthApi';
import InventorySidebar from './InventorySidebar';
import './inventoryDashboard.css';
import './healthOfficerDashboard.css';

const makeDefaultAlertForm = () => ({
  itemName: '',
  currentStock: '',
  minimumRequired: '',
  message: '',
  recipient: 'inventory-manager',
  methods: {
    system: true,
    email: false,
    sms: false,
  }
});

export default function InventoryAlerts() {
  const navigate = useNavigate();
  const user = getUser();

  const [sendAlertOpen, setSendAlertOpen] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState('');
  const [alertForm, setAlertForm] = useState(makeDefaultAlertForm());
  const [editingAlert, setEditingAlert] = useState(null);

  const onLogout = () => { clearSession(); navigate('/login'); };

  const openModal = () => {
    setAlertForm(makeDefaultAlertForm());
    setPriority('medium');
    setEditingAlert(null);
    setSendAlertOpen(true);
  };
  const closeModal = () => {
    setSendAlertOpen(false);
    setEditingAlert(null);
  };

  const selectPriority = (level) => setPriority(level);

  const openEditModal = (alert) => {
    if (!alert) return;
    setEditingAlert(alert);
    setPriority(alert.priority || 'medium');
    setAlertForm({
      itemName: alert.itemName || '',
      currentStock: alert.currentStock ?? '',
      minimumRequired: alert.minimumRequired ?? '',
      message: alert.message || '',
      recipient: alert.recipient || 'inventory-manager',
      methods: {
        system: Array.isArray(alert.deliveryMethods) ? alert.deliveryMethods.includes('system') : true,
        email: Array.isArray(alert.deliveryMethods) ? alert.deliveryMethods.includes('email') : false,
        sms: Array.isArray(alert.deliveryMethods) ? alert.deliveryMethods.includes('sms') : false,
      },
    });
    setSendAlertOpen(true);
  };

  const handleFormChange = (key, value) => {
    setAlertForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMethodToggle = (method) => {
    setAlertForm((prev) => ({
      ...prev,
      methods: {
        ...prev.methods,
        [method]: !prev.methods[method],
      },
    }));
  };

  const submitAlert = async (e) => {
    e.preventDefault();
    try {
      const actionType = editingAlert ? 'update' : 'create';
      setProcessing(actionType);
      const deliveryMethods = Object.entries(alertForm.methods)
        .filter(([, enabled]) => enabled)
        .map(([method]) => method);
      const payload = {
        itemName: alertForm.itemName,
        currentStock: alertForm.currentStock || undefined,
        minimumRequired: alertForm.minimumRequired || undefined,
        message: alertForm.message,
        recipient: alertForm.recipient,
        deliveryMethods,
        priority,
      };
      if (editingAlert?._id) {
        await updateInventoryAlert(editingAlert._id, payload);
      } else {
        await createInventoryAlert(payload);
      }
      setSendAlertOpen(false);
      setEditingAlert(null);
      await loadAlerts();
    } catch (err) {
      console.error('Failed to save inventory alert', err);
      setError('Failed to save inventory alert');
    } finally {
      setProcessing('');
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listInventoryAlerts({ limit: 50 });
      setAlerts(Array.isArray(data?.items) ? data.items : []);
      setSummary(data?.summary || null);
    } catch (err) {
      console.error('Failed to load inventory alerts', err);
      setError('Failed to load inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const formatPriorityLabel = (value) => {
    if (!value) return '—';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const priorityBadgeClass = (value) => {
    switch (value) {
      case 'high':
        return 'status-danger';
      case 'medium':
        return 'status-warning';
      case 'low':
        return 'status-active';
      default:
        return 'status-active';
    }
  };

  const statusBadgeClass = (value) => {
    switch (value) {
      case 'sent':
        return 'status-warning';
      case 'acknowledged':
        return 'status-warning';
      case 'resolved':
        return 'status-active';
      default:
        return 'status-active';
    }
  };

  const formatStatusLabel = (value) => {
    if (!value) return '—';
    return value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatRecipient = (value) => {
    if (!value) return 'Inventory Manager';
    const map = {
      'inventory-manager': 'Inventory Manager',
      both: 'Inventory Manager & Captain',
      all: 'All Department Heads',
    };
    const mapped = map[value];
    if (mapped) return mapped;
    return value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const isProcessing = (id, action) => processing === `${id}-${action}`;

  const runAction = async (id, action, fn) => {
    try {
      setProcessing(`${id}-${action}`);
      setError('');
      await fn(id);
      await loadAlerts();
    } catch (err) {
      console.error(`Failed to ${action} inventory alert`, err);
      setError(`Failed to ${action} inventory alert`);
    } finally {
      setProcessing('');
    }
  };

  const handleAcknowledge = (id) => runAction(id, 'acknowledge', acknowledgeInventoryAlert);
  const handleResolve = (id) => runAction(id, 'resolve', resolveInventoryAlert);
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory alert?')) return;
    await runAction(id, 'delete', deleteInventoryAlert);
  };

  const quickCardData = [
    {
      key: 'high',
      variant: 'critical',
      iconTone: 'danger',
      icon: 'fas fa-exclamation-triangle',
      title: 'High Priority Alerts',
      headline: summary?.priorityBreakdown?.high ?? 0,
      detail: `${summary?.highPriorityOpen ?? 0} open`,
    },
    {
      key: 'unresolved',
      variant: 'warning',
      iconTone: 'warning',
      icon: 'fas fa-bell',
      title: 'Unresolved Alerts',
      headline: summary?.unresolved ?? 0,
      detail: 'Awaiting acknowledgement',
    },
    {
      key: 'resolved',
      variant: '',
      iconTone: 'inventory',
      icon: 'fas fa-check-circle',
      title: 'Resolved Alerts',
      headline: summary?.resolved ?? 0,
      detail: `${summary?.total ?? 0} total alerts`,
    },
  ];

  const actionsDisabled = Boolean(processing);

  return (
    <div className="inventory-dashboard health-dashboard">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          <div className="header">
            <h2>Inventory Alert Center</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Department | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="page-content">
            <div className="page-header">
              <div className="page-title">Send Inventory Alert</div>
              <div className="page-actions">
                <button className="btn btn-outline"><i className="fas fa-history"></i> Alert History</button>
                <button className="btn btn-alert" onClick={openModal}><i className="fas fa-bell"></i> Send New Alert</button>
              </div>
            </div>

            {summary && (
              <div className="stats-container">
                {quickCardData.map((card) => (
                  <div className="stat-card" key={card.key}>
                    <div className={`stat-icon ${card.iconTone}`}>
                      <i className={card.icon}></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{card.headline}</div>
                      <div className="stat-label">{card.title}</div>
                      <div className="note">{card.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="alert-panel" style={{ background: '#fdecea', borderColor: '#f5c6cb', color: '#b71c1c' }}>
                {error}
              </div>
            )}

            <div className="history-container">
              <div className="history-title">Recent Alert History</div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Alert</th>
                      <th>Recipient</th>
                      <th>Priority</th>
                      <th>Sent At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={6}>Loading inventory alerts...</td>
                      </tr>
                    )}
                    {!loading && !alerts.length && (
                      <tr>
                        <td colSpan={6}>No inventory alerts found.</td>
                      </tr>
                    )}
                    {!loading && alerts.map((alert) => {
                      const canAck = alert.status === 'sent';
                      const canResolve = alert.status !== 'resolved';
                      return (
                        <tr key={alert._id}>
                          <td>
                            <div className="history-item-name">{alert.itemName || 'Inventory Alert'}</div>
                            <div className="history-item-details">{alert.message}</div>
                          </td>
                          <td>{formatRecipient(alert.recipient)}</td>
                          <td>
                            <span className={`status-badge ${priorityBadgeClass(alert.priority)}`}>
                              {formatPriorityLabel(alert.priority)}
                            </span>
                          </td>
                          <td>{formatDateTime(alert.sentAt || alert.createdAt)}</td>
                          <td>
                            <span className={`status-badge ${statusBadgeClass(alert.status)}`}>
                              {formatStatusLabel(alert.status)}
                            </span>
                          </td>
                          <td className="action-buttons">
                            <button
                              className="btn btn-action btn-sm"
                              onClick={() => openEditModal(alert)}
                            >
                              <i className="fas fa-pen"></i> Edit
                            </button>
                            <button
                              className="btn btn-action btn-sm"
                              disabled={actionsDisabled || !canAck || isProcessing(alert._id, 'acknowledge')}
                              onClick={() => handleAcknowledge(alert._id)}
                            >
                              {isProcessing(alert._id, 'acknowledge') ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> Saving...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-check"></i> Acknowledge
                                </>
                              )}
                            </button>
                            <button
                              className="btn btn-action btn-sm"
                              disabled={actionsDisabled || !canResolve || isProcessing(alert._id, 'resolve')}
                              onClick={() => handleResolve(alert._id)}
                            >
                              {isProcessing(alert._id, 'resolve') ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> Resolving...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-check-double"></i> Resolve
                                </>
                              )}
                            </button>
                            <button
                              className="btn btn-action btn-sm delete"
                              disabled={actionsDisabled || isProcessing(alert._id, 'delete')}
                              onClick={() => handleDelete(alert._id)}
                            >
                              {isProcessing(alert._id, 'delete') ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> Deleting...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-trash"></i> Delete
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {sendAlertOpen && (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target.classList.contains('modal') && closeModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingAlert ? 'Update Inventory Alert' : 'Send Inventory Alert'}</h3>
              <button className="close-modal" onClick={closeModal}>&times;</button>
            </div>
            <form id="alertForm" onSubmit={submitAlert}>
              <div className="form-group">
                <label htmlFor="alertItem">Item Name *</label>
                <input
                  type="text"
                  id="alertItem"
                  className="form-control"
                  placeholder="Enter item name"
                  value={alertForm.itemName}
                  onChange={(e) => handleFormChange('itemName', e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="currentStock">Current Stock *</label>
                  <input
                    type="number"
                    id="currentStock"
                    className="form-control"
                    min={0}
                    value={alertForm.currentStock}
                    onChange={(e) => handleFormChange('currentStock', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="minRequired">Minimum Required *</label>
                  <input
                    type="number"
                    id="minRequired"
                    className="form-control"
                    min={1}
                    value={alertForm.minimumRequired}
                    onChange={(e) => handleFormChange('minimumRequired', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Priority Level *</label>
                <div className="priority-indicator">
                  <div className={`priority-option priority-high ${priority === 'high' ? 'selected' : ''}`} onClick={() => selectPriority('high')}>
                    <div>High</div>
                    <small>Critical Need</small>
                  </div>
                  <div className={`priority-option priority-medium ${priority === 'medium' ? 'selected' : ''}`} onClick={() => selectPriority('medium')}>
                    <div>Medium</div>
                    <small>Restock Soon</small>
                  </div>
                  <div className={`priority-option ${priority === 'low' ? 'selected' : ''}`} onClick={() => selectPriority('low')}>
                    <div>Low</div>
                    <small>Monitor</small>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="alertMessage">Alert Message *</label>
                <textarea
                  id="alertMessage"
                  className="form-control"
                  rows={4}
                  placeholder="Describe the inventory issue and any urgent needs..."
                  value={alertForm.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="alertRecipient">Recipient</label>
                <select
                  id="alertRecipient"
                  className="form-control"
                  value={alertForm.recipient}
                  onChange={(e) => handleFormChange('recipient', e.target.value)}
                >
                  <option value="inventory-manager">Inventory Manager (Default)</option>
                  <option value="both">Inventory Manager & Captain</option>
                  <option value="all">All Department Heads</option>
                </select>
              </div>

              <div className="form-group">
                <label>Delivery Method</label>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={alertForm.methods.system}
                      onChange={() => handleMethodToggle('system')}
                    />
                    {' '}System Notification
                  </label>{' '}
                  <label>
                    <input
                      type="checkbox"
                      checked={alertForm.methods.email}
                      onChange={() => handleMethodToggle('email')}
                    />
                    {' '}Email
                  </label>{' '}
                  <label>
                    <input
                      type="checkbox"
                      checked={alertForm.methods.sms}
                      onChange={() => handleMethodToggle('sms')}
                    />
                    {' '}SMS
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }} disabled={Boolean(processing)}>Cancel</button>
                <button type="submit" className="btn btn-alert" style={{ flex: 1 }} disabled={Boolean(processing)}>
                  {processing === 'create' ? 'Sending...' : processing === 'update' ? 'Saving...' : editingAlert ? 'Save Changes' : 'Send Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
