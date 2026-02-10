import React, { useState, useEffect } from 'react';
import api from '../config/api';
import {
    X, Search, Plus, Trash2, Monitor, Play,
    ImageIcon, Folder, HardDrive, Loader, ArrowLeft,
    Home, ChevronRight, Users, Scissors, Copy, ClipboardCheck
} from 'lucide-react';

const LIBRARY_STYLES = `
    /* --- 1. ESTILOS DE BOTONES UNIFICADOS (Idénticos a ClientDetails) --- */
    .btn-primary { 
        background: #3b82f6; color: white; border: none; 
        padding: 10px 20px; border-radius: 10px; font-weight: 600; 
        cursor: pointer; display: flex; align-items: center; gap: 8px; 
        transition: background 0.2s; white-space: nowrap; 
        font-size: 14px;
    }
    .btn-primary:hover { background: #2563eb; }
    
    .btn-secondary { 
        background: white; color: #475569; border: 1px solid #cbd5e1; 
        padding: 10px 18px; border-radius: 10px; font-weight: 600; 
        cursor: pointer; display: flex; align-items: center; gap: 8px; 
        transition: all 0.2s; white-space: nowrap; 
        font-size: 14px;
    }
    .btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; }

    /* --- 2. X FLOTANTE (Cerrar) --- */
    .modal-wrapper-relative { position: relative; display: flex; flex-direction: column; }
    
    .btn-close-floating {
        position: absolute; top: -15px; right: -15px; 
        width: 36px; height: 36px; border-radius: 50%; 
        background: #ef4444; border: 2px solid white; color: white;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        z-index: 50; box-shadow: 0 4px 10px rgba(0,0,0,0.3); 
        transition: transform 0.2s;
    }
    .btn-close-floating:hover { transform: scale(1.1); background: #dc2626; }

    /* --- 3. ESTILOS PROPIOS DE LA BIBLIOTECA --- */
    .overlay-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 200; display: flex; justify-content: center; align-items: center; }
    .overlay-backdrop.library-mode { z-index: 3000; } 

    .library-modal-content { background: #f8fafc; width: 90vw; max-width: 1400px; height: 85vh; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    .library-toolbar { background: white; padding: 15px 25px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
    
    .breadcrumbs { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px; font-weight: 600; }
    .breadcrumb-item { cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 6px; transition: 0.2s; }
    .breadcrumb-item:hover { background: #f1f5f9; color: #3b82f6; }
    .breadcrumb-item.active { color: #1e293b; cursor: default; background: transparent; }
    
    .library-tabs { display: flex; gap: 5px; background: #f1f5f9; padding: 4px; border-radius: 10px; }
    .lib-tab { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #64748b; transition: all 0.2s; border: none; background: transparent; }
    .lib-tab.active { background: white; color: #3b82f6; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .lib-tab:hover:not(.active) { color: #334155; background: rgba(255,255,255,0.5); }
    
    .search-bar-wrapper { position: relative; width: 300px; }
    .search-icon-input { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .library-search-input { width: 100%; padding: 10px 10px 10px 35px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .library-search-input:focus { border-color: #3b82f6; }

    .library-browser { display: flex; flex: 1; overflow: hidden; flex-direction: column; }
    .library-main-area { flex: 1; display: flex; flex-direction: column; background: #f8fafc; }
    .library-grid-container { flex: 1; overflow-y: auto; padding: 25px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; align-content: flex-start; -ms-overflow-style: none; scrollbar-width: none; }
    .library-grid-container::-webkit-scrollbar { display: none; }

    .folder-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .folder-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.15); border-color: #3b82f6; }
    .folder-icon-area { width: 60px; height: 60px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #3b82f6; }
    .folder-name { font-weight: 700; color: #334155; font-size: 14px; text-align: center; }

    .media-card { position: relative; background: #fff; border-radius: 10px; overflow: hidden; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
    .media-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px rgba(0,0,0,0.15); border-color: #3b82f6; }
    .media-card-thumb { width: 100%; aspect-ratio: 16/9; background: #000; position: relative; overflow: hidden; }
    .media-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .media-card-thumb .video-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); backdrop-filter: blur(1px); }
    .media-card-footer { padding: 8px 10px; font-size: 12px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: white; border-top: 1px solid #f1f5f9; }
    
    .card-actions { position: absolute; top: 5px; right: 5px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; z-index: 10; }
    .media-card:hover .card-actions { opacity: 1; }
    .btn-action-mini { width: 26px; height: 26px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; }
    .btn-action-mini.delete { background: rgba(239, 68, 68, 0.9); }
    .btn-action-mini.cut { background: rgba(245, 158, 11, 0.9); }
    .btn-action-mini.copy { background: rgba(59, 130, 246, 0.9); }
    
    .btn-paste { background: #fef08a; color: #854d0e; border: 1px solid #fde047; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .btn-paste:hover { background: #fde047; }
    @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .btn-add-overlay { position: absolute; inset: 0; background: rgba(59, 130, 246, 0.8); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: white; font-weight: 700; gap: 5px; }
    .media-card:hover .btn-add-overlay { opacity: 1; } 
    
    .media-type-badge { position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; z-index: 2; }
    .btn-delete-media { position: absolute; top: 5px; right: 5px; background: rgba(239, 68, 68, 0.9); color: white; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; z-index: 10; }
    .media-card:hover .btn-delete-media { opacity: 1; }
    
    .tv-limit-box { width: 100%; max-width: 600px; max-height: 50vh; aspect-ratio: 16/9; background: #000; border: 2px solid #334155; border-radius: 8px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .tv-limit-label { position: absolute; top: 10px; right: 10px; color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 700; border: 1px solid rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; z-index: 5; }
    .library-detail-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; padding: 20px; position: relative; }

    @media (max-width: 768px) {
        .library-modal-content { height: 100vh; width: 100vw; border-radius: 0; }
        .library-toolbar { flex-direction: column; align-items: stretch; gap: 10px; }
        .search-bar-wrapper { width: 100%; }
    }
`;

