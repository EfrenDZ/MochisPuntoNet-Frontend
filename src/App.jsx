import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVPlayer from './pages/TVPlayer';
import MediaManager from './pages/MediaManager'; // <--- 1. Importar
import Clients from './pages/Clients';
import UsersPage from './pages/Users';
import ClientDetails from './pages/ClientDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 2. Nueva ruta protegida */}
        <Route path="/media" element={<MediaManager />} />
        
        <Route path="/app" element={<TVPlayer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/clients/:id" element={<ClientDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;