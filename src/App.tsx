import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { AuthProvider, useAuth as useAppAuth } from './contexts/AuthContext';
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
import { SettingsPage } from './pages/SettingsPage';
import { PlacementsPage } from './pages/PlacementsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAppAuth();
  
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
  const { user, loading } = useAppAuth();
  
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
      <Route 
        path="/login" 
        element={
          <SignedOut>
            <LoginPage />
          </SignedOut>
        } 
      />
      <Route 
        path="/login" 
        element={
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <SignedOut>
            <SignupPage />
          </SignedOut>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
        } 
      />
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
      <Route 
        path="/settings" 
        element={
          <UsernameSetupRoute>
            <SettingsPage />
          </UsernameSetupRoute>
        } 
      />
      <Route 
        path="/links/:linkId/placements" 
        element={
          <UsernameSetupRoute>
            <PlacementsPage />
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
