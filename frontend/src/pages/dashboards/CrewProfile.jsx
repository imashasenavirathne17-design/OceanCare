import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../../lib/token';
import './crewDashboard.css';
import CrewSidebar from './CrewSidebar';
import { getCrewProfile, updateCrewProfile } from '../../lib/crewProfileApi';

const ALLERGY_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'penicillin', label: 'Penicillin' },
  { key: 'shellfish', label: 'Shellfish' },
  { key: 'other', label: 'Other' },
];

const formatStatValue = (value) => {
  if (value === undefined || value === null || value === '') return '—';
  return value;
};

export default function CrewProfile() {
  const navigate = useNavigate();
  const user = getUser();
  const onLogout = () => { clearSession(); navigate('/login'); };

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [personal, setPersonal] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    birthDate: '',
    nationality: '',
    address: '',
    vessel: '',
    crewId: user?.crewId || '',
  });
  const [medical, setMedical] = useState({
    bloodType: '',
    height: '',
    weight: '',
    conditions: '',
    allergies: new Set(['none']),
    allergyDetails: '',
    medications: '',
  });
  const [settings, setSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: new Set(['email']),
    language: 'en',
  });
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Your changes have been saved successfully.');
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const hydrateProfile = useCallback((data) => {
    if (!data) return;
    setProfile(data);
    const personalData = data.personal || {};
    setPersonal({
      firstName: personalData.firstName || '',
      lastName: personalData.lastName || '',
      email: personalData.email || user?.email || '',
      phone: personalData.phone || '',
      birthDate: personalData.birthDate || '',
      nationality: personalData.nationality || '',
      address: personalData.address || '',
      vessel: personalData.vessel || '',
      crewId: personalData.crewId || personal.crewId || user?.crewId || '',
    });
    const medicalData = data.medical || {};
    setMedical({
      bloodType: medicalData.bloodType || '',
      height: medicalData.height === null || medicalData.height === undefined ? '' : String(medicalData.height),
      weight: medicalData.weight === null || medicalData.weight === undefined ? '' : String(medicalData.weight),
      conditions: medicalData.conditions || '',
      allergies: new Set(Array.isArray(medicalData.allergies) && medicalData.allergies.length ? medicalData.allergies : ['none']),
      allergyDetails: medicalData.allergyDetails || '',
      medications: medicalData.medications || '',
    });
    const settingsData = data.settings || {};
    setSettings({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      notifications: new Set(Array.isArray(settingsData.notifications) && settingsData.notifications.length ? settingsData.notifications : ['email']),
      language: settingsData.language || 'en',
    });
    setContacts(Array.isArray(data.emergencyContacts) ? data.emergencyContacts.map((c) => ({ ...c })) : []);
    setNewContact({ name: '', relation: '', phone: '', email: '' });
  }, [personal.crewId, user?.crewId, user?.email]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCrewProfile();
      hydrateProfile(data);
    } catch (err) {
      setError('Failed to load profile information.');
    } finally {
      setLoading(false);
    }
  }, [hydrateProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const statBlocks = useMemo(() => {
    const stats = profile?.stats || {};
    return [
      { value: formatStatValue(stats.healthChecks), label: 'Health Checks' },
      { value: formatStatValue(stats.vaccinations), label: 'Vaccinations' },
      { value: formatStatValue(stats.compliance), label: 'Compliance' },
    ];
  }, [profile]);

  const showSuccess = (msg) => { setSuccessMessage(msg); setSuccessOpen(true); };

  const onPersonalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        personal: {
          firstName: personal.firstName.trim(),
          lastName: personal.lastName.trim(),
          email: personal.email.trim(),
          phone: personal.phone.trim(),
          birthDate: personal.birthDate || '',
          nationality: personal.nationality.trim(),
          address: personal.address.trim(),
          vessel: personal.vessel.trim(),
          crewId: personal.crewId.trim(),
        },
      };
      const updated = await updateCrewProfile(payload);
      hydrateProfile(updated);
      showSuccess('Personal information updated successfully.');
    } catch (err) {
      setError('Failed to update personal information.');
    } finally {
      setSaving(false);
    }
  };

  const onMedicalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        medical: {
          bloodType: medical.bloodType,
          height: medical.height,
          weight: medical.weight,
          conditions: medical.conditions,
          allergies: Array.from(medical.allergies),
          allergyDetails: medical.allergyDetails,
          medications: medical.medications,
        },
      };
      const updated = await updateCrewProfile(payload);
      hydrateProfile(updated);
      showSuccess('Medical information updated successfully.');
    } catch (err) {
      setError('Failed to update medical information.');
    } finally {
      setSaving(false);
    }
  };

  const onSettingsSubmit = async (e) => {
    e.preventDefault();
    if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        settings: {
          notifications: Array.from(settings.notifications),
          language: settings.language,
        },
      };
      const updated = await updateCrewProfile(payload);
      hydrateProfile(updated);
      showSuccess('Account settings updated successfully.');
    } catch (err) {
      setError('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergy = (key) => {
    setMedical((m) => {
      const next = new Set(m.allergies);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (key === 'none') {
          next.clear();
          next.add('none');
        } else {
          next.delete('none');
          next.add(key);
        }
      }
      if (next.size === 0) next.add('none');
      return { ...m, allergies: next };
    });
  };

  const toggleNotif = (key) => {
    setSettings((s) => {
      const next = new Set(s.notifications);
      if (next.has(key)) next.delete(key); else next.add(key);
      return { ...s, notifications: next };
    });
  };

  const addContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.relation || !newContact.phone) return;
    setError('');
    setSaving(true);
    try {
      const updatedContacts = [...contacts, { ...newContact }];
      const payload = {
        emergencyContacts: updatedContacts.map((c) => ({
          id: c.id || undefined,
          name: c.name.trim(),
          relation: c.relation.trim(),
          phone: c.phone.trim(),
          email: c.email.trim(),
        })),
      };
      const updated = await updateCrewProfile(payload);
      hydrateProfile(updated);
      setAddContactOpen(false);
      showSuccess('Emergency contact added successfully.');
    } catch (err) {
      setError('Failed to add emergency contact.');
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (id) => {
    if (window.confirm('Are you sure you want to delete this emergency contact?')) {
      setError('');
      setSaving(true);
      try {
        const remaining = contacts.filter((c) => c.id !== id);
        const payload = {
          emergencyContacts: remaining.map((c) => ({
            id: c.id,
            name: c.name,
            relation: c.relation,
            phone: c.phone,
            email: c.email,
          })),
        };
        const updated = await updateCrewProfile(payload);
        hydrateProfile(updated);
        showSuccess('Contact deleted.');
      } catch (err) {
        setError('Failed to delete contact.');
      } finally {
        setSaving(false);
      }
    }
  };

  const avatarInitial = (() => {
    const nameSource = `${personal.firstName} ${personal.lastName}`.trim() || user?.fullName || 'Crew User';
    return nameSource.trim().charAt(0).toUpperCase();
  })();

  const displayName = (() => {
    const combined = `${personal.firstName} ${personal.lastName}`.trim();
    return combined || user?.fullName || 'Crew User';
  })();

  const crewIdDisplay = personal.crewId || user?.crewId || 'CD12345';

  return (
    <div className="crew-dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <CrewSidebar onLogout={onLogout} />

        {/* Main Content */}
        <main className="main-content">
          <div className="dash-header">
            <h2>My Profile</h2>
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'Crew')}&background=3a86ff&color=fff`} alt="User" />
              <div>
                <div>{displayName}</div>
                <small>Crew ID: {crewIdDisplay}</small>
              </div>
              <div className="status-badge status-active">Active</div>
            </div>
          </div>

          <div className="profile-container" style={{ background: '#fff', borderRadius: 10, boxShadow: '0 5px 15px rgba(0,0,0,0.05)', padding: 30, marginBottom: 30, width: '100%' }}>
            {/* Header */}
            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
              <div className="profile-avatar" style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40, marginRight: 25 }}>
                <span>{avatarInitial}</span>
              </div>
              <div className="profile-info" style={{ flex: 1 }}>
                <h3 style={{ fontSize: 24, marginBottom: 5 }}>{displayName}</h3>
                <p style={{ color: '#777', marginBottom: 10 }}>Crew Member • {profile?.personal?.department || 'Deck Department'}</p>
                <p style={{ color: '#777' }}>{personal.vessel || 'MV Ocean Explorer'} • Active</p>
              </div>
              <div className="profile-stats" style={{ display: 'flex', gap: 20 }}>
                {statBlocks.map((s, i) => (
                  <div key={i} className="stat-item" style={{ textAlign: 'center' }}>
                    <div className="stat-value" style={{ fontSize: 20, fontWeight: 600, color: 'var(--primary)' }}>{s.value}</div>
                    <div className="stat-label" style={{ fontSize: 12, color: '#777' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs" style={{ display: 'flex', marginBottom: 25, borderBottom: '1px solid #ddd' }}>
              {[
                { key: 'personal', label: 'Personal Information' },
                { key: 'medical', label: 'Medical Details' },
                { key: 'emergency', label: 'Emergency Contacts' },
                { key: 'settings', label: 'Account Settings' },
              ].map((t) => (
                <div
                  key={t.key}
                  className={`profile-tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                  style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: activeTab === t.key ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === t.key ? 'var(--primary)' : 'inherit', fontWeight: activeTab === t.key ? 600 : 400 }}
                >
                  {t.label}
                </div>
              ))}
            </div>

            {/* Personal Tab */}
            {activeTab === 'personal' && (
              <div className="tab-content active">
                <h3 className="form-title">Personal Information</h3>
                <form onSubmit={onPersonalSubmit}>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 20 }}>
                    <div className="form-group">
                      <label>First Name</label>
                      <input className="form-control" value={personal.firstName} onChange={(e) => setPersonal((p) => ({ ...p, firstName: e.target.value }))} required disabled={saving} />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input className="form-control" value={personal.lastName} onChange={(e) => setPersonal((p) => ({ ...p, lastName: e.target.value }))} required disabled={saving} />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" className="form-control" value={personal.email} onChange={(e) => setPersonal((p) => ({ ...p, email: e.target.value }))} required disabled={saving} />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input className="form-control" value={personal.phone} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))} disabled={saving} />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input type="date" className="form-control" value={personal.birthDate} onChange={(e) => setPersonal((p) => ({ ...p, birthDate: e.target.value }))} disabled={saving} />
                    </div>
                    <div className="form-group">
                      <label>Nationality</label>
                      <input className="form-control" value={personal.nationality} onChange={(e) => setPersonal((p) => ({ ...p, nationality: e.target.value }))} disabled={saving} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Residential Address</label>
                    <textarea className="form-control" rows={3} value={personal.address} onChange={(e) => setPersonal((p) => ({ ...p, address: e.target.value }))} disabled={saving} />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={saving}>Update Personal Information</button>
                </form>
              </div>
            )}

            {/* Medical Tab */}
            {activeTab === 'medical' && (
              <div className="tab-content active">
                <h3 className="form-title">Medical Information</h3>
                <p style={{ color: '#777', marginBottom: 20 }}>Sensitive medical information requires Health Officer approval for changes.</p>
                <form onSubmit={onMedicalSubmit}>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 20 }}>
                    <div className="form-group">
                      <label>Blood Type</label>
                      <input className="form-control" value={medical.bloodType} onChange={(e) => setMedical((m) => ({ ...m, bloodType: e.target.value }))} disabled={saving} />
                      <small style={{ color: '#777' }}>Contact Health Officer to verify changes</small>
                    </div>
                    <div className="form-group">
                      <label>Height (cm)</label>
                      <input type="number" className="form-control" value={medical.height} onChange={(e) => setMedical((m) => ({ ...m, height: e.target.value }))} disabled={saving} />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input type="number" className="form-control" value={medical.weight} onChange={(e) => setMedical((m) => ({ ...m, weight: e.target.value }))} disabled={saving} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Known Medical Conditions</label>
                      <textarea className="form-control" rows={3} value={medical.conditions} onChange={(e) => setMedical((m) => ({ ...m, conditions: e.target.value }))} disabled={saving}></textarea>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Allergies</label>
                    <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 15, marginTop: 10 }}>
                      {ALLERGY_OPTIONS.map((a) => (
                        <label key={a.key} className="checkbox-item" style={{ display: 'flex', alignItems: 'center' }}>
                          <input type="checkbox" checked={medical.allergies.has(a.key)} onChange={() => toggleAllergy(a.key)} style={{ marginRight: 8 }} disabled={saving} />
                          {a.label}
                        </label>
                      ))}
                    </div>
                    {medical.allergies.has('other') && (
                      <textarea className="form-control" rows={2} placeholder="Specify other allergies" style={{ marginTop: 10 }} value={medical.allergyDetails} onChange={(e) => setMedical((m) => ({ ...m, allergyDetails: e.target.value }))} disabled={saving}></textarea>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Current Medications</label>
                    <textarea className="form-control" rows={3} placeholder="List any current medications" value={medical.medications} onChange={(e) => setMedical((m) => ({ ...m, medications: e.target.value }))} disabled={saving}></textarea>
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={saving}>Update Medical Information</button>
                </form>
              </div>
            )}

            {/* Emergency Contacts Tab */}
            {activeTab === 'emergency' && (
              <div className="tab-content active">
                <h3 className="form-title">Emergency Contacts</h3>
                <p>These contacts will be notified in case of emergency.</p>
                <div className="emergency-contacts" style={{ marginTop: 30 }}>
                  {contacts.map((c) => (
                    <div key={c.id} className="contact-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottom: '1px solid #eee' }}>
                      <div className="contact-info">
                        <h4 style={{ marginBottom: 5 }}>{c.name}</h4>
                        <p style={{ color: '#777', fontSize: 14 }}>{c.relation} • {c.phone}</p>
                      </div>
                      <div className="contact-actions" style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => alert('Editing contact ' + c.id)}>Edit</button>
                        <button className="btn btn-primary btn-sm" onClick={() => deleteContact(c.id)} disabled={saving}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setAddContactOpen(true)} disabled={saving}>
                  <i className="fas fa-plus"></i> Add Emergency Contact
                </button>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="tab-content active">
                <h3 className="form-title">Account Settings</h3>
                <form onSubmit={onSettingsSubmit}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" className="form-control" value={settings.currentPassword} onChange={(e) => setSettings((s) => ({ ...s, currentPassword: e.target.value }))} placeholder="Enter current password" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" className="form-control" value={settings.newPassword} onChange={(e) => setSettings((s) => ({ ...s, newPassword: e.target.value }))} placeholder="Enter new password" />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" className="form-control" value={settings.confirmPassword} onChange={(e) => setSettings((s) => ({ ...s, confirmPassword: e.target.value }))} placeholder="Confirm new password" />
                  </div>
                  <div className="form-group">
                    <label>Notification Preferences</label>
                    <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                      {[
                        { key: 'email', label: 'Email Notifications' },
                        { key: 'sms', label: 'SMS Notifications' },
                        { key: 'reminders', label: 'Medication Reminders' },
                      ].map((n) => (
                        <label key={n.key} className="checkbox-item" style={{ display: 'flex', alignItems: 'center' }}>
                          <input type="checkbox" checked={settings.notifications.has(n.key)} onChange={() => toggleNotif(n.key)} style={{ marginRight: 8 }} />
                          {n.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Language Preference</label>
                    <select className="form-control" value={settings.language} onChange={(e) => setSettings((s) => ({ ...s, language: e.target.value }))}>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" type="submit">Update Settings</button>
                </form>

                <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #eee' }}>
                  <h4>Danger Zone</h4>
                  <p style={{ color: '#777', marginBottom: 15 }}>Permanently delete your account and all associated data.</p>
                  <button className="btn" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent' }} onClick={() => {
                    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      alert('Account deletion request submitted. A Health Officer will contact you to confirm.');
                    }
                  }}>
                    <i className="fas fa-trash"></i> Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {loading && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Loading Profile</h3>
            </div>
            <p>Fetching your profile details...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div style={{ background: 'rgba(230, 57, 70, 0.12)', color: '#e63946', padding: '12px 16px', borderRadius: 8, margin: 20 }}>
          {error}
        </div>
      )}

      {/* Add Contact Modal */}
      {addContactOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setAddContactOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Emergency Contact</h3>
              <button className="close-modal" onClick={() => setAddContactOpen(false)}>&times;</button>
            </div>
            <form onSubmit={addContact}>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" value={newContact.name} onChange={(e) => setNewContact((c) => ({ ...c, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <input className="form-control" value={newContact.relation} onChange={(e) => setNewContact((c) => ({ ...c, relation: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input className="form-control" value={newContact.phone} onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-control" value={newContact.email} onChange={(e) => setNewContact((c) => ({ ...c, email: e.target.value }))} />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 20 }} disabled={saving}>Add Contact</button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successOpen && (
        <div className="modal" onClick={(e) => e.target.classList.contains('modal') && setSuccessOpen(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Success!</h3>
              <button className="close-modal" onClick={() => setSuccessOpen(false)}>&times;</button>
            </div>
            <p>{successMessage}</p>
            <button className="btn btn-primary" onClick={() => setSuccessOpen(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
