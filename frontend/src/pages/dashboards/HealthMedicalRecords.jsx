import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './healthOfficerDashboard.css';
import HealthSidebar from './HealthSidebar';
import { saveMedicalRecord } from '../../lib/healthApi';

export default function HealthMedicalRecords() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };

  // Search/filter state
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All Record Types');
  const [status, setStatus] = useState('All Status');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  // Controlled form state for modal
  const [form, setForm] = useState({ crewId: '', recordType: '', notes: '' });
  const [uploadFiles, setUploadFiles] = useState([]);

  const rows = useMemo(() => ([
    { id: 1, name: 'John Doe', crewId: 'CD12345', rtype: 'Medical History', updated: 'Oct 22, 2025', status: 'Complete' },
    { id: 2, name: 'Maria Rodriguez', crewId: 'CD12346', rtype: 'Examination', updated: 'Oct 20, 2025', status: 'Complete' },
    { id: 3, name: 'James Wilson', crewId: 'CD12347', rtype: 'Chronic Condition', updated: 'Oct 18, 2025', status: 'Ongoing' },
    { id: 4, name: 'Lisa Chen', crewId: 'CD12348', rtype: 'Vaccination', updated: 'Oct 15, 2025', status: 'Complete' },
  ]), []);

  const filtered = rows.filter(r => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.crewId.toLowerCase().includes(q) || r.rtype.toLowerCase().includes(q);
    const matchesType = type === 'All Record Types' || r.rtype === type;
    const matchesStatus = status === 'All Status' || (status === 'Active' && r.status !== 'Archived') || (status === 'Archived' && r.status === 'Archived');
    return matchesQuery && matchesType && matchesStatus;
  });

  const details = (id) => (
    <div>
      <h3>Medical Record #{id}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 15 }}>
        <div>
          <h4>Personal Information</h4>
          <p><strong>Name:</strong> John Doe</p>
          <p><strong>Crew ID:</strong> CD12345</p>
          <p><strong>Position:</strong> Deck Officer</p>
          <p><strong>Date of Birth:</strong> 15/03/1985</p>
        </div>
        <div>
          <h4>Medical Information</h4>
          <p><strong>Blood Type:</strong> O+</p>
          <p><strong>Allergies:</strong> Penicillin</p>
          <p><strong>Chronic Conditions:</strong> None</p>
          <p><strong>Last Examination:</strong> 22/10/2025</p>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <h4>Medical History</h4>
        <p>Patient has a history of seasonal allergies. No major surgeries. Family history of hypertension.</p>
      </div>
      <div style={{ marginTop: 20 }}>
        <h4>Attached Documents</h4>
        <ul>
          <li><a href="#">Physical Exam Report (22/10/2025)</a></li>
          <li><a href="#">Blood Test Results (15/09/2025)</a></li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="health-dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <HealthSidebar onLogout={onLogout} />

        {/* Main Content */}
        <main className="main-content">
          {/* Header */}
          <div className="dash-header">
            <h2>Medical Records Management</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Health Officer')}&background=2a9d8f&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Dr. Sarah Johnson'}</div>
                <small>Health Officer | MV Ocean Explorer</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="dashboard-section">
            <div className="section-header">
              <div className="section-title">Search Records</div>
              <div className="section-actions">
                <button className="btn btn-primary" onClick={() => { setAddOpen(true); }}>
                  <i className="fas fa-plus"></i> Add New Record
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 15 }}>
              <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="Search by name, ID, or condition..." style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4 }} />
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4 }}>
                <option>All Record Types</option>
                <option>Medical History</option>
                <option>Examination</option>
                <option>Treatment</option>
                <option>Vaccination</option>
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4 }}>
                <option>All Status</option>
                <option>Active</option>
                <option>Archived</option>
              </select>
              <button className="btn btn-primary" onClick={() => { /* filters applied live */ }}>Search</button>
            </div>
          </div>

          {/* Records Table */}
          <div className="dashboard-section">
            <div className="section-header">
              <div className="section-title">Crew Medical Records</div>
              <div className="section-actions"><button className="btn btn-outline"><i className="fas fa-download"></i> Export</button></div>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Crew Member</th>
                    <th>ID</th>
                    <th>Record Type</th>
                    <th>Last Updated</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.crewId}</td>
                      <td>{r.rtype}</td>
                      <td>{r.updated}</td>
                      <td>
                        <span className={`status-indicator ${r.status === 'Complete' ? 'status-completed' : 'status-pending'}`}></span> {r.status}
                      </td>
                      <td>
                        <button className="btn btn-outline" onClick={() => setSelectedRecordId(r.id)}>View</button>
                        <button className="btn btn-outline" onClick={() => setAddOpen(true)} style={{ marginLeft: 8 }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15 }}>
              <div>Showing 1-{Math.min(4, filtered.length)} of {filtered.length} records</div>
              <div>
                <button className="btn btn-outline">Previous</button>
                <button className="btn btn-primary" style={{ marginLeft: 8 }}>Next</button>
              </div>
            </div>
          </div>

          {/* Record Details */}
          {selectedRecordId && (
            <div className="dashboard-section" id="recordDetails">
              <div className="section-header">
                <div className="section-title">Record Details</div>
                <div className="section-actions">
                  <button className="btn btn-outline" onClick={() => window.print()}><i className="fas fa-print"></i> Print</button>
                  <button className="btn btn-primary" onClick={() => setSelectedRecordId(null)} style={{ marginLeft: 8 }}><i className="fas fa-times"></i> Close</button>
                </div>
              </div>
              <div id="recordContent">{details(selectedRecordId)}</div>
            </div>
          )}
        </main>
      </div>

      {/* Add Medical Record Modal */}
      {addOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setAddOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Medical Record</h3>
              <button className="close-modal" onClick={() => setAddOpen(false)}>&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!form.crewId || !form.recordType) {
                alert('Please select a crew member and record type.');
                return;
              }
              try {
                await saveMedicalRecord({ crewId: form.crewId, type: form.recordType, notes: form.notes }, uploadFiles);
                alert('Medical record saved successfully!');
                setAddOpen(false);
                setForm({ crewId: '', recordType: '', notes: '' });
                setUploadFiles([]);
              } catch (err) {
                console.warn('saveMedicalRecord failed', err);
                alert('Backend unavailable. Your record could not be saved.');
              }
            }}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Crew Member</label>
                <select value={form.crewId} onChange={(e) => setForm((f) => ({ ...f, crewId: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} required>
                  <option value="">Select crew member</option>
                  <option value="CD12345">John Doe (CD12345)</option>
                  <option value="CD12346">Maria Rodriguez (CD12346)</option>
                  <option value="CD12347">James Wilson (CD12347)</option>
                </select>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Record Type</label>
                <select value={form.recordType} onChange={(e) => setForm((f) => ({ ...f, recordType: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} required>
                  <option value="">Select record type</option>
                  <option value="medical_history">Medical History</option>
                  <option value="examination">Examination</option>
                  <option value="treatment">Treatment</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="chronic_condition">Chronic Condition</option>
                </select>
              </div>

              {/* Dynamic fields */}
              {form.recordType === 'medical_history' && (
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Allergies</label>
                  <input type="text" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} placeholder="List any allergies" />
                  <label style={{ display: 'block', margin: '10px 0 5px', fontWeight: 600 }}>Previous Surgeries</label>
                  <textarea style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, minHeight: 60 }} placeholder="List any previous surgeries"></textarea>
                </div>
              )}
              {form.recordType === 'examination' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Blood Pressure</label>
                    <input type="text" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} placeholder="e.g., 120/80" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Heart Rate</label>
                    <input type="number" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} placeholder="BPM" />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, minHeight: 100 }}></textarea>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Upload File</label>
                <input type="file" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files || []))} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Record</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
