import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import MediaLibraryModal from '../components/MediaLibraryModal';
import api from '../config/api';
import {
    Users, Image, Bell, CheckCircle2,
    ChevronRight, WifiOff, Monitor, Wifi,
    Activity, Zap, ArrowUpRight
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  .db-root {
    height: 100vh;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    background: #f5f6fa;
    font-family: 'Inter', sans-serif;
  }
  .db-root::-webkit-scrollbar { display: none; }

  .db-wrap {
    max-width: 1060px;
    margin: 0 auto;
    padding: 36px 28px 100px;
  }

  /* ── Header ── */
  .db-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 36px;
    flex-wrap: wrap;
    gap: 16px;
  }
  .db-title {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 3px;
  }
  .db-subtitle {
    font-size: 13px;
    color: #9ca3af;
    margin: 0;
  }
  .db-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid;
  }
  .db-badge .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
  }
  .db-badge.ok   { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
  .db-badge.ok .dot { background: #22c55e; }
  .db-badge.warn { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
  .db-badge.warn .dot { background: #ef4444; animation: blink 1.4s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

  /* ── Stats row ── */
  .db-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 22px;
  }
  .stat-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 20px 22px;
    transition: box-shadow .2s, transform .2s;
  }
  .stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.06); transform: translateY(-2px); }
  .stat-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9ca3af;
    margin-bottom: 10px;
  }
  .stat-value {
    font-size: 34px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 8px;
    color: #111827;
  }
  .stat-sub {
    font-size: 12px;
    color: #9ca3af;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .stat-sub.up   { color: #16a34a; }
  .stat-sub.down { color: #dc2626; }

  /* ── Uptime bar ── */
  .bar-wrap {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 18px 22px;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .bar-label { font-size: 12px; font-weight: 600; color: #9ca3af; white-space: nowrap; text-transform: uppercase; letter-spacing: .8px; }
  .bar-track { flex: 1; height: 7px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
  .bar-fill   { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #22c55e, #86efac); transition: width 1s cubic-bezier(.4,0,.2,1); }
  .bar-pct    { font-size: 13px; font-weight: 700; color: #16a34a; white-space: nowrap; }

  /* ── Main cards ── */
  .db-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-bottom: 22px;
  }
  .action-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 26px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: box-shadow .25s, transform .25s, border-color .25s;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 186px;
  }
  .action-card:hover {
    box-shadow: 0 16px 32px rgba(0,0,0,.07);
    transform: translateY(-4px);
    border-color: var(--ac);
  }
  .bg-icon {
    position: absolute;
    bottom: -22px; right: -22px;
    opacity: .04;
    transition: opacity .3s, transform .3s;
  }
  .action-card:hover .bg-icon { opacity: .09; transform: scale(1.08) rotate(-4deg); }
  .icon-wrap {
    width: 42px; height: 42px;
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
  }
  .action-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 5px; }
  .action-desc  { font-size: 13px; color: #6b7280; line-height: 1.5; }
  .action-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 18px;
  }
  .action-link {
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: gap .2s;
    text-decoration: none;
  }
  .action-card:hover .action-link { gap: 7px; }
  .action-chip {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 99px;
  }

  /* ── Quick actions ── */
  .quick-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 26px;
  }
  .quick-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 13px;
    cursor: pointer;
    transition: box-shadow .2s, transform .2s, border-color .2s;
  }
  .quick-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,.05); transform: translateY(-2px); border-color: #d1d5db; }
  .quick-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .quick-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 2px; }
  .quick-hint  { font-size: 11px; color: #9ca3af; }

  /* ── Offline list ── */
  .offline-section { animation: fadeUp .4s ease both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; }
  .offline-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border: 1px solid #f3f4f6;
    border-left: 3px solid #ef4444;
    border-radius: 14px;
    padding: 14px 18px;
    margin-bottom: 10px;
    transition: box-shadow .2s;
    animation: fadeUp .35s ease both;
  }
  .offline-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,.05); }
  .offline-info { display: flex; align-items: center; gap: 13px; }
  .offline-icon-wrap {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #fef2f2;
    display: flex; align-items: center; justify-content: center;
    color: #ef4444;
    flex-shrink: 0;
  }
  .offline-name   { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 2px; }
  .offline-client { font-size: 12px; color: #9ca3af; }
  .review-btn {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: background .2s;
    font-family: 'Inter', sans-serif;
  }
  .review-btn:hover { background: #fee2e2; }

  @media (max-width: 768px) {
    .db-stats { grid-template-columns: 1fr 1fr; }
    .db-main  { grid-template-columns: 1fr; }
    .quick-row { grid-template-columns: 1fr; }
  }
`;

export default function Dashboard() {
    const navigate = useNavigate();
    const initialUser = JSON.parse(localStorage.getItem('user') || '{"role":"super_admin"}');
    const [user, setUser] = useState(initialUser);

    // AQUÍ ESTÁ EL CAMBIO PRINCIPAL:
    const isSuperAdminOrAgent = user.role === 'super_admin' || user.role === 'super_agent';

    const clientSlug = localStorage.getItem('clientSlug');
    const basePath = isSuperAdminOrAgent ? '' : `/${clientSlug}`;

    const [stats, setStats] = useState({ clients: 0, screens: 0, online: 0, offline: 0, media: 0 });
    const [offlineScreens, setOfflineScreens] = useState([]);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [animated, setAnimated] = useState({ clients: 0, screens: 0, online: 0, offline: 0 });

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user'));
        if (u) setUser(u);
        fetchData();
    }, []);

    useEffect(() => {
        ['clients', 'screens', 'online', 'offline'].forEach(key => {
            const target = stats[key] || 0;
            let cur = 0;
            const step = Math.max(1, Math.ceil(target / 20));
            const iv = setInterval(() => {
                cur = Math.min(cur + step, target);
                setAnimated(p => ({ ...p, [key]: cur }));
                if (cur >= target) clearInterval(iv);
            }, 40);
        });
    }, [stats]);

    const fetchData = async () => {
        try {
            const resStats = await api.get('/admin/stats');
            setStats(resStats.data);
            const resScreens = await api.get('/admin/screens');
            if (resScreens.data && Array.isArray(resScreens.data)) {
                setOfflineScreens(resScreens.data.filter(s => s.status !== 'online'));
            }
        } catch (err) {
            console.error('Error cargando dashboard:', err);
        }
    };

    const hasIssues = stats.offline > 0;
    const onlinePct = stats.screens > 0 ? Math.round((stats.online / stats.screens) * 100) : 0;

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <SidebarLayout>
            <style>{css}</style>
            <div className="db-root">
                <div className="db-wrap">

                    {/* Header */}
                    <div className="db-header">
                        <div>
                            <h1 className="db-title">{greeting} </h1>
                            <p className="db-subtitle">
                                {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                        <div className={`db-badge ${hasIssues ? 'warn' : 'ok'}`}>
                            <span className="dot" />
                            {hasIssues ? `${stats.offline} pantallas offline` : 'Todo operativo'}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="db-stats">
                        {isSuperAdminOrAgent && (
                            <div className="stat-card">
                                <div className="stat-label">Clientes</div>
                                <div className="stat-value" style={{ color: '#2563eb' }}>{animated.clients}</div>
                                <div className="stat-sub"><Users size={12} /> registros activos</div>
                            </div>
                        )}
                        <div className="stat-card">
                            <div className="stat-label">Pantallas</div>
                            <div className="stat-value">{animated.screens}</div>
                            <div className="stat-sub"><Monitor size={12} /> desplegadas</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">En línea</div>
                            <div className="stat-value" style={{ color: '#16a34a' }}>{animated.online}</div>
                            <div className="stat-sub up"><Wifi size={12} /> transmitiendo</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Offline</div>
                            <div className="stat-value" style={{ color: hasIssues ? '#dc2626' : '#9ca3af' }}>{animated.offline}</div>
                            <div className={`stat-sub ${hasIssues ? 'down' : ''}`}>
                                <WifiOff size={12} /> {hasIssues ? 'con problemas' : 'sin incidencias'}
                            </div>
                        </div>
                    </div>

                    {/* Uptime bar */}
                    {stats.screens > 0 && (
                        <div className="bar-wrap">
                            <span className="bar-label">Disponibilidad</span>
                            <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${onlinePct}%` }} />
                            </div>
                            <span className="bar-pct">{onlinePct}%</span>
                        </div>
                    )}

                    {/* Main cards */}
                    <div className="db-main">
                        {isSuperAdminOrAgent ? (
                            <div className="action-card" style={{ '--ac': '#bfdbfe' }} onClick={() => navigate('/clients')}>
                                <div>
                                    <div className="icon-wrap" style={{ background: '#eff6ff' }}>
                                        <Users size={20} color="#2563eb" />
                                    </div>
                                    <div className="action-title">Gestión de Clientes</div>
                                    <div className="action-desc">Administra los {stats.clients} clientes registrados, sus pantallas y configuraciones.</div>
                                </div>
                                <div className="action-footer">
                                    <span className="action-link" style={{ color: '#2563eb' }}>Ver todos <ArrowUpRight size={14} /></span>
                                    <span className="action-chip" style={{ background: '#eff6ff', color: '#2563eb' }}>{stats.clients} clientes</span>
                                </div>
                                <Users size={160} className="bg-icon" color="#2563eb" />
                            </div>
                        ) : (
                            <div className="action-card" style={{ '--ac': '#bfdbfe' }} onClick={() => navigate(`${basePath}/clients/${user.client_id}`)}>
                                <div>
                                    <div className="icon-wrap" style={{ background: '#eff6ff' }}>
                                        <Monitor size={20} color="#2563eb" />
                                    </div>
                                    <div className="action-title">Mis Pantallas</div>
                                    <div className="action-desc">Controla el estado y contenido de tus {stats.screens} pantallas activas.</div>
                                </div>
                                <div className="action-footer">
                                    <span className="action-link" style={{ color: '#2563eb' }}>Ver pantallas <ArrowUpRight size={14} /></span>
                                    <span className="action-chip" style={{ background: '#eff6ff', color: '#2563eb' }}>{stats.screens} pantallas</span>
                                </div>
                                <Monitor size={160} className="bg-icon" color="#2563eb" />
                            </div>
                        )}

                        <div className="action-card" style={{ '--ac': '#fde68a' }} onClick={() => setShowMediaModal(true)}>
                            <div>
                                <div className="icon-wrap" style={{ background: '#fffbeb' }}>
                                    <Image size={20} color="#d97706" />
                                </div>
                                <div className="action-title">Biblioteca Multimedia</div>
                                <div className="action-desc">Gestiona imágenes, videos y contenido para tus pantallas digitales.</div>
                            </div>
                            <div className="action-footer">
                                <span className="action-link" style={{ color: '#d97706' }}>Abrir biblioteca <ArrowUpRight size={14} /></span>
                                <span className="action-chip" style={{ background: '#fffbeb', color: '#d97706' }}>{stats.media ?? 0} archivos</span>
                            </div>
                            <Image size={160} className="bg-icon" color="#d97706" />
                        </div>
                    </div>


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