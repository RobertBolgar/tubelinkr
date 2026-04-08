import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SetupUsernamePage } from './pages/SetupUsernamePage';
import { DashboardPage } from './pages/DashboardPage';
import { LinksPage } from './pages/LinksPage';
import { NewLinkPage } from './pages/NewLinkPage';
import { EditLinkPage } from './pages/EditLinkPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RedirectPage } from './pages/RedirectPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function UsernameSetupRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user.username) {
    return <Navigate to="/setup-username" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route 
        path="/setup-username" 
        element={
          <ProtectedRoute>
            <SetupUsernamePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <UsernameSetupRoute>
            <DashboardPage />
          </UsernameSetupRoute>
        } 
      />
      <Route 
        path="/links" 
        element={
          <UsernameSetupRoute>
            <LinksPage />
          </UsernameSetupRoute>
        } 
      />
      <Route 
        path="/links/new" 
        element={
          <UsernameSetupRoute>
            <NewLinkPage />
          </UsernameSetupRoute>
        } 
      />
      <Route 
        path="/links/:id/edit" 
        element={
          <UsernameSetupRoute>
            <EditLinkPage />
          </UsernameSetupRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <UsernameSetupRoute>
            <AnalyticsPage />
          </UsernameSetupRoute>
        } 
      />
      <Route path="/:username/:slug" element={<RedirectPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
