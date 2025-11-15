import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Employees from './pages/Employees';
import Expenses from './pages/Expenses';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import Bill from './pages/Bill';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useUser();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useUser();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              {user?.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />}
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/clients" 
        element={
          <ProtectedRoute>
            <Layout>
              <Clients />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/clients/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <ClientDetails />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/employees" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/expenses" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <Expenses />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/invoices" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <Invoices />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/tasks" 
        element={
          <ProtectedRoute>
            <Layout>
              <Tasks />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/bill/:id" 
        element={
          <ProtectedRoute>
            <Bill />
          </ProtectedRoute>
        } 
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <Router>
            <div className="App">
              <AppRoutes />
            </div>
          </Router>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
