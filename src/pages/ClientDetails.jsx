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
    AlertTriangle, CheckCircle, Link as LinkIcon, Unlink, Upload, Loader, 
    Save, Clock, Edit2, Image as ImageIcon, Folder, FolderPlus, Monitor, Wifi
} from 'lucide-react';

// ==========================================
// 1. COMPONENTES UI REUTILIZABLES
// ==========================================

const CustomAlert = ({ config, onClose }) => {
    if (!config.isOpen) return null;
    
    const themes = {
        danger: { icon: <Trash2 size={24}/>, className: 'alert-danger' },
        warning: { icon: <AlertTriangle size={24}/>, className: 'alert-warning' },
        info: { icon: <CheckCircle size={24}/>, className: 'alert-info' }
    };
    const theme = themes[config.type] || themes.info;

    return (
        <div className="overlay-backdrop">
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

// ==========================================
// 2. ITEMS DND MEMOIZADOS
// ==========================================

const SortablePlaylistItem = memo(({ item, onRemove, onUpdateDuration, index }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.item_id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`playlist-item ${isDragging ? 'dragging' : ''} ${String(item.item_id).startsWith('temp-') ? 'is-temp' : ''}`}>
            <div className="playlist-thumb">
                {item.type === 'video' ? <div className="video-placeholder"><Play size={20} color="white"/></div> : <img src={item.url} alt="" />}
                <span className="index-badge">#{index + 1}</span>
            </div>
            <div className="playlist-content">
                <div className="playlist-details">
                    <span className="file-type">{item.type === 'video' ? 'Video' : 'Imagen'}</span>
                </div>
                <div className="playlist-actions">
                    {item.type !== 'video' ? (
                        <div className="duration-wrapper" onPointerDown={e => e.stopPropagation()}>
                            <Clock size={12} className="text-gray" />
                            <input type="number" min="1" value={item.custom_duration || 10} onChange={(e) => onUpdateDuration(item.item_id, e.target.value)} className="duration-input" />
                            <span className="unit">s</span>
                        </div>
                    ) : <span className="auto-badge"><Play size={10}/> Auto</span>}
                    <button onPointerDown={e => e.stopPropagation()} onClick={() => onRemove(item.item_id)} className="btn-icon-delete"><Trash2 size={14} /></button>
                </div>
            </div>
        </div>
    );
});

const GroupCard = memo(({ group, onClick, onDelete }) => (
    <div className="group-card" onClick={onClick}>
        <div className="group-card-visual">
            <div className="group-icon-content">
                <Folder size={40} strokeWidth={1.5} />
                <span className="group-badge">{group.screen_count || 0} TVs</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(group.id); }} className="btn-delete-absolute"><Trash2 size={14} /></button>
        </div>
        <div className="item-label">{group.name}</div>
    </div>
));

const ScreenItem = memo(({ id, screen, onClick, isEditMode, onEditScreen, onDeleteScreen, groups }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(id), disabled: !isEditMode, data: { type: 'item', screen } });
    
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 999 : 1 };
    const isGrouped = screen.group_id != null;
    const groupName = isGrouped && groups ? groups.find(g => g.id === screen.group_id)?.name : null;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="screen-item-wrapper">
            <div onClick={(e) => { if(isEditMode) return; onClick(); }} className={`screen-card ${screen.orientation} ${isGrouped ? 'grouped' : ''} ${isEditMode ? 'edit-mode' : ''}`}>
                {isGrouped && <div className="grouped-tag"><LinkIcon size={10}/> {groupName || 'Grupo'}</div>}
                
                {screen.thumbnails?.length > 0 ? (
                    <div className="screen-thumb" style={{backgroundImage: `url(${screen.thumbnails[0]})`}}></div>
                ) : (
                    <div className="screen-placeholder">
                        {screen.orientation === 'horizontal' ? <Tv size={40}/> : <Smartphone size={40}/>}
                    </div>
                )}

                <div className={`status-dot ${screen.status === 'online' ? 'online' : 'offline'}`}></div>

                {isEditMode && (
                    <>
                        <div className="drag-handle"><Layers size={14}/></div>
                        <div className="edit-actions">
                            <button onPointerDown={e => e.stopPropagation()} onClick={(e) => {e.stopPropagation(); onEditScreen(screen)}} className="btn-mini edit"><Edit2 size={12}/></button>
                            <button onPointerDown={e => e.stopPropagation()} onClick={(e) => {e.stopPropagation(); onDeleteScreen(screen.id)}} className="btn-mini delete"><Trash2 size={12}/></button>
                        </div>
                    </>
                )}
            </div>
            <div className="item-label">{screen.name}</div>
        </div>
    );
});

