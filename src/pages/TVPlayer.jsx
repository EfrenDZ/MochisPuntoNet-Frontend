import { useState, useEffect, useRef } from 'react';
import api from '../config/api';
import { WifiOff, CloudOff, Loader, Maximize, AlertCircle } from 'lucide-react';

export default function TVPlayer() {
    const [status, setStatus] = useState('loading'); // loading, pairing, playing, offline, empty
    const [pairingCode, setPairingCode] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    // --- DATOS ---
    const [activePlaylist, setActivePlaylist] = useState([]);
    const [pendingPlaylist, setPendingPlaylist] = useState(null);
    const [playlistHash, setPlaylistHash] = useState('');

    // --- TRANSICIONES ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(null); 
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // --- ESTADO DE INTERACCIÓN (EL FIX IMPORTANTE) ---
    const [hasInteracted, setHasInteracted] = useState(false);

    // Refs
    const timerRef = useRef(null);
    const pollRef = useRef(null);
    const updateIntervalRef = useRef(null);
    const wakeLockRef = useRef(null);

    // 1. INICIALIZACIÓN
    useEffect(() => {
        const token = localStorage.getItem('device_token');
        console.log("📺 TV Iniciada. Token encontrado:", !!token);

        if (token) {
            checkForUpdates();
            // Revisar actualizaciones cada minuto
            updateIntervalRef.current = setInterval(checkForUpdates, 60000);
        } else {
            startPairingProcess();
        }

        // NOTA: Hemos eliminado el listener que reseteaba 'hasInteracted' al salir de fullscreen.
        // Ahora, una vez que das click, se queda activado para siempre en esta sesión.

        return () => {
            clearTimeout(timerRef.current);
            clearInterval(pollRef.current);
            clearInterval(updateIntervalRef.current);
            if (wakeLockRef.current) wakeLockRef.current.release();
        };
    }, []);

    // --- FUNCIÓN DE INICIO (CORREGIDA) ---
    const enterFullscreenAndWakeLock = async () => {
        // 1. PRIMERO: Quitamos el overlay inmediatamente.
        // Esto asegura que veas el contenido aunque el fullscreen falle.
        setHasInteracted(true); 

        try {
            console.log("🖥️ Intentando entrar a Pantalla Completa...");
            const elem = document.documentElement;
            
            // Intentamos fullscreen
            if (elem.requestFullscreen) await elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
            
            // Intentamos mantener la pantalla encendida (Wake Lock)
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                console.log("💡 WakeLock activado");
            }
        } catch (err) {
            console.warn("⚠️ No se pudo activar Pantalla Completa (o fue cancelada), pero continuamos reproduciendo.", err);
        }
    };

    // --- CACHÉ ---
    const cacheMedia = async (url) => {
        try {
            // Evitar caché de Mixed Content (HTTP en HTTPS)
            if (window.location.protocol === 'https:' && url.startsWith('http:')) {
                return url; 
            }
            
            const cache = await caches.open('tv-media-v1');
            const cachedRes = await cache.match(url);
            if (cachedRes) {
                const blob = await cachedRes.blob();
                return URL.createObjectURL(blob);
            }
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
                await cache.put(url, response.clone());
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        } catch (e) { 
            console.warn("⚠️ Error cacheando:", url);
        }
        return url;
    };

    const processPlaylist = async (rawItems) => {
        return Promise.all(rawItems.map(async (item) => {
            const localUrl = await cacheMedia(item.url);
            return { ...item, original_url: item.url, url: localUrl };
        }));
    };

    // --- API UPDATES ---
    const checkForUpdates = async () => {
        try {
            const token = localStorage.getItem('device_token');
            const res = await api.get('/tv/playlist', { headers: { Authorization: `Bearer ${token}` } });
            const serverData = res.data || [];
            
            const newHash = JSON.stringify(serverData.map(i => i.item_id + i.display_order + i.duration_seconds));

            if (newHash !== playlistHash) {
                console.log("🔄 Nueva playlist detectada...");
                const readyPlaylist = await processPlaylist(serverData);
                
                if (activePlaylist.length === 0) {
                    setActivePlaylist(readyPlaylist);
                    setStatus(readyPlaylist.length > 0 ? 'playing' : 'empty');
                    setPlaylistHash(newHash);
                } else {
                    setPendingPlaylist(readyPlaylist);
                    setPlaylistHash(newHash);
                }
            } else {
                if (status === 'loading' && activePlaylist.length > 0) setStatus('playing');
                else if (status === 'loading' && serverData.length === 0) setStatus('empty');
            }
        } catch (error) {
            console.error("❌ Error Update:", error);
            if (error.response?.status === 403) {
                localStorage.removeItem('device_token');
                window.location.reload();
            } else {
                if (activePlaylist.length === 0) {
                    setStatus('offline');
                    setErrorMsg('No se puede conectar al servidor.');
                }
            }
        }
    };

    const startPairingProcess = async () => {
        try {
            const res = await api.post('/tv/setup');
            setPairingCode(res.data.code); 
            setStatus('pairing');
            
            pollRef.current = setInterval(async () => {
                try { 
                    const s = await api.get(`/tv/status/${res.data.code}`); 
                    if (s.data.status === 'paired') { 
                        localStorage.setItem('device_token', s.data.token); 
                        clearInterval(pollRef.current); 
                        window.location.reload(); 
                    } 
                } catch {}
            }, 5000);
        } catch (e) { 
            setStatus('offline');
            setErrorMsg('Error al generar código de vinculación.');
        }
    };

    // --- LÓGICA DE REPRODUCCIÓN ---
    const nextItem = () => {
        if (activePlaylist.length === 0) return;

        setPreviousIndex(currentIndex);
        setIsTransitioning(true);

        if (currentIndex === activePlaylist.length - 1 && pendingPlaylist) {
            setActivePlaylist(pendingPlaylist);
            setPendingPlaylist(null);
            setCurrentIndex(0);
        } else {
            setCurrentIndex((prev) => (prev + 1) % activePlaylist.length);
        }

        setTimeout(() => {
            setIsTransitioning(false);
            setPreviousIndex(null);
        }, 1000);
    };

    useEffect(() => {
        if (status !== 'playing' || activePlaylist.length === 0) return;
        
        const item = activePlaylist[currentIndex];
        if (!item) { setCurrentIndex(0); return; }

        console.log(`▶️ Reproduciendo: ${item.name}`);

        if (item.type !== 'video') {
            const duration = (item.duration_seconds || 10) * 1000;
            timerRef.current = setTimeout(nextItem, duration);
        }
        
        return () => clearTimeout(timerRef.current);
    }, [currentIndex, status, activePlaylist]);


    // --- RENDERIZADO DEL MEDIO ---
    const renderMedia = (item, animationClass = '') => {
        if (!item) return null;
        const key = `${item.item_id}-${animationClass}`; 

        const handleError = () => {
            console.error(`⚠️ Error cargando medio, saltando...`);
            if (!animationClass.includes('fadeOut')) nextItem();
        };

        const content = item.type === 'video' ? (
            <video 
                src={item.url} 
                autoPlay 
                muted={true}
                playsInline
                onEnded={!animationClass.includes('fadeOut') ? nextItem : undefined} 
                onError={handleError}
                style={styles.mediaFull} 
            />
        ) : (
            <img 
                src={item.url} 
                style={styles.mediaFull} 
                alt="content" 
                onError={handleError} 
            />
        );

        return (
            <div key={key} style={{...styles.layer, animation: animationClass}}>
                {content}
            </div>
        );
    };

    // --- PANTALLA DE INICIO (INTERACCIÓN USUARIO) ---
    // SOLO se muestra si NO se ha interactuado Y ya cargó algo (para no tapar el loading)
    if (!hasInteracted && status !== 'loading') {
        return (
            <div onClick={enterFullscreenAndWakeLock} style={styles.startOverlay}>
                <div style={styles.startBox}>
                    <Maximize size={80} color="#3b82f6" />
                    <h1>Iniciar TV</h1>
                    <p>Clic para Pantalla Completa y Sonido</p>
                    <p style={{fontSize:'12px', color:'#94a3b8', marginTop: '10px'}}>Estado actual: {status}</p>
                </div>
            </div>
        );
    }

    // --- VISTAS DE ESTADO ---
    if (status === 'loading') return <div style={styles.containerBlack}><Loader size={50} className="spin" color="#3b82f6"/><p style={{marginTop:20, color:'#94a3b8'}}>Iniciando sistema...</p><style>{`.spin { animation: spin 2s infinite linear; } @keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;
    
    if (status === 'offline') return (
        <div style={styles.containerError}>
            <WifiOff size={80} color="white"/>
            <h1>Sin Conexión</h1>
            <p>{errorMsg}</p>
            <button onClick={() => window.location.reload()} style={styles.btnRetry}>Reintentar</button>
        </div>
    );
    
    if (status === 'pairing') return (
        <div style={styles.containerPairing}>
            <div style={styles.codeBox}>
                <p style={{margin:0, color:'#94a3b8', fontSize:'20px'}}>Código de Vinculación:</p>
                <h1 style={styles.bigCode}>{pairingCode}</h1>
                <div style={{display:'flex', alignItems:'center', gap:'10px', justifyContent:'center'}}>
                    <Loader size={20} className="spin"/> <span style={{fontSize:'14px', color:'#cbd5e1'}}>Esperando al administrador...</span>
                </div>
            </div>
            <style>{`.spin { animation: spin 2s infinite linear; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
    
    if (status === 'empty') return <div style={styles.containerBlack}><CloudOff size={60} color="#64748b"/><h2>Pantalla Vinculada</h2><p style={{color:'#64748b'}}>Esta pantalla no tiene contenido asignado.</p></div>;

    // --- REPRODUCTOR (PLAYING) ---
    if (status === 'playing') {
        return (
            <div style={styles.playerContainer}>
                {renderMedia(activePlaylist[currentIndex], isTransitioning ? 'fadeIn 1s forwards' : '')}
                {isTransitioning && previousIndex !== null && renderMedia(activePlaylist[previousIndex], 'fadeOut 1s forwards')}
                
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
                `}</style>
            </div>
        );
    }
    
    return <div style={styles.containerBlack}><AlertCircle color="red"/><p>Estado desconocido</p></div>;
}

const styles = {
    startOverlay: { position: 'fixed', inset: 0, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 9999 },
    startBox: { textAlign: 'center', color: 'white', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' },
    
    containerPairing: { height: '100vh', width: '100vw', backgroundColor: '#0f172a', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'sans-serif' },
    codeBox: { background: 'rgba(255,255,255,0.05)', padding: '40px 60px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
    bigCode: { fontSize: '100px', margin: '10px 0', letterSpacing: '8px', fontWeight: '800', color: '#3b82f6' },
    
    containerError: { height: '100vh', width: '100vw', backgroundColor: '#ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', gap:'20px' },
    btnRetry: { background:'white', color:'#ef4444', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'16px' },
    
    containerBlack: { height: '100vh', width: '100vw', backgroundColor: 'black', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color:'white' },
    
    playerContainer: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', overflow: 'hidden' },
    layer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mediaFull: { width: '100%', height: '100%', objectFit: 'contain' },
};