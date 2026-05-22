import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-sm font-semibold tracking-widest text-dark-muted uppercase animate-pulse">Initializing Terminal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin role has superuser access to everything
  if (user.role === 'Admin') {
    return children;
  }

  // If role is not allowed on this path, redirect them to their native department page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`Redirecting unauthorized user [${user.username}] with role [${user.role}]`);
    
    switch (user.role) {
      case 'Inbound':
        return <Navigate to="/inbound" replace />;
      case 'Inventory':
        return <Navigate to="/inventory" replace />;
      case 'Outbound':
        return <Navigate to="/outbound" replace />;
      case 'Network':
        return <Navigate to="/network" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
