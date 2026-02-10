import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVPlayer from './pages/TVPlayer';
import MediaManager from './pages/MediaManager';
import Clients from './pages/Clients';
import UsersPage from './pages/Users';
import ClientDetails from './pages/ClientDetails';

// ==========================================
// 1. SI NO TIENES TOKEN -> AL LOGIN
// ==========================================
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// ==========================================
// 2. SI YA TIENES TOKEN -> AL DASHBOARD
// ==========================================
const RedirectIfAuthenticated = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* LOGIN: Usamos el guardia para que no puedas entrar si ya tienes sesión */}
        <Route path="/" element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        } />

        {/* --- RUTAS PRIVADAS (Solo agregué el envoltorio ProtectedRoute) --- */}
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/media" element={
          <ProtectedRoute>
            <MediaManager />
          </ProtectedRoute>
        } />
        
        <Route path="/clients" element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        } />

        <Route path="/clients/:id" element={
          <ProtectedRoute>
            <ClientDetails />
          </ProtectedRoute>
        } />

        {/* --- RUTA PÚBLICA (TV) --- */}
        {/* Esta la dejé EXACTAMENTE igual, sin protección */}
        <Route path="/app" element={<TVPlayer />} />

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;