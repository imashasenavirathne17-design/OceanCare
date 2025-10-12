import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';

export default function CrewDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const onLogout = () => {
    clearSession();
    navigate('/login');
  };

  const chart = useMemo(() => {
    const temperatures = [36.5, 36.7, 36.6, 36.8, 37.0, 36.9, 36.8];
    const heartRates = [70, 72, 68, 75, 74, 72, 72];
    const dates = ['10/09', '10/10', '10/11', '10/12', '10/13', '10/14', '10/15'];
    const maxTemp = Math.max(...temperatures);
    const maxHR = Math.max(...heartRates);
    const maxValue = Math.max(maxTemp, maxHR);
    const scale = (v) => (v / maxValue) * 150; // 150px chart height
    return { temperatures, heartRates, dates, scale };
  }, []);

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <CrewSidebar onLogout={onLogout} />

        {/* Main Content */}
        <main className="main-content">
          {/* Header */}
          <div className="dash-header">
            <h2>Dashboard</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{user?.fullName || 'Crew User'}</div>
                <small>Crew ID: {user?.crewId || 'CD12345'}</small>
              </div>
              <div className="status-badge status-active">Health Status: Good</div>
            </div>
          </div>

          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div>
              <div className="welcome-title">Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}!` : '!'} </div>
              <div className="welcome-subtitle">Your health is important to us. Remember to submit your daily health check and stay updated with your health metrics.</div>
            </div>
            <div className="welcome-icon">
              <i className="fas fa-heartbeat"></i>
            </div>
          </div>

          {/* Dashboard Cards */}
          <section className="dashboard-section">
            <div className="section-header">
              <div>
                <div className="section-title">Health Tools</div>
                <div className="section-subtitle">Stay on top of your daily health responsibilities</div>
              </div>
            </div>
            <div className="dashboard-cards">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Daily Health Check</div>
                <div className="card-icon health-icon"><i className="fas fa-heartbeat"></i></div>
              </div>
              <p>Submit your daily health metrics to stay compliant with maritime health regulations.</p>
              <div style={{ margin: '15px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span>Last submission:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>Today, 08:30 AM</span>
                </div>
                <div style={{ background: '#f0f0f0', height: 6, borderRadius: 3 }}>
                  <div style={{ background: 'var(--success)', width: '100%', height: '100%', borderRadius: 3 }}></div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard/crew/health-check')}>Submit Health Check</button>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Health Records</div>
                <div className="card-icon records-icon"><i className="fas fa-file-medical"></i></div>
              </div>
              <p>Access your complete medical history, immunization records, and health reports.</p>
              <div style={{ margin: '15px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span>Medical appointments:</span>
                  <span style={{ fontWeight: 600 }}>3 this month</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Immunizations:</span>
                  <span style={{ fontWeight: 600 }}>Up to date</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard/crew/records')}>View Records</button>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Medication Reminders</div>
                <div className="card-icon medication-icon"><i className="fas fa-pills"></i></div>
              </div>
              <p>Manage your medication schedule and health-related reminders.</p>
              <div style={{ margin: '15px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <i className="fas fa-bell" style={{ color: 'var(--warning)', marginRight: 10 }}></i>
                  <span>2 pending reminders today</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginRight: 10 }}></i>
                  <span>15 completed this month</span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard/crew/reminders')}>View Reminders</button>
            </div>
            </div>
          </section>

          {/* Health Status Overview */}
          <section className="dashboard-section">
            <div className="section-header">
              <div>
                <div className="section-title">Health Status Overview</div>
                <div className="section-subtitle">Your recent health metrics and trends</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginTop: 20 }}>
              <div style={{ textAlign: 'center', padding: 15, borderRadius: 8, background: '#f8f9fa' }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 5, color: 'var(--primary)' }}>36.8°C</div>
                <div style={{ fontSize: 14, color: '#777' }}>Temperature</div>
              </div>
              <div style={{ textAlign: 'center', padding: 15, borderRadius: 8, background: '#f8f9fa' }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 5, color: 'var(--primary)' }}>72 BPM</div>
                <div style={{ fontSize: 14, color: '#777' }}>Heart Rate</div>
              </div>
              <div style={{ textAlign: 'center', padding: 15, borderRadius: 8, background: '#f8f9fa' }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 5, color: 'var(--primary)' }}>118/76</div>
                <div style={{ fontSize: 14, color: '#777' }}>Blood Pressure</div>
              </div>
              <div style={{ textAlign: 'center', padding: 15, borderRadius: 8, background: '#f8f9fa' }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 5, color: 'var(--success)' }}>98%</div>
                <div style={{ fontSize: 14, color: '#777' }}>Oxygen Saturation</div>
              </div>
            </div>

            <div className="chart-container" style={{ marginTop: 20, padding: 15 }}>
              <h4 style={{ marginBottom: 15 }}>Weekly Health Trends</h4>
              <div style={{ height: 200, width: '100%', position: 'relative', marginTop: 15 }}>
                {/* Temperature bars */}
                {chart.temperatures.map((temp, index) => {
                  const h = chart.scale(temp);
                  return (
                    <div key={`t-${index}`} style={{ display: 'inline-block', width: 20, margin: '0 3px', verticalAlign: 'bottom' }}>
                      <div style={{ height: 150 - h }} />
                      <div className="chart-bar" style={{ height: h, backgroundColor: 'var(--primary)', borderRadius: '3px 3px 0 0' }} title={`Temp: ${temp}°C`} />
                      <div className="chart-label" style={{ textAlign: 'center', fontSize: 10, marginTop: 5 }}>{chart.dates[index]}</div>
                    </div>
                  );
                })}
                {/* spacer */}
                <div style={{ display: 'inline-block', width: 20 }} />
                {/* Heart rate bars */}
                {chart.heartRates.map((hr, index) => {
                  const h = chart.scale(hr);
                  return (
                    <div key={`h-${index}`} style={{ display: 'inline-block', width: 20, margin: '0 3px', verticalAlign: 'bottom' }}>
                      <div style={{ height: 150 - h }} />
                      <div className="chart-bar" style={{ height: h, backgroundColor: 'var(--success)', borderRadius: '3px 3px 0 0' }} title={`HR: ${hr} BPM`} />
                      <div className="chart-label" style={{ textAlign: 'center', fontSize: 10, marginTop: 5 }}>{chart.dates[index]}</div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12 }}>
                <span style={{ display: 'inline-block', marginRight: 15 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--primary)', marginRight: 5 }}></span>
                  Temperature (°C)
                </span>
                <span style={{ display: 'inline-block' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--success)', marginRight: 5 }}></span>
                  Heart Rate (BPM)
                </span>
              </div>
            </div>
          </section>

          {/* Two-column grid: Recent Activity and Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            {/* Recent Activity */}
            <div className="dashboard-section" style={{ marginBottom: 0 }}>
              <div className="section-header">
                <div>
                  <div className="section-title">Recent Activity</div>
                  <div className="section-subtitle">Your latest health-related activities</div>
                </div>
              </div>
              <ul style={{ listStyle: 'none', marginTop: 15, paddingLeft: 0 }}>
                {[
                  { icon: 'fas fa-heartbeat', bg: 'var(--primary)', title: 'Daily health check submitted', time: 'Today, 08:30 AM' },
                  { icon: 'fas fa-file-medical', bg: 'var(--success)', title: 'Health record updated by Health Officer', time: 'Yesterday, 02:15 PM' },
                  { icon: 'fas fa-pills', bg: 'var(--warning)', title: 'Medication reminder completed', time: 'Oct 15, 08:00 AM' },
                  { icon: 'fas fa-book-medical', bg: 'var(--info)', title: 'Viewed health education content', time: 'Oct 14, 07:45 PM' },
                  { icon: 'fas fa-user-edit', bg: '#8338ec', title: 'Updated personal information', time: 'Oct 12, 10:20 AM' },
                ].map((a, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 15, color: '#fff', fontSize: 14, backgroundColor: a.bg }}>
                      <i className={a.icon}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 3 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#777' }}>{a.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-section" style={{ marginBottom: 0 }}>
              <div className="section-header">
                <div>
                  <div className="section-title">Quick Actions</div>
                  <div className="section-subtitle">Fast access to common tasks</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginTop: 20 }}>
                {[
                  { icon: 'fas fa-heartbeat', label: 'Health Check', to: '/dashboard/crew/health-check' },
                  { icon: 'fas fa-plus-circle', label: 'Emergency', to: '/dashboard/crew' },
                  { icon: 'fas fa-book-medical', label: 'Education', to: '/dashboard/crew' },
                  { icon: 'fas fa-bell', label: 'Reminders', to: '/dashboard/crew/reminders' },
                  { icon: 'fas fa-file-medical', label: 'Records', to: '/dashboard/crew/records' },
                  { icon: 'fas fa-user-edit', label: 'Profile', to: '/dashboard/crew' },
                ].map((q, i) => (
                  <button key={i} onClick={() => navigate(q.to)} style={{ textAlign: 'center', padding: '20px 10px', borderRadius: 8, background: '#f8f9fa', transition: 'all .3s', cursor: 'pointer', border: 'none' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = 'inherit'; }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>
                      <i className={q.icon}></i>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{q.label}</div>
                  </button>
                ))}
              </div>

              {/* Emergency Quick Access */}
              <div style={{ marginTop: 25, padding: 15, background: '#fff5f5', borderRadius: 8, textAlign: 'center' }}>
                <h4 style={{ color: 'var(--danger)', marginBottom: 10 }}>Emergency Access</h4>
                <p style={{ fontSize: 14, marginBottom: 15 }}>Immediate assistance when needed</p>
                <button className="btn btn-danger" onClick={() => navigate('/dashboard/crew')} style={{ width: '100%' }}>
                  <i className="fas fa-exclamation-triangle"></i> Emergency Alert
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="dashboard-section">
            <div className="section-header">
              <div>
                <div className="section-title">Upcoming Appointments</div>
                <div className="section-subtitle">Your scheduled health-related appointments</div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', marginTop: 15, paddingLeft: 0 }}>
              {[
                { icon: 'fas fa-calendar-check', bg: 'var(--success)', title: 'Routine Health Check-up', time: 'October 30, 2025 • 10:00 AM', color: 'var(--success)' },
                { icon: 'fas fa-syringe', bg: 'var(--info)', title: 'Influenza Vaccination', time: 'October 25, 2025 • 02:00 PM', color: 'var(--info)' },
              ].map((a, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i === 1 ? 'none' : '1px solid #f0f0f0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 15, color: '#fff', fontSize: 14, backgroundColor: a.bg }}>
                    <i className={a.icon}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#777' }}>{a.time}</div>
                  </div>
                  <button className="btn" style={{ border: `1px solid ${a.color}`, color: a.color, background: 'transparent' }}>View Details</button>
                </li>
              ))}
            </ul>
          </div>

        </main>
      </div>
    </div>
  );
}

