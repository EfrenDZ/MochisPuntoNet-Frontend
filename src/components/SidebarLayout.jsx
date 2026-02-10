import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// 1. Agregamos 'Briefcase' para usarlo en Clientes
import { LayoutDashboard, Users, LogOut, Menu, X, Briefcase } from 'lucide-react';

import logoMochis from '../assets/mochis_punto_net_logo.png';

// ==========================================
// ESTILOS CSS
// ==========================================
const STYLES = `
  .layout-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #f9fafb;
    font-family: 'Inter', sans-serif;
  }

  .top-header {
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    height: 64px;
    
    /* Necesario para que el menú centrado se posicione respecto a este header */
    position: sticky; 
    top: 0;
    z-index: 50;

    display: flex;
    align-items: center;
    justify-content: space-between; /* Separa Logo (izq) y Logout (der) */
    padding: 0 40px;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    z-index: 20; /* Aseguramos que el logo quede por encima si la pantalla se achica mucho */
  }

  /* --- NAVEGACIÓN DESKTOP CENTRADA --- */
  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    
    /* TRUCO PARA CENTRADO PERFECTO */
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .desktop-actions {
    display: flex;
    align-items: center;
    z-index: 20; /* Aseguramos que el botón salir quede accesible */
  }

  .mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    color: #374151;
    padding: 8px;
    z-index: 20;
  }

  .mobile-menu-dropdown {
    display: none;
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

  .main-content {
    flex: 1;
    padding: 32px 40px;
    max-width: 1280px;
    width: 100%;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .top-header { padding: 0 20px; }
    
    /* En móvil ocultamos el menú centrado y las acciones de escritorio */
    .desktop-nav, .desktop-actions { display: none; }
    .mobile-menu-btn { display: block; }
    .main-content { padding: 20px; }
    
    .nav-item {
      padding: 12px 16px;
      border-radius: 8px;
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
// COMPONENTE REACT
// ==========================================

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 2. Definimos los iconos diferentes aquí
  const menuItems = [
    { 
      icon: <LayoutDashboard size={18} />, 
      label: 'Dashboard', 
      path: '/dashboard' 
    },
    { 
      icon: <Briefcase size={18} />, // Icono de Maletín para Clientes
      label: 'Clientes', 
      path: '/clients' 
    },
    { 
      icon: <Users size={18} />,     // Icono de Usuarios para Equipo
      label: 'Equipo', 
      path: '/users' 
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="layout-container">
      <style>{STYLES}</style>

      <header className="top-header">
        
        {/* LOGO */}
        <div className="logo-area" onClick={() => navigate('/dashboard')}>
           <img 
             src={logoMochis} 
             alt="Mochis.Net Logo" 
             style={{ height: '40px', objectFit: 'contain' }} 
           />
        </div>

        {/* NAVEGACIÓN ESCRITORIO (CENTRADA ABSOLUTAMENTE) */}
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

        {/* LOGOUT */}
        <div className="desktop-actions">
          <div className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Salir</span>
          </div>
        </div>

        {/* MÓVIL */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* MENÚ MÓVIL */}
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

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}