import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVPlayer from './pages/TVPlayer';
import MediaManager from './pages/MediaManager';
import Clients from './pages/Clients';
import UsersPage from './pages/Users';
import ClientDetails from './pages/ClientDetails';

// IMPORTANTE: Asegúrate de haber creado este archivo en src/components/
import SidebarLayout from './components/SidebarLayout'; 

// ==========================================
// 1. GUARDIÁN DE RUTAS PRIVADAS
// ==========================================
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

// ==========================================
// 2. GUARDIÁN DE LOGIN
// ==========================================
const RedirectIfAuthenticated = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* --- 1. LOGIN (Público, pero te saca si ya entraste) --- */}
        <Route path="/" element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        } />

        {/* --- 2. TV PLAYER (TOTALMENTE PÚBLICO) --- */}
        {/* No tiene SidebarLayout (pantalla completa) y No tiene ProtectedRoute */}
        <Route path="/app" element={<TVPlayer />} />


        {/* --- 3. ZONA PRIVADA CON MENÚ (Admin) --- */}
        {/* Aquí usamos SidebarLayout para que aparezca el menú lateral/superior */}
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <SidebarLayout>
              <Dashboard />
            </SidebarLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/media" element={
          <ProtectedRoute>
            <SidebarLayout>
              <MediaManager />
            </SidebarLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/clients" element={
          <ProtectedRoute>
            <SidebarLayout>
              <Clients />
            </SidebarLayout>
          </ProtectedRoute>
        } />

        <Route path="/clients/:id" element={
          <ProtectedRoute>
            <SidebarLayout>
              <ClientDetails />
            </SidebarLayout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <SidebarLayout>
              <UsersPage />
            </SidebarLayout>
          </ProtectedRoute>
        } />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;