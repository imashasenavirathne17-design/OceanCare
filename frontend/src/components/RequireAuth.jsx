import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken, getUser } from '../lib/token';

// Usage:
// <RequireAuth /> wraps routes that require auth
// Optionally pass roles={["admin","crew"]} to restrict by role
export default function RequireAuth({ roles }) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    // Role mismatch -> send to home or a generic unauthorized page
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