export default function MediaLibraryModal({ isOpen, onClose, clientId: initialClientId, clientName: initialClientName, onSelect, showToast }) {
    const [activeFolderId, setActiveFolderId] = useState(null);
    const [folderName, setFolderName] = useState('Inicio');
    const [clipboard, setClipboard] = useState(null);
    const [clientsList, setClientsList] = useState([]);
    const [media, setMedia] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedItem(null);
            if (initialClientId) {
                setActiveFolderId(initialClientId);
                setFolderName(initialClientName || 'Cliente Actual');
                fetchMedia(initialClientId);
            } else {
                goHome();
            }
        }
    }, [isOpen, initialClientId, initialClientName]);

    const goHome = async () => {
        setLoading(true);
        setActiveFolderId(null);
        setFolderName('Inicio');
        setMedia([]);
        try {
            const res = await api.get('/admin/clients');
            setClientsList(res.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const openFolder = (id, name) => {
        setActiveFolderId(id);
        setFolderName(name);
        fetchMedia(id);
    };

    const fetchMedia = async (targetId) => {
        setLoading(true);
        try {
            const res = await api.get(`/media/library?clientId=${targetId}`);
            setMedia(res.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeFolderId) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('clientId', activeFolderId);
        fd.append('file', file);
        try {
            await api.post('/media/upload', fd, { headers: { "Content-Type": undefined } });
            await fetchMedia(activeFolderId);
            if (showToast) showToast('Archivo subido');
        } catch (e) {
            alert("Error subiendo archivo");
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    const handleDeleteMedia = async (e, mediaId) => {
        e.stopPropagation();
        if (!window.confirm("¿Seguro? Se borrará de todas las pantallas.")) return;
        try {
            await api.delete(`/media/${mediaId}`);
            setMedia(prev => prev.filter(m => m.id !== mediaId));
            if (showToast) showToast('Archivo eliminado', 'error');
        } catch (e) { console.error(e); }
    };

    const addToClipboard = (e, action, item) => {
        e.stopPropagation();
        setClipboard({ action, item });
        if (showToast) showToast(action === 'cut' ? 'Archivo listo para mover' : 'Archivo copiado');
    };

    const handlePaste = async () => {
        if (!clipboard || !activeFolderId) return;
        setLoading(true);
        try {
            if (clipboard.action === 'cut') {
                await api.put(`/media/${clipboard.item.id}`, { clientId: activeFolderId });
                if (showToast) showToast('Archivo movido correctamente');
            } else {
                await api.post(`/media/copy`, { mediaId: clipboard.item.id, targetClientId: activeFolderId });
                if (showToast) showToast('Archivo duplicado correctamente');
            }
            setClipboard(null);
            fetchMedia(activeFolderId);
        } catch (error) {
            console.error(error);
            alert("Error al pegar archivo.");
        } finally {
            setLoading(false);
        }
    };

    const filteredMedia = media.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filter === 'all' || m.type === filter));
    const filteredClients = clientsList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!isOpen) return null;

    return (
        <div className="overlay-backdrop library-mode" onClick={onClose}>
            <style>{LIBRARY_STYLES}</style>

            {/* WRAPPER RELATIVO PARA LA X FLOTANTE */}
            <div className="modal-wrapper-relative" onClick={e => e.stopPropagation()}>

                {/* LA X FLOTANTE (Ahora igual que en ClientDetails) */}
                <button className="btn-close-floating" onClick={onClose}>
                    <X size={20} strokeWidth={3} />
                </button>

                <div className="library-modal-content">

                    {/* VISTA DETALLE */}
                    {selectedItem ? (
                        <div className="library-detail-view">
                            <button onClick={() => setSelectedItem(null)} className="btn-secondary" style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}><ArrowLeft size={16} /> Volver</button>
                            <div className="tv-limit-box">
                                <div className="tv-limit-label">PREVIEW</div>
                                {selectedItem.type === 'video' ?
                                    <video src={selectedItem.url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> :
                                    <img src={selectedItem.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                                }
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                {onSelect && (
                                    <button className="btn-primary" style={{ padding: '15px 30px', fontSize: '16px' }} onClick={() => { onSelect(selectedItem); onClose(); }}>
                                        <Plus size={20} /> Añadir a Pantalla
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* TOOLBAR (Sin botón X, porque ya está flotando afuera) */}
                            <div className="library-toolbar">
                                <div style={{ minWidth: '200px' }}>
                                    <div className="breadcrumbs">
                                        <div className={`breadcrumb-item ${!activeFolderId ? 'active' : ''}`} onClick={goHome}>
                                            <Home size={16} /> Inicio
                                        </div>
                                        {activeFolderId && (
                                            <>
                                                <ChevronRight size={14} style={{ color: '#cbd5e1' }} />
                                                <div className="breadcrumb-item active">
                                                    {activeFolderId === 'general' ? 'General' : folderName}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="search-bar-wrapper">
                                    <Search className="search-icon-input" size={16} />
                                    <input type="text" placeholder={activeFolderId ? "Buscar archivos..." : "Buscar cliente..."} className="library-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {clipboard && activeFolderId && (
                                        <button className="btn-paste" onClick={handlePaste}>
                                            <ClipboardCheck size={16} />
                                            Pegar
                                        </button>
                                    )}

                                    {activeFolderId && (
                                        <label className="btn-primary" style={{ cursor: 'pointer' }}>
                                            {uploading ? <Loader className="spin-anim" size={18} /> : <Plus size={18} />}
                                            <span>Subir</span>
                                            <input type="file" hidden onChange={handleFileUpload} disabled={uploading} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* BROWSER AREA */}
                            <div className="library-browser">
                                <div className="library-main-area">
                                    <div className="library-grid-container">
                                        {loading && <div style={{ width: '100%', textAlign: 'center', marginTop: 50 }}><Loader className="spin-anim" size={30} color="#3b82f6" /></div>}

                                        {!loading && !activeFolderId && (
                                            <>
                                                <div className="folder-card" onClick={() => openFolder('general', 'General')}>
                                                    <div className="folder-icon-area" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                                                        <HardDrive size={24} />
                                                    </div>
                                                    <div className="folder-name">General</div>
                                                </div>

                                                {filteredClients.map(c => (
                                                    <div key={c.id} className="folder-card" onClick={() => openFolder(c.id, c.name)}>
                                                        <div className="folder-icon-area">
                                                            <Users size={24} />
                                                        </div>
                                                        <div className="folder-name">{c.name}</div>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {!loading && activeFolderId && filteredMedia.map(m => (
                                            <div key={m.id} className="media-card" onClick={() => setSelectedItem(m)}>
                                                <div className="card-actions">
                                                    <button className="btn-action-mini copy" title="Copiar" onClick={(e) => addToClipboard(e, 'copy', m)}><Copy size={12} /></button>
                                                    <button className="btn-action-mini cut" title="Cortar/Mover" onClick={(e) => addToClipboard(e, 'cut', m)}><Scissors size={12} /></button>
                                                    <button className="btn-action-mini delete" title="Eliminar" onClick={(e) => handleDeleteMedia(e, m.id)}><Trash2 size={12} /></button>
                                                </div>

                                                <div className="media-card-thumb">
                                                    <span className="media-type-badge">{m.type === 'video' ? 'VIDEO' : 'IMG'}</span>
                                                    {m.type === 'video' ? <div className="video-overlay"><Play size={32} color="white" fill="white" /></div> : <img src={m.url} alt="media" loading="lazy" />}
                                                    <div className="btn-add-overlay" style={{ zIndex: 5 }}><Monitor size={24} /> Ver</div>
                                                </div>
                                                {/* ... dentro del map de filteredMedia ... */}

                                                <div className="media-card-footer">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: '120px'
                                                        }}>
                                                            {m.name}
                                                        </span>

                                                        {/* Mostrar badge del dueño si estamos en General */}
                                                        {activeFolderId === 'general' && m.owner_name && (
                                                            <span style={{
                                                                fontSize: '9px',
                                                                background: '#e2e8f0',
                                                                padding: '2px 5px',
                                                                borderRadius: '4px',
                                                                color: '#64748b',
                                                                maxWidth: '80px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {m.owner_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {!loading && !activeFolderId && filteredClients.length === 0 && (
                                            <p style={{ textAlign: 'center', color: '#94a3b8', width: '100%', marginTop: 50 }}>No se encontraron clientes.</p>
                                        )}
                                        {!loading && activeFolderId && filteredMedia.length === 0 && (
                                            <p style={{ textAlign: 'center', color: '#94a3b8', width: '100%', marginTop: 50 }}>Esta carpeta está vacía.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}