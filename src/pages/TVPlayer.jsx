import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../config/api';
import { getMediaUrl } from '../utils/getMediaUrl';
import { WifiOff, CloudOff, Loader, Maximize, Lock } from 'lucide-react';

// --- HACK: VIDEO INVISIBLE ---
const NO_SLEEP_VIDEO_BASE64 = "data:video/mp4;base64,AAAAHGZ0eXPCisAAAAACdatzbW9vdgAAADxtdmhkAAAAAAAAAAAAAAAAAAABAAAAAAABAAABAAAAAAHAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAHBt0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAChtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAIAAAAAEAAAAVAFAAAAAAAxBWhZGxyAAAAAAAAAAZdmNocmwAAAAXPZnJsAAAAIG1kaGQAAAAAAAAAAAAAAAAAIAAAAAEAAAAVAFAAAAAAAxBWhZGxyAAAAAAAAAAZdmNocmwAAAAXPZnJs";

// --- NUEVO: Sub-componente para gestionar el ciclo de vida del video ---
const MediaLayer = ({ item, isCurrent, isPrev, isNext, isSingleItem, onEnded }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (item.type !== 'video' || !videoRef.current) return;

        if (isCurrent) {
            // Cuando le toca su turno, lo regresamos a 0 y forzamos el play
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.warn("Autoplay prevenido:", e));
        } else if (isNext && !isPrev) {
            // Cuando está oculto preparándose, lo rebobinamos y pausamos
            videoRef.current.currentTime = 0;
            videoRef.current.pause();
        }
    }, [isCurrent, isNext, isPrev, item.type]);

    const mediaStyle = { width: '100%', height: '100%', objectFit: 'cover' };

    if (item.type === 'video') {
        return (
            <video
                ref={videoRef}
                src={item.url}
                muted={true}
                playsInline
                loop={isSingleItem}
                onEnded={onEnded}
                style={mediaStyle}
            />
        );
    }

    return <img src={item.url} style={mediaStyle} alt="slide" />;
};

