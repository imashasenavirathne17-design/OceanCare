import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Features from './pages/Features';
import HealthLibrary from './pages/HealthLibrary';
import Emergency from './pages/Emergency';
import EmergencyProtocols from './pages/dashboards/EmergencyProtocols';
import Announcements from './pages/Announcements';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Register from './pages/Register';
import Login from './pages/Login';
import CrewLogin from './pages/CrewLogin';
import HealthOfficerLogin from './pages/HealthOfficerLogin';
import EmergencyOfficerLogin from './pages/EmergencyOfficerLogin';
import InventoryLogin from './pages/InventoryLogin';
import AdminLogin from './pages/AdminLogin';
import RequireAuth from './components/RequireAuth';
import CrewDashboard from './pages/dashboards/CrewDashboard';
import CrewHealthCheck from './pages/dashboards/CrewHealthCheck';
import CrewHealthRecords from './pages/dashboards/CrewHealthRecords';
import CrewExaminations from './pages/dashboards/CrewExaminations';
import CrewChronic from './pages/dashboards/CrewChronic';
import CrewMental from './pages/dashboards/CrewMental';
import CrewVaccinations from './pages/dashboards/CrewVaccinations';
import CrewReminders from './pages/dashboards/CrewReminders';
import CrewEmergency from './pages/dashboards/CrewEmergency';
import CrewHealthEducation from './pages/dashboards/CrewHealthEducation';
import CrewProfile from './pages/dashboards/CrewProfile';
import HealthDashboard from './pages/dashboards/HealthDashboard';
import EmergencyDashboard from './pages/dashboards/EmergencyDashboard';
import EmergencyAlerts from './pages/dashboards/EmergencyAlerts';
import EmergencyCrewProfiles from './pages/dashboards/EmergencyCrewProfiles';
import EmergencyCrewLocator from './pages/dashboards/EmergencyCrewLocator';
import EmergencyMessaging from './pages/dashboards/EmergencyMessaging';
import CrewMessaging from './pages/dashboards/CrewMessaging';
import HealthMessaging from './pages/dashboards/HealthMessaging';
import InventoryMessaging from './pages/dashboards/InventoryMessaging';
import AdminMessaging from './pages/dashboards/AdminMessaging';
import EmergencyIncidentLog from './pages/dashboards/EmergencyIncidentLog';
import EmergencyReports from './pages/dashboards/EmergencyReports';
import InventoryDashboard from './pages/dashboards/InventoryDashboard';
import InventoryItems from './pages/dashboards/InventoryItems';
import InventoryStockManagement from './pages/dashboards/InventoryStockManagement';
import InventoryExpiryTracking from './pages/dashboards/InventoryExpiryTracking';
import InventoryStorageZones from './pages/dashboards/InventoryStorageZones';
import InventoryReports from './pages/dashboards/InventoryReports';
import InventoryAuditTrail from './pages/dashboards/InventoryAuditTrail';
import InventoryBarcodeScanning from './pages/dashboards/InventoryBarcodeScanning';
import InventoryPredictiveRestocking from './pages/dashboards/InventoryPredictiveRestocking';
import InventoryFleetTransfer from './pages/dashboards/InventoryFleetTransfer';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import AdminUserManagement from './pages/dashboards/AdminUserManagement';
import AdminPermissions from './pages/dashboards/AdminPermissions';
import AdminCompliance from './pages/dashboards/AdminCompliance';
import AdminReports from './pages/dashboards/AdminReports';
import AdminAnnouncements from './pages/dashboards/AdminAnnouncements';
import HealthMedicalRecords from './pages/dashboards/HealthMedicalRecords';
import HealthExamination from './pages/dashboards/HealthExamination';
import HealthChronic from './pages/dashboards/HealthChronic';
import HealthReminders from './pages/dashboards/HealthReminders';
import HealthVaccination from './pages/dashboards/HealthVaccination';
import HealthInventoryAlerts from './pages/dashboards/HealthInventoryAlerts';
import HealthEducation from './pages/dashboards/HealthEducation';
import HealthReports from './pages/dashboards/HealthReports';
import InventoryWasteDisposal from './pages/dashboards/InventoryWasteDisposal';
import HealthMental from './pages/dashboards/HealthMental';
import HealthEmergency from './pages/dashboards/HealthEmergency';
import HealthPermissions from './pages/dashboards/HealthPermissions';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/health-library" element={<HealthLibrary />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/emergency-protocols" element={<EmergencyProtocols />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/about" element={<AboutUs />} />

        <Route path="/login" element={<Login />} />
        <Route path="/login/crew" element={<CrewLogin />} />
        <Route path="/login/health-officer" element={<HealthOfficerLogin />} />
        <Route path="/login/emergency-officer" element={<EmergencyOfficerLogin />} />
        <Route path="/login/inventory-manager" element={<InventoryLogin />} />
        <Route path="/login/administrator" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />

        {/* Protected dashboards */}
        <Route element={<RequireAuth roles={["crew"]} />}>
          <Route path="/dashboard/crew" element={<CrewDashboard />} />
          <Route path="/dashboard/crew/records" element={<CrewHealthRecords />} />
          <Route path="/dashboard/crew/examinations" element={<CrewExaminations />} />
          <Route path="/dashboard/crew/chronic" element={<CrewChronic />} />
          <Route path="/dashboard/crew/mental-health" element={<CrewMental />} />
          <Route path="/dashboard/crew/vaccinations" element={<CrewVaccinations />} />
          <Route path="/dashboard/crew/reminders" element={<CrewReminders />} />
          <Route path="/dashboard/crew/emergency" element={<CrewEmergency />} />
          <Route path="/dashboard/crew/education" element={<CrewHealthEducation />} />
          <Route path="/dashboard/crew/profile" element={<CrewProfile />} />
        </Route>

        <Route element={<RequireAuth roles={["health"]} />}>
          <Route path="/dashboard/health" element={<HealthDashboard />} />
          <Route path="/dashboard/health/medical-records" element={<HealthMedicalRecords />} />
          <Route path="/dashboard/health/examinations" element={<HealthExamination />} />
          <Route path="/dashboard/health/chronic" element={<HealthChronic />} />
          <Route path="/dashboard/health/reminders" element={<HealthReminders />} />
          <Route path="/dashboard/health/mental-health" element={<HealthMental />} />
          <Route path="/dashboard/health/vaccination" element={<HealthVaccination />} />
          <Route path="/dashboard/health/reports" element={<HealthReports />} />
          {/* inventory page removed */}
          <Route path="/dashboard/health/inventory-alerts" element={<HealthInventoryAlerts />} />
          <Route path="/dashboard/health/emergency" element={<HealthEmergency />} />
          <Route path="/dashboard/health/education" element={<HealthEducation />} />
          <Route path="/dashboard/health/permissions" element={<HealthPermissions />} />
        </Route>

        <Route element={<RequireAuth roles={["emergency"]} />}>
          <Route path="/dashboard/emergency" element={<EmergencyDashboard />} />
          <Route path="/dashboard/emergency/alerts" element={<EmergencyAlerts />} />
          <Route path="/dashboard/emergency/protocols" element={<EmergencyProtocols />} />
          <Route path="/dashboard/emergency/crew-profiles" element={<EmergencyCrewProfiles />} />
          <Route path="/dashboard/emergency/crew-locator" element={<EmergencyCrewLocator />} />
          <Route path="/dashboard/emergency/messaging" element={<EmergencyMessaging />} />
          <Route path="/dashboard/emergency/incident-log" element={<EmergencyIncidentLog />} />
          <Route path="/dashboard/emergency/reports" element={<EmergencyReports />} />
        </Route>

        <Route element={<RequireAuth roles={["crew", "emergency", "health"]} />}>
          <Route path="/dashboard/crew/messaging" element={<CrewMessaging />} />
        </Route>

        <Route element={<RequireAuth roles={["health", "emergency", "admin"]} />}>
          <Route path="/dashboard/health/messaging" element={<HealthMessaging />} />
        </Route>

        <Route element={<RequireAuth roles={["inventory", "emergency", "admin"]} />}>
          <Route path="/dashboard/inventory/messaging" element={<InventoryMessaging />} />
        </Route>

        <Route element={<RequireAuth roles={["admin"]} />}>
          <Route path="/dashboard/admin/messaging" element={<AdminMessaging />} />
        </Route>

        <Route element={<RequireAuth roles={["inventory"]} />}>
          <Route path="/dashboard/inventory" element={<InventoryDashboard />} />
          <Route path="/dashboard/inventory/items" element={<InventoryItems />} />
          <Route path="/dashboard/inventory/stock" element={<InventoryStockManagement />} />
          <Route path="/dashboard/inventory/expiry" element={<InventoryExpiryTracking />} />
          <Route path="/dashboard/inventory/zones" element={<InventoryStorageZones />} />
          <Route path="/dashboard/inventory/reports" element={<InventoryReports />} />
          <Route path="/dashboard/inventory/audit-trail" element={<InventoryAuditTrail />} />
          <Route path="/dashboard/inventory/barcode" element={<InventoryBarcodeScanning />} />
          <Route path="/dashboard/inventory/waste" element={<InventoryWasteDisposal />} />
          <Route path="/dashboard/inventory/predict" element={<InventoryPredictiveRestocking />} />
          <Route path="/dashboard/inventory/transfer" element={<InventoryFleetTransfer />} />
        </Route>

        <Route element={<RequireAuth roles={["admin"]} />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/admin/users" element={<AdminUserManagement />} />
          <Route path="/dashboard/admin/permissions" element={<AdminPermissions />} />
          <Route path="/dashboard/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/dashboard/admin/compliance" element={<AdminCompliance />} />
          <Route path="/dashboard/admin/reports" element={<AdminReports />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;