const SortableRow = memo(({ id, items, screensData, groups, onScreenClick, isSelected, onSelectRow, isEditMode, onDeleteRow, onEditScreen, onDeleteScreen }) => {
    const { setNodeRef } = useSortable({ id: String(id), data: { type: 'container' }, disabled: true });
    
    return (
        <div ref={setNodeRef} onClick={() => onSelectRow(String(id))} className={`row-container ${isSelected ? 'selected' : ''} ${isEditMode ? 'edit-mode' : ''}`}>
            <div className="row-header">
                <div className={`row-title ${isSelected ? 'active' : ''}`}>
                    <Layers size={16} /> <span>Fila {parseInt(id) + 1}</span> 
                    {isSelected && <span className="badge-selected">SELECCIONADA</span>}
                </div>
                {isEditMode && <button onClick={(e) => { e.stopPropagation(); onDeleteRow(String(id), items); }} className="btn-row-delete"><Trash2 size={14} /> Eliminar Fila</button>}
            </div>
            <div className="row-items-grid">
                <SortableContext id={String(id)} items={items} strategy={rectSortingStrategy}>
                    {items.map((screenId) => {
                        const screen = screensData.find(s => String(s.id) === String(screenId));
                        if (!screen) return null;
                        return <ScreenItem key={screenId} id={screenId} screen={screen} groups={groups} onClick={() => onScreenClick(screen)} isEditMode={isEditMode} onEditScreen={onEditScreen} onDeleteScreen={onDeleteScreen} />;
                    })}
                </SortableContext>
                {items.length === 0 && isEditMode && <div className="empty-row-placeholder">Arrastra pantallas aquí</div>}
            </div>
        </div>
    );
});

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================

