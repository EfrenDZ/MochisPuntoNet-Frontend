import { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';
import { Users, Tv, Image, Activity, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, screens: 0, media: 0, online: 0, offline: 0 });
  const [user, setUser] = useState({});

  // Estados para vincular TV (Acción Rápida)
  const [code, setCode] = useState('');
  const [screenName, setScreenName] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    setUser(u || {});
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePairing = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/pair', { pairingCode: code, screenName });
      alert('✅ ¡Pantalla vinculada!');
      setCode('');
      setScreenName('');
      fetchStats(); // Actualizar números
    } catch (error) {
      alert('❌ Error al vincular');
    }
  };

  return (
    <SidebarLayout>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>Panel de Control</h1>
        <p style={{ color: '#6b7280', marginTop: '5px' }}>Bienvenido de nuevo, {user.full_name}</p>
      </div>

      {/* --- GRID DE ESTADÍSTICAS --- */}
      <div style={gridContainer}>
        <StatCard title="Clientes Totales" value={stats.clients} icon={<Users size={24} color="#4f46e5" />} bg="#e0e7ff" />
        <StatCard title="Pantallas Activas" value={stats.online} icon={<Wifi size={24} color="#16a34a" />} bg="#dcfce7" />
        <StatCard title="Pantallas Offline" value={stats.offline} icon={<WifiOff size={24} color="#ef4444" />} bg="#fee2e2" />
        <StatCard title="Archivos en Nube" value={stats.media} icon={<Image size={24} color="#f59e0b" />} bg="#fef3c7" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '30px' }}>
        
        {/* --- ACCIÓN RÁPIDA: VINCULAR --- */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#eff6ff' }}><Tv size={20} color="#3b82f6"/></div>
            <h3 style={{ margin: 0 }}>Vincular Pantalla Rápida</h3>
          </div>
          
          <form onSubmit={handlePairing} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                    type="text" placeholder="Código (Ej: 4821)" 
                    value={code} onChange={e => setCode(e.target.value)}
                    maxLength={4} required style={inputStyle}
                />
                <input 
                    type="text" placeholder="Nombre (Ej: Recepción)" 
                    value={screenName} onChange={e => setScreenName(e.target.value)}
                    required style={{ ...inputStyle, flex: 1 }}
                />
            </div>
            <button type="submit" style={btnPrimary}>Vincular Ahora</button>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0 0' }}>
              * Esta pantalla se asignará al Cliente "Agencia" por defecto.
            </p>
          </form>
        </div>

        {/* --- RESUMEN DE ACTIVIDAD --- */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#f3e8ff' }}><Activity size={20} color="#9333ea"/></div>
            <h3 style={{ margin: 0 }}>Estado del Sistema</h3>
          </div>
          
          <div style={statusRow}>
            <span style={dotGreen}></span>
            <span>Servidor API</span>
            <span style={{ marginLeft: 'auto', color: '#16a34a', fontWeight: 'bold' }}>Online</span>
          </div>
          <div style={statusRow}>
            <span style={dotGreen}></span>
            <span>Base de Datos</span>
            <span style={{ marginLeft: 'auto', color: '#16a34a', fontWeight: 'bold' }}>Conectada</span>
          </div>
          <div style={statusRow}>
            <span style={dotGreen}></span>
            <span>Cloudinary CDN</span>
            <span style={{ marginLeft: 'auto', color: '#16a34a', fontWeight: 'bold' }}>Activo</span>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
}

// Componente Pequeño para las Tarjetas
function StatCard({ title, value, icon, bg }) {
  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{title}</p>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{value}</h2>
      </div>
    </div>
  );
}

// Estilos
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' };
const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' };
const btnPrimary = { padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' };
const statusRow = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' };
const dotGreen = { width: '8px', height: '8px', backgroundColor: '#16a34a', borderRadius: '50%' };