import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVPlayer from './pages/TVPlayer';
import MediaManager from './pages/MediaManager';
import Clients from './pages/Clients';
import UsersPage from './pages/Users';
import ClientDetails from './pages/ClientDetails';

// ==========================================
// 1. GUARDIÁN DE RUTAS PRIVADAS
// (Si no hay token, te manda al Login)
// ==========================================
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Si no hay token, redirigir al inicio (Login)
    return <Navigate to="/" replace />;
  }

  // Si hay token, renderizar el componente hijo (la página)
  return children;
};

// ==========================================
// 2. GUARDIÁN DE LOGIN
// (Si YA tienes token, te manda al Dashboard automáticamente)
// ==========================================
const RedirectIfAuthenticated = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    // Si ya hay sesión, no dejar entrar al login, mandar al dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* RUTA PÚBLICA (LOGIN) CON REDIRECCIÓN AUTOMÁTICA */}
        <Route path="/" element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        } />

        {/* RUTAS PROTEGIDAS (ADMINISTRACIÓN) */}
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

        <Route path="/clients/:id" element={
          <ProtectedRoute>
            <ClientDetails />
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        } />

        {/* NOTA: El TVPlayer a veces necesita ser público si es para pantallas solas.
            Si quieres que sea privado, déjalo dentro de ProtectedRoute.
            Si quieres que sea público, quítale el wrapper. */}
        <Route path="/app" element={
          <ProtectedRoute>
            <TVPlayer />
          </ProtectedRoute>
        } />

        {/* CATCH-ALL: Cualquier ruta desconocida te manda al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;