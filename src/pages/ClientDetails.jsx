import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';

// --- DND-KIT ---
import { 
    DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, 
    useSensor, useSensors, defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import { 
    arrayMove, sortableKeyboardCoordinates, rectSortingStrategy, 
    SortableContext, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- ÍCONOS ---
import { 
    Tv, Smartphone, Plus, X, Layers, Play, Trash2, Lock, Unlock, 
    AlertTriangle, CheckCircle, Link as LinkIcon, Unlink, Loader, 
    Save, Clock, Edit2, Folder, FolderPlus, Monitor, GripVertical,
    Grid, Search, Image as ImageIcon, Maximize2, ArrowLeft, Filter
} from 'lucide-react';

// ==========================================
// 1. ESTILOS CSS
// ==========================================
const STYLES = `
    /* --- UTILIDADES --- */
    .loading-screen, .error-screen { display: flex; justify-content: center; align-items: center; height: 50vh; color: #94a3b8; }
    .spin-anim { animation: spin 1s infinite linear; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    
    /* --- HEADER --- */
    .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .page-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
    .subtitle { color: #64748b; margin-top: 5px; font-size: 14px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .divider { width: 1px; height: 30px; background: #cbd5e1; }
    
    /* --- BOTONES --- */
    .btn-primary { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; white-space: nowrap; }
    .btn-primary:hover { background: #2563eb; }
    .btn-primary.disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 10px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; white-space: nowrap; }
    .btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; }
    .btn-active-edit { color: #e11d48; border-color: #fecdd3; background: #fff1f2; }
    .btn-mini { width: 24px; height: 24px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: white; transition: transform 0.1s; }
    .btn-mini:hover { transform: scale(1.1); }
    .btn-mini.edit { color: #3b82f6; }
    .btn-mini.delete { color: #ef4444; }

    /* BOTON DESVINCULAR */
    .btn-danger-action {
        width: 100%;
        justify-content: center;
        padding: 12px 16px;
        background: #fee2e2;
        color: #ef4444;
        border: 1px solid #fecaca;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
    }
    .btn-danger-action:hover {
        background: #fecaca;
        transform: translateY(-1px);
    }
    .btn-danger-action:active {
        transform: translateY(0);
    }

    /* --- GRUPOS --- */
    .groups-section { margin-bottom: 30px; }
    .section-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
    .groups-grid { display: flex; gap: 15px; flex-wrap: wrap; }
    .group-card { cursor: pointer; width: 200px; transition: transform 0.2s; }
    .group-card:hover { transform: translateY(-3px); }
    .group-card-visual { height: 120px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 16px; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(109, 40, 217, 0.3); }
    .group-icon-content { color: white; display: flex; flexDirection: column; align-items: center; gap: 8px; }
    .group-badge { background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
    .btn-delete-absolute { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.2); border: none; color: white; width: 26px; height: 26px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    /* --- BOARD Y FILAS --- */
    .board-container { display: flex; flexDirection: column; gap: 20px; padding-bottom: 100px; }
    .row-container { padding: 20px; border: 2px solid #e2e8f0; border-radius: 20px; min-height: 180px; transition: all 0.2s; background: transparent; }
    .row-container.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.02); }
    .row-container.edit-mode { border-style: dashed; border-color: #94a3b8; }
    .row-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .row-title { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 13px; }
    .row-title.active { color: #3b82f6; }
    .badge-selected { background: #3b82f6; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; }
    .btn-row-delete { background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
    .row-items-grid { display: flex; flex-wrap: wrap; gap: 25px; align-items: flex-start; min-height: 120px; padding: 10px; }
    .empty-row-placeholder { width: 100%; height: 100px; border: 2px dashed #cbd5e1; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; }

    /* --- SCREEN CARD --- */
    .screen-item-wrapper { position: relative; }
    .screen-card { 
        width: 240px; height: 135px; border-radius: 12px; position: relative; overflow: hidden; 
        display: flex; align-items: center; justify-content: center; background: #0f172a; 
        border: 1px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        backface-visibility: hidden; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; 
    }
    .screen-card.vertical { width: 135px; height: 240px; }
    .screen-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px rgba(0,0,0,0.2); border-color: #3b82f6; z-index: 10; }
    .screen-card.grouped { border-color: #8b5cf6; border-width: 2px; }
    .screen-card.edit-mode { cursor: grab; }
    .screen-img-content { width: 100%; height: 100%; object-fit: cover; display: block; }
    .screen-placeholder-content { display: flex; flexDirection: column; align-items: center; justify-content: center; color: #475569; width: 100%; height: 100%; background: #1e293b; }
    .no-signal-text { font-size: 10px; font-weight: 800; margin-top: 5px; opacity: 0.5; letter-spacing: 1px; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; position: absolute; bottom: 10px; right: 10px; border: 2px solid #0f172a; z-index: 5; }
    .status-dot.online { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
    .status-dot.offline { background: #ef4444; }
    .grouped-tag { position: absolute; top: 0; width: 100%; background: rgba(139, 92, 246, 0.9); color: white; font-size: 10px; font-weight: 700; text-align: center; padding: 2px; z-index: 5; display: flex; justify-content: center; gap: 4px; }
    .drag-handle { position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.5); color: white; padding: 4px; border-radius: 4px; }
    .edit-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 5px; z-index: 10; }
    .item-label { margin-top: 8px; text-align: center; font-size: 14px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }

    /* --- LAYERS & MODALS (MODAL PRINCIPAL) --- */
    .overlay-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 200; display: flex; justify-content: center; align-items: center; }
    .overlay-backdrop.library-mode { z-index: 3000; } 
    
    /* Z-INDEX CORREGIDO PARA ALERTAS (ENCIMA DE TODO) */
    .overlay-backdrop.alert-layer { z-index: 2500; }

    .modal-container { background: white; width: 90vw; max-width: 1200px; height: 85vh; border-radius: 24px; display: flex; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5); position: relative; }
    .btn-close-global { position: absolute; top: 15px; right: 15px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.1); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 20; }
    
    .modal-left-panel { flex: 1; background: #0f172a; border-right: 1px solid #1e293b; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
    .modal-right-panel { flex: 1.6; background: #f8fafc; display: flex; flex-direction: column; overflow: hidden; }

    /* --- PREVIEW BOX --- */
    .preview-container-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    
    .preview-box {
        position: relative;
        background: black;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #334155;
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        transition: transform 0.2s;
        width: 100%;
        max-width: 500px;
        aspect-ratio: 16/9;
    }
    .preview-box.vertical {
        aspect-ratio: 9/16;
        max-width: 280px;
    }
    .preview-box:hover { transform: scale(1.02); border-color: #3b82f6; }
    
    .preview-content { width: 100%; height: 100%; object-fit: contain; }

    /* --- PLAYLIST ITEMS --- */
    .playlist-row { display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; gap: 12px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .playlist-row:hover { border-color: #3b82f6; background: #f8fafc; }
    .row-img { width: 60px; height: 40px; object-fit: cover; border-radius: 4px; background: #000; flex-shrink: 0; display: block; }
    .row-img-placeholder { width: 60px; height: 40px; border-radius: 4px; background: #0f172a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .row-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
    .row-title-text { font-size: 13px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row-index-text { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .duration-wrapper { display: flex; align-items: center; gap: 5px; background: #f1f5f9; padding: 2px 6px; border-radius: 8px; border: 1px solid #e2e8f0; height: auto; }
    .duration-input { width: 24px; background: transparent; border: none; font-weight: 700; text-align: center; color: #334155; outline: none; font-size: 12px; }
    .btn-icon-delete { background: transparent; border: 1px solid #e2e8f0; color: #94a3b8; width: 24px; height: 24px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .btn-icon-delete:hover { background: #fee2e2; border-color: #ef4444; color: #ef4444; }

    /* --- ALERTAS & TOAST --- */
    .modern-modal.alert-box { width: 400px; padding: 30px; border-radius: 20px; background: white; text-align: center; position: relative; z-index: 301; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .alert-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .alert-danger { background: #fee2e2; color: #ef4444; } .alert-danger-btn { background: #ef4444; }
    .alert-warning { background: #fef3c7; color: #f59e0b; }
    .alert-info { background: #dbeafe; color: #3b82f6; }
    .alert-actions { display: flex; gap: 10px; justify-content: center; margin-top: 25px; }
    .btn-text-danger { background: none; border: none; color: #ef4444; font-weight: 600; cursor: pointer; }
    .toast-notification { position: fixed; bottom: 20px; right: 20px; background: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; gap: 10px; align-items: center; font-weight: 600; color: #334155; z-index: 9999; animation: slideIn 0.3s ease; }
    .toast-notification.success { border-left: 5px solid #10b981; } .toast-notification.success svg { color: #10b981; }
    @keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* --- BIBLIOTECA: PANEL INFERIOR --- */
    .library-quick-view { height: 180px; border-top: 1px solid #e2e8f0; background: #ffffff; padding: 15px 20px; display: flex; flex-direction: column; }
    .library-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .library-title { font-size: 13px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
    .btn-view-all { font-size: 12px; color: #3b82f6; background: #eff6ff; padding: 6px 12px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s; }
    .btn-view-all:hover { background: #dbeafe; }
    .quick-scroll-track { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; height: 100%; }

    /* --- BIBLIOTECA: MODAL COMPLETO --- */
    .library-modal-content { background: #f8fafc; width: 90vw; max-width: 1400px; height: 85vh; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    .library-toolbar { background: white; padding: 15px 25px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
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
    .library-grid-container { flex: 1; overflow-y: auto; padding: 25px; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; align-content: flex-start; }
    
    .media-card { position: relative; background: #fff; border-radius: 10px; overflow: hidden; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
    .media-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px rgba(0,0,0,0.15); border-color: #3b82f6; }
    .media-card-thumb { width: 100%; aspect-ratio: 16/9; background: #000; position: relative; overflow: hidden; }
    .media-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .media-card-thumb .video-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); backdrop-filter: blur(1px); }
    .media-card-footer { padding: 8px 10px; font-size: 12px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: white; border-top: 1px solid #f1f5f9; }
    .btn-add-overlay { position: absolute; inset: 0; background: rgba(59, 130, 246, 0.8); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: white; font-weight: 700; gap: 5px; }
    .media-card:hover .btn-add-overlay { opacity: 1; }
    .media-type-badge { position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; z-index: 2; }

    /* TV LIMITS BOX */
    .tv-limit-box { width: 100%; max-width: 600px; max-height: 50vh; aspect-ratio: 16/9; background: #000; border: 2px solid #334155; border-radius: 8px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .tv-limit-label { position: absolute; top: 10px; right: 10px; color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 700; border: 1px solid rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; z-index: 5; }

    /* --- TV FULLSCREEN PREVIEW (GRANDE) --- */
    .preview-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 3000; display: flex; justify-content: center; align-items: center; }
    .tv-frame { box-shadow: 0 0 40px #3b82f6, inset 0 0 20px #3b82f6; border: 4px solid #3b82f6; background: black; border-radius: 8px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .tv-frame.horizontal { width: 90vw; max-width: 1400px; aspect-ratio: 16/9; }
    .tv-frame.vertical { height: 90vh; aspect-ratio: 9/16; }
    .btn-close-preview { position: absolute; top: 20px; right: 20px; color: white; background: rgba(255,255,255,0.2); border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: 600; z-index: 3001; }

    /* --- RESPONSIVE MOBILE --- */
    @media (max-width: 1024px) {
        .content-container { padding: 0 15px 120px 15px; }
        .header-container { flex-direction: column; align-items: flex-start; gap: 15px; }
        .header-actions { width: 100%; overflow-x: auto; padding-bottom: 5px; }
        
        /* MODAL RESPONSIVE: MODO VENTANA */
        .modal-container { 
            flex-direction: column; 
            height: 90vh;  /* NO 100vh */
            width: 95vw;   /* NO 100vw */
            border-radius: 16px; /* Bordes redondeados */
            margin: auto;
        }
        
        .modal-left-panel { 
            flex: none; 
            width: 100%; 
            height: auto; 
            max-height: 50vh;
            border-right: none; 
            border-bottom: 1px solid #334155; 
            padding: 15px;
            background: #000; 
        }

        .preview-container-wrapper { width: 100%; height: 100%; }
        .preview-box.vertical { height: 100%; max-height: 40vh; width: auto; }
        .modal-right-panel { flex: 1; height: auto; }

        .library-modal-content { height: 100vh; width: 100vw; border-radius: 0; }
        .library-toolbar { flex-direction: column; align-items: stretch; gap: 15px; }
        .library-tabs { overflow-x: auto; }
        .search-bar-wrapper { width: 100%; }
        .library-grid-container { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
        
        /* Mostrar botones de vinculación también en móvil */
        .hide-on-mobile-small { display: block !important; width: 100% !important; padding: 10px !important; }
    }
`;

// ==========================================
// 2. COMPONENTES UI AUXILIARES
// ==========================================

const CustomAlert = ({ config, onClose }) => {
    if (!config.isOpen) return null;
    const themes = { danger: { icon: <Trash2 size={24}/>, className: 'alert-danger' }, warning: { icon: <AlertTriangle size={24}/>, className: 'alert-warning' }, info: { icon: <CheckCircle size={24}/>, className: 'alert-info' } };
    const theme = themes[config.type] || themes.info;
    
    // NOTA: Se agrega la clase "alert-layer" para Z-Index 2500
    return (
        <div className="overlay-backdrop alert-layer">
            <div className="modern-modal alert-box">
                <div className={`alert-icon ${theme.className}`}>{theme.icon}</div>
                <h3>{config.title}</h3>
                <p>{config.message}</p>
                <div className="alert-actions">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    {config.isExitConfirmation ? (
                        <>
                            <button onClick={config.onConfirm} className="btn-text-danger">Salir sin guardar</button>
                            <button onClick={config.onSaveAndExit} className="btn-primary">Guardar y Salir</button>
                        </>
                    ) : (
                        <button onClick={config.onConfirm} className={`btn-primary ${theme.className}-btn`}>Confirmar</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ToastNotification = ({ visible, message, type }) => {
    if (!visible) return null;
    return (
        <div className={`toast-notification ${type}`}>
            {type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
            <span>{message}</span>
        </div>
    );
};

// --- COMPONENTE PLAYLIST ---
const SortablePlaylistItem = memo(({ item, onRemove, onUpdateDuration, index }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.item_id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, touchAction: 'none', zIndex: isDragging ? 999 : 'auto' };

    return (
        <div ref={setNodeRef} style={style} className="playlist-row">
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#cbd5e1', display:'flex' }}><GripVertical size={16}/></div>
            {item.type === 'video' ? (<div className="row-img-placeholder"><Play size={16} color="white"/></div>) : (<img src={item.url} alt="media" className="row-img"/>)}
            <div className="row-info"><span className="row-title-text">{item.type === 'video' ? 'Video Clip' : 'Imagen'}</span><span className="row-index-text">Posición #{index + 1}</span></div>
            {item.type !== 'video' && (<div className="duration-wrapper"><Clock size={12} style={{marginRight: 4, color: '#64748b'}}/><input type="number" value={item.custom_duration || 10} onChange={e => onUpdateDuration(item.item_id, e.target.value)} className="duration-input"/><span style={{fontSize: 10, color: '#64748b'}}>s</span></div>)}
            <button onClick={() => onRemove(item.item_id)} className="btn-icon-delete"><Trash2 size={14}/></button>
        </div>
    );
});

const GroupCard = memo(({ group, onClick, onDelete }) => (
    <div className="group-card" onClick={onClick}>
        <div className="group-card-visual">
            <div className="group-icon-content"><Folder size={40} strokeWidth={1.5} /><span className="group-badge">{group.screen_count || 0} TVs</span></div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(group.id); }} className="btn-delete-absolute"><Trash2 size={14} /></button>
        </div>
        <div className="item-label">{group.name}</div>
    </div>
));

// ==========================================
// 3. ITEMS DND
// ==========================================

const ScreenItem = memo(({ id, screen, onClick, isEditMode, onEditScreen, onDeleteScreen, groups, activeId }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id, disabled: !isEditMode, data: { type: 'item', screen } });
    const isActuallyDragging = activeId === id;
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isActuallyDragging ? 0.5 : 1, zIndex: isActuallyDragging ? 999 : 'auto', position: 'relative', touchAction: 'none' };
    const isGrouped = screen.group_id != null;
    const groupName = isGrouped && groups ? groups.find(g => g.id === screen.group_id)?.name : null;
    const hasImage = screen.thumbnails?.length > 0;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="screen-item-wrapper">
            <div onClick={(e) => { if(isEditMode) return; onClick(); }} className={`screen-card ${screen.orientation === 'vertical' ? 'vertical' : ''} ${isGrouped ? 'grouped' : ''} ${isEditMode ? 'edit-mode' : ''}`}>
                {isGrouped && <div className="grouped-tag"><LinkIcon size={10}/> {groupName || 'Grupo'}</div>}
                {hasImage ? (<img src={screen.thumbnails[0]} alt="thumbnail" className="screen-img-content" />) : (<div className="screen-placeholder-content">{screen.orientation === 'horizontal' ? <Tv size={48} strokeWidth={1.5} /> : <Smartphone size={32} strokeWidth={1.5} />}<span className="no-signal-text">SIN SEÑAL</span></div>)}
                <div className={`status-dot ${screen.status === 'online' ? 'online' : 'offline'}`}></div>
                {isEditMode && (<><div className="drag-handle"><Layers size={14}/></div><div className="edit-actions"><button onPointerDown={e => e.stopPropagation()} onClick={(e) => {e.stopPropagation(); onEditScreen(screen)}} className="btn-mini edit"><Edit2 size={12}/></button><button onPointerDown={e => e.stopPropagation()} onClick={(e) => {e.stopPropagation(); onDeleteScreen(screen.id)}} className="btn-mini delete"><Trash2 size={12}/></button></div></>)}
            </div>
            <div className="item-label">{screen.name}</div>
        </div>
    );
});

