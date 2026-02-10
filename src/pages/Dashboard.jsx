import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import MediaLibraryModal from '../components/MediaLibraryModal';
import api from '../config/api';
import { 
    Users, Image, Bell, CheckCircle2, 
    ChevronRight, WifiOff
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ full_name: 'Admin' });
  
  const [stats, setStats] = useState({ clients: 0, screens: 0, online: 0, offline: 0 });
  const [offlineScreens, setOfflineScreens] = useState([]); 
  const [showMediaModal, setShowMediaModal] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (u) setUser(u);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resStats = await api.get('/admin/stats');
      setStats(resStats.data);
      
      const resScreens = await api.get('/admin/screens'); 
      
      if (resScreens.data && Array.isArray(resScreens.data)) {
          const list = resScreens.data.filter(s => s.status !== 'online');
          setOfflineScreens(list);
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  const hasIssues = stats.offline > 0;

  return (
    <SidebarLayout>
      <style>{`
        /* --- NUEVO: Wrapper para el scroll invisible --- */
        .scroll-wrapper {
            height: 100vh; /* Ocupa toda la altura */
            overflow-y: auto; /* Habilita el scroll vertical */
            
            /* Ocultar scrollbar en Firefox */
            scrollbar-width: none; 
            
            /* Ocultar scrollbar en IE y Edge */
            -ms-overflow-style: none; 
        }
        
        /* Ocultar scrollbar en Chrome, Safari y Opera */
        .scroll-wrapper::-webkit-scrollbar {
            display: none;
        }
        /* --------------------------------------------- */

        .dash-container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Inter', sans-serif; padding-bottom: 80px; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; flex-wrap: wrap; gap: 15px; }
        .greeting-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
        .greeting-sub { color: #6b7280; margin-top: 4px; font-size: 14px; }
        
        .status-pill { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 600; transition: all 0.3s ease; }
        .status-ok { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
        .status-warn { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
        
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
        .hero-card {
            background: white; border-radius: 20px; padding: 30px; border: 1px solid #f3f4f6;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); cursor: pointer; position: relative; overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; justify-content: space-between; height: 160px;
        }
        .hero-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08); border-color: #e5e7eb; }
        .hero-icon-bg { position: absolute; top: -20px; right: -20px; opacity: 0.05; transform: rotate(15deg); }
        .hero-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
        .hero-desc { font-size: 14px; color: #6b7280; }
        .hero-arrow { width: 36px; height: 36px; border-radius: 50%; background: #f9fafb; display: flex; align-items: center; justifyContent: center; color: #374151; transition: 0.2s; align-self: flex-start; margin-top: 20px; }
        .hero-card:hover .hero-arrow { background: #111827; color: white; }
        
        .alerts-section { animation: fadeIn 0.5s ease; }
        .section-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 15px; display: block; }
        .alert-item {
            display: flex; align-items: center; justify-content: space-between; background: white; padding: 16px 20px;
            border-radius: 12px; border: 1px solid #f3f4f6; border-left: 4px solid #ef4444; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        
        @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Envolvemos todo el contenido en el div scroll-wrapper */}
      <div className="scroll-wrapper">
          <div className="dash-container">
            
            {/* HEADER */}
            <div className="dash-header">
                {/* Puedes poner un saludo aquí si quieres, o dejarlo vacío como estaba */}
                
                <div className={`status-pill ${hasIssues ? 'status-warn' : 'status-ok'}`}>
                    {hasIssues ? (
                        <><Bell size={16} /> {stats.offline} Pantallas Offline</>
                    ) : (
                        <><CheckCircle2 size={16} /> Todo operativo</>
                    )}
                </div>
            </div>

            {/* HERO CARDS */}
            <div className="hero-grid">
                <div className="hero-card" onClick={() => navigate('/clients')}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ padding: '10px', background: '#eff6ff', width: 'fit-content', borderRadius: '10px', color: '#2563eb', marginBottom: '15px' }}>
                            <Users size={24} />
                        </div>
                        <div className="hero-title">Clientes</div>
                        <div className="hero-desc">Clientes: {stats.clients}</div>
                    </div>
                    <Users size={180} className="hero-icon-bg" color="#2563eb" />
                    <div className="hero-arrow"><ChevronRight size={20} /></div>
                </div>

                <div className="hero-card" onClick={() => setShowMediaModal(true)}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ padding: '10px', background: '#fffbeb', width: 'fit-content', borderRadius: '10px', color: '#d97706', marginBottom: '15px' }}>
                            <Image size={24} />
                        </div>
                        <div className="hero-title">Biblioteca Multimedia</div>
                        <div className="hero-desc">Archivos en la nube: {stats.media}</div>
                    </div>
                    <Image size={180} className="hero-icon-bg" color="#d97706" />
                    <div className="hero-arrow"><ChevronRight size={20} /></div>
                </div>
            </div>

            {/* LISTA DE PANTALLAS CON PROBLEMAS */}
            {hasIssues && offlineScreens.length > 0 && (
                <div className="alerts-section">
                    <span className="section-label">TVs sin conexión ({offlineScreens.length})</span>
                    {offlineScreens.map(screen => (
                        <div key={screen.id} className="alert-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '8px', background: '#fee2e2', borderRadius: '50%', color: '#991b1b' }}>
                                    <WifiOff size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                        {screen.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {screen.client_name || 'Sin asignar'}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate('/clients')}
                                style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                            >
                                Revisar
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>
      </div>

      <MediaLibraryModal 
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        clientId={null}
      />
    </SidebarLayout>
  );
}