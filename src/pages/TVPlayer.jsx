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

        // Listener para detectar si salimos de pantalla completa
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                // Opcional: Si salen de pantalla completa, podríamos pausar o no hacer nada
                console.log("Salida de pantalla completa detectada");
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            clearTimeout(timerRef.current);
            clearInterval(pollRef.current);
            clearInterval(updateIntervalRef.current);
            if (wakeLockRef.current) wakeLockRef.current.release();
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const enterFullscreenAndWakeLock = async () => {
        try {
            console.log("🖥️ Intentando entrar a Pantalla Completa...");
            const elem = document.documentElement;
            if (elem.requestFullscreen) await elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
            
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                console.log("💡 WakeLock activado (Pantalla no se apagará)");
            }
        } catch (err) {
            console.error("Error fullscreen/wakelock:", err);
        } finally { 
            setHasInteracted(true); 
        }
    };

    // --- CACHÉ (Simplificado para evitar errores CORS en localhost) ---
    const cacheMedia = async (url) => {
        // En desarrollo o HTTP mixto, el caché puede fallar.
        // Retornamos la URL original si falla el caché.
        try {
            // Solo intentamos cachear si es HTTPS para evitar errores de Mixed Content en Service Workers
            if (window.location.protocol === 'https:' && url.startsWith('http:')) {
                return url; // No cachear mixed content, dejar que el navegador lo intente cargar
            }
            
            const cache = await caches.open('tv-media-v1');
            const cachedRes = await cache.match(url);
            if (cachedRes) {
                const blob = await cachedRes.blob();
                return URL.createObjectURL(blob);
            }
            // mode: 'cors' es importante para Cloudinary/S3
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
                await cache.put(url, response.clone());
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        } catch (e) { 
            console.warn("⚠️ Error cacheando:", url, e);
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
            
            console.log("📥 Playlist recibida:", serverData.length, "items");

            const newHash = JSON.stringify(serverData.map(i => i.item_id + i.display_order + i.duration_seconds));

            if (newHash !== playlistHash) {
                console.log("🔄 Nueva playlist detectada, procesando...");
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
                // Si ya tenemos playlist y el status estaba en loading, lo ponemos en playing
                if (status === 'loading' && activePlaylist.length > 0) setStatus('playing');
                else if (status === 'loading' && serverData.length === 0) setStatus('empty');
            }
        } catch (error) {
            console.error("❌ Error Update:", error);
            if (error.response?.status === 403) {
                localStorage.removeItem('device_token');
                window.location.reload();
            } else {
                // Si falla la conexión pero ya tenemos contenido, no hacemos nada (seguimos offline mode)
                // Si NO tenemos contenido, mostramos error
                if (activePlaylist.length === 0) {
                    setStatus('offline');
                    setErrorMsg(error.message || 'Error de conexión');
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
            setErrorMsg('No se pudo conectar al servidor para vincular.');
        }
    };

    // --- LOGICA DE REPRODUCCIÓN ---
    const nextItem = () => {
        if (activePlaylist.length === 0) return;

        setPreviousIndex(currentIndex);
        setIsTransitioning(true);

        if (currentIndex === activePlaylist.length - 1 && pendingPlaylist) {
            console.log("🔀 Aplicando actualización de playlist pendiente...");
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

    // Efecto para manejar el timer de las IMÁGENES
    useEffect(() => {
        if (status !== 'playing' || activePlaylist.length === 0) return;
        
        const item = activePlaylist[currentIndex];
        // Seguridad: Si item es undefined, reseteamos
        if (!item) {
            setCurrentIndex(0);
            return;
        }

        console.log(`▶️ Reproduciendo [${item.type}]: ${item.name} (${item.duration_seconds || 10}s)`);

        if (item.type !== 'video') {
            const duration = (item.duration_seconds || 10) * 1000;
            timerRef.current = setTimeout(nextItem, duration);
        }
        
        return () => clearTimeout(timerRef.current);
    }, [currentIndex, status, activePlaylist]);


    // --- RENDERIZADO DEL MEDIO ---
    const renderMedia = (item, animationClass = '') => {
        if (!item) return null;
        const key = `${item.item_id}-${animationClass}`; // Key única para forzar re-render de animación

        const handleError = () => {
            console.error(`⚠️ Error cargando medio: ${item.url}`);
            // Si falla, pasamos al siguiente inmediatamente
            if (!animationClass.includes('fadeOut')) nextItem();
        };

        const content = item.type === 'video' ? (
            <video 
                src={item.url} 
                autoPlay 
                muted={true} // IMPORTANTE: Videos deben estar muteados para autoplay
                playsInline
                onEnded={!animationClass.includes('fadeOut') ? nextItem : undefined} 
                onError={handleError}
                style={styles.mediaFull} 
            />
        ) : (
            <img 
                src={item.url} 
                style={styles.mediaFull} 
                alt="tv-content" 
                onError={handleError} // <--- ESTO EVITA LA PANTALLA NEGRA
            />
        );

        return (
            <div key={key} style={{...styles.layer, animation: animationClass}}>
                {content}
            </div>
        );
    };

    // --- PANTALLA DE INICIO (INTERACCIÓN USUARIO) ---
    // Si ya cargó algo (playing/pairing) y no hay interacción, mostramos el overlay
    // Si sigue 'loading', mostramos spinner
    if (!hasInteracted && status !== 'loading') {
        return (
            <div onClick={enterFullscreenAndWakeLock} style={styles.startOverlay}>
                <div style={styles.startBox}>
                    <Maximize size={80} color="#3b82f6" />
                    <h1>Iniciar TV</h1>
                    <p>Clic para Pantalla Completa y Sonido</p>
                    <p style={{fontSize:'12px', color:'#94a3b8'}}>Estado: {status}</p>
                </div>
            </div>
        );
    }

    // --- VISTAS DE ESTADO ---
    if (status === 'loading') return <div style={styles.containerBlack}><Loader size={50} className="spin" color="#3b82f6"/><p style={{marginTop:20, color:'#94a3b8'}}>Cargando sistema...</p></div>;
    
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
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Loader size={20} className="spin"/> <span style={{fontSize:'14px'}}>Esperando conexión...</span>
                </div>
            </div>
        </div>
    );
    
    if (status === 'empty') return <div style={styles.containerBlack}><CloudOff size={60} color="#64748b"/><h2>Pantalla Vinculada</h2><p style={{color:'#64748b'}}>Agrega contenido desde el panel para comenzar.</p></div>;

    // --- REPRODUCTOR (PLAYING) ---
    if (status === 'playing') {
        return (
            <div style={styles.playerContainer}>
                {/* 1. LAYER ACTIVO */}
                {renderMedia(activePlaylist[currentIndex], isTransitioning ? 'fadeIn 1s forwards' : '')}

                {/* 2. LAYER SALIENTE (CROSSFADE) */}
                {isTransitioning && previousIndex !== null && renderMedia(activePlaylist[previousIndex], 'fadeOut 1s forwards')}
                
                {/* ESTILOS GLOBALES */}
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
                    .spin { animation: spin 2s infinite linear; } 
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }
    
    // Fallback final
    return <div style={styles.containerBlack}><AlertCircle color="red"/><p>Error de estado desconocido</p></div>;
}

const styles = {
    startOverlay: { position: 'fixed', inset: 0, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 9999 },
    startBox: { textAlign: 'center', color: 'white', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' },
    
    containerPairing: { height: '100vh', width: '100vw', backgroundColor: '#0f172a', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'sans-serif' },
    codeBox: { background: 'rgba(255,255,255,0.05)', padding: '40px 60px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
    bigCode: { fontSize: '120px', margin: '10px 0', letterSpacing: '10px', fontWeight: '800', color: '#3b82f6' },
    
    containerError: { height: '100vh', width: '100vw', backgroundColor: '#ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', gap:'20px' },
    btnRetry: { background:'white', color:'#ef4444', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'16px' },
    
    containerBlack: { height: '100vh', width: '100vw', backgroundColor: 'black', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color:'white' },
    
    playerContainer: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', overflow: 'hidden' },
    layer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mediaFull: { width: '100%', height: '100%', objectFit: 'contain' },
};