const SortableRow = memo(({ id, items, screensData, groups, onScreenClick, isSelected, onSelectRow, isEditMode, onDeleteRow, onEditScreen, onDeleteScreen, activeId }) => {
    const { setNodeRef } = useSortable({ id: id, data: { type: 'container' }, disabled: true });
    const displayIndex = parseInt(id.replace('container-', '')) + 1;
    return (
        <div ref={setNodeRef} onClick={() => onSelectRow(id)} className={`row-container ${isSelected ? 'selected' : ''} ${isEditMode ? 'edit-mode' : ''}`}>
            <div className="row-header"><div className={`row-title ${isSelected ? 'active' : ''}`}><Layers size={16} /> <span>Fila {displayIndex}</span> {isSelected && <span className="badge-selected">SELECCIONADA</span>}</div>{isEditMode && <button onClick={(e) => { e.stopPropagation(); onDeleteRow(id, items); }} className="btn-row-delete"><Trash2 size={14} /> Eliminar Fila</button>}</div>
            <div className="row-items-grid">
                <SortableContext id={id} items={items} strategy={rectSortingStrategy}>
                    {items.map((prefixedId) => {
                        const realId = prefixedId.replace('item-', '');
                        const screen = screensData.find(s => String(s.id) === realId);
                        if (!screen) return null;
                        return (<ScreenItem key={prefixedId} id={prefixedId} activeId={activeId} screen={screen} groups={groups} onClick={() => onScreenClick(screen)} isEditMode={isEditMode} onEditScreen={onEditScreen} onDeleteScreen={onDeleteScreen} />);
                    })}
                </SortableContext>
                {items.length === 0 && <div className="empty-row-placeholder">Arrastra pantallas aquí</div>}
            </div>
        </div>
    );
});

