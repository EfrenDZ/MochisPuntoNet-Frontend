import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
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
const ProtectedRoute = ({ children, requireSuperAdmin = false }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const savedSlug = localStorage.getItem('clientSlug');
  const { clientSlug } = useParams();

  if (!token || token === 'undefined' || token === 'null') {
    return <Navigate to={clientSlug ? `/${clientSlug}/login` : "/admin"} replace />;
  }

  // Si eres cliente pero perdiste tu slug de memoria, tu sesión está corrupta.
  if (role !== 'super_admin' && role !== 'super_agent' && !savedSlug) {
    localStorage.clear();
    return <Navigate to="/admin" replace />;
  }

  if (requireSuperAdmin && role !== 'super_admin' && role !== 'super_agent') {
    return <Navigate to={`/${savedSlug}/dashboard`} replace />;
  }

  // Opcional: Si es super_admin no lo dejamos patullar en rutas de cliente (Aislamiento total)
  if (!requireSuperAdmin && clientSlug && (role === 'super_admin' || role === 'super_agent')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ==========================================
// 2. SI YA TIENES TOKEN -> AL DASHBOARD
// ==========================================
const RedirectIfAuthenticated = ({ children, requireSuperAdmin = false }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const savedSlug = localStorage.getItem('clientSlug');

  if (token && token !== 'undefined' && token !== 'null') {
    // Si eres cliente pero perdiste tu slug de memoria (sesión vieja), limpiar.
    if (role !== 'super_admin' && role !== 'super_agent' && !savedSlug) {
      localStorage.clear();
      return <Navigate to="/admin" replace />;
    }

    if (role === 'super_admin' || role === 'super_agent') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to={`/${savedSlug}/media`} replace />;
    }
  }
  return children;
};

// ==========================================
// 3. RUTADOR PRINCIPAL DE CLIENTE (/:clientSlug)
// ==========================================
const NavigateToClientRoot = () => {
  const token = localStorage.getItem('token');
  const { clientSlug } = useParams();

  if (token && token !== 'undefined' && token !== 'null') {
    return <Navigate to={`/${clientSlug}/media`} replace />;
  }
  return <Navigate to={`/${clientSlug}/login`} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* --- RUTA PÚBLICA PRINCIPAL (TV) --- */}
        <Route path="/" element={<TVPlayer />} />

        {/* ADMIN LOGIN */}
        <Route path="/admin" element={
          <RedirectIfAuthenticated requireSuperAdmin={true}>
            <Login isAdmin={true} />
          </RedirectIfAuthenticated>
        } />

        <Route path="/:clientSlug/login" element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        } />

        {/* --- CLIENT ROOT REDIRECT --- */}
        <Route path="/:clientSlug" element={<NavigateToClientRoot />} />

        {/* --- RUTAS PRIVADAS SUPER ADMIN --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute requireSuperAdmin={true}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/media" element={
          <ProtectedRoute requireSuperAdmin={true}><MediaManager /></ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute requireSuperAdmin={true}><Clients /></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute requireSuperAdmin={true}><UsersPage /></ProtectedRoute>
        } />
        <Route path="/clients/:id" element={
          <ProtectedRoute requireSuperAdmin={true}><ClientDetails /></ProtectedRoute>
        } />

        {/* --- RUTAS PRIVADAS CLIENTES (Anidadas por slug) --- */}
        {/* Dashboard removido para clientes, redirige a media si intentan entrar */}
        <Route path="/:clientSlug/dashboard" element={
          <Navigate to="../media" replace />
        } />
        <Route path="/:clientSlug/media" element={
          <ProtectedRoute><MediaManager /></ProtectedRoute>
        } />
        <Route path="/:clientSlug/users" element={
          <ProtectedRoute><UsersPage /></ProtectedRoute>
        } />
        <Route path="/:clientSlug/tvs" element={
          <ProtectedRoute><ClientDetails /></ProtectedRoute>
        } />

        {/* --- RUTA PÚBLICA (ANTIGUA TV - Mantenida por retrocompatibilidad) --- */}
        <Route path="/app" element={<TVPlayer />} />

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;