import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

interface LayoutProps {
  children: React.ReactNode;
  userRole: string;
  onLogout: () => void;
}

function DashboardLayout({ children, userRole, onLogout }: LayoutProps) {
  return (
    <div className="app-container">
      <Sidebar userRole={userRole} onLogout={onLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <TopNav userRole={userRole} />
        <main className="main-content" style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('FleetManager');

  const handleLogin = (role: string) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } 
        />

        {/* Authenticated Dashboard Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <DashboardLayout userRole={userRole} onLogout={handleLogout}>
                <Dashboard />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/vehicles"
          element={
            isAuthenticated ? (
              <DashboardLayout userRole={userRole} onLogout={handleLogout}>
                <Vehicles />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/drivers"
          element={
            isAuthenticated ? (
              <DashboardLayout userRole={userRole} onLogout={handleLogout}>
                <Drivers />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/trips"
          element={
            isAuthenticated ? (
              <DashboardLayout userRole={userRole} onLogout={handleLogout}>
                <Trips />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/maintenance"
          element={
            isAuthenticated ? (
              <DashboardLayout userRole={userRole} onLogout={handleLogout}>
                <Maintenance />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/expenses"
          element={
            isAuthenticated ? (
              <DashboardLayout userRole={userRole} onLogout={handleLogout}>
                <Expenses />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/reports"
          element={
            isAuthenticated ? (
              <DashboardLayout userRole={userRole} onLogout={handleLogout}>
                <Reports />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
