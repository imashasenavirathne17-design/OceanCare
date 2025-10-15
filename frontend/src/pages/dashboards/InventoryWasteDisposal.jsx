import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getToken, getUser } from '../../lib/token';
import InventorySidebar from './InventorySidebar';
import './inventoryWaste.css';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'expired', label: 'Expired Items' },
  { value: 'damaged', label: 'Damaged Items' },
  { value: 'recalled', label: 'Recalled Items' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'medical-waste', label: 'Medical Waste' },
  { value: 'hazardous-waste', label: 'Hazardous Waste' },
  { value: 'general-waste', label: 'General Waste' },
  { value: 'recycling', label: 'Recycling' },
  { value: 'incineration', label: 'Incineration' },
  { value: 'other', label: 'Other' },
];

const TYPE_LABELS = {
  expired: 'Expired',
  damaged: 'Damaged',
  recalled: 'Recalled',
  other: 'Other',
};

const STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const METHOD_LABELS = {
  'medical-waste': 'Medical Waste',
  'hazardous-waste': 'Hazardous Waste',
  'general-waste': 'General Waste',
  recycling: 'Recycling',
  incineration: 'Incineration',
  other: 'Other',
};

const INITIAL_FILTERS = {
  type: 'all',
  status: 'all',
  method: 'all',
  term: '',
  from: '',
  to: '',
};

const INITIAL_FORM = {
  itemName: '',
  disposalType: 'expired',
  quantity: 1,
  unit: 'units',
  method: 'medical-waste',
  status: 'pending',
  reason: '',
  notes: '',
  location: '',
  scheduledDate: '',
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch (err) {
    return '—';
  }
};

