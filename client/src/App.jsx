import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useFlat } from './context/FlatContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FlatSetupPage from './pages/FlatSetupPage';
import DashboardPage from './pages/DashboardPage';
import MyTasksPage from './pages/MyTasksPage';
import AllTasksPage from './pages/AllTasksPage';
import ChoreExchangePage from './pages/ChoreExchangePage';
import CreditLedgerPage from './pages/CreditLedgerPage';
import ItemDebtPage from './pages/ItemDebtPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ActivityHistoryPage from './pages/ActivityHistoryPage';
import FlatmatesPage from './pages/FlatmatesPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user does not belong to a flat yet, redirect to flat setup
  if (!user.flat && location.pathname !== '/flat-setup') {
    return <Navigate to="/flat-setup" replace />;
  }

  // If user already belongs to a flat and visits flat-setup, send to dashboard
  if (user.flat && location.pathname === '/flat-setup') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      {/* Flat Setup Route (for users without a flat) */}
      <Route
        path="/flat-setup"
        element={
          <ProtectedRoute>
            <FlatSetupPage />
          </ProtectedRoute>
        }
      />

      {/* Main Authenticated Flat Application */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-tasks" element={<MyTasksPage />} />
        <Route path="tasks" element={<AllTasksPage />} />
        <Route path="exchange" element={<ChoreExchangePage />} />
        <Route path="credits" element={<CreditLedgerPage />} />
        <Route path="items" element={<ItemDebtPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="activity" element={<ActivityHistoryPage />} />
        <Route path="flatmates" element={<FlatmatesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

