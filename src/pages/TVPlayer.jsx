import { useState, useEffect, useRef } from 'react';
import api from '../config/api';
import { WifiOff, CloudOff, Loader, RefreshCw, Maximize } from 'lucide-react';

export default function TVPlayer() {
    const [status, setStatus] = useState('loading');
    const [pairingCode, setPairingCode] = useState(null);
    
    // --- DATOS ---
    const [activePlaylist, setActivePlaylist] = useState([]);
    const [pendingPlaylist, setPendingPlaylist] = useState(null);
    const [playlistHash, setPlaylistHash] = useState('');

    // --- ESTADOS DE TRANSICIÓN ---
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // "previousIndex" nos ayuda a saber cuál es la imagen que se está yendo
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
        if (token) {
            checkForUpdates();
            updateIntervalRef.current = setInterval(checkForUpdates, 60000);
        } else {
            startPairingProcess();
        }

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                setHasInteracted(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            clearTimeout(timerRef.current);
            clearInterval(pollRef.current);
            clearInterval(updateIntervalRef.current);
            if (wakeLockRef.current) wakeLockRef.current.release();
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    const enterFullscreenAndWakeLock = async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) await elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
            if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {} finally { setHasInteracted(true); }
    };

    // --- CACHÉ ---
    const cacheMedia = async (url) => {
        try {
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
        } catch (e) { }
        return url;
    };

    const processPlaylist = async (rawItems) => {
        return Promise.all(rawItems.map(async (item) => {
            const localUrl = await cacheMedia(item.url);
            return { ...item, original_url: item.url, url: localUrl };
        }));
    };

    // --- UPDATES ---
    const checkForUpdates = async () => {
        try {
            const token = localStorage.getItem('device_token');
            const res = await api.get('/tv/playlist', { headers: { Authorization: `Bearer ${token}` } });
            const serverData = res.data || [];
            
            const newHash = JSON.stringify(serverData.map(i => i.item_id + i.display_order + i.custom_duration));

            if (newHash !== playlistHash) {
                const readyPlaylist = await processPlaylist(serverData);
                
                if (activePlaylist.length === 0) {
                    setActivePlaylist(readyPlaylist);
                    setStatus(readyPlaylist.length > 0 ? 'playing' : 'empty');
                    setPlaylistHash(newHash);
                } else {
                    setPendingPlaylist(readyPlaylist);
                    setPlaylistHash(newHash);
                }
            }
        } catch (error) {
            if (error.response?.status === 403) {
                localStorage.removeItem('device_token');
                window.location.reload();
            }
        }
    };

    // ----------------------------------------------------
    // LÓGICA DE TRANSICIÓN CRUZADA (CROSSFADE)
    // ----------------------------------------------------
    const nextItem = () => {
        if (activePlaylist.length === 0) return;

        // 1. Guardamos el índice actual antes de cambiarlo (Esta será la imagen "Vieja")
        setPreviousIndex(currentIndex);
        setIsTransitioning(true);

        // 2. Verificar ciclo
        if (currentIndex === activePlaylist.length - 1 && pendingPlaylist) {
            setActivePlaylist(pendingPlaylist);
            setPendingPlaylist(null);
            setCurrentIndex(0);
        } else {
            // Avanzar normal
            setCurrentIndex((prev) => (prev + 1) % activePlaylist.length);
        }

        // 3. Limpiar la transición después de 1 segundo (duración de la animación)
        setTimeout(() => {
            setIsTransitioning(false);
            setPreviousIndex(null); // Limpiamos la imagen vieja para ahorrar memoria
        }, 1000);
    };

    useEffect(() => {
        if (status !== 'playing' || activePlaylist.length === 0) return;
        const item = activePlaylist[currentIndex];
        
        // Timer solo para imágenes (el video usa onEnded)
        if (item.type !== 'video') {
            const duration = (item.custom_duration || 10) * 1000;
            timerRef.current = setTimeout(nextItem, duration);
        }
        return () => clearTimeout(timerRef.current);
    }, [currentIndex, status, activePlaylist]);

    // --- VISTAS ---
    if (!hasInteracted && status !== 'loading') return <div onClick={enterFullscreenAndWakeLock} style={styles.startOverlay}><div style={styles.startBox}><Maximize size={80} color="#3b82f6" /><h1>Iniciar TV</h1><p>Clic para Pantalla Completa</p></div></div>;

    const startPairingProcess = async () => {
        try {
            const res = await api.post('/tv/setup');
            setPairingCode(res.data.code); setStatus('pairing');
            pollRef.current = setInterval(async () => {
                try { const s = await api.get(`/tv/status/${res.data.code}`); if (s.data.status === 'paired') { localStorage.setItem('device_token', s.data.token); clearInterval(pollRef.current); window.location.reload(); } } catch {}
            }, 5000);
        } catch { setStatus('offline'); }
    };

    // Helper Renderizado
    const renderMedia = (item, animationClass = '') => {
        if (!item) return null;
        
        // Asignamos una key única para que React sepa que son elementos distintos
        // Esto es CRUCIAL para que la animación reinicie
        const key = `${item.item_id}-${animationClass}`;

        const content = item.type === 'video' ? (
            <video 
                src={item.url} 
                autoPlay 
                muted={true}
                // Solo el video entrante (sin clase de salida) dispara el siguiente evento
                onEnded={!animationClass.includes('fade-out') ? nextItem : undefined} 
                onError={!animationClass.includes('fade-out') ? nextItem : undefined} 
                style={styles.mediaFull} 
            />
        ) : (
            <img src={item.url} style={styles.mediaFull} alt="" />
        );

        return (
            <div key={key} style={{...styles.layer, animation: animationClass}}>
                {content}
            </div>
        );
    };

    if (status === 'offline') return <div style={styles.containerError}><WifiOff size={80} color="white"/><h1>Sin Conexión</h1></div>;
    if (status === 'pairing') return <div style={styles.containerPairing}><h1 style={styles.bigCode}>{pairingCode}</h1><p style={{color:'white'}}>Vincula esta pantalla</p></div>;
    if (status === 'empty') return <div style={styles.containerBlack}><CloudOff size={60} color="#64748b"/><h2>Esperando contenido...</h2></div>;

    if (status === 'playing') {
        return (
            <div style={styles.playerContainer}>
                {pendingPlaylist && <div style={styles.updateBadge}><RefreshCw size={20} className="spin" color="#4ade80"/></div>}

                {/* 1. IMAGEN ACTUAL (ENTRANTE) */}
                {/* Si hay transición, esta hace Fade In. Si no, está estática. */}
                {renderMedia(
                    activePlaylist[currentIndex], 
                    isTransitioning ? 'fadeIn 1s forwards' : ''
                )}

                {/* 2. IMAGEN VIEJA (SALIENTE) */}
                {/* Solo existe durante la transición y hace Fade Out */}
                {isTransitioning && previousIndex !== null && renderMedia(
                    activePlaylist[previousIndex], 
                    'fadeOut 1s forwards'
                )}
                
                {/* ESTILOS DE ANIMACIÓN INYECTADOS */}
                <style>{`
                    @keyframes fadeIn { 
                        from { opacity: 0; } 
                        to { opacity: 1; } 
                    }
                    @keyframes fadeOut { 
                        from { opacity: 1; } 
                        to { opacity: 0; } 
                    }
                    .spin { animation: spin 2s infinite linear; } 
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }
    
    return <div style={{backgroundColor:'black', height:'100vh'}}></div>;
}

const styles = {
    startOverlay: { position: 'fixed', inset: 0, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 9999 },
    startBox: { textAlign: 'center', color: 'white', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' },
    containerPairing: { height: '100vh', width: '100vw', backgroundColor: '#0f172a', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'sans-serif' },
    bigCode: { fontSize: '150px', margin: '20px 0', letterSpacing: '10px', fontWeight: '800' },
    containerError: { height: '100vh', width: '100vw', backgroundColor: '#ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' },
    containerBlack: { height: '100vh', width: '100vw', backgroundColor: 'black', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color:'white' },
    
    playerContainer: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', overflow: 'hidden' },
    
    // Layer ahora no tiene z-index fijo, depende del orden de renderizado
    layer: { 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
    },
    
    mediaFull: { width: '100%', height: '100%', objectFit: 'contain' },
    updateBadge: { position:'absolute', top:20, right:20, zIndex:100, background:'rgba(0,0,0,0.5)', padding:10, borderRadius:'50%' }
};