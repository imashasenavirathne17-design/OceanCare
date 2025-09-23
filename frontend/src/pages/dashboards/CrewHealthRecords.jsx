import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewHealthRecords() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };
  // Demo records inspired by provided HTML
  const [records] = useState([
    {
      id: 'REC-1', date: '2023-10-15', type: 'Health Check',
      details: 'Temperature: 36.8°C, Heart Rate: 72 BPM, BP: 118/76, Oxygen: 98%',
      status: 'Normal', statusColor: 'success',
      fullDetails: `
        <p><strong>Date:</strong> October 15, 2023</p>
        <p><strong>Type:</strong> Routine Health Check</p>
        <p><strong>Temperature:</strong> 36.8°C</p>
        <p><strong>Heart Rate:</strong> 72 BPM</p>
        <p><strong>Blood Pressure:</strong> 118/76 mmHg</p>
        <p><strong>Oxygen Saturation:</strong> 98%</p>
        <p><strong>Respiratory Rate:</strong> 16 breaths/min</p>
        <p><strong>Symptoms:</strong> None reported</p>
        <p><strong>Health Officer Notes:</strong> All vitals within normal range.</p>
      `
    },
    {
      id: 'REC-2', date: '2023-10-14', type: 'Immunization',
      details: 'Influenza Vaccine - Batch: FLU2023A',
      status: 'Completed', statusColor: 'success',
      fullDetails: `
        <p><strong>Date:</strong> October 14, 2023</p>
        <p><strong>Type:</strong> Immunization</p>
        <p><strong>Vaccine:</strong> Influenza</p>
        <p><strong>Batch Number:</strong> FLU2023A</p>
        <p><strong>Administrated By:</strong> Dr. Sarah Johnson</p>
        <p><strong>Next Due:</strong> October 2024</p>
        <p><strong>Notes:</strong> No adverse reactions reported.</p>
      `
    },
    {
      id: 'REC-3', date: '2023-10-10', type: 'Health Check',
      details: 'Temperature: 37.1°C, Heart Rate: 75 BPM, BP: 122/78, Oxygen: 97%',
      status: 'Slight Fever', statusColor: 'warning',
      fullDetails: `
        <p><strong>Date:</strong> October 10, 2023</p>
        <p><strong>Type:</strong> Health Check</p>
        <p><strong>Temperature:</strong> 37.1°C (Slight fever)</p>
        <p><strong>Heart Rate:</strong> 75 BPM</p>
        <p><strong>Blood Pressure:</strong> 122/78 mmHg</p>
        <p><strong>Oxygen Saturation:</strong> 97%</p>
        <p><strong>Respiratory Rate:</strong> 18 breaths/min</p>
        <p><strong>Symptoms:</strong> Mild headache</p>
        <p><strong>Health Officer Notes:</strong> Recommended rest and hydration. Temperature returned to normal after 24 hours.</p>
      `
    },
    {
      id: 'REC-4', date: '2023-10-05', type: 'Medical Appointment',
      details: 'Routine check-up with Health Officer',
      status: 'Completed', statusColor: 'success',
      fullDetails: `
        <p><strong>Date:</strong> October 5, 2023</p>
        <p><strong>Type:</strong> Medical Appointment</p>
        <p><strong>Purpose:</strong> Routine check-up</p>
        <p><strong>Health Officer:</strong> Dr. Michael Chen</p>
        <p><strong>Findings:</strong> Overall health good. Recommended maintaining current exercise routine.</p>
        <p><strong>Next Appointment:</strong> January 5, 2024</p>
      `
    },
  ]);
  const [filters, setFilters] = useState({ recordType: 'all', dateFrom: '', dateTo: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalHtml, setModalHtml] = useState('');

  const onFilterChange = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const applyFilters = () => { /* no-op, computed by useMemo */ };
  const viewRecord = (rec) => { setModalTitle(`${rec.type} - ${rec.date}`); setModalHtml(rec.fullDetails); setModalOpen(true); };
  const downloadRecord = (rec) => { alert(`Downloading record: ${rec.type} from ${rec.date}`); };
  const generateHealthCertificate = () => { alert('Generating health certificate...'); };
  const printRecords = () => { window.print(); };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const typeOk = filters.recordType === 'all' || r.type.toLowerCase().includes(filters.recordType.replace('-', ' ').toLowerCase());
      const fromOk = !filters.dateFrom || r.date >= filters.dateFrom;
      const toOk = !filters.dateTo || r.date <= filters.dateTo;
      return typeOk && fromOk && toOk;
    });
  }, [records, filters]);

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        <CrewSidebar onLogout={onLogout} />
        <main className="main-content">
          <div className="dash-header">
            <h2>Health Records</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <section className="health-records">
            <h3 className="form-title">Your Health Records</h3>

            <div className="records-filter" style={{ display: 'flex', gap: 15, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
                <label>Record Type</label>
                <select name="recordType" className="form-control" value={filters.recordType} onChange={onFilterChange}>
                  <option value="all">All Records</option>
                  <option value="health-check">Health Checks</option>
                  <option value="immunization">Immunizations</option>
                  <option value="appointment">Medical Appointments</option>
                  <option value="emergency">Emergency Reports</option>
                </select>
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
                <label>From Date</label>
                <input name="dateFrom" type="date" className="form-control" value={filters.dateFrom} onChange={onFilterChange} />
              </div>
              <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
                <label>To Date</label>
                <input name="dateTo" type="date" className="form-control" value={filters.dateTo} onChange={onFilterChange} />
              </div>
              <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
              </div>
            </div>

            <div className="table-responsive">
              <table id="recordsTable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.type}</td>
                      <td>{r.details}</td>
                      <td><span style={{ color: r.statusColor === 'success' ? 'var(--success)' : 'var(--warning)' }}>{r.status}</span></td>
                      <td className="action-buttons" style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => viewRecord(r)}>View Details</button>
                        <button className="btn btn-success btn-sm" onClick={() => downloadRecord(r)}>Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button className="btn btn-success" onClick={generateHealthCertificate}><i className="fas fa-download"></i> Download Health Certificate</button>
              <button className="btn btn-primary" style={{ marginLeft: 10 }} onClick={printRecords}><i className="fas fa-print"></i> Print Records</button>
            </div>
          </section>
        </main>
      </div>
      {modalOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">{modalTitle || 'Record Details'}</h3>
              <button className="close-modal" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: modalHtml }} />
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
