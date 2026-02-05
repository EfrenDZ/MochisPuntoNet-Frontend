import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react';

// ==========================================
// 1. ESTILOS CSS RESPONSIVE
// ==========================================
const STYLES = `
  /* --- BASE DE LA PAGINA --- */
  .layout-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #f9fafb;
    font-family: 'Inter', sans-serif;
  }

  /* --- HEADER --- */
  .top-header {
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    height: 64px;
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px; /* Padding de escritorio */
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* --- NAVEGACIÓN DESKTOP --- */
  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .desktop-actions {
    display: flex;
    align-items: center;
  }

  /* --- BOTÓN HAMBURGUESA (MÓVIL) --- */
  .mobile-menu-btn {
    display: none; /* Oculto en escritorio */
    background: none;
    border: none;
    cursor: pointer;
    color: #374151;
    padding: 8px;
  }

  /* --- MENÚ MÓVIL DESPLEGABLE --- */
  .mobile-menu-dropdown {
    display: none; /* Oculto por defecto */
    flex-direction: column;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 10px 20px 20px 20px;
    position: fixed;
    top: 64px;
    left: 0;
    width: 100%;
    z-index: 49;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .mobile-menu-dropdown.open {
    display: flex;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* --- ITEMS DEL MENÚ --- */
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    color: #6b7280;
  }
  
  .nav-item:hover {
    background-color: #f3f4f6;
    color: #111827;
  }

  .nav-item.active {
    background-color: #eff6ff;
    color: #3b82f6;
    font-weight: 600;
  }

  /* Logout button style */
  .logout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #ef4444;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 20px;
  }
  .logout-btn:hover {
    background-color: #fef2f2;
  }

  /* --- CONTENIDO PRINCIPAL --- */
  .main-content {
    flex: 1;
    padding: 32px 40px;
    max-width: 1280px;
    width: 100%;
    margin: 0 auto;
  }

  /* =========================================
     RESPONSIVE QUERY (CELULARES Y TABLETS)
     ========================================= */
  @media (max-width: 768px) {
    .top-header {
      padding: 0 20px; /* Menos padding en móvil */
    }
    
    .desktop-nav, .desktop-actions {
      display: none; /* Ocultar menú normal */
    }

    .mobile-menu-btn {
      display: block; /* Mostrar botón hamburguesa */
    }

    .main-content {
      padding: 20px; /* Menos padding en contenido */
    }
    
    /* Ajustes para items en móvil */
    .nav-item {
      padding: 12px 16px; /* Más área de toque */
      border-radius: 8px; /* Menos redondeado en lista vertical */
      margin-bottom: 5px;
    }
    
    .logout-btn {
      margin-top: 10px;
      border-top: 1px solid #f3f4f6;
      border-radius: 8px;
      padding: 12px 16px;
    }
  }
`;

// ==========================================
// 2. COMPONENTE REACT
// ==========================================

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Users size={18} />, label: 'Clientes', path: '/clients' },
    { icon: <Users size={18} />, label: 'Equipo', path: '/users' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Cerrar menú al navegar en móvil
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="layout-container">
      <style>{STYLES}</style>

      {/* HEADER FIJO */}
      <header className="top-header">
        
        {/* LOGO */}
        <div className="logo-area">
          <div style={{ width: '28px', height: '28px', backgroundColor: '#3b82f6', borderRadius: '6px' }}></div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Mochis.Net</h2>
        </div>

        {/* NAVEGACIÓN ESCRITORIO (Se oculta en móvil via CSS) */}
        <nav className="desktop-nav">
          {menuItems.map((item) => (
            <div 
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* LOGOUT ESCRITORIO */}
        <div className="desktop-actions">
          <div className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Salir</span>
          </div>
        </div>

        {/* BOTÓN HAMBURGUESA (Solo visible en móvil) */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      <div className={`mobile-menu-dropdown ${isMobileMenuOpen ? 'open' : ''}`}>
        {menuItems.map((item) => (
          <div 
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
        <div className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}