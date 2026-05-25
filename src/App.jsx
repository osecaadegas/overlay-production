import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import OverlayControls from './components/OverlayCenter/OverlayControls';
import OverlayPreviewPage from './components/OverlayPreviewPage';

function AuthGate({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Checking session...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/overlay-center"
        element={
          <AuthGate>
            <OverlayControls />
          </AuthGate>
        }
      />
      <Route path="/premium/overlay-controls" element={<Navigate to="/overlay-center" replace />} />
      <Route path="/premium/overlay" element={<OverlayPreviewPage />} />
      <Route path="/overlay" element={<OverlayPreviewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}