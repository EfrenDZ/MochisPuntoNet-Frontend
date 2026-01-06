import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Tv, Image, LogOut } from 'lucide-react';

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Users size={20} />, label: 'Clientes', path: '/clients' },
    // { icon: <Tv size={20} />, label: 'Pantallas', path: '/screens' }, // Próximamente
    // { icon: <Image size={20} />, label: 'Multimedia', path: '/media' }, // Próximamente
    // En tu lista de menuItems, agrega:
{ icon: <Users size={20} />, label: 'Equipo', path: '/users' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: '"Inter", sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', backgroundColor: '#3b82f6', borderRadius: '8px' }}></div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Mochis.Net</h2>
        </div>

        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div 
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  borderRadius: '8px', cursor: 'pointer', marginBottom: '5px',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#3b82f6' : '#4b5563',
                  fontWeight: isActive ? '600' : '400'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div 
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', color: '#ef4444' }}
        >
          <LogOut size={20} />
          <span>Salir</span>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}