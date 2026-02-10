import { useState, useEffect, useRef } from 'react';
import api from '../config/api';
import { WifiOff, CloudOff, Loader, Maximize, Lock } from 'lucide-react';

// --- HACK: VIDEO INVISIBLE PARA EVITAR SUSPENSIÓN ---
// Este es un video MP4 válido de 1 pixel, negro y mudo.
// Al reproducirse en bucle, la TV cree que es contenido multimedia activo y no se duerme.
const NO_SLEEP_VIDEO_BASE64 = "data:video/mp4;base64,AAAAHGZ0eXPCisAAAAACdatzbW9vdgAAADxtdmhkAAAAAAAAAAAAAAAAAAABAAAAAAABAAABAAAAAAHAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAHBt0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAChtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAIAAAAAEAAAAVAFAAAAAAAxBWhZGxyAAAAAAAAAAZdmNocmwAAAAXPZnJsAAAAIG1kaGQAAAAAAAAAAAAAAAAAIAAAAAEAAAAVAFAAAAAAAxBWhZGxyAAAAAAAAAAZdmNocmwAAAAXPZnJs";

export default function TVPlayer() {
    const [status, setStatus] = useState('loading'); 
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
        if (token) {
            checkForUpdates();
            updateIntervalRef.current = setInterval(checkForUpdates, 30000);
        } else {
            startPairingProcess();
        }

        // Listener para recuperar el WakeLock si la TV minimiza y maximiza el navegador
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && hasInteracted) {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(timerRef.current);
            clearInterval(pollRef.current);
            clearInterval(updateIntervalRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) wakeLockRef.current.release();
        };
    }, [hasInteracted]);

    // --- WAKE LOCK & FULLSCREEN REFORZADO ---
    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                console.log("⚡ WakeLock activado");
            } catch (err) {
                console.warn("⚠️ No se pudo activar WakeLock:", err);
            }
        }
    };

    const enterFullscreenAndWakeLock = async () => {
        setHasInteracted(true); 
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) await elem.requestFullscreen();
            await requestWakeLock();
        } catch (err) { console.warn("Fullscreen/WakeLock error", err); }
    };

    // --- CACHÉ ---
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
        } catch (e) { console.warn("Error cacheando:", url); }
        return url;
    };

    const processPlaylist = async (rawItems) => {
        return Promise.all(rawItems.map(async (item) => {
            const localUrl = await cacheMedia(item.url);
            return { ...item, original_url: item.url, url: localUrl };
        }));
    };

    // --- CHECK FOR UPDATES ---
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
            const newHash = JSON.stringify(serverData.map(i => i.item_id + i.display_order + i.duration_seconds));

            if (newHash !== playlistHash) {
                console.log("🔄 Contenido actualizado");
                const readyPlaylist = await processPlaylist(serverData);
                
                if (activePlaylist.length === 0) {
                    setActivePlaylist(readyPlaylist);
                    setStatus(readyPlaylist.length > 0 ? 'playing' : 'empty');
                    setPlaylistHash(newHash);
                } else {
                    setPendingPlaylist(readyPlaylist);
                    setPlaylistHash(newHash);
                }
            } else if (activePlaylist.length === 0 && serverData.length > 0) {
                 const readyPlaylist = await processPlaylist(serverData);
                 setActivePlaylist(readyPlaylist);
                 setStatus('playing');
            }

        } catch (error) {
            console.error("Estado API Check:", error.response?.status);

            if (error.response?.status === 403) {
                const errorData = error.response.data;
                if (errorData.command === 'stop' || 
                   (errorData.error && errorData.error.toLowerCase().includes('suspendida'))) {
                    
                    clearTimeout(timerRef.current);
                    setActivePlaylist([]); 
                    setPendingPlaylist(null);
                    setStatus('suspended');
                    setErrorMsg('Su servicio ha sido suspendido temporalmente.');
                } else {
                    localStorage.removeItem('device_token');
                    window.location.reload();
                }
            } else {
                if (activePlaylist.length === 0) {
                    setStatus('offline');
                }
            }
        }
    };

    // --- PAIRING ---
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
            setErrorMsg('Error de conexión al servidor.');
        }
    };

    // --- LOOP REPRODUCCIÓN ---
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

    // --- EFFECT DE TIEMPO ---
    useEffect(() => {
        if (status !== 'playing' || activePlaylist.length === 0) return;
        
        const item = activePlaylist[currentIndex];
        if (!item) { setCurrentIndex(0); return; }

        console.log(`▶️ Reproduciendo: ${item.name} | Duración: ${item.custom_duration}s`);

        if (item.type !== 'video') {
            const duration = (parseInt(item.custom_duration) || 10) * 1000;
            timerRef.current = setTimeout(nextItem, duration);
        }
        
        return () => clearTimeout(timerRef.current);
    }, [currentIndex, status, activePlaylist]);

    // --- RENDERIZADO ---
    const renderMedia = (item, animationClass = '') => {
        if (!item) return null;
        
        // Si es video REAL del usuario
        const content = item.type === 'video' ? (
            <video 
                src={item.url} autoPlay muted={true} playsInline
                onEnded={!animationClass.includes('fadeOut') ? nextItem : undefined} 
                style={styles.mediaFull} 
            />
        ) : (
            <img src={item.url} style={styles.mediaFull} alt="content" />
        );
        return <div key={`${item.item_id}-${animationClass}`} style={{...styles.layer, animation: animationClass}}>{content}</div>;
    };

    // --- UI STATES ---

    if (!hasInteracted && status !== 'loading') {
        return (
            <div onClick={enterFullscreenAndWakeLock} style={styles.startOverlay}>
                <div style={styles.startBox}>
                    <Maximize size={80} color="#3b82f6" />
                    <h1>Iniciar TV</h1>
                    <p>Clic para Pantalla Completa</p>
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
            <h1 style={{ color: 'white', margin: '0 0 15px 0', fontSize: '32px' }}>Servicio Suspendido</h1>
            <p style={{ color: '#9ca3af', fontSize: '18px', maxWidth: '600px', textAlign: 'center' }}>
                {errorMsg}
            </p>
        </div>
    );
    
    if (status === 'offline') return <div style={styles.containerError}><WifiOff size={80} color="white"/><h1>Sin Conexión</h1><button onClick={() => window.location.reload()} style={styles.btnRetry}>Reconectar</button></div>;
    
    if (status === 'pairing') return <div style={styles.containerPairing}><div style={styles.codeBox}><p style={{color:'#94a3b8'}}>Código:</p><h1 style={styles.bigCode}>{pairingCode}</h1><Loader size={20} className="spin"/></div><style>{`.spin { animation: spin 2s infinite linear; }`}</style></div>;
    
    if (status === 'empty') return <div style={styles.containerBlack}><CloudOff size={60} color="#64748b"/><h2>Sin Contenido</h2></div>;

    if (status === 'playing') {
        return (
            <div style={styles.playerContainer}>
                {/* 👇👇👇 AQUÍ ESTÁ EL FIX 👇👇👇
                   Video invisible que se reproduce en bucle para engañar a la TV
                   y evitar que entre en modo suspensión cuando solo hay imágenes.
                */}
                <video 
                    src={NO_SLEEP_VIDEO_BASE64}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        opacity: 0.01,
                        pointerEvents: 'none',
                        zIndex: 0
                    }}
                />
                
                {/* Contenido Real */}
                {renderMedia(activePlaylist[currentIndex], isTransitioning ? 'fadeIn 1s forwards' : '')}
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