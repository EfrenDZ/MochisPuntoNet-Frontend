import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVPlayer from './pages/TVPlayer';
import MediaManager from './pages/MediaManager';
import Clients from './pages/Clients';
import UsersPage from './pages/Users';
import ClientDetails from './pages/ClientDetails';
import MainLayout from './components/MainLayout'; // Asumo que tienes este layout

// 1. GUARDIÁN DE RUTAS PRIVADAS (Solo con Token)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// 2. GUARDIÁN DE LOGIN (Si ya tienes token, no entras aquí)
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
        
        {/* --- ZONA PÚBLICA (LOGIN) --- */}
        <Route path="/" element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        } />

        {/* --- ZONA PÚBLICA (TV PLAYER) --- */}
        {/* ¡IMPORTANTE! Esta ruta va FUERA de ProtectedRoute */}
        {/* Así la TV puede entrar sin iniciar sesión */}
        <Route path="/app" element={<TVPlayer />} />


        {/* --- ZONA PRIVADA (ADMINISTRACIÓN) --- */}
        {/* Todo lo de aquí abajo requiere Login */}
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/media" element={
          <ProtectedRoute>
            <MainLayout>
              <MediaManager />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/clients" element={
          <ProtectedRoute>
            <MainLayout>
              <Clients />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/clients/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <ClientDetails />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <MainLayout>
              <UsersPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Cualquier ruta desconocida manda al Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;