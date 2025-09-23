import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Features from './pages/Features';
import HealthLibrary from './pages/HealthLibrary';
import Emergency from './pages/Emergency';
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
import CrewReminders from './pages/dashboards/CrewReminders';
import CrewEmergency from './pages/dashboards/CrewEmergency';
import CrewHealthEducation from './pages/dashboards/CrewHealthEducation';
import CrewProfile from './pages/dashboards/CrewProfile';
import HealthDashboard from './pages/dashboards/HealthDashboard';
import EmergencyDashboard from './pages/dashboards/EmergencyDashboard';
import InventoryDashboard from './pages/dashboards/InventoryDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import HealthMedicalRecords from './pages/dashboards/HealthMedicalRecords';
import HealthExamination from './pages/dashboards/HealthExamination';
import HealthChronic from './pages/dashboards/HealthChronic';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/health-library" element={<HealthLibrary />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
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
          <Route path="/dashboard/crew/health-check" element={<CrewHealthCheck />} />
          <Route path="/dashboard/crew/records" element={<CrewHealthRecords />} />
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
        </Route>
        <Route element={<RequireAuth roles={["emergency"]} />}>
          <Route path="/dashboard/emergency" element={<EmergencyDashboard />} />
        </Route>
        <Route element={<RequireAuth roles={["inventory"]} />}>
          <Route path="/dashboard/inventory" element={<InventoryDashboard />} />
        </Route>
        <Route element={<RequireAuth roles={["admin"]} />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;