export default function ClientDetails() {
    const { id } = useParams();
    
    // --- ESTADOS DE DATOS ---
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [screensData, setScreensData] = useState([]);
    const [groups, setGroups] = useState([]);
    const [items, setItems] = useState({ "0": [] });
    const [availableMedia, setAvailableMedia] = useState([]);
    
    // --- ESTADOS DE UI/CONTROL ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [selectedRowId, setSelectedRowId] = useState("0");
    const [selectedEntity, setSelectedEntity] = useState(null); 
    
    // --- ESTADOS DE PLAYLIST ---
    const [playlist, setPlaylist] = useState([]);
    const originalPlaylistRef = useRef([]);
    const [groupScreens, setGroupScreens] = useState([]); 
    const originalGroupScreensRef = useRef([]); 
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

    // --- MODALES Y FORMS ---
    const [modals, setModals] = useState({ createScreen: false, createGroup: false, editScreen: false });
    const [inputs, setInputs] = useState({ screenName: '', groupName: '', orientation: 'horizontal', pairingCode: '' });
    const [editingScreen, setEditingScreen] = useState(null);

    // --- FEEDBACK ---
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [loaders, setLoaders] = useState({ uploading: false, saving: false });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => { fetchData(); }, [id]);

    useEffect(() => {
        if (!playlist?.length) return;
        const currentItem = playlist[currentPreviewIndex];
        if (!currentItem) { setCurrentPreviewIndex(0); return; }
        const duration = (parseInt(currentItem.custom_duration) || 10) * 1000;
        const timer = setTimeout(() => {
            setCurrentPreviewIndex(prev => (prev + 1) % playlist.length);
        }, duration);
        return () => clearTimeout(timer);
    }, [playlist, currentPreviewIndex]);

    useEffect(() => {
        if (!selectedEntity) return;
        if (selectedEntity.type === 'screen' && selectedEntity.data.group_id) {
            setHasUnsavedChanges(false); return;
        }
        let changed = false;
        const original = originalPlaylistRef.current;
        if (playlist.length !== original.length) changed = true;
        else {
            for (let i = 0; i < playlist.length; i++) {
                if (playlist[i].item_id !== original[i].item_id || 
                    String(playlist[i].item_id).startsWith('temp-') || 
                    parseInt(playlist[i].custom_duration) !== parseInt(original[i].custom_duration)) {
                    changed = true; break;
                }
            }
        }
        if (selectedEntity.type === 'group') {
            const origSet = new Set(originalGroupScreensRef.current);
            const currSet = new Set(groupScreens);
            if (origSet.size !== currSet.size) changed = true;
            else { for (let x of currSet) if (!origSet.has(x)) changed = true; }
        }
        setHasUnsavedChanges(changed);
    }, [playlist, groupScreens, selectedEntity]);

    const fetchData = async () => {
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
            organizeDataIntoRows(screensRes.data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const organizeDataIntoRows = (data) => {
        const grouped = {};
        data.forEach(s => { const r = String(s.row_index || 0); if (!grouped[r]) grouped[r] = []; grouped[r].push(s); });
        const finalItems = {};
        Object.keys(grouped).sort((a,b) => parseInt(a) - parseInt(b)).forEach(key => { 
            finalItems[key] = grouped[key].sort((a,b) => (a.display_order || 0) - (b.display_order || 0)).map(s => String(s.id)); 
        });
        if (Object.keys(finalItems).length === 0) finalItems["0"] = [];
        setItems(finalItems);
    };

    const handleEntityClick = async (entity, type) => {
        if (hasUnsavedChanges) {
            showAlert('warning', 'Cambios sin guardar', '¿Qué deseas hacer?', null, true, async () => {
                await handleSaveAllChanges();
                loadEntity(entity, type);
            });
            return;
        }
        loadEntity(entity, type);
    };

    const loadEntity = async (entity, type) => {
        setSelectedEntity({ type, data: entity });
        setCurrentPreviewIndex(0);
        setInputs(prev => ({ ...prev, pairingCode: '' }));
        try {
            if (type === 'screen') {
                if (entity.group_id) {
                    const res = await api.get(`/admin/groups/${entity.group_id}/playlist`);
                    setPlaylist(res.data);
                    originalPlaylistRef.current = JSON.parse(JSON.stringify(res.data));
                } else {
                    const res = await api.get(`/playlist/${entity.id}`);
                    setPlaylist(res.data);
                    originalPlaylistRef.current = JSON.parse(JSON.stringify(res.data));
                }
            } else { 
                const res = await api.get(`/admin/groups/${entity.id}/playlist`);
                setPlaylist(res.data);
                originalPlaylistRef.current = JSON.parse(JSON.stringify(res.data));
                const assigned = screensData.filter(s => s.group_id === entity.id).map(s => s.id);
                setGroupScreens(assigned);
                originalGroupScreensRef.current = [...assigned];
            }
        } catch (e) { console.error(e); }
    };

    // --- ACCIONES AGREGADAS Y CORREGIDAS ---
    const addRow = () => {
        const newKey = String(Object.keys(items).length + Math.floor(Math.random()*1000));
        setItems({ ...items, [newKey]: [] });
        setSelectedRowId(newKey);
        setIsEditMode(true);
    };

    const handleCreateScreen = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/screens', { 
                clientId: id, 
                name: inputs.screenName, 
                orientation: inputs.orientation, 
                row_index: parseInt(selectedRowId) 
            });
            setModals(p => ({...p, createScreen: false}));
            setInputs(p => ({...p, screenName: ''}));
            fetchData();
            showToast('Pantalla creada');
        } catch (e) { console.error(e); showAlert('danger', 'Error', 'No se pudo crear pantalla'); }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/groups', { clientId: id, name: inputs.groupName });
            setModals(p => ({...p, createGroup: false}));
            setInputs(p => ({...p, groupName: ''}));
            fetchData();
            showToast('Grupo creado');
        } catch (e) { console.error(e); }
    };

    const handleDeleteGroup = (groupId) => {
        showAlert('danger', '¿Eliminar Grupo?', 'Las pantallas quedarán sueltas.', async () => {
            closeAlert();
            try { await api.delete(`/admin/groups/${groupId}`); fetchData(); showToast('Grupo eliminado'); } catch (e) { console.error(e); }
        });
    };

    const requestDeleteRow = (rowId, rowItems) => {
        showAlert('danger', 'Borrar Fila', 'Se borrarán las pantallas.', () => {
            closeAlert();
            Promise.all(rowItems.map(sid => api.delete(`/admin/screens/${sid}`)))
                .then(() => {
                    const n = {...items};
                    delete n[rowId];
                    setItems(n);
                    fetchData();
                });
        });
    };

    const confirmDeleteScreen = (id) => {
        const clean = String(id).split(':')[0];
        showAlert('danger', 'Borrar Pantalla', 'Confirmar acción', async () => {
            closeAlert();
            await api.delete(`/admin/screens/${clean}`);
            fetchData();
        });
    };

    const handleLinkTV = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/screens/link', { 
                screenId: selectedEntity.data.id, 
                pairingCode: inputs.pairingCode 
            });
            fetchData();
            showToast('Vinculado');
            // Actualizamos estado local
            setSelectedEntity(prev => ({...prev, data: {...prev.data, status:'online'}}));
        } catch(e){ console.error(e); showAlert('danger', 'Error', 'Código inválido'); }
    };

    const handleUnlinkTV = () => {
        showAlert('danger', 'Desvincular', 'La pantalla dejará de recibir contenido. ¿Seguro?', async () => {
            closeAlert();
            try {
                await api.post('/admin/screens/unlink', { screenId: selectedEntity.data.id });
                fetchData();
                showToast('Desvinculado correctamente');
                // Actualizamos estado local para que aparezca el input de nuevo
                setSelectedEntity(prev => ({...prev, data: {...prev.data, status:'offline'}}));
            } catch (e) {
                console.error(e);
                showAlert('danger', 'Error', 'No se pudo desvincular');
            }
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setLoaders(p => ({...p, uploading: true}));
        const fd = new FormData();
        const safeId = id ? String(id) : 'general';
        fd.append('clientId', safeId);
        fd.append('file', file);
        try {
            await api.post('/media/upload', fd, { headers: { "Content-Type": undefined } });
            const res = await api.get(`/media/library?clientId=${id}`);
            setAvailableMedia(res.data);
            showToast('Archivo subido');
        } catch(e) { 
            const msg = e.response?.data?.error || 'Fallo al subir';
            showAlert('danger', 'Error', msg); 
        } 
        finally { 
            setLoaders(p => ({...p, uploading: false}));
            e.target.value = null; 
        }
    };
    
    const handleAddToPlaylistLocal = (mediaId) => {
        if(!selectedEntity) return;
        const mediaSelected = availableMedia.find(m => m.id === mediaId);
        if(!mediaSelected) return;
        const newItem = { 
            item_id: `temp-${Date.now()}-${Math.random().toString(36).substr(2,5)}`, 
            media_id: mediaId, 
            url: mediaSelected.url, 
            type: mediaSelected.type, 
            custom_duration: 10, 
            display_order: playlist.length 
        };
        setPlaylist(prev => [...prev, newItem]);
    };

    const handleSaveAllChanges = async () => {
        if (!selectedEntity || !hasUnsavedChanges) return;
        setLoaders(prev => ({...prev, saving: true}));
        try {
            const isGroup = selectedEntity.type === 'group';
            const entityId = selectedEntity.data.id;
            const original = originalPlaylistRef.current;
            const current = playlist;
            
            const origIds = new Set(original.map(i => i.item_id));
            const currIds = new Set(current.map(i => i.item_id));
            const toDelete = [...origIds].filter(id => !currIds.has(id));
            const toAdd = current.filter(i => String(i.item_id).startsWith('temp-'));
            const toUpdate = current.filter(i => !String(i.item_id).startsWith('temp-') && original.find(o => o.item_id === i.item_id)?.custom_duration !== i.custom_duration);

            const promises = [];
            toDelete.forEach(id => promises.push(api.delete(`/playlist/${id}`)));
            toAdd.forEach(item => promises.push(api.post('/playlist', { 
                [isGroup ? 'groupId' : 'screenId']: entityId, 
                mediaId: item.media_id, 
                duration: parseInt(item.custom_duration) 
            })));
            toUpdate.forEach(item => promises.push(api.put(`/playlist/${item.item_id}`, { duration: parseInt(item.custom_duration) })));

            if (isGroup) {
                const origS = new Set(originalGroupScreensRef.current);
                const currS = new Set(groupScreens);
                let changed = origS.size !== currS.size;
                if(!changed) for(let id of currS) if(!origS.has(id)) changed = true;
                if (changed) promises.push(api.put('/admin/groups/screens', { groupId: entityId, screenIds: groupScreens }));
            }

            await Promise.all(promises);

            const route = isGroup ? `/admin/groups/${entityId}/playlist` : `/playlist/${entityId}`;
            const freshRes = await api.get(route);
            let freshList = freshRes.data;
            const visualOrder = current.map(i => i.media_id);
            freshList.sort((a,b) => visualOrder.indexOf(a.media_id) - visualOrder.indexOf(b.media_id));
            await api.put('/playlist/reorder', { items: freshList.map((item, idx) => ({ id: item.item_id, order: idx })) });

            const finalRes = await api.get(route);
            setPlaylist(finalRes.data);
            originalPlaylistRef.current = JSON.parse(JSON.stringify(finalRes.data));
            
            if (isGroup) {
                originalGroupScreensRef.current = [...groupScreens];
                fetchData();
            }
            
            setHasUnsavedChanges(false);
            showToast('Guardado correctamente');
        } catch (e) {
            console.error(e);
            showAlert('danger', 'Error', 'Ocurrió un error al guardar.');
        } finally {
            setLoaders(prev => ({...prev, saving: false}));
        }
    };

    // --- DND HANDLERS ---
    const findContainer = (id) => { if (id in items) return id; return Object.keys(items).find((key) => items[key].includes(String(id))); };
    
    const handleDragOver = useCallback((event) => {
        const { active, over } = event;
        const overId = over?.id;
        if (overId == null || String(active.id) === String(overId)) return;
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(overId);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setItems((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.indexOf(String(active.id));
            const overIndex = overItems.indexOf(String(overId));
            let newIndex;
            if (overId in prev) { newIndex = overItems.length + 1; } 
            else {
                const isBelowOverItem = over && over.rect.top + over.rect.height > over.rect.top && over.rect.left + over.rect.width > over.rect.left;
                newIndex = overIndex >= 0 ? overIndex + (isBelowOverItem ? 1 : 0) : overItems.length + 1;
            }
            return {
                ...prev,
                [activeContainer]: prev[activeContainer].filter((item) => item !== active.id),
                [overContainer]: [...prev[overContainer].slice(0, newIndex), items[activeContainer][activeIndex], ...prev[overContainer].slice(newIndex, prev[overContainer].length)],
            };
        });
    }, [items]);

    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over?.id);

        if (activeContainer && overContainer) {
            const activeIndex = items[activeContainer].indexOf(String(active.id));
            const overIndex = items[overContainer].indexOf(String(over?.id));
            if (activeIndex !== overIndex || activeContainer !== overContainer) {
                setItems((prev) => {
                    const newItems = { ...prev };
                    if (activeContainer === overContainer) newItems[activeContainer] = arrayMove(prev[activeContainer], activeIndex, overIndex);
                    api.put('/admin/screens/reorder', { rows: newItems }).catch(console.error);
                    return newItems;
                });
            }
        }
        setActiveId(null);
    }, [items]);

    // --- RENDER HELPERS ---
    const showAlert = (type, title, message, onConfirm, isExitConfirmation, onSaveAndExit) => setAlertConfig({ isOpen: true, type, title, message, onConfirm: () => { setAlertConfig(p => ({...p, isOpen:false})); onConfirm && onConfirm(); }, isExitConfirmation, onSaveAndExit });
    const closeAlert = () => setAlertConfig(p => ({...p, isOpen:false}));
    const showToast = (msg, type='success') => { setToast({visible:true, message:msg, type}); setTimeout(() => setToast(p=>({...p, visible:false})), 3000); };

    if (loading) return <SidebarLayout><div className="loading-screen"><Loader className="spin-anim" size={30}/></div></SidebarLayout>;
    if (!client) return <SidebarLayout><div className="error-screen">Cliente no encontrado</div></SidebarLayout>;

    return (
        <SidebarLayout>
            {/* INYECCIÓN DE ESTILOS CSS */}
            <style>{`
                .loading-screen, .error-screen { display: flex; justify-content: center; align-items: center; height: 50vh; color: #94a3b8; }
                .spin-anim { animation: spin 1s infinite linear; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .page-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
                .subtitle { color: #64748b; margin-top: 5px; font-size: 14px; }
                .header-actions { display: flex; gap: 12px; align-items: center; }
                .divider { width: 1px; height: 30px; background: #cbd5e1; }
                
                .btn-primary { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
                .btn-primary:hover { background: #2563eb; }
                .btn-secondary { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 10px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
                .btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; }
                .btn-active-edit { color: #e11d48; border-color: #fecdd3; background: #fff1f2; }
                .btn-mini { width: 24px; height: 24px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: white; transition: transform 0.1s; }
                .btn-mini:hover { transform: scale(1.1); }
                .btn-mini.edit { color: #3b82f6; }
                .btn-mini.delete { color: #ef4444; }

                .groups-section { margin-bottom: 30px; }
                .section-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
                .groups-grid { display: flex; gap: 15px; flex-wrap: wrap; }
                .group-card { cursor: pointer; width: 200px; transition: transform 0.2s; }
                .group-card:hover { transform: translateY(-3px); }
                .group-card-visual { height: 120px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 16px; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(109, 40, 217, 0.3); }
                .group-icon-content { color: white; display: flex; flexDirection: column; align-items: center; gap: 8px; }
                .group-badge { background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
                .btn-delete-absolute { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.2); border: none; color: white; width: 26px; height: 26px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }

                .board-container { display: flex; flexDirection: column; gap: 20px; padding-bottom: 100px; }
                .row-container { padding: 20px; border: 2px solid #e2e8f0; border-radius: 20px; min-height: 180px; transition: all 0.2s; background: transparent; }
                .row-container.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.02); }
                .row-container.edit-mode { border-style: dashed; border-color: #94a3b8; }
                .row-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
                .row-title { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 13px; }
                .row-title.active { color: #3b82f6; }
                .badge-selected { background: #3b82f6; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; }
                .btn-row-delete { background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
                .row-items-grid { display: flex; flex-wrap: wrap; gap: 25px; align-items: flex-start; min-height: 120px; }
                .empty-row-placeholder { width: 100%; height: 100px; border: 2px dashed #cbd5e1; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; }

                .screen-item-wrapper { position: relative; }
                .screen-card { width: 200px; height: 120px; border-radius: 16px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); }
                .screen-card.vertical { width: 110px; height: 190px; }
                .screen-card.grouped { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3); }
                .screen-card:hover { transform: translateY(-3px); }
                .screen-card.edit-mode { cursor: grab; }
                .grouped-tag { position: absolute; top: 0; width: 100%; background: rgba(0,0,0,0.3); color: white; font-size: 10px; font-weight: 700; text-align: center; padding: 3px; z-index: 5; display: flex; justify-content: center; gap: 4px; }
                .screen-thumb { width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0.9; }
                .screen-placeholder { opacity: 0.5; color: white; }
                .status-dot { width: 10px; height: 10px; border-radius: 50%; position: absolute; bottom: 10px; right: 10px; border: 2px solid rgba(255,255,255,0.2); }
                .status-dot.online { background: #4ade80; box-shadow: 0 0 5px #4ade80; }
                .status-dot.offline { background: #f87171; }
                .item-label { margin-top: 8px; text-align: center; font-size: 14px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
                .drag-handle { position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.2); color: white; padding: 4px; border-radius: 4px; }
                .edit-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 5px; z-index: 10; }

                .overlay-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 200; display: flex; justify-content: center; align-items: center; }
                .modal-container { background: white; width: 90vw; max-width: 1200px; height: 85vh; border-radius: 24px; display: flex; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5); position: relative; }
                .btn-close-global { position: absolute; top: 15px; right: 15px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.1); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 20; }
                .modal-left-panel { flex: 1; background: #0f172a; border-right: 1px solid #1e293b; color: white; display: flex; flex-direction: column; align-items: center; }
                .modal-right-panel { flex: 1.6; background: #f8fafc; display: flex; flex-direction: column; overflow: hidden; }

                .playlist-item { display: flex; height: 80px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s; }
                .playlist-item.is-temp { background: #fffbeb; border-color: #fcd34d; }
                .playlist-thumb { width: 140px; background: #000; position: relative; display: flex; align-items: center; justify-content: center; }
                .playlist-thumb img { width: 100%; height: 100%; object-fit: cover; }
                .index-badge { position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
                .playlist-content { flex: 1; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; }
                .file-type { font-size: 13px; font-weight: 700; color: #334155; }
                .playlist-actions { display: flex; align-items: center; gap: 10px; }
                .duration-wrapper { display: flex; align-items: center; gap: 5px; background: #f1f5f9; padding: 5px 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .duration-input { width: 30px; background: transparent; border: none; font-weight: 700; text-align: center; color: #334155; outline: none; }
                .auto-badge { font-size: 11px; background: #e2e8f0; padding: 4px 8px; border-radius: 6px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px; }
                .btn-icon-delete { background: transparent; border: 1px solid #e2e8f0; color: #94a3b8; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .btn-icon-delete:hover { background: #fee2e2; border-color: #ef4444; color: #ef4444; }

                .modern-modal.alert-box { width: 400px; padding: 30px; border-radius: 20px; background: white; text-align: center; }
                .alert-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
                .alert-danger { background: #fee2e2; color: #ef4444; } .alert-danger-btn { background: #ef4444; }
                .alert-warning { background: #fef3c7; color: #f59e0b; }
                .alert-info { background: #dbeafe; color: #3b82f6; }
                .alert-actions { display: flex; gap: 10px; justify-content: center; margin-top: 25px; }
                .btn-text-danger { background: none; border: none; color: #ef4444; font-weight: 600; cursor: pointer; }
                
                .toast-notification { position: fixed; bottom: 20px; right: 20px; background: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; gap: 10px; align-items: center; font-weight: 600; color: #334155; z-index: 9999; animation: slideIn 0.3s ease; }
                .toast-notification.success { border-left: 5px solid #10b981; } .toast-notification.success svg { color: #10b981; }
                @keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                @media (max-width: 1024px) {
                    .modal-container { flex-direction: column; height: 90vh; }
                    .modal-left-panel { display: none; }
                    .screen-card { width: 160px; height: 100px; }
                }
            `}</style>

            <CustomAlert config={alertConfig} onClose={closeAlert} />
            <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} />

            <div className="header-container">
                <div>
                    <h1 className="page-title">{client?.name || 'Cargando...'}</h1>
                    <p className="subtitle">Mapa de Pantallas</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => setIsEditMode(!isEditMode)} className={`btn-secondary ${isEditMode ? 'btn-active-edit' : ''}`}>
                        {isEditMode ? <Unlock size={18}/> : <Lock size={18}/>} {isEditMode ? 'Edición' : 'Bloqueado'}
                    </button>
                    <div className="divider"></div>
                    <button onClick={() => setModals(p => ({...p, createGroup: true}))} className="btn-secondary"><FolderPlus size={18}/> Grupo</button>
                    <button onClick={addRow} className="btn-secondary" disabled={!isEditMode}><Layers size={18}/> Fila</button>
                    <button onClick={() => setModals(p => ({...p, createScreen: true}))} className="btn-primary"><Plus size={18}/> Pantalla</button>
                </div>
            </div>

            {/* GRUPOS */}
            {groups.length > 0 && (
                <div className="groups-section">
                    <div className="section-label">Grupos de Sincronización</div>
                    <div className="groups-grid">
                        {groups.map(g => (
                            <GroupCard key={g.id} group={g} onClick={() => handleEntityClick(g, 'group')} onDelete={id => handleDeleteGroup(id)} />
                        ))}
                    </div>
                </div>
            )}

            {/* TABLERO DND */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="board-container">
                    {Object.keys(items).map(key => (
                        <SortableRow 
                            key={key} 
                            id={key} 
                            items={items[key]} 
                            screensData={screensData} 
                            groups={groups} 
                            onScreenClick={s => handleEntityClick(s, 'screen')} 
                            isSelected={selectedRowId === key} 
                            onSelectRow={setSelectedRowId} 
                            isEditMode={isEditMode} 
                            onDeleteRow={requestDeleteRow} 
                            onEditScreen={s => { setEditingScreen(s); setModals(p => ({...p, editScreen: true})); }} 
                            onDeleteScreen={confirmDeleteScreen} 
                        />
                    ))}
                </div>
                <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.6' } } })}>
                    {activeId ? <div style={{width:'180px', height:'100px', background:'#3b82f6', borderRadius:'16px', opacity:0.8}}></div> : null}
                </DragOverlay>
            </DndContext>

            {/* MODALES */}
            {modals.createScreen && (
                <div className="overlay-backdrop" onClick={() => setModals(p => ({...p, createScreen: false}))}>
                    <div className="modern-modal alert-box" onClick={e => e.stopPropagation()}>
                        <h3>Nueva Pantalla</h3>
                        <form onSubmit={handleCreateScreen}>
                            <input autoFocus type="text" placeholder="Nombre" value={inputs.screenName} onChange={e => setInputs(p => ({...p, screenName: e.target.value}))} style={{width:'100%', padding:'12px', border:'1px solid #cbd5e1', borderRadius:'8px', marginBottom:'15px'}} />
                            <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                                <button type="button" onClick={() => setInputs(p=>({...p, orientation:'horizontal'}))} className={`btn-secondary ${inputs.orientation === 'horizontal' ? 'btn-active-edit' : ''}`} style={{flex:1}}>Horizontal</button>
                                <button type="button" onClick={() => setInputs(p=>({...p, orientation:'vertical'}))} className={`btn-secondary ${inputs.orientation === 'vertical' ? 'btn-active-edit' : ''}`} style={{flex:1}}>Vertical</button>
                            </div>
                            <button type="submit" className="btn-primary" style={{width:'100%', justifyContent:'center'}}>Crear</button>
                        </form>
                    </div>
                </div>
            )}
            
            {modals.createGroup && (
                <div className="overlay-backdrop" onClick={() => setModals(p => ({...p, createGroup: false}))}>
                    <div className="modern-modal alert-box" onClick={e => e.stopPropagation()}>
                        <h3>Nuevo Grupo</h3>
                        <form onSubmit={handleCreateGroup}>
                            <input autoFocus type="text" placeholder="Nombre del Grupo" value={inputs.groupName} onChange={e => setInputs(p => ({...p, groupName: e.target.value}))} style={{width:'100%', padding:'12px', border:'1px solid #cbd5e1', borderRadius:'8px', marginBottom:'15px'}} />
                            <button type="submit" className="btn-primary" style={{width:'100%', justifyContent:'center'}}>Crear Grupo</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PRINCIPAL */}
            {selectedEntity && (
                <div className="overlay-backdrop" onClick={() => hasUnsavedChanges ? showAlert('warning', 'Salir', 'Cambios pendientes', null, true, handleSaveAllChanges) : setSelectedEntity(null)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <button className="btn-close-global" onClick={() => hasUnsavedChanges ? showAlert('warning', 'Salir', 'Cambios pendientes', null, true, handleSaveAllChanges) : setSelectedEntity(null)}><X size={20}/></button>
                        
                        <div className="modal-left-panel">
                            <div style={{padding:'30px', textAlign:'center'}}>
                                <h2 style={{margin:0}}>{selectedEntity.data.name}</h2>
                                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'5px', opacity:0.7, fontSize:'13px'}}>
                                    {selectedEntity.type === 'screen' ? (
                                        <><div style={{width:'8px', height:'8px', borderRadius:'50%', background: selectedEntity.data.status === 'online' ? '#4ade80' : '#f87171'}}></div>{selectedEntity.data.status === 'online' ? 'Online' : 'Offline'}</>
                                    ) : ( <><Layers size={14}/> <span>Grupo Sincronizado</span></> )}
                                </div>
                            </div>
                            <div style={{flex:1, width:'100%', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                <div style={{width:'100%', aspectRatio:'16/9', background:'black', borderRadius:'12px', overflow:'hidden', position:'relative', border:'1px solid #334155'}}>
                                    {playlist.length > 0 ? (
                                        playlist[currentPreviewIndex]?.type === 'video' ? 
                                        <video src={playlist[currentPreviewIndex].url} autoPlay muted loop style={{width:'100%', height:'100%', objectFit:'cover'}}/> : 
                                        <img src={playlist[currentPreviewIndex]?.url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/>
                                    ) : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.3}}><Play size={40}/></div>}
                                </div>
                                
                                {/* ----------------------- */}
                                {/* SECCIÓN DE VINCULACIÓN  */}
                                {/* ----------------------- */}
                                {selectedEntity.type === 'screen' && !selectedEntity.data.group_id && (
                                    <div style={{marginTop:'30px', width:'100%', padding:'20px', borderRadius:'12px', background: selectedEntity.data.status === 'online' ? 'transparent' : 'rgba(255,255,255,0.05)'}}>
                                        {selectedEntity.data.status === 'online' ? (
                                            <div style={{textAlign:'center'}}>
                                                <p style={{color:'#4ade80', fontWeight:'bold', marginBottom:'15px', fontSize:'14px'}}>● Pantalla Vinculada</p>
                                                <button onClick={handleUnlinkTV} style={{width:'100%', justifyContent:'center', padding:'12px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'10px', display:'flex', alignItems:'center', gap:'8px', fontWeight:'700', cursor:'pointer'}}>
                                                    <Unlink size={18}/> Desvincular Dispositivo
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <input type="text" placeholder="CÓDIGO TV" maxLength={4} value={inputs.pairingCode} onChange={e => setInputs(p => ({...p, pairingCode: e.target.value.toUpperCase()}))} style={{width:'100%', padding:'10px', textAlign:'center', marginBottom:'10px', background:'transparent', border:'1px solid #475569', color:'white', borderRadius:'8px'}} />
                                                <button onClick={handleLinkTV} className="btn-primary" style={{width:'100%', justifyContent:'center'}}>Vincular</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-right-panel">
                            <div className="header-actions" style={{padding:'20px', borderBottom:'1px solid #e2e8f0', justifyContent:'space-between'}}>
                                <h3 style={{margin:0, color:'#1e293b'}}>Contenido</h3>
                                {(!selectedEntity.data.group_id || selectedEntity.type === 'group') && (
                                    <button onClick={handleSaveAllChanges} disabled={!hasUnsavedChanges || loaders.saving} className={`btn-primary ${!hasUnsavedChanges ? 'disabled' : ''}`} style={{opacity: hasUnsavedChanges ? 1 : 0.5}}>
                                        {loaders.saving ? <Loader className="spin-anim"/> : <Save size={18}/>} Guardar
                                    </button>
                                )}
                            </div>
                            
                            <div style={{flex:1, overflowY:'auto', padding:'20px'}}>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => {
                                    const {active, over} = e;
                                    if(active.id !== over.id) setPlaylist(items => arrayMove(items, items.findIndex(i=>i.item_id===active.id), items.findIndex(i=>i.item_id===over.id)));
                                }}>
                                    <SortableContext items={playlist.map(p => p.item_id)} strategy={rectSortingStrategy}>
                                        {playlist.map((item, i) => (
                                            <SortablePlaylistItem key={item.item_id} index={i} item={item} onRemove={id => setPlaylist(p => p.filter(x => x.item_id !== id))} onUpdateDuration={(id, val) => setPlaylist(p => p.map(x => x.item_id === id ? {...x, custom_duration: val} : x))} />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <div style={{height:'160px', borderTop:'1px solid #e2e8f0', background:'white', padding:'15px', display:'flex', flexDirection:'column'}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                                    <span style={{fontSize:'12px', fontWeight:'700', color:'#64748b', textTransform:'uppercase'}}>Biblioteca</span>
                                    <label style={{cursor:'pointer', fontSize:'12px', color:'#3b82f6', fontWeight:'600'}}>
                                        + Subir <input type="file" hidden onChange={handleFileUpload}/>
                                    </label>
                                </div>
                                <div style={{display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'5px'}}>
                                    {availableMedia.map(m => (
                                        <div key={m.id} onClick={() => handleAddToPlaylistLocal(m.id)} style={{minWidth:'100px', height:'60px', borderRadius:'8px', overflow:'hidden', cursor:'pointer', border:'1px solid #e2e8f0'}}>
                                            <img src={m.url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}