export default function InventoryWasteDisposal() {
  const user = getUser();
  const token = getToken();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const onLogout = () => { clearSession(); navigate('/login'); };

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [records, setRecords] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [processingIds, setProcessingIds] = useState({});

  const fetchRecords = useCallback(async (targetPage = 1) => {
    if (!token) {
      console.error('❌ No authentication token found');
      setError('Missing authentication token. Please log in again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Fetching waste disposal records from:', `${API}/api/inventory/waste`);
      console.log('🔑 Using token:', token.substring(0, 20) + '...');

      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(limit),
        sort: '-createdAt',
      });

      if (appliedFilters.type !== 'all') params.set('type', appliedFilters.type);
      if (appliedFilters.status !== 'all') params.set('status', appliedFilters.status);
      if (appliedFilters.method !== 'all') params.set('method', appliedFilters.method);
      if (appliedFilters.term.trim()) params.set('term', appliedFilters.term.trim());
      if (appliedFilters.from) params.set('from', appliedFilters.from);
      if (appliedFilters.to) params.set('to', appliedFilters.to);

      console.log('📋 Request params:', Object.fromEntries(params));

      const res = await fetch(`${API}/api/inventory/waste?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('📊 API Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`Failed to load waste disposal records: ${res.status}`);
      }

      const data = await res.json();
      console.log('✅ API Response data:', data);
      console.log('📋 Records count:', Array.isArray(data.records) ? data.records.length : 0);

      if (data.records && Array.isArray(data.records)) {
        console.log('📋 First few records:', data.records.slice(0, 3));
        console.log('📋 All record statuses:', data.records.map(r => ({ id: r._id, status: r.status, itemName: r.itemName })));
        setRecords(data.records);
        if (data.pagination) {
          setPagination({
            page: data.pagination.page,
            pages: data.pagination.pages,
            total: data.pagination.total,
            limit: data.pagination.limit,
          });
          setPage(data.pagination.page);
        }
      } else {
        console.warn('⚠️ No records array in response');
        console.log('📋 Response structure:', Object.keys(data));
        setRecords([]);
      }

    } catch (err) {
      console.error('💥 Fetch error:', err);
      setError(err.message || 'Unable to fetch waste disposal data');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [API, token, limit, appliedFilters]);

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  // Listen for disposal creation events from other pages
  useEffect(() => {
    const handleWasteDisposalRefresh = () => {
      console.log('🔄 Received waste disposal refresh event, fetching latest data...');
      fetchRecords(1);
    };

    window.addEventListener('wasteDisposalRefresh', handleWasteDisposalRefresh);
    return () => window.removeEventListener('wasteDisposalRefresh', handleWasteDisposalRefresh);
  }, [fetchRecords]);

  const fetchInventoryItems = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      const res = await fetch(`${API}/api/inventory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load inventory items');
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setInventoryItems(items.map((item) => ({
        id: item._id,
        name: item.name,
        qty: item.qty,
        min: item.min,
        unit: item.unit || 'units',
        expiry: item.expiry,
        zone: item.zone,
      })));
    } catch (err) {
      console.error(err);
    }
  }, [API, token]);

  useEffect(() => {
    fetchInventoryItems();
  }, [fetchInventoryItems]);

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.pages || nextPage === page) return;
    fetchRecords(nextPage);
  };

  const stats = useMemo(() => {
    const typeCounts = { expired: 0, damaged: 0, recalled: 0, other: 0 };
    const statusCounts = { pending: 0, completed: 0, cancelled: 0 };
    records.forEach((record) => {
      typeCounts[record.disposalType] = (typeCounts[record.disposalType] || 0) + 1;
      statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
    });
    return {
      expired: typeCounts.expired,
      damaged: typeCounts.damaged,
      recalled: typeCounts.recalled,
      completed: statusCounts.completed,
      pending: statusCounts.pending,
    };
  }, [records]);

  const pendingRecords = useMemo(
    () => records.filter((record) => record.status === 'pending').sort((a, b) => {
      const dateA = new Date(a.scheduledDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.scheduledDate || b.createdAt || 0).getTime();
      return dateA - dateB;
    }),
    [records],
  );

  const historyRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [records],
  );

  // Debug logging for records
  useEffect(() => {
    console.log('🔍 Records state updated:', {
      totalRecords: records.length,
      pendingRecords: pendingRecords.length,
      historyRecords: historyRecords.length,
      appliedFilters,
      sampleRecord: records[0] ? {
        id: records[0]._id,
        itemName: records[0].itemName,
        status: records[0].status,
        disposalType: records[0].disposalType,
      } : null
    });
  }, [records, pendingRecords.length, historyRecords.length, appliedFilters]);

  // Debug: Check if filters are hiding records
  useEffect(() => {
    if (records.length === 0 && !loading) {
      console.log('⚠️ No records displayed. Checking if filters are too restrictive...');
      console.log('📋 Current appliedFilters:', appliedFilters);

      // Try fetching without filters to see if records exist
      if (appliedFilters.type !== 'all' || appliedFilters.status !== 'all' || appliedFilters.method !== 'all') {
        console.log('🔍 Trying to fetch all records without filters...');
        fetch(`${API}/api/inventory/waste?page=1&limit=50&sort=-createdAt`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => res.json())
        .then(data => {
          console.log('📋 Records without filters:', data.records?.length || 0);
          if (data.records && data.records.length > 0) {
            console.log('⚠️ Records exist but are being filtered out!');
            console.log('💡 Try clicking "Clear Filters & Refresh" button');
          }
        })
        .catch(err => console.error('Error fetching without filters:', err));
      }
    }
  }, [records.length, loading, appliedFilters, API, token]);

  const pageNumbers = useMemo(() => {
    const totalPages = Math.max(1, pagination.pages || 1);
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }, [pagination.pages]);

  const startEntry = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endEntry = pagination.total ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  const openNewDisposal = () => {
    console.log('Opening new disposal modal');
    setForm(INITIAL_FORM);
    setSubmitting(false);
    setModalOpen(true);
    console.log('Modal state set to:', true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
    setForm(INITIAL_FORM);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const autoFillFromInventory = (itemId) => {
    const selected = inventoryItems.find((item) => item.id === itemId);
    if (!selected) return;
    handleFormChange('itemName', selected.name || '');
    if (selected.unit) handleFormChange('unit', selected.unit);
    if (selected.zone) handleFormChange('location', selected.zone);
    if (selected.expiry) {
      const iso = new Date(selected.expiry).toISOString().slice(0, 10);
      handleFormChange('scheduledDate', iso);
    }
  };

  const filteredItemOptions = useMemo(() => (
    inventoryItems
      .filter((item) => (
        !form.itemName.trim()
          || item.name.toLowerCase().includes(form.itemName.trim().toLowerCase())
      ))
      .slice(0, 20)
  ), [inventoryItems, form.itemName]);

  const onConfirmDisposal = async () => {
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }
    if (!form.itemName.trim()) {
      alert('Please provide an item name for the disposal record.');
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    const payload = {
      itemName: form.itemName.trim(),
      disposalType: form.disposalType,
      status: form.status,
      quantity: Number(form.quantity),
      unit: form.unit,
      method: form.method,
      reason: form.reason,
      notes: form.notes,
      location: form.location,
      scheduledDate: form.scheduledDate || undefined,
    };

    console.log('Creating waste disposal record with payload:', payload);

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/inventory/waste`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Create API Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Create API Error response:', errorText);
        throw new Error('Failed to create waste disposal record');
      }

      const responseData = await res.json();
      console.log('Create API Response data:', responseData);

      closeModal();
      // Reset filters to show all records including the newly created one
      setAppliedFilters(INITIAL_FILTERS);
      await fetchRecords(1);
      alert('Waste disposal record created successfully.');
    } catch (err) {
      console.error('Create disposal error:', err);
      alert(err.message || 'Unable to create disposal record.');
      setSubmitting(false);
    }
  };

  const onProcessDisposal = async (record) => {
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }
    if (!window.confirm(`Process disposal for ${record.itemName}?`)) return;

    setProcessingIds((prev) => ({ ...prev, [record._id]: true }));
    try {
      const res = await fetch(`${API}/api/inventory/waste/${record._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!res.ok) throw new Error('Failed to update disposal record');
      await fetchRecords(page);
      alert(`${record.itemName} has been marked as completed.`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to process disposal.');
    } finally {
      setProcessingIds((prev) => ({ ...prev, [record._id]: false }));
    }
  };

  const handleExport = () => {
    if (!records.length) {
      alert('No records available to export.');
      return;
    }
    const header = ['Item Name', 'Type', 'Quantity', 'Method', 'Status', 'Scheduled Date', 'Disposal Date'];
    const rows = records.map((record) => [
      record.itemName,
      TYPE_LABELS[record.disposalType] || record.disposalType,
      `${record.quantity || 0} ${record.unit || ''}`.trim(),
      METHOD_LABELS[record.method] || record.method,
      STATUS_LABELS[record.status] || record.status,
      formatDate(record.scheduledDate || record.createdAt),
      formatDate(record.disposalDate),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((val) => {
        const str = String(val ?? '');
        return /[",\n,]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `waste-disposal-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="inventory-dashboard inventory-waste">
      <div className="dashboard-container">
        <InventorySidebar onLogout={onLogout} />

        <main className="main-content">
          {loading && <div className="info-banner">Loading waste disposal records…</div>}
          {!!error && <div className="error-banner">{error}</div>}

          <div className="header">
            <h2>Waste Disposal Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Inventory Manager')}&background=f4a261&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Inventory Manager'}</div>
                <small>Inventory Manager | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Online</div>
            </div>
          </div>

          <div className="disposal-stats">
            <div className="stat-card">
              <div className="stat-icon expired"><i className="fas fa-calendar-times"></i></div>
              <div className="stat-value">{stats.expired}</div>
              <div className="stat-label">Expired Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon damaged"><i className="fas fa-ban"></i></div>
              <div className="stat-value">{stats.damaged}</div>
              <div className="stat-label">Damaged Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon completed"><i className="fas fa-check-circle"></i></div>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed Disposals</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pending"><i className="fas fa-clock"></i></div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending Disposals</div>
            </div>
          </div>

          <div className="disposal-controls">
            <div className="filter-group">
              <label className="filter-label">Disposal Type</label>
              <select className="filter-select" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select className="filter-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Method</label>
              <select className="filter-select" value={filters.method} onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))}>
                {METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group search">
              <label className="filter-label">Search</label>
              <input type="text" className="filter-input" value={filters.term} onChange={(e) => setFilters((f) => ({ ...f, term: e.target.value }))} placeholder="Item, location, or reason" />
            </div>
            <div className="date-range">
              <div className="filter-group">
                <label className="filter-label">From Date</label>
                <input type="date" className="date-input" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="filter-group">
                <label className="filter-label">To Date</label>
                <input type="date" className="date-input" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={applyFilters}><i className="fas fa-filter"></i> Apply Filters</button>
            <button className="btn" onClick={resetFilters}><i className="fas fa-undo"></i> Reset</button>
            <button className="btn btn-danger" onClick={openNewDisposal}><i className="fas fa-plus"></i> New Disposal Record</button>
            <button className="btn btn-info" onClick={() => {
              console.log('🔄 Manual refresh triggered');
              fetchRecords(1);
            }}><i className="fas fa-refresh"></i> Refresh Data</button>
            <button className="btn btn-warning" onClick={() => {
              console.log('🔄 Clearing all filters and refreshing');
              setAppliedFilters(INITIAL_FILTERS);
              setTimeout(() => fetchRecords(1), 100);
            }}><i className="fas fa-broom"></i> Clear Filters & Refresh</button>
          </div>

          <div className="pending-disposals">
            <div className="section-header">
              <div className="section-title">Pending Disposals</div>
              <button className="btn btn-warning" onClick={() => setFilters((f) => ({ ...f, status: 'pending' }))}><i className="fas fa-exclamation-triangle"></i> Show Pending Only</button>
            </div>

            <div className="disposal-grid">
              {pendingRecords.length ? (
                pendingRecords.map((record) => (
                  <div key={record._id} className={`disposal-card ${record.disposalType}`}>
                    <div className="disposal-header">
                      <div className="disposal-title">{record.itemName}</div>
                      <div className={`disposal-badge badge-${record.disposalType}`}>{TYPE_LABELS[record.disposalType] || record.disposalType}</div>
                    </div>
                    <div className="disposal-details">
                      <div className="detail-item"><span className="detail-label">Quantity:</span><span className="detail-value">{record.quantity || 0} {record.unit || ''}</span></div>
                      <div className="detail-item"><span className="detail-label">Method:</span><span className="detail-value">{METHOD_LABELS[record.method] || record.method}</span></div>
                      {record.location && <div className="detail-item"><span className="detail-label">Location:</span><span className="detail-value">{record.location}</span></div>}
                      {record.reason && <div className="detail-item"><span className="detail-label">Reason:</span><span className="detail-value">{record.reason}</span></div>}
                      <div className="detail-item"><span className="detail-label">Scheduled:</span><span className="detail-value">{formatDate(record.scheduledDate || record.createdAt)}</span></div>
                    </div>
                    <div className="disposal-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => onProcessDisposal(record)}
                        disabled={processingIds[record._id]}
                      >
                        <i className="fas fa-check"></i> {processingIds[record._id] ? 'Processing…' : 'Mark Completed'}
                      </button>
                      <button className="btn btn-info btn-sm" onClick={() => alert(record.notes || 'No additional notes provided')}><i className="fas fa-info-circle"></i> Notes</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="disposal-empty">No pending disposals found.</div>
              )}
            </div>
          </div>

          <div className="disposal-history">
            <div className="section-header">
              <div className="section-title">Disposal History</div>
              <button className="btn btn-primary" onClick={handleExport}><i className="fas fa-file-export"></i> Export Records</button>
            </div>

            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Scheduled</th>
                    <th>Disposal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.length ? (
                    historyRecords.map((record) => (
                      <tr key={record._id}>
                        <td>{record.itemName}</td>
                        <td><span className={`disposal-type type-${record.disposalType}`}>{TYPE_LABELS[record.disposalType] || record.disposalType}</span></td>
                        <td>{record.quantity || 0} {record.unit || ''}</td>
                        <td><span className="disposal-method">{METHOD_LABELS[record.method] || record.method}</span></td>
                        <td><span className={`disposal-status status-${record.status}`}>{STATUS_LABELS[record.status] || record.status}</span></td>
                        <td>{formatDate(record.scheduledDate || record.createdAt)}</td>
                        <td>{formatDate(record.disposalDate)}</td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => alert(record.notes || 'No additional notes provided')}><i className="fas fa-eye"></i></button>
                          <button className="btn btn-info btn-sm" onClick={() => alert(`Reporter: ${record.reporter || 'Unknown'}\nReason: ${record.reason || '—'}`)}><i className="fas fa-print"></i></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="empty-row">No disposal history yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                {pagination.total ? `Showing ${startEntry}-${endEntry} of ${pagination.total} records` : 'No records to display'}
              </div>
              <div className="pagination-controls">
                <button className="page-btn" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>Prev</button>
                {pageNumbers.map((p) => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => handlePageChange(p)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => handlePageChange(page + 1)} disabled={page >= pagination.pages}>Next</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="modal inventory-waste-modal" onClick={(e) => { if (e.target.classList.contains('modal') || e.target.classList.contains('inventory-waste-modal')) closeModal(); }}>
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Create New Disposal Record</div>
              <button className="close-modal" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Existing Item</label>
                <select className="form-control" onChange={(e) => autoFillFromInventory(e.target.value)} defaultValue="">
                  <option value="">-- Select from inventory (optional) --</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.qty ?? 0} {item.unit || 'units'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input type="text" className="form-control" value={form.itemName} onChange={(e) => handleFormChange('itemName', e.target.value)} placeholder="Name of item to dispose" list="waste-item-suggestions" />
                {filteredItemOptions.length > 0 && (
                  <datalist id="waste-item-suggestions">
                    {filteredItemOptions.map((item) => (
                      <option key={item.id} value={item.name} />
                    ))}
                  </datalist>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Disposal Type</label>
                  <select className="form-control" value={form.disposalType} onChange={(e) => handleFormChange('disposalType', e.target.value)}>
                    {TYPE_OPTIONS.filter((opt) => opt.value !== 'all').map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={(e) => handleFormChange('status', e.target.value)}>
                    {STATUS_OPTIONS.filter((opt) => opt.value !== 'all').map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" className="form-control" min={1} value={form.quantity} onChange={(e) => handleFormChange('quantity', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input type="text" className="form-control" value={form.unit} onChange={(e) => handleFormChange('unit', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Disposal Method</label>
                <select className="form-control" value={form.method} onChange={(e) => handleFormChange('method', e.target.value)}>
                  {METHOD_OPTIONS.filter((opt) => opt.value !== 'all').map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-control" value={form.location} onChange={(e) => handleFormChange('location', e.target.value)} placeholder="Storage location" />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-control" rows={3} value={form.reason} onChange={(e) => handleFormChange('reason', e.target.value)} placeholder="Why is this item being disposed?" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => handleFormChange('notes', e.target.value)} placeholder="Additional details" />
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input type="date" className="form-control" value={form.scheduledDate} onChange={(e) => handleFormChange('scheduledDate', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeModal} disabled={submitting}>Cancel</button>
              <button className="btn btn-danger" onClick={onConfirmDisposal} disabled={submitting}>
                {submitting ? 'Saving…' : 'Confirm Disposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
