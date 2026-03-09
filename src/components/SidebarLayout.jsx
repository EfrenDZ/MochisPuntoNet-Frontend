import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, LogOut, Menu, X, Briefcase, Monitor, Image, ChevronDown, User as UserIcon, Key
} from 'lucide-react';
import { getMediaUrl } from '../utils/getMediaUrl';
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
    position: sticky; 
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    z-index: 20;
  }

  /* --- NAVEGACIÓN DESKTOP CENTRADA --- */
  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .desktop-actions {
    display: flex;
    align-items: center;
    z-index: 20;
  }

  /* --- MENÚ DE USUARIO DESKTOP --- */
  .user-menu-container {
    position: relative;
  }

  .user-menu-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 20px;
    transition: background-color 0.2s;
  }

  .user-menu-btn:hover {
    background-color: #f3f4f6;
  }

  .user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    display: flex;
    flex-direction: column;
    padding: 8px 0;
    z-index: 50;
  }

  .user-dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
    transition: background 0.2s;
  }

  .user-dropdown-item:hover {
    background-color: #f3f4f6;
  }

  .user-dropdown-item.danger {
    color: #ef4444;
  }

  .user-dropdown-item.danger:hover {
    background-color: #fef2f2;
  }

  /* --- MÓVIL --- */
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

  .mobile-divider {
    height: 1px;
    background-color: #e5e7eb;
    margin: 10px 0;
  }

  .logout-btn-mobile {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    color: #ef4444;
    font-size: 14px;
    font-weight: 500;
    padding: 12px 16px;
    border-radius: 8px;
    margin-top: 5px;
  }
  .logout-btn-mobile:hover {
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
    .desktop-nav, .desktop-actions { display: none; }
    .mobile-menu-btn { display: block; }
    .main-content { padding: 20px; }
    .nav-item {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 5px;
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userConfig = userData.clientConfig || {};
  const primaryColor = userConfig.primary_color || '#3b82f6';
  const logo = userConfig.logo_url ? getMediaUrl(userConfig.logo_url) : logoMochis;
  const user = userData;
  const clientSlug = localStorage.getItem('clientSlug');
  const basePath = (user?.role === 'super_admin' || user?.role === 'super_agent') ? '' : `/${clientSlug}`;

  // Obtenemos el nombre a mostrar (usamos nombre, email o un genérico)
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';

  const DYNAMIC_STYLES = `
    .nav-item.active {
      background-color: ${primaryColor}1a; 
      color: ${primaryColor};
      font-weight: 600;
    }
  `;

  // Cierra el menú de usuario si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [];

  if (user?.role === 'super_admin' || user?.role === 'super_agent') {
    menuItems.push({
      icon: <LayoutDashboard size={18} />,
      label: 'Dashboard',
      path: `${basePath}/dashboard`
    });
    menuItems.push({
      icon: <Briefcase size={18} />,
      label: 'Clientes',
      path: '/clients'
    });
  } else if (user?.client_id) {
    menuItems.push({
      icon: <Monitor size={18} />,
      label: 'Pantallas',
      path: `${basePath}/tvs`
    });
    menuItems.push({
      icon: <Image size={18} />,
      label: 'Biblioteca',
      path: `${basePath}/media`
    });
  }

  if (user?.role !== 'super_agent' && user?.role !== 'client_agent') {
    menuItems.push({
      icon: <Users size={18} />,
      label: 'Equipo',
      path: `${basePath}/users`
    });
  }

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    const slug = localStorage.getItem('clientSlug');
    localStorage.clear();
    navigate(slug ? `/${slug}/login` : '/admin');
  };

  return (
    <div className="layout-container">
      <style>{STYLES}</style>
      <style>{DYNAMIC_STYLES}</style>

      <header className="top-header">
        {/* LOGO */}
        <div className="logo-area" onClick={() => navigate(`${basePath}/dashboard`)}>
          <img
            src={logo}
            alt="Logo"
            style={{ height: '40px', objectFit: 'contain' }}
          />
        </div>

        {/* NAVEGACIÓN ESCRITORIO */}
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

        {/* ACCIONES ESCRITORIO (MENÚ USUARIO) */}
        <div className="desktop-actions">
          <div className="user-menu-container" ref={userMenuRef}>
            <div
              className="user-menu-btn"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <UserIcon size={18} />
              <span>{displayName}</span>
              <ChevronDown size={16} />
            </div>

            {/* DROPDOWN USUARIO */}
            {isUserMenuOpen && (
              <div className="user-dropdown">
                <div
                  className="user-dropdown-item"
                  onClick={() => handleNavigation(`${basePath}/change-password`)}
                >
                  <Key size={16} />
                  <span>Cambiar contraseña</span>
                </div>
                <div className="user-dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </div>
              </div>
            )}
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

      {/* MENÚ MÓVIL DESPLEGABLE */}
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

        <div className="mobile-divider"></div>

        <div
          className="nav-item"
          onClick={() => handleNavigation(`${basePath}/change-password`)}
        >
          <Key size={18} />
          <span>Cambiar contraseña</span>
        </div>
        <div className="logout-btn-mobile" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </div>
      </div>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}