// ==========================================
// 4. COMPONENTE PRINCIPAL
// ==========================================

export default function ClientDetails() {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [screensData, setScreensData] = useState([]);
    const [groups, setGroups] = useState([]);
    const [items, setItems] = useState({ "container-0": [] });
    const [availableMedia, setAvailableMedia] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [selectedRowId, setSelectedRowId] = useState("container-0");
    const [selectedEntity, setSelectedEntity] = useState(null); 
    const [playlist, setPlaylist] = useState([]);
    const originalPlaylistRef = useRef([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [modals, setModals] = useState({ createScreen: false, createGroup: false, editScreen: false });
    const [inputs, setInputs] = useState({ screenName: '', groupName: '', orientation: 'horizontal', pairingCode: '', selectedGroup: '' });
    const [editingScreen, setEditingScreen] = useState(null); 
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [loaders, setLoaders] = useState({ uploading: false, saving: false });
    
    // Estados Nuevos
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [libraryFilter, setLibraryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLibraryItem, setSelectedLibraryItem] = useState(null);
    const [fullScreenPreview, setFullScreenPreview] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => { fetchData(); }, [id]);

    useEffect(() => {
        if (!playlist?.length) return;
        const currentItem = playlist[currentPreviewIndex];
        if (!currentItem) { setCurrentPreviewIndex(0); return; }
        const duration = (parseInt(currentItem.custom_duration) || 10) * 1000;
        const timer = setTimeout(() => { setCurrentPreviewIndex(prev => (prev + 1) % playlist.length); }, duration);
        return () => clearTimeout(timer);
    }, [playlist, currentPreviewIndex]);

    useEffect(() => {
        if (!selectedEntity) return;
        if (selectedEntity.type === 'screen' && selectedEntity.data.group_id) { setHasUnsavedChanges(false); return; }
        let changed = false;
        const original = originalPlaylistRef.current;
        if (playlist.length !== original.length) changed = true;
        else {
            for (let i = 0; i < playlist.length; i++) {
                if (playlist[i].item_id !== original[i].item_id || String(playlist[i].item_id).startsWith('temp-') || parseInt(playlist[i].custom_duration) !== parseInt(original[i].custom_duration)) { changed = true; break; }
            }
        }
        setHasUnsavedChanges(changed);
    }, [playlist, selectedEntity]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [clientRes, screensRes, mediaRes, groupsRes] = await Promise.all([
                api.get(`/admin/clients/${id}`),
                api.get(`/admin/screens?clientId=${id}`),
                api.get(`/media/library?clientId=${id}`),
                api.get(`/admin/groups?clientId=${id}`)
            ]);
            setClient(clientRes.data);
            setScreensData(screensRes.data);
            setAvailableMedia(mediaRes.data);
            setGroups(groupsRes.data);
            const grouped = {};
            screensRes.data.forEach(s => { const r = `container-${s.row_index || 0}`; if (!grouped[r]) grouped[r] = []; grouped[r].push(s); });
            if(Object.keys(grouped).length === 0) grouped["container-0"] = [];
            const finalItems = {};
            Object.keys(grouped).sort((a,b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])).forEach(key => { finalItems[key] = grouped[key].sort((a,b) => (a.display_order || 0) - (b.display_order || 0)).map(s => `item-${s.id}`); });
            setItems(finalItems);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [id]);

    const showAlert = useCallback((type, title, message, onConfirm, isExitConfirmation, onSaveAndExit) => { setAlertConfig({ isOpen: true, type, title, message, onConfirm: () => { setAlertConfig(p => ({...p, isOpen:false})); onConfirm && onConfirm(); }, isExitConfirmation, onSaveAndExit }); }, []);
    const closeAlert = useCallback(() => setAlertConfig(p => ({...p, isOpen:false})), []);
    const showToast = useCallback((msg, type='success') => { setToast({visible:true, message:msg, type}); setTimeout(() => setToast(p=>({...p, visible:false})), 3000); }, []);

    const handleEntityClick = useCallback(async (entity, type) => {
        if (hasUnsavedChanges) { showAlert('warning', 'Cambios sin guardar', '¿Qué deseas hacer?', null, true, async () => { await handleSaveAllChanges(); loadEntity(entity, type); }); return; }
        loadEntity(entity, type);
    }, [hasUnsavedChanges]);

    const loadEntity = async (entity, type) => {
        setSelectedEntity({ type, data: entity });
        setCurrentPreviewIndex(0);
        setInputs(prev => ({ ...prev, pairingCode: '' }));
        try {
            const url = type === 'screen' ? (entity.group_id ? `/admin/groups/${entity.group_id}/playlist` : `/playlist/${entity.id}`) : `/admin/groups/${entity.id}/playlist`;
            const res = await api.get(url);
            setPlaylist(res.data);
            originalPlaylistRef.current = JSON.parse(JSON.stringify(res.data));
        } catch (e) { console.error(e); }
    };

    const addRow = () => { const newIndex = Object.keys(items).length; const newKey = `container-${newIndex}`; setItems({ ...items, [newKey]: [] }); setSelectedRowId(newKey); setIsEditMode(true); };
    const handleCreateScreen = async (e) => { e.preventDefault(); const cleanRowIndex = parseInt(selectedRowId.replace('container-', '')); try { await api.post('/admin/screens', { clientId: id, name: inputs.screenName, orientation: inputs.orientation, row_index: cleanRowIndex, group_id: inputs.selectedGroup ? parseInt(inputs.selectedGroup) : null }); setModals(p => ({...p, createScreen: false})); setInputs(p => ({...p, screenName: '', selectedGroup: ''})); fetchData(); showToast('Pantalla creada'); } catch (e) { console.error(e); showAlert('danger', 'Error', 'No se pudo crear pantalla'); } };
    const handleCreateGroup = async (e) => { e.preventDefault(); try { await api.post('/admin/groups', { clientId: id, name: inputs.groupName }); setModals(p => ({...p, createGroup: false})); setInputs(p => ({...p, groupName: ''})); fetchData(); showToast('Grupo creado'); } catch (e) { console.error(e); } };
    const handleDeleteGroup = useCallback((groupId) => { showAlert('danger', '¿Eliminar Grupo?', 'Las pantallas quedarán sueltas.', async () => { closeAlert(); try { await api.delete(`/admin/groups/${groupId}`); fetchData(); showToast('Grupo eliminado'); } catch (e) { console.error(e); } }); }, [fetchData, showAlert, closeAlert, showToast]);
    const requestDeleteRow = useCallback((rowId, rowItems) => { const cleanIds = rowItems.map(ri => ri.replace('item-', '')); showAlert('danger', 'Borrar Fila', 'Se borrarán las pantallas.', () => { closeAlert(); Promise.all(cleanIds.map(sid => api.delete(`/admin/screens/${sid}`))).then(() => { const n = {...items}; delete n[rowId]; setItems(n); fetchData(); }); }); }, [items, fetchData, showAlert, closeAlert]);
    const confirmDeleteScreen = useCallback((id) => { const clean = String(id).replace('item-', ''); showAlert('danger', 'Borrar Pantalla', 'Confirmar acción', async () => { closeAlert(); await api.delete(`/admin/screens/${clean}`); fetchData(); }); }, [fetchData, showAlert, closeAlert]);
    const handleLinkTV = async (e) => { e.preventDefault(); try { await api.post('/admin/screens/link', { screenId: selectedEntity.data.id, pairingCode: inputs.pairingCode }); fetchData(); showToast('Vinculado'); setSelectedEntity(prev => ({...prev, data: {...prev.data, status:'online'}})); } catch(e){ console.error(e); showAlert('danger', 'Error', 'Código inválido'); } };
    
    // CORREGIDO: Lógica de desvinculación
    const handleUnlinkTV = () => { 
        showAlert('danger', 'Desvincular', 'La pantalla dejará de recibir contenido. ¿Seguro?', async () => { 
            closeAlert(); 
            try { 
                await api.post('/admin/screens/unlink', { screenId: selectedEntity.data.id }); 
                fetchData(); 
                showToast('Desvinculado correctamente'); 
                // Actualizar estado local inmediatamente
                setSelectedEntity(prev => ({...prev, data: {...prev.data, status:'offline'}})); 
            } catch (e) { 
                console.error(e); 
                showAlert('danger', 'Error', 'No se pudo desvincular'); 
            } 
        }); 
    };
    
    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; if(!file) return; setLoaders(p => ({...p, uploading: true})); const fd = new FormData(); const safeId = id ? String(id) : 'general'; fd.append('clientId', safeId); fd.append('file', file);
        try { await api.post('/media/upload', fd, { headers: { "Content-Type": undefined } }); const res = await api.get(`/media/library?clientId=${id}`); setAvailableMedia(res.data); showToast('Archivo subido'); } catch(e) { const msg = e.response?.data?.error || 'Fallo al subir'; showAlert('danger', 'Error', msg); } finally { setLoaders(p => ({...p, uploading: false})); e.target.value = null; }
    };
    
    const handleAddToPlaylistLocal = (mediaId) => { 
        if(!selectedEntity) return; 
        const mediaSelected = availableMedia.find(m => m.id === mediaId); if(!mediaSelected) return; 
        const newItem = { item_id: `temp-${Date.now()}-${Math.random().toString(36).substr(2,5)}`, media_id: mediaId, url: mediaSelected.url, type: mediaSelected.type, custom_duration: 10, display_order: playlist.length }; 
        setPlaylist(prev => [...prev, newItem]); 
        if(isLibraryOpen) { showToast("Añadido a Playlist"); }
    };

    const handleSaveAllChanges = async () => {
        if (!selectedEntity || !hasUnsavedChanges) return; setLoaders(prev => ({...prev, saving: true}));
        try {
            const isGroup = selectedEntity.type === 'group'; const entityId = selectedEntity.data.id; const original = originalPlaylistRef.current; const current = playlist;
            const origIds = new Set(original.map(i => i.item_id)); const currIds = new Set(current.filter(i=>!String(i.item_id).startsWith('temp-')).map(i => i.item_id));
            const toDelete = original.filter(i => !currIds.has(i.item_id)); 
            const toAdd = current.filter(i => String(i.item_id).startsWith('temp-')); 
            const toUpdate = current.filter(i => !String(i.item_id).startsWith('temp-') && original.find(o => o.item_id === i.item_id)?.custom_duration != i.custom_duration);
            const promises = []; 
            toDelete.forEach(item => promises.push(api.delete(`/playlist/${item.item_id}`))); 
            toUpdate.forEach(item => promises.push(api.put(`/playlist/${item.item_id}`, { duration: parseInt(item.custom_duration) })));
            toAdd.forEach(item => { const payload = { mediaId: item.media_id, duration: parseInt(item.custom_duration) }; if(isGroup) payload.groupId = entityId; else payload.screenId = entityId; promises.push(api.post('/playlist', payload)); });
            await Promise.all(promises);
            const route = isGroup ? `/admin/groups/${entityId}/playlist` : `/playlist/${entityId}`; const freshRes = await api.get(route);
            setPlaylist(freshRes.data); originalPlaylistRef.current = JSON.parse(JSON.stringify(freshRes.data)); 
            setHasUnsavedChanges(false); showToast('Guardado correctamente');
        } catch (e) { console.error(e); showAlert('danger', 'Error', 'Ocurrió un error al guardar.'); } finally { setLoaders(prev => ({...prev, saving: false})); }
    };

    const findContainer = (id) => { if (id in items) return id; return Object.keys(items).find((key) => items[key].includes(id)); };
    const handleDragOver = useCallback((event) => {
        const { active, over } = event; const overId = over?.id; if (overId == null || active.id === overId) return;
        const activeContainer = findContainer(active.id); const overContainer = (overId in items) ? overId : findContainer(overId);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;
        setItems((prev) => {
            const activeItems = prev[activeContainer]; const overItems = prev[overContainer]; const activeIndex = activeItems.indexOf(active.id); 
            let newIndex;
            if (overId in prev) { newIndex = overItems.length + 1; }
            else { const overIndex = overItems.indexOf(overId); const isBelowOverItem = over && over.rect.top + over.rect.height > over.rect.top && over.rect.left + over.rect.width > over.rect.left; const modifier = isBelowOverItem ? 1 : 0; newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1; }
            return { ...prev, [activeContainer]: [...prev[activeContainer].filter((item) => item !== active.id)], [overContainer]: [...prev[overContainer].slice(0, newIndex), items[activeContainer][activeIndex], ...prev[overContainer].slice(newIndex, prev[overContainer].length)] };
        });
    }, [items]);

    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event; const activeContainer = findContainer(active.id); const overContainer = (over?.id in items) ? over.id : findContainer(over?.id);
        if (activeContainer && overContainer) {
            const activeIndex = items[activeContainer].indexOf(active.id); const overIndex = items[overContainer].indexOf(over?.id);
            if (activeContainer === overContainer && activeIndex !== overIndex) { setItems((items) => ({...items, [activeContainer]: arrayMove(items[activeContainer], activeIndex, overIndex)})); }
        }
        setActiveId(null);
    }, [items]);

    const getActivePreviewContent = () => { if (!playlist || playlist.length === 0) return null; return playlist[currentPreviewIndex]; };

    if (loading) return <SidebarLayout><style>{STYLES}</style><div className="loading-screen"><Loader className="spin-anim" size={30}/></div></SidebarLayout>;
    if (!client) return <SidebarLayout><style>{STYLES}</style><div className="error-screen">Cliente no encontrado</div></SidebarLayout>;

    return (
        <SidebarLayout>
            <style>{STYLES}</style>
            
            <div className="header-container">
                <div><h1 className="page-title">{client?.name || 'Cargando...'}</h1><p className="subtitle">Mapa de Pantallas</p></div>
                <div className="header-actions">
                    <button onClick={() => setIsEditMode(!isEditMode)} className={`btn-secondary ${isEditMode ? 'btn-active-edit' : ''}`}>{isEditMode ? <Unlock size={18}/> : <Lock size={18}/>} {isEditMode ? 'Edición' : 'Bloqueado'}</button>
                    <div className="divider"></div>
                    <button onClick={() => setModals(p => ({...p, createGroup: true}))} className="btn-secondary"><FolderPlus size={18}/> Grupo</button>
                    <button onClick={addRow} className="btn-secondary" disabled={!isEditMode}><Layers size={18}/> Fila</button>
                    <button onClick={() => setModals(p => ({...p, createScreen: true}))} className="btn-primary"><Plus size={18}/> Pantalla</button>
                </div>
            </div>
            
            {groups.length > 0 && <div className="groups-section"><div className="section-label">Grupos de Sincronización</div><div className="groups-grid">{groups.map(g => <GroupCard key={g.id} group={g} onClick={() => handleEntityClick(g, 'group')} onDelete={id => handleDeleteGroup(id)} />)}</div></div>}
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="board-container">
                    {Object.keys(items).map(key => (
                        <SortableRow key={key} id={key} activeId={activeId} items={items[key]} screensData={screensData} groups={groups} onScreenClick={s => handleEntityClick(s, 'screen')} isSelected={selectedRowId === key} onSelectRow={setSelectedRowId} isEditMode={isEditMode} onDeleteRow={requestDeleteRow} onEditScreen={s => { setEditingScreen(s); setModals(p => ({...p, editScreen: true})); }} onDeleteScreen={confirmDeleteScreen} />
                    ))}
                </div>
                <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.6' } } })}>{activeId ? <div style={{width:'180px', height:'100px', background:'#3b82f6', borderRadius:'16px', opacity:0.8}}></div> : null}</DragOverlay>
            </DndContext>
            
            {modals.createScreen && <div className="overlay-backdrop" onClick={() => setModals(p => ({...p, createScreen: false}))}><div className="modern-modal alert-box" onClick={e => e.stopPropagation()}>
                <h3>Nueva Pantalla</h3>
                <form onSubmit={handleCreateScreen}>
                    <input autoFocus type="text" placeholder="Nombre" value={inputs.screenName} onChange={e => setInputs(p => ({...p, screenName: e.target.value}))} style={{width:'100%', padding:'12px', border:'1px solid #cbd5e1', borderRadius:'8px', marginBottom:'15px'}} />
                    <div style={{marginBottom: '15px'}}><label style={{display:'block', textAlign:'left', fontSize:'12px', fontWeight:'700', color:'#64748b', marginBottom:'5px'}}>Asignar a Grupo (Opcional)</label><select value={inputs.selectedGroup} onChange={e => setInputs(p => ({...p, selectedGroup: e.target.value}))} style={{width:'100%', padding:'10px', border:'1px solid #cbd5e1', borderRadius:'8px', background:'white'}}><option value="">Ninguno</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
                    <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}><button type="button" onClick={() => setInputs(p=>({...p, orientation:'horizontal'}))} className={`btn-secondary ${inputs.orientation === 'horizontal' ? 'btn-active-edit' : ''}`} style={{flex:1}}>Horizontal</button><button type="button" onClick={() => setInputs(p=>({...p, orientation:'vertical'}))} className={`btn-secondary ${inputs.orientation === 'vertical' ? 'btn-active-edit' : ''}`} style={{flex:1}}>Vertical</button></div>
                    <button type="submit" className="btn-primary" style={{width:'100%', justifyContent:'center'}}>Crear</button>
                </form>
            </div></div>}
            {modals.createGroup && <div className="overlay-backdrop" onClick={() => setModals(p => ({...p, createGroup: false}))}><div className="modern-modal alert-box" onClick={e => e.stopPropagation()}><h3>Nuevo Grupo</h3><form onSubmit={handleCreateGroup}><input autoFocus type="text" placeholder="Nombre del Grupo" value={inputs.groupName} onChange={e => setInputs(p => ({...p, groupName: e.target.value}))} style={{width:'100%', padding:'12px', border:'1px solid #cbd5e1', borderRadius:'8px', marginBottom:'15px'}} /><button type="submit" className="btn-primary" style={{width:'100%', justifyContent:'center'}}>Crear Grupo</button></form></div></div>}
            
            {/* --- MODAL DE EDICIÓN --- */}
            {selectedEntity && <div className="overlay-backdrop" onClick={() => hasUnsavedChanges ? showAlert('warning', 'Salir', 'Cambios pendientes', null, true, handleSaveAllChanges) : setSelectedEntity(null)}>
                <div className="modal-container" onClick={e => e.stopPropagation()}>
                    <button className="btn-close-global" onClick={() => hasUnsavedChanges ? showAlert('warning', 'Salir', 'Cambios pendientes', null, true, handleSaveAllChanges) : setSelectedEntity(null)}><X size={20}/></button>
                    
                    <div className="modal-left-panel">
                        <div className="preview-container-wrapper">
                            <div style={{padding:'20px', textAlign:'center', width:'100%'}}>
                                <h2 style={{margin:0, color:'white'}}>{selectedEntity.data.name}</h2>
                                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'5px', opacity:0.7, fontSize:'13px', color:'white'}}>
                                    {selectedEntity.type === 'screen' ? <><div style={{width:'8px', height:'8px', borderRadius:'50%', background: selectedEntity.data.status === 'online' ? '#4ade80' : '#f87171'}}></div>{selectedEntity.data.status === 'online' ? 'Online' : 'Offline'}</> : <><Layers size={14}/> <span>Grupo Sincronizado</span></>}
                                </div>
                            </div>

                            {/* CAJA DE PREVIEW INTELIGENTE (Responsive) */}
                            <div 
                                className={`preview-box ${selectedEntity.data.orientation === 'vertical' ? 'vertical' : 'horizontal'}`}
                                onClick={() => setFullScreenPreview(true)}
                            >
                                <div style={{position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.5)', borderRadius:'4px', padding:'4px', zIndex:10}}><Maximize2 size={16} color="white"/></div>
                                {playlist.length > 0 ? (
                                    getActivePreviewContent()?.type === 'video' ? 
                                    <video src={getActivePreviewContent().url} autoPlay muted loop className={`preview-content ${selectedEntity.data.orientation === 'vertical' ? 'contain' : ''}`} /> : 
                                    <img src={getActivePreviewContent()?.url} className="preview-content" alt=""/>
                                ) : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.3, color:'white'}}><Play size={40}/></div>}
                            </div>
                        </div>
                        
                        {/* Controles visibles en movil ahora tambien */}
                        {selectedEntity.type === 'screen' && !selectedEntity.data.group_id && <div className="hide-on-mobile-small" style={{marginTop:'30px', width:'90%', padding:'20px', borderRadius:'12px', background: selectedEntity.data.status === 'online' ? 'transparent' : 'rgba(255,255,255,0.05)'}}>{selectedEntity.data.status === 'online' ? <div style={{textAlign:'center'}}><p style={{color:'#4ade80', fontWeight:'bold', marginBottom:'15px', fontSize:'14px'}}>● Pantalla Vinculada</p><button onClick={handleUnlinkTV} className="btn-danger-action"><Unlink size={18}/> Desvincular Dispositivo</button></div> : <><input type="text" placeholder="CÓDIGO TV" maxLength={4} value={inputs.pairingCode} onChange={e => setInputs(p => ({...p, pairingCode: e.target.value.toUpperCase()}))} style={{width:'100%', padding:'10px', textAlign:'center', marginBottom:'10px', background:'transparent', border:'1px solid #475569', color:'white', borderRadius:'8px'}} /><button onClick={handleLinkTV} className="btn-primary" style={{width:'100%', justifyContent:'center'}}>Vincular</button></>}</div>}
                    </div>

                    <div className="modal-right-panel">
                        <div className="header-actions" style={{padding:'20px', borderBottom:'1px solid #e2e8f0', justifyContent:'space-between'}}>
                            <h3 style={{margin:0, color:'#1e293b'}}>Contenido</h3>
                            {(!selectedEntity.data.group_id || selectedEntity.type === 'group') && <button onClick={handleSaveAllChanges} disabled={!hasUnsavedChanges || loaders.saving} className={`btn-primary ${!hasUnsavedChanges ? 'disabled' : ''}`} style={{opacity: hasUnsavedChanges ? 1 : 0.5}}>{loaders.saving ? <Loader className="spin-anim"/> : <Save size={18}/>} Guardar</button>}
                        </div>
                        
                        <div style={{flex:1, overflowY:'auto', padding:'20px'}}>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => { const {active, over} = e; if(active.id !== over.id) setPlaylist(items => arrayMove(items, items.findIndex(i=>i.item_id===active.id), items.findIndex(i=>i.item_id===over.id))); }}>
                                <SortableContext items={playlist.map(p => p.item_id)} strategy={rectSortingStrategy}>
                                    {playlist.map((item, i) => <SortablePlaylistItem key={item.item_id} index={i} item={item} onRemove={id => setPlaylist(p => p.filter(x => x.item_id !== id))} onUpdateDuration={(id, val) => setPlaylist(p => p.map(x => x.item_id === id ? {...x, custom_duration: val} : x))} />)}
                                </SortableContext>
                            </DndContext>
                        </div>

                        <div className="library-quick-view">
                            <div className="library-header">
                                <div className="library-title"><ImageIcon size={16} color="#64748b"/><span>Biblioteca Reciente</span><span style={{fontSize:'11px', color:'#94a3b8', fontWeight:'normal'}}>({availableMedia.length})</span></div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <label className="btn-secondary" style={{padding:'6px 12px', fontSize:'12px', height:'auto'}}><Plus size={14}/> Subir<input type="file" hidden onChange={handleFileUpload}/></label>
                                    <button onClick={() => setIsLibraryOpen(true)} className="btn-view-all"><Grid size={14}/> Ver todo</button>
                                </div>
                            </div>
                            <div className="quick-scroll-track">
                                {availableMedia.slice(0, 6).map(m => (
                                    <div key={m.id} className="media-card" style={{minWidth:'120px', height:'100%'}} onClick={() => handleAddToPlaylistLocal(m.id)}>
                                        <div className="media-card-thumb"><span className="media-type-badge">{m.type === 'video' ? 'VIDEO' : 'IMG'}</span>{m.type === 'video' ? <div className="video-overlay"><Play size={24} color="white" fill="white"/></div> : <img src={m.url} alt="media" />}<div className="btn-add-overlay"><Plus size={18}/></div></div>
                                        <div className="media-card-footer">{m.name}</div>
                                    </div>
                                ))}
                                <div onClick={() => setIsLibraryOpen(true)} style={{minWidth:'100px', borderRadius:'10px', border:'2px dashed #cbd5e1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#64748b', cursor:'pointer', gap:'5px', fontSize:'12px', fontWeight:'600'}}><Grid size={20}/>Ver todo</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>}
            
            {/* --- MODAL FULLSCREEN PREVIEW --- */}
            {fullScreenPreview && (
                <div className="preview-backdrop" onClick={() => setFullScreenPreview(false)}>
                    <div className={`tv-frame ${selectedEntity.data.orientation === 'vertical' ? 'vertical' : 'horizontal'}`} onClick={e => e.stopPropagation()}>
                        <button className="btn-close-preview" onClick={() => setFullScreenPreview(false)}><ArrowLeft size={18}/> Salir</button>
                        {getActivePreviewContent() ? (
                            getActivePreviewContent().type === 'video' ? 
                            <video src={getActivePreviewContent().url} autoPlay muted loop controls style={{width:'100%', height:'100%', objectFit:'contain'}} /> :
                            <img src={getActivePreviewContent().url} alt="preview" style={{width:'100%', height:'100%', objectFit:'contain'}} />
                        ) : (<div style={{color:'white'}}>Sin contenido</div>)}
                    </div>
                </div>
            )}

            {/* --- MODAL BIBLIOTECA COMPLETA (TABS) --- */}
            {isLibraryOpen && (
                <div className="overlay-backdrop library-mode" onClick={() => { setIsLibraryOpen(false); setSelectedLibraryItem(null); }}>
                    <div className="library-modal-content" onClick={e => e.stopPropagation()}>
                        {selectedLibraryItem ? (
                            <div className="library-detail-view" style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0f172a', padding:20, position:'relative'}}>
                                <button onClick={() => setSelectedLibraryItem(null)} className="btn-secondary" style={{position:'absolute', top:20, left:20, zIndex:10}}><ArrowLeft size={16}/> Volver</button>
                                <div className="tv-limit-box">
                                    <div className="tv-limit-label">1920 x 1080 LIMITS</div>
                                    {selectedLibraryItem.type === 'video' ? <video src={selectedLibraryItem.url} controls style={{width:'100%', height:'100%', objectFit:'contain'}}/> : <img src={selectedLibraryItem.url} style={{width:'100%', height:'100%', objectFit:'contain'}} alt=""/>}
                                </div>
                                <div style={{marginTop:'20px'}}><button className="btn-primary" style={{padding:'15px 30px', fontSize:'16px'}} onClick={() => { handleAddToPlaylistLocal(selectedLibraryItem.id); showToast('Añadido a playlist'); setIsLibraryOpen(false); }}><Plus size={20}/> Añadir a Pantalla</button></div>
                            </div>
                        ) : (
                            <>
                                <div className="library-toolbar">
                                    <div style={{minWidth:'200px'}}><h2 style={{margin:0, fontSize:'20px', color:'#1e293b'}}>Biblioteca</h2><p style={{margin:'5px 0 0', fontSize:'13px', color:'#64748b'}}>Gestiona tu contenido</p></div>
                                    <div className="library-tabs">
                                        <button className={`lib-tab ${libraryFilter==='all'?'active':''}`} onClick={()=>setLibraryFilter('all')}><Folder size={16}/> Todo</button>
                                        <button className={`lib-tab ${libraryFilter==='image'?'active':''}`} onClick={()=>setLibraryFilter('image')}><ImageIcon size={16}/> Imágenes</button>
                                        <button className={`lib-tab ${libraryFilter==='video'?'active':''}`} onClick={()=>setLibraryFilter('video')}><Play size={16}/> Videos</button>
                                    </div>
                                    <div className="search-bar-wrapper"><Search className="search-icon-input" size={16}/><input type="text" placeholder="Buscar..." className="library-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
                                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}><label className="btn-primary" style={{cursor:'pointer'}}><Plus size={18}/> Subir <input type="file" hidden onChange={handleFileUpload}/></label><button onClick={() => setIsLibraryOpen(false)} className="btn-secondary" style={{width:'36px', height:'36px', padding:0, justifyContent:'center'}}><X size={20}/></button></div>
                                </div>
                                <div className="library-browser">
                                    <div className="library-main-area">
                                        <div className="library-grid-container">
                                            {availableMedia.filter(m => (libraryFilter==='all' || m.type===libraryFilter) && m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                                                <div key={m.id} className="media-card" onClick={() => setSelectedLibraryItem(m)}>
                                                    <div className="media-card-thumb"><span className="media-type-badge">{m.type === 'video' ? 'VIDEO' : 'IMG'}</span>{m.type === 'video' ? <div className="video-overlay"><Play size={32} color="white" fill="white"/></div> : <img src={m.url} alt="media" loading="lazy" />}<div className="btn-add-overlay"><Monitor size={24}/> Ver</div></div>
                                                    <div className="media-card-footer">{m.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* MOVIDO AL FINAL DEL DOM PARA ASEGURAR VISIBILIDAD */}
            <CustomAlert config={alertConfig} onClose={closeAlert} />
            <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} />

        </SidebarLayout>
    );
}