export default function TVPlayer() {
    // Estados base
    const [status, setStatus] = useState('loading');
    const [pairingCode, setPairingCode] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [rotation, setRotation] = useState(0);

    // Datos Playlist
    const [activePlaylist, setActivePlaylist] = useState([]);
    const [pendingPlaylist, setPendingPlaylist] = useState(null);
    const [playlistHash, setPlaylistHash] = useState('');

    // Transiciones y Control
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(() => !!localStorage.getItem('device_token'));

    // Refs Críticas
    const timerRef = useRef(null);
    const watchdogRef = useRef(null);
    const lastSwitchTime = useRef(Date.now());
    const wakeLockRef = useRef(null);
    const pollRef = useRef(null);
    const playlistHashRef = useRef('');
    const activePlaylistRef = useRef([]);
    const statusRef = useRef('loading');
    const rotationRef = useRef(0);

    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { activePlaylistRef.current = activePlaylist; }, [activePlaylist]);

    // 1. INICIALIZACIÓN
    useEffect(() => {
        const token = localStorage.getItem('device_token');
        if (token) {
            requestWakeLock();
            checkForUpdates();
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

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) wakeLockRef.current.release();
        };
    }, [hasInteracted]);

    // Limpieza global de intervalos
    useEffect(() => {
        return () => {
            clearTimeout(timerRef.current);
            clearInterval(watchdogRef.current);
            clearInterval(pollRef.current);
        };
    }, []);

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
        } catch (err) { }
    };

    // 3. FUNCIÓN DE CAMBIO DE DIAPOSITIVA
    const nextItem = useCallback(() => {
        if (activePlaylist.length === 0) return;

        lastSwitchTime.current = Date.now();
        setPreviousIndex(currentIndex);
        setIsTransitioning(true);

        setCurrentIndex((prev) => {
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
        }, 1000);
    }, [activePlaylist, pendingPlaylist, currentIndex]);

    // 4. LÓGICA PRINCIPAL DE REPRODUCCIÓN + SUPERVISOR
    useEffect(() => {
        if (status !== 'playing' || activePlaylist.length === 0) return;

        if (activePlaylist.length === 1) {
            return;
        }

        const item = activePlaylist[currentIndex];
        if (!item) return;

        console.log(`▶️ Play: ${item.type} | ID: ${item.item_id}`);

        clearTimeout(timerRef.current);
        clearInterval(watchdogRef.current);

        if (item.type !== 'video') {
            const durationSec = parseInt(item.custom_duration) || 10;
            const durationMs = durationSec * 1000;

            timerRef.current = setTimeout(nextItem, durationMs);

            watchdogRef.current = setInterval(() => {
                const now = Date.now();
                const timeDiff = now - lastSwitchTime.current;
                if (timeDiff > (durationMs + 3000)) {
                    console.warn("⚠️ ALERTA: Imagen trabada detectada. Forzando siguiente...");
                    nextItem();
                }
            }, 2000);
        }

        if (item.type === 'video') {
            const maxVideoDuration = 300 * 1000;
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

    }, [currentIndex, status, activePlaylist, nextItem]);

    // --- CACHÉ Y DATOS ---
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
        } catch (e) { }
        return url;
    };

    const processPlaylist = async (rawItems) => {
        const processed = await Promise.all(rawItems.map(async (item) => {
            const resolvedUrl = getMediaUrl(item.url);
            const localUrl = await cacheMedia(resolvedUrl);
            return { ...item, original_url: item.url, url: localUrl };
        }));

        // ✨ EL TRUCO: Clonación si solo hay 1 elemento
        if (processed.length === 1) {
            return [
                processed[0],
                { ...processed[0], item_id: `${processed[0].item_id}_clone` }
            ];
        }

        return processed;
    };

    const checkForUpdates = async () => {
        try {
            const token = localStorage.getItem('device_token');
            if (!token) return;

            const res = await api.get('/tv/playlist', { headers: { Authorization: `Bearer ${token}` } });

            const newRotation = parseInt(res.headers['x-tv-rotation'] || 0, 10);
            if (newRotation !== rotationRef.current) {
                rotationRef.current = newRotation;
                setRotation(newRotation);
            }

            const currentStatus = statusRef.current;
            if (currentStatus === 'suspended' || currentStatus === 'offline') {
                setStatus('loading');
                setErrorMsg('');
            }

            const serverData = res.data || [];
            const newHash = JSON.stringify(serverData.map(i => `${i.item_id}-${i.display_order}-${i.custom_duration}`));

            if (newHash !== playlistHashRef.current) {
                playlistHashRef.current = newHash;
                setPlaylistHash(newHash);

                const readyPlaylist = await processPlaylist(serverData);
                if (activePlaylistRef.current.length === 0) {
                    activePlaylistRef.current = readyPlaylist;
                    setActivePlaylist(readyPlaylist);
                    setStatus(readyPlaylist.length > 0 ? 'playing' : 'empty');
                } else {
                    setPendingPlaylist(readyPlaylist);
                }
            } else if (activePlaylistRef.current.length === 0 && serverData.length > 0) {
                const readyPlaylist = await processPlaylist(serverData);
                activePlaylistRef.current = readyPlaylist;
                setActivePlaylist(readyPlaylist);
                setStatus('playing');
            }
        } catch (error) {
            if (error.response?.status === 403) {
                const errorData = error.response.data;
                if (errorData.command === 'stop' || (errorData.error && errorData.error.toLowerCase().includes('suspendida'))) {
                    activePlaylistRef.current = [];
                    setActivePlaylist([]);
                    setStatus('suspended');
                    setErrorMsg('Su servicio ha sido suspendido temporalmente.');
                } else {
                    localStorage.removeItem('device_token');
                    window.location.reload();
                }
            } else if (activePlaylistRef.current.length === 0) {
                setStatus('offline');
            }
        }
    };

    const startPairingProcess = async () => {
        try {
            let deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let randomStr = '';
                for (let i = 0; i < 6; i++) {
                    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                deviceId = `TV-${randomStr}`;
                localStorage.setItem('device_id', deviceId);
            }

            setPairingCode(deviceId);
            setStatus('pairing');

            pollRef.current = setInterval(async () => {
                try {
                    const s = await api.post(`/tv/status?t=${Date.now()}`, { code: deviceId });

                    if (s.data.status === 'paired') {
                        localStorage.setItem('device_token', s.data.token);
                        clearInterval(pollRef.current);
                        window.location.reload();
                    } else if (s.data.status === 'error') {
                        clearInterval(pollRef.current);
                        setStatus('suspended');
                        setErrorMsg(s.data.message || 'Error de vinculación');
                    }
                } catch (err) {
                    console.error("Error en polling de TV:", err);
                }
            }, 5000);
        } catch (e) {
            setStatus('offline');
            setErrorMsg('Error de inicialización de TV.');
        }
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

    if (status === 'loading') return <div style={styles.containerBlack}><Loader size={50} className="spin" color="#3b82f6" /><style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s infinite linear; }`}</style></div>;

    if (status === 'suspended') return (
        <div style={styles.containerBlack}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '40px', borderRadius: '50%', marginBottom: '30px' }}>
                <Lock size={80} color="#ef4444" />
            </div>
            <h1>Servicio Suspendido</h1>
            <p style={{ color: '#9ca3af' }}>{errorMsg}</p>
        </div>
    );

    if (status === 'offline') return <div style={styles.containerError}><WifiOff size={80} color="white" /><h1>Sin Conexión</h1><button onClick={() => window.location.reload()} style={styles.btnRetry}>Reconectar</button></div>;

    if (status === 'pairing') return <div style={styles.containerPairing}><div style={styles.codeBox}><p>Código:</p><h1 style={styles.bigCode}>{pairingCode}</h1><Loader size={40} className="spin" color="#3b82f6" style={{ marginTop: '20px' }} /></div><style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s infinite linear; }`}</style></div>;

    if (status === 'empty') return <div style={styles.containerBlack}><CloudOff size={60} color="#64748b" /><h2>Sin Contenido</h2></div>;

    // VISTA PLAYING
    if (status === 'playing') {
        const isFlipped = rotation === 90 || rotation === 270;
        const playerStyle = {
            ...styles.playerContainer,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            width: isFlipped ? '100vh' : '100vw',
            height: isFlipped ? '100vw' : '100vh',
        };

        return (
            <div style={playerStyle}>
                {/* VIDEO HACK ANTISUSPENSIÓN */}
                <video
                    src={NO_SLEEP_VIDEO_BASE64}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ position: 'absolute', width: '10px', height: '10px', opacity: 0.1, pointerEvents: 'none', zIndex: -1, bottom: 0, right: 0 }}
                />

                {/* SISTEMA DE RENDERIZADO OPTIMIZADO */}
                {activePlaylist.map((item, index) => {
                    const isCurrent = index === currentIndex;
                    const isPrev = isTransitioning && index === previousIndex;
                    const isNext = index === (currentIndex + 1) % activePlaylist.length;

                    if (!isCurrent && !isPrev && !isNext) return null;

                    const isSingleItem = activePlaylist.length === 1;

                    let layerZIndex = 0;
                    let opacity = 1;
                    let animationClass = '';

                    if (isCurrent) {
                        layerZIndex = 2;
                        animationClass = isTransitioning ? 'fadeIn 1s forwards' : '';
                    } else if (isPrev) {
                        layerZIndex = 1;
                    } else if (isNext) {
                        layerZIndex = -1;
                        opacity = 0;
                    }

                    return (
                        <div
                            key={item.item_id}
                            style={{
                                ...styles.layer,
                                zIndex: layerZIndex,
                                opacity: opacity,
                                animation: animationClass
                            }}
                        >
                            <MediaLayer
                                item={item}
                                isCurrent={isCurrent}
                                isPrev={isPrev}
                                isNext={isNext}
                                isSingleItem={isSingleItem}
                                onEnded={(!isPrev && !isSingleItem) ? nextItem : undefined}
                            />
                        </div>
                    );
                })}

                <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
            </div>
        );
    }

    return null;
}

// 4. ESTILOS
const styles = {
    startOverlay: { position: 'fixed', inset: 0, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 9999 },
    startBox: { textAlign: 'center', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
    containerPairing: { height: '100vh', width: '100vw', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'sans-serif' },
    codeBox: { background: 'rgba(255,255,255,0.05)', padding: '40px 60px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '90%', wordBreak: 'break-all' },
    bigCode: { fontSize: 'clamp(40px, 8vw, 70px)', margin: '15px 0', letterSpacing: '4px', fontWeight: '800', color: '#3b82f6', wordWrap: 'break-word' },
    containerError: { height: '100vh', width: '100vw', backgroundColor: '#ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', gap: '20px' },
    btnRetry: { background: 'white', color: '#ef4444', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    containerBlack: { height: '100vh', width: '100vw', backgroundColor: 'black', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' },
    playerContainer: { position: 'fixed', top: '50%', left: '50%', width: '100vw', height: '100vh', backgroundColor: 'black', overflow: 'hidden', transform: 'translate(-50%, -50%)' },
    layer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mediaFull: { width: '100%', height: '100%', objectFit: 'cover' },
};