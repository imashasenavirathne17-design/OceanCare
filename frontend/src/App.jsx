import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import HealthOfficerLogin from './pages/HealthOfficerLogin';
import HealthOfficerDashboard from './pages/HealthOfficerDashboard';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Always show login page first if not authenticated */}
        <Route
          path="/healthofficer/login"
          element={
            user ? (
              <Navigate to="/healthofficer/dashboard" replace />
            ) : (
              <HealthOfficerLogin onLogin={setUser} />
            )
          }
        />
        {/* Only show dashboard if authenticated */}
        <Route
          path="/healthofficer/dashboard"
          element={
            user ? (
              <HealthOfficerDashboard user={user} />
            ) : (
              <Navigate to="/healthofficer/login" replace />
            )
          }
        />
        {/* Redirect root and unknown routes to login */}
        <Route path="/" element={<Navigate to="/healthofficer/login" replace />} />
        <Route path="*" element={<Navigate to="/healthofficer/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;