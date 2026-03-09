import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../config/api'; // Asegúrate de que esta ruta sea correcta
import {
  LayoutDashboard, Users, LogOut, Menu, X, Briefcase, Monitor, Image, ChevronDown, User as UserIcon, Key, CheckCircle
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

  /* --- MODAL CAMBIO DE CONTRASEÑA --- */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content-box {
    background: #ffffff;
    padding: 24px;
    border-radius: 12px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-group {
    margin-bottom: 16px;
  }

  .input-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }

  .modal-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    color: #111827;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .modal-input:focus {
    border-color: #3b82f6;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }

  .btn-cancel {
    background: #f3f4f6;
    color: #4b5563;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-cancel:hover {
    background: #e5e7eb;
  }

  .btn-save {
    color: #ffffff;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-save:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  .btn-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .msg-error {
    background: #fef2f2;
    color: #dc2626;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .msg-success {
    background: #f0fdf4;
    color: #166534;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
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

  // ESTADOS DEL MODAL DE CONTRASEÑA
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  const userMenuRef = useRef(null);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userConfig = userData.clientConfig || {};
  const primaryColor = userConfig.primary_color || '#3b82f6';
  const logo = userConfig.logo_url ? getMediaUrl(userConfig.logo_url) : logoMochis;
  const user = userData;
  const clientSlug = localStorage.getItem('clientSlug');
  const basePath = (user?.role === 'super_admin' || user?.role === 'super_agent') ? '' : `/${clientSlug}`;

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';

  const DYNAMIC_STYLES = `
    .nav-item.active {
      background-color: ${primaryColor}1a; 
      color: ${primaryColor};
      font-weight: 600;
    }
    .btn-save {
      background-color: ${primaryColor};
    }
  `;

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
    menuItems.push({ icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: `${basePath}/dashboard` });
    menuItems.push({ icon: <Briefcase size={18} />, label: 'Clientes', path: '/clients' });
  } else if (user?.client_id) {
    menuItems.push({ icon: <Monitor size={18} />, label: 'Pantallas', path: `${basePath}/tvs` });
    menuItems.push({ icon: <Image size={18} />, label: 'Biblioteca', path: `${basePath}/media` });
  }

  if (user?.role !== 'super_agent' && user?.role !== 'client_agent') {
    menuItems.push({ icon: <Users size={18} />, label: 'Equipo', path: `${basePath}/users` });
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

  const openPasswordModal = () => {
    setModalError('');
    setModalSuccess(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  // ==========================================
  // FUNCIÓN PARA ACTUALIZAR CONTRASEÑA
  // ==========================================
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess(false);

    // Validaciones básicas de front-end
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setModalError('Las contraseñas nuevas no coinciden.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setModalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Llamada al backend. Ajusta la ruta '/auth/change-password' si tu API la tiene en otro lado
      // Dependiendo de tu backend, puede requerir el ID del usuario, o tomarlo del token JWT actual
      await api.put(`/admin/users/${user.id}`, {
        // Asumiendo que tu endpoint de edición de usuario acepta esto
        password: passwordData.newPassword,
        current_password: passwordData.currentPassword
      });

      setModalSuccess(true);

      // Cerrar el modal después de un ratito para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        setIsPasswordModalOpen(false);
      }, 2000);

    } catch (error) {
      setModalError(error.response?.data?.error || 'Ocurrió un error al cambiar la contraseña. Verifica tu contraseña actual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="layout-container">
      <style>{STYLES}</style>
      <style>{DYNAMIC_STYLES}</style>

      <header className="top-header">
        <div className="logo-area" onClick={() => navigate(`${basePath}/dashboard`)}>
          <img src={logo} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>

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

        <div className="desktop-actions">
          <div className="user-menu-container" ref={userMenuRef}>
            <div className="user-menu-btn" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
              <UserIcon size={18} />
              <span>{displayName}</span>
              <ChevronDown size={16} />
            </div>

            {isUserMenuOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-item" onClick={openPasswordModal}>
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

        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

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

        <div className="nav-item" onClick={openPasswordModal}>
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

      {/* ============================== */}
      {/* MODAL PARA CAMBIAR CONTRASEÑA  */}
      {/* ============================== */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <Key size={20} color={primaryColor} />
              Cambiar Contraseña
            </h2>

            {modalError && <div className="msg-error">{modalError}</div>}

            {modalSuccess ? (
              <div className="msg-success">
                <CheckCircle size={18} />
                Contraseña actualizada con éxito.
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit}>
                {/* Opcional: Si tu API requiere la contraseña actual, descomenta este bloque.
                  Si tu API solo necesita la nueva contraseña porque ya estás autenticado con JWT, 
                  puedes borrarlo.
                */}
                <div className="input-group">
                  <label className="input-label">Contraseña actual</label>
                  <input
                    type="password"
                    className="modal-input"
                    placeholder="Ingresa tu contraseña actual"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Nueva contraseña</label>
                  <input
                    type="password"
                    className="modal-input"
                    placeholder="Ingresa la nueva contraseña"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    className="modal-input"
                    placeholder="Repite la nueva contraseña"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsPasswordModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save" disabled={isSubmitting}>
                    {isSubmitting ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}