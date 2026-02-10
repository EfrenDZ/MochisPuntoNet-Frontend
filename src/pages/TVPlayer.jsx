import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../config/api';
import { WifiOff, CloudOff, Loader, Maximize, Lock } from 'lucide-react';

// --- HACK: VIDEO INVISIBLE ---
const NO_SLEEP_VIDEO_BASE64 = "data:video/mp4;base64,AAAAHGZ0eXPCisAAAAACdatzbW9vdgAAADxtdmhkAAAAAAAAAAAAAAAAAAABAAAAAAABAAABAAAAAAHAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAHBt0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAChtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAIAAAAAEAAAAVAFAAAAAAAxBWhZGxyAAAAAAAAAAZdmNocmwAAAAXPZnJsAAAAIG1kaGQAAAAAAAAAAAAAAAAAIAAAAAEAAAAVAFAAAAAAAxBWhZGxyAAAAAAAAAAZdmNocmwAAAAXPZnJs";

export default function TVPlayer() {
    // Estados base
    const [status, setStatus] = useState('loading'); 
    const [pairingCode, setPairingCode] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Datos Playlist
    const [activePlaylist, setActivePlaylist] = useState([]);
    const [pendingPlaylist, setPendingPlaylist] = useState(null);
    const [playlistHash, setPlaylistHash] = useState('');

    // Transiciones y Control
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(null); 
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Refs Críticas
    const timerRef = useRef(null);         // El temporizador principal
    const watchdogRef = useRef(null);      // El supervisor de seguridad
    const lastSwitchTime = useRef(Date.now()); // Marca de tiempo del último cambio
    const wakeLockRef = useRef(null);
    const pollRef = useRef(null);

    // 1. INICIALIZACIÓN
    useEffect(() => {
        const token = localStorage.getItem('device_token');
        if (token) {
            checkForUpdates();
            // Revisar actualizaciones cada 30s
            const updateInterval = setInterval(checkForUpdates, 30000);
            return () => clearInterval(updateInterval);
        } else {
            startPairingProcess();
        }
    }, []);

    // 2. WAKE LOCK REFORZADO
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && hasInteracted) {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Limpieza general al desmontar componente
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) wakeLockRef.current.release();
            clearTimeout(timerRef.current);
            clearInterval(watchdogRef.current);
            clearInterval(pollRef.current);
        };
    }, [hasInteracted]);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) { console.warn("WakeLock falló", err); }
        }
    };

    const enterFullscreenAndWakeLock = async () => {
        setHasInteracted(true); 
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) await elem.requestFullscreen();
            await requestWakeLock();
        } catch (err) {}
    };

    // 3. FUNCIÓN DE CAMBIO DE DIAPOSITIVA (Estabilizada)
    const nextItem = useCallback(() => {
        if (activePlaylist.length === 0) return;

        // Actualizamos la marca de tiempo para que el supervisor sepa que cambiamos
        lastSwitchTime.current = Date.now();

        setPreviousIndex(currentIndex);
        setIsTransitioning(true);

        setCurrentIndex((prev) => {
            // Si hay playlist pendiente y llegamos al final, cambiamos
            if (prev === activePlaylist.length - 1 && pendingPlaylist) {
                setActivePlaylist(pendingPlaylist);
                setPendingPlaylist(null);
                return 0;
            }
            return (prev + 1) % activePlaylist.length;
        });

        setTimeout(() => {
            setIsTransitioning(false);
            setPreviousIndex(null);
        }, 1000); // Duración de la transición CSS
    }, [activePlaylist, pendingPlaylist, currentIndex]);

    // 4. LÓGICA PRINCIPAL DE REPRODUCCIÓN + SUPERVISOR (Watchdog)
    useEffect(() => {
        if (status !== 'playing' || activePlaylist.length === 0) return;
        
        const item = activePlaylist[currentIndex];
        if (!item) return;

        console.log(`▶️ Play: ${item.type} | ID: ${item.item_id}`);

        // Limpiar temporizadores anteriores
        clearTimeout(timerRef.current);
        clearInterval(watchdogRef.current);

        // A) SI ES IMAGEN: Usamos setTimeout normal
        if (item.type !== 'video') {
            const durationSec = parseInt(item.custom_duration) || 10;
            const durationMs = durationSec * 1000;

            // 1. Programar el cambio normal
            timerRef.current = setTimeout(nextItem, durationMs);

            // 2. Activar el SUPERVISOR (Watchdog)
            // Revisa cada 2 segundos. Si pasaron (duracion + 3 seg) y no ha cambiado, fuerza el cambio.
            watchdogRef.current = setInterval(() => {
                const now = Date.now();
                const timeDiff = now - lastSwitchTime.current;
                
                // Si llevamos 3 segundos más de lo que debería durar la imagen...
                if (timeDiff > (durationMs + 3000)) {
                    console.warn("⚠️ ALERTA: Imagen trabada detectada. Forzando siguiente...");
                    nextItem(); 
                }
            }, 2000);
        }
        
        // B) SI ES VIDEO: No usamos timer aquí, dependemos del evento onEnded
        // Pero por seguridad, si el video dura 15s y lleva 25s, lo saltamos (por si falla onEnded)
        if (item.type === 'video') {
             // Estimamos una duración máxima de seguridad (ej. 120 segundos o lo que diga la metadata)
             // Si tus videos tienen duración en la BD, úsala. Si no, pon un límite alto.
             const maxVideoDuration = 300 * 1000; // 5 minutos de seguridad
             watchdogRef.current = setInterval(() => {
                if (Date.now() - lastSwitchTime.current > maxVideoDuration) {
                    console.warn("⚠️ ALERTA: Video trabado (no lanzó onEnded). Forzando...");
                    nextItem();
                }
             }, 5000);
        }

        return () => {
            clearTimeout(timerRef.current);
            clearInterval(watchdogRef.current);
        };

    }, [currentIndex, status, activePlaylist, nextItem]); // Dependencias críticas

    // --- CACHÉ Y DATOS (Igual que antes) ---
    const cacheMedia = async (url) => {
        try {
            if (window.location.protocol === 'https:' && url.startsWith('http:')) return url; 
            const cache = await caches.open('tv-media-v1');
            const cachedRes = await cache.match(url);
            if (cachedRes) return URL.createObjectURL(await cachedRes.blob());
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
                await cache.put(url, response.clone());
                return URL.createObjectURL(await response.blob());
            }
        } catch (e) {}
        return url;
    };

    const processPlaylist = async (rawItems) => {
        return Promise.all(rawItems.map(async (item) => {
            const localUrl = await cacheMedia(item.url);
            return { ...item, original_url: item.url, url: localUrl };
        }));
    };

    const checkForUpdates = async () => {
        try {
            const token = localStorage.getItem('device_token');
            if (!token) return;

            const res = await api.get('/tv/playlist', { headers: { Authorization: `Bearer ${token}` } });
            
            if (status === 'suspended' || status === 'offline') {
                setStatus('loading');
                setErrorMsg('');
            }

            const serverData = res.data || [];
            // Incluimos custom_duration en el hash para detectar cambios de tiempo
            const newHash = JSON.stringify(serverData.map(i => i.item_id + i.display_order + i.custom_duration));

            if (newHash !== playlistHash) {
                const readyPlaylist = await processPlaylist(serverData);
                if (activePlaylist.length === 0) {
                    setActivePlaylist(readyPlaylist);
                    setStatus(readyPlaylist.length > 0 ? 'playing' : 'empty');
                } else {
                    setPendingPlaylist(readyPlaylist);
                }
                setPlaylistHash(newHash);
            } else if (activePlaylist.length === 0 && serverData.length > 0) {
                 const readyPlaylist = await processPlaylist(serverData);
                 setActivePlaylist(readyPlaylist);
                 setStatus('playing');
            }
        } catch (error) {
            if (error.response?.status === 403) {
                 const errorData = error.response.data;
                 if (errorData.command === 'stop' || (errorData.error && errorData.error.toLowerCase().includes('suspendida'))) {
                    setActivePlaylist([]); 
                    setStatus('suspended');
                    setErrorMsg('Su servicio ha sido suspendido temporalmente.');
                 } else {
                    localStorage.removeItem('device_token');
                    window.location.reload();
                 }
            } else if (activePlaylist.length === 0) {
                setStatus('offline');
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
            setErrorMsg('Error de conexión.');
        }
    };

    // --- RENDERIZADO ---
    const renderMedia = (item, animationClass = '') => {
        if (!item) return null;
        
        // Optimización: Si es una transición de salida (fadeOut), 
        // y el item es video, lo silenciamos para evitar conflictos de audio
        const isFadingOut = animationClass.includes('fadeOut');

        const content = item.type === 'video' ? (
            <video 
                src={item.url} autoPlay muted={true} playsInline
                // Importante: Solo el video activo (no el que se va) puede disparar nextItem
                onEnded={!isFadingOut ? nextItem : undefined} 
                style={styles.mediaFull} 
            />
        ) : (
            <img src={item.url} style={styles.mediaFull} alt="slide" />
        );
        
        return (
            <div key={`${item.item_id}-${animationClass}`} style={{...styles.layer, animation: animationClass}}>
                {content}
            </div>
        );
    };

    // --- VISTAS ---
    if (!hasInteracted && status !== 'loading') {
        return (
            <div onClick={enterFullscreenAndWakeLock} style={styles.startOverlay}>
                <div style={styles.startBox}>
                    <Maximize size={80} color="#3b82f6" />
                    <h1>Iniciar TV</h1>
                    <p>Toca para Pantalla Completa</p>
                </div>
            </div>
        );
    }

    if (status === 'loading') return <div style={styles.containerBlack}><Loader size={50} className="spin" color="#3b82f6"/></div>;
    
    if (status === 'suspended') return (
        <div style={styles.containerBlack}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '40px', borderRadius: '50%', marginBottom: '30px' }}>
                <Lock size={80} color="#ef4444" />
            </div>
            <h1>Servicio Suspendido</h1>
            <p style={{ color: '#9ca3af' }}>{errorMsg}</p>
        </div>
    );
    
    if (status === 'offline') return <div style={styles.containerError}><WifiOff size={80} color="white"/><h1>Sin Conexión</h1><button onClick={() => window.location.reload()} style={styles.btnRetry}>Reconectar</button></div>;
    
    if (status === 'pairing') return <div style={styles.containerPairing}><div style={styles.codeBox}><p>Código:</p><h1 style={styles.bigCode}>{pairingCode}</h1><Loader size={20} className="spin"/></div><style>{`.spin { animation: spin 2s infinite linear; }`}</style></div>;
    
    if (status === 'empty') return <div style={styles.containerBlack}><CloudOff size={60} color="#64748b"/><h2>Sin Contenido</h2></div>;

    // VISTA PLAYING
    if (status === 'playing') {
        return (
            <div style={styles.playerContainer}>
                {/* VIDEO HACK ANTISUSPENSIÓN */}
                <video 
                    src={NO_SLEEP_VIDEO_BASE64}
                    autoPlay loop muted playsInline
                    style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.01, pointerEvents: 'none', zIndex: 0 }}
                />
                
                {renderMedia(activePlaylist[currentIndex], isTransitioning ? 'fadeIn 1s forwards' : '')}
                
                {/* Solo renderizamos el anterior si estamos transicionando, para ahorrar memoria en TV */}
                {isTransitioning && previousIndex !== null && renderMedia(activePlaylist[previousIndex], 'fadeOut 1s forwards')}
                
                <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`}</style>
            </div>
        );
    }
    
    return null;
}

const styles = {
    startOverlay: { position: 'fixed', inset: 0, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 9999 },
    startBox: { textAlign: 'center', color: 'white', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' },
    containerPairing: { height: '100vh', width: '100vw', backgroundColor: '#0f172a', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'sans-serif' },
    codeBox: { background: 'rgba(255,255,255,0.05)', padding: '40px 60px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
    bigCode: { fontSize: '100px', margin: '10px 0', letterSpacing: '8px', fontWeight: '800', color: '#3b82f6' },
    containerError: { height: '100vh', width: '100vw', backgroundColor: '#ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', gap:'20px' },
    btnRetry: { background:'white', color:'#ef4444', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' },
    containerBlack: { height: '100vh', width: '100vw', backgroundColor: 'black', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color:'white' },
    playerContainer: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', overflow: 'hidden' },
    layer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mediaFull: { width: '100%', height: '100%', objectFit: 'contain' },
};