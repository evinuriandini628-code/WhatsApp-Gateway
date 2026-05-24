import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import ApiKeys from './pages/ApiKeys';
import Pricing from './pages/Pricing';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout><Dashboard /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sessions"
        element={
          <ProtectedRoute>
            <DashboardLayout><Sessions /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/api-keys"
        element={
          <ProtectedRoute>
            <DashboardLayout><ApiKeys /></DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/pricing"
        element={
          <ProtectedRoute>
            <DashboardLayout><Pricing /></DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
