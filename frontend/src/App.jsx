import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { StateProvider } from './store/store';
import ProtectedRoute from './components/ProtectedRoute';
import CommandPalette from './components/CommandPalette';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inbound from './pages/Inbound';
import Inventory from './pages/Inventory';
import Outbound from './pages/Outbound';
import Network from './pages/Network';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';

const App = () => {
  return (
    <StateProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            {/* Global Command Palette search modal */}
            <CommandPalette />
            
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Role Protected Dashboard Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/inbound" 
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Inbound']}>
                    <Inbound />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Inventory']}>
                    <Inventory />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/outbound" 
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Outbound']}>
                    <Outbound />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/network" 
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Network']}>
                    <Network />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Reports />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback to Login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </StateProvider>
  );
};

export default App;
