import { useState, useEffect, useRef, useCallback } from 'react';
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
    AlertTriangle, CheckCircle, Link as LinkIcon, Unlink, 
    Upload, Loader, Save, Clock, Check, Edit2, Image as ImageIcon, 
    Folder, FolderPlus, List, Monitor
} from 'lucide-react';

// ==========================================
// 1. ESTILOS DEFINIDOS AL INICIO
// ==========================================
const btnPrimary = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition:'background 0.2s', display:'flex', alignItems:'center', gap:'8px' };
const btnSecondary = { backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '600' };
const btnPrimaryFull = { ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: '20px' };

const blueBoxStyle = { backgroundColor: '#3b82f6', backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' };
const dragHandleIcon = { position: 'absolute', top: '5px', left: '5px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px' };
const miniBtnAction = { backgroundColor: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };
const carouselContainer = { position: 'absolute', top:0, left:0, width:'100%', height:'100%' };
const nameLabelStyle = { marginTop: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' };
const rowContainer = { padding: '20px', margin: '15px 0', border: '2px solid #e2e8f0', borderRadius: '20px', minHeight: '200px', transition: 'all 0.2s', cursor: 'default' };
const rowHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const rowLabel = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' };
const badgeStyle = { fontSize:'10px', backgroundColor:'#3b82f6', color:'white', padding:'2px 6px', borderRadius:'10px' };
const btnDeleteRow = { display: 'flex', alignItems: 'center', gap: '5px', border: 'none', background: '#fee2e2', color: '#ef4444', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const itemsContainer = { display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start', minHeight: '140px' };
const emptyRowPlaceholder = { width: '100%', height: '120px', border: '2px dashed #cbd5e1', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px', background: 'rgba(255,255,255,0.5)' };
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize:'15px', outline:'none', transition:'border 0.2s' };
const btnCloseModal = { width: '100%', padding: '10px', marginTop: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontWeight:'500' };
const btnOption = { flex: 1, padding: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color:'#64748b', transition:'all 0.2s' };
const btnOptionActive = { ...btnOption, backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#3b82f6', fontWeight:'600', boxShadow:'0 4px 6px -1px rgba(59, 130, 246, 0.15)' };
const btnUploadStyle = { backgroundColor: 'white', color: '#334155', border:'1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' };

// ==========================================
// 2. COMPONENTES AUXILIARES
// ==========================================
// CORRECCIÓN: Renombrado a CustomAlert para coincidir con el uso
const CustomAlert = ({ config, onClose }) => {
    if (!config.isOpen) return null;
    
    const colors = {
        danger: { bg: '#fee2e2', text: '#ef4444', btn: '#ef4444' },
        warning: { bg: '#fef3c7', text: '#f59e0b', btn: '#f59e0b' },
        info: { bg: '#dbeafe', text: '#3b82f6', btn: '#3b82f6' }
    };
    const theme = colors[config.type] || colors.info;

    return (
        <div className="overlay-backdrop">
            <div className="modern-modal alert-box">
                <div className="alert-icon" style={{ backgroundColor: theme.bg, color: theme.text }}>
                    {config.type === 'danger' ? <Trash2 size={24}/> : <AlertTriangle size={24}/>}
                </div>
                <h3>{config.title}</h3>
                <p>{config.message}</p>
                <div className="alert-actions">
                    {config.isExitConfirmation ? (
                        <>
                            <button onClick={onClose} className="btn-secondary">Cancelar</button>
                            <button onClick={config.onConfirm} className="btn-danger-text">Salir sin guardar</button>
                            <button onClick={config.onSaveAndExit} className="btn-primary">Guardar y Salir</button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className="btn-secondary">Cancelar</button>
                            <button onClick={config.onConfirm} className="btn-primary" style={{backgroundColor: theme.btn}}>Confirmar</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// CORRECCIÓN: Renombrado a ToastNotification para coincidir con versiones anteriores si es necesario, o mantenemos Toast si actualizamos el uso abajo.
const ToastNotification = ({ visible, message, type }) => {
    if (!visible) return null;
    return (
        <div className={`modern-toast ${type === 'error' ? 'error' : 'success'}`}>
            {type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
            <span>{message}</span>
        </div>
    );
};

// ==========================================
// 3. ITEMS VISUALES
// ==========================================
const SortablePlaylistItem = ({ item, onRemove, onUpdateDuration, index }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.item_id });
    const handleInputClick = (e) => { e.stopPropagation(); };
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`playlist-item-card ${isDragging ? 'dragging' : ''} ${String(item.item_id).startsWith('temp-') ? 'is-temp' : ''}`}>
            <div className="playlist-thumbnail-container">
                {item.type === 'video' ? ( <div className="video-placeholder"><Play size={24} color="white"/></div> ) : ( <img src={item.url} className="playlist-thumbnail-img" alt="" /> )}
                <div className="playlist-index-badge">#{index + 1}</div>
            </div>
            <div className="playlist-info-container">
                <div style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
                    <span style={{fontSize:'13px', fontWeight:'600', color:'#334155', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden'}}>{item.type === 'video' ? 'Video' : 'Imagen'}</span>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    {item.type !== 'video' ? (
                        <div className="duration-input-wrapper" onPointerDown={(e) => e.stopPropagation()}>
                            <Clock size={12} color="#64748b" />
                            <input type="number" min="1" value={item.custom_duration || 10} onChange={(e) => onUpdateDuration(item.item_id, e.target.value)} onClick={handleInputClick} className="duration-input" />
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>s</span>
                        </div>
                    ) : ( <span style={{fontSize: '11px', color: '#94a3b8', display:'flex', alignItems:'center', gap:'4px'}}><Play size={12}/> Auto</span> )}
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(item.item_id); }} className="btn-delete-item" title="Eliminar"><Trash2 size={14} /></button>
                </div>
            </div>
        </div>
    );
};

// Tarjeta de Grupo (CARPETA)
const GroupCard = ({ group, onClick, onDelete }) => (
    <div className="group-card" onClick={onClick}>
        <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
            borderRadius: '16px', 
            boxShadow: '0 10px 15px -3px rgba(109, 40, 217, 0.3)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
            width: '220px', height: '130px'
        }}>
            <div style={{color:'white', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px'}}>
                <Folder size={40} strokeWidth={1.5} />
                <span style={{fontSize:'12px', fontWeight:'700', backgroundColor:'rgba(0,0,0,0.2)', padding:'4px 10px', borderRadius:'12px'}}>{group.screen_count || 0} TVs</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(group.id); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
        </div>
        <div style={{...nameLabelStyle, fontSize:'15px'}}>{group.name}</div>
    </div>
);

// SCREEN ITEM (TV)
const ScreenItem = ({ id, screen, onClick, isEditMode, onEditScreen, onDeleteScreen, groups }) => {
  const safeId = String(id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: safeId, disabled: !isEditMode, data: { type: 'item', screen } });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 999 : 1, cursor: isEditMode ? 'grab' : 'pointer', position: 'relative' };
  
  const isGrouped = screen.group_id != null;
  const groupName = isGrouped && groups ? groups.find(g => g.id === screen.group_id)?.name : null;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="screen-item">
       <div onClick={(e) => { if(isEditMode) return; onClick(); }} style={{ 
           backgroundColor: isGrouped ? '#7c3aed' : '#3b82f6', 
           backgroundImage: isGrouped ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
           borderRadius: '16px', 
           boxShadow: isGrouped ? '0 0 0 3px rgba(139, 92, 246, 0.4)' : '0 4px 6px -1px rgba(59, 130, 246, 0.3)', 
           display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
           width: screen.orientation === 'vertical' ? '120px' : '220px', 
           height: screen.orientation === 'vertical' ? '220px' : '130px'
        }}>
          {isGrouped && (
              <div style={{position:'absolute', top: 0, left: 0, right: 0, background:'rgba(0,0,0,0.3)', padding: '4px', textAlign: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', zIndex: 5}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px'}}>
                     <LinkIcon size={10}/> {groupName || 'Grupo'}
                  </div>
              </div>
          )}
          {screen.thumbnails && screen.thumbnails.length > 0 ? ( <div style={carouselContainer}>{screen.thumbnails.map((url, i) => (<div key={i} className="carousel-fade-slide" style={{ backgroundImage: `url(${url})`, animationDelay: `${i * 3}s` }} />))}</div> ) : ( <div style={{ opacity: 0.5 }}>{screen.orientation === 'horizontal' ? <Tv size={40} color="white"/> : <Smartphone size={40} color="white"/>}</div> )}
          
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: screen.status === 'online' ? '#4ade80' : '#f87171', boxShadow: '0 0 4px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)' }}></div>
          
          {isEditMode && ( <><div style={dragHandleIcon}><Layers size={14} color="white"/></div><div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '5px', zIndex:20 }}><button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onEditScreen(screen); }} style={miniBtnAction} title="Editar"><Edit2 size={14} color="#3b82f6" /></button><button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDeleteScreen(screen.id); }} style={{...miniBtnAction, color: '#ef4444'}} title="Eliminar"><Trash2 size={14} color="#ef4444" /></button></div></> )}
       </div>
       <div style={nameLabelStyle}>{screen.name}</div>
    </div>
  );
};

const SortableRow = ({ id, items, screensData, groups, onScreenClick, isSelected, onSelectRow, isEditMode, onDeleteRow, onEditScreen, onDeleteScreen }) => {
  const safeId = String(id);
  const { setNodeRef } = useSortable({ id: safeId, data: { type: 'container' }, disabled: true });
  return (
    <div ref={setNodeRef} onClick={() => onSelectRow(safeId)} style={{ ...rowContainer, borderColor: isSelected ? '#3b82f6' : (isEditMode ? '#94a3b8' : '#e2e8f0'), backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.04)' : 'transparent', borderStyle: isEditMode ? 'dashed' : 'solid' }}>
      <div style={rowHeader}>
          <div style={{...rowLabel, color: isSelected ? '#3b82f6' : '#94a3b8'}}><Layers size={16} /> <span>Fila {parseInt(safeId) + 1}</span> {isSelected && <span style={badgeStyle}>SELECCIONADA</span>}</div>
          {isEditMode && (<button onClick={(e) => { e.stopPropagation(); onDeleteRow(safeId, items); }} style={btnDeleteRow}><Trash2 size={14} /> Eliminar Fila</button>)}
      </div>
      <div style={itemsContainer}>
        <SortableContext id={safeId} items={items} strategy={rectSortingStrategy}>
          {items.map((screenId) => {
            const screen = screensData.find(s => String(s.id) === String(screenId));
            if (!screen) return null;
            return <ScreenItem key={screenId} id={screenId} screen={screen} groups={groups} onClick={() => onScreenClick(screen)} isEditMode={isEditMode} onEditScreen={onEditScreen} onDeleteScreen={onDeleteScreen} />;
          })}
        </SortableContext>
        {items.length === 0 && isEditMode && (<div style={emptyRowPlaceholder}>Arrastra pantallas aquí</div>)}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN COMPONENT (CLIENT DETAILS)
// ==========================================
export default function ClientDetails() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [screensData, setScreensData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState({ "0": [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState("0");
  
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditScreenModal, setShowEditScreenModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null); 
  
  const [playlist, setPlaylist] = useState([]);
  const originalPlaylistRef = useRef([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [groupScreens, setGroupScreens] = useState([]); 
  const originalGroupScreensRef = useRef([]); 
  
  const [availableMedia, setAvailableMedia] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState('playlist'); 

  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [newScreenName, setNewScreenName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newOrientation, setNewOrientation] = useState('horizontal');
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (!playlist || playlist.length === 0) return;
    if (currentPreviewIndex >= playlist.length) { setCurrentPreviewIndex(0); return; }
    const currentItem = playlist[currentPreviewIndex];
    if (!currentItem) return;
    const durationMs = (parseInt(currentItem.custom_duration) || 10) * 1000;
    const timer = setTimeout(() => { setCurrentPreviewIndex((prev) => (prev + 1) % playlist.length); }, durationMs);
    return () => clearTimeout(timer);
  }, [playlist, currentPreviewIndex]);

  const checkForChanges = useCallback(() => {
      if (selectedEntity?.type === 'screen' && selectedEntity?.data?.group_id) {
          setHasUnsavedChanges(false);
          return;
      }

      let changed = false;
      const original = originalPlaylistRef.current;
      
      if (playlist.length !== original.length) changed = true;
      else {
          for (let i = 0; i < playlist.length; i++) {
              if (playlist[i].item_id !== original[i].item_id || String(playlist[i].item_id).startsWith('temp-') || parseInt(playlist[i].custom_duration) !== parseInt(original[i].custom_duration)) {
                  changed = true; break;
              }
          }
      }

      if (selectedEntity?.type === 'group') {
          const originalScreens = new Set(originalGroupScreensRef.current);
          const currentScreens = new Set(groupScreens);
          if (originalScreens.size !== currentScreens.size) changed = true;
          else { for (let id of currentScreens) if (!originalScreens.has(id)) changed = true; }
      }
      setHasUnsavedChanges(changed);
  }, [playlist, groupScreens, selectedEntity]);

  useEffect(() => { if (selectedEntity) checkForChanges(); }, [playlist, groupScreens, checkForChanges]);

  // Helpers
  const showAlert = (type, title, message, onConfirm, isExitConfirmation = false, onSaveAndExit = null) => setAlertConfig({ isOpen: true, type, title, message, onConfirm: () => { setAlertConfig(prev => ({...prev, isOpen: false})); onConfirm(); }, isExitConfirmation, onSaveAndExit: isExitConfirmation ? () => { setAlertConfig(prev => ({...prev, isOpen: false})); onSaveAndExit(); } : null });
  const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });
  const showToast = (message, type = 'success') => { setToast({ visible: true, message, type }); setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000); };

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
    } catch (error) { 
        console.error("Fetch error:", error); 
    } finally {
        setLoading(false);
    }
  };

  const organizeDataIntoRows = (data) => {
      const grouped = {};
      data.forEach(s => { const r = String(s.row_index || 0); if (!grouped[r]) grouped[r] = []; grouped[r].push(s); });
      const finalItems = {};
      Object.keys(grouped).sort((a,b) => parseInt(a) - parseInt(b)).forEach(key => { finalItems[key] = grouped[key].sort((a,b) => (a.display_order || 0) - (b.display_order || 0)).map(s => String(s.id)); });
      if (Object.keys(finalItems).length === 0) finalItems["0"] = [];
      setItems(finalItems);
  };

  const findContainer = (id) => { if (id in items) return id; return Object.keys(items).find((key) => items[key].includes(String(id))); };
  const handleDragStart = (event) => setActiveId(event.active.id);
  const handleDragOver = (event) => { const { active, over } = event; const overId = over?.id; if (overId == null || String(active.id) === String(overId)) return; const activeContainer = findContainer(active.id); const overContainer = findContainer(overId); if (!activeContainer || !overContainer || activeContainer === overContainer) return; setItems((prev) => { const activeItems = prev[activeContainer]; const overItems = prev[overContainer]; const activeIndex = activeItems.indexOf(String(active.id)); const overIndex = overItems.indexOf(String(overId)); let newIndex; if (overId in prev) { newIndex = overItems.length + 1; } else { const isBelowOverItem = over && over.rect.top + over.rect.height > over.rect.top && over.rect.left + over.rect.width > over.rect.left; newIndex = overIndex >= 0 ? overIndex + (isBelowOverItem ? 1 : 0) : overItems.length + 1; } return { ...prev, [activeContainer]: prev[activeContainer].filter((item) => item !== active.id), [overContainer]: [...prev[overContainer].slice(0, newIndex), items[activeContainer][activeIndex], ...prev[overContainer].slice(newIndex, prev[overContainer].length)], }; }); };
  const handleDragEnd = async (event) => { const { active, over } = event; const activeContainer = findContainer(active.id); const overContainer = findContainer(over?.id); if (activeContainer && overContainer) { const activeIndex = items[activeContainer].indexOf(String(active.id)); const overIndex = items[overContainer].indexOf(String(over?.id)); if (activeIndex !== overIndex || activeContainer !== overContainer) { setItems((prev) => { const newItems = { ...prev }; if (activeContainer === overContainer) newItems[activeContainer] = arrayMove(prev[activeContainer], activeIndex, overIndex); api.put('/admin/screens/reorder', { rows: newItems }).catch(console.error); return newItems; }); } } setActiveId(null); };
  const handleDragEndPlaylist = (event) => { const { active, over } = event; if (!over || active.id === over.id) return; setPlaylist((items) => { const oldIndex = items.findIndex(i => i.item_id === active.id); const newIndex = items.findIndex(i => i.item_id === over.id); return arrayMove(items, oldIndex, newIndex); }); };
  
  const handleAddToPlaylistLocal = (mediaId) => { if(!selectedEntity) return; const mediaSelected = availableMedia.find(m => m.id === mediaId); if(!mediaSelected) return; const newItem = { item_id: `temp-${Date.now()}-${Math.random().toString(36).substr(2,5)}`, media_id: mediaId, url: mediaSelected.url, type: mediaSelected.type, custom_duration: 10, display_order: playlist.length }; setPlaylist(prev => [...prev, newItem]); setMobileTab('playlist'); };
  const handleRemoveFromPlaylistLocal = (itemId) => { setPlaylist(prev => prev.filter(i => i.item_id !== itemId)); };
  const handleUpdateDurationLocal = (itemId, val) => { const dur = parseInt(val); if(isNaN(dur) || dur < 1) return; setPlaylist(prev => prev.map(i => i.item_id === itemId ? {...i, custom_duration: dur} : i)); };

  const handleEntityClick = async (entity, type) => {
      setSelectedEntity({ type, data: entity });
      setCurrentPreviewIndex(0);
      setHasUnsavedChanges(false);
      setMobileTab('playlist');
      
      try {
          if (type === 'screen') {
              setPairingCodeInput('');
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
              const playlistRes = await api.get(`/admin/groups/${entity.id}/playlist`);
              setPlaylist(playlistRes.data);
              originalPlaylistRef.current = JSON.parse(JSON.stringify(playlistRes.data));
              const assignedScreens = screensData.filter(s => s.group_id === entity.id).map(s => s.id);
              setGroupScreens(assignedScreens);
              originalGroupScreensRef.current = [...assignedScreens];
          }
      } catch (e) { console.error(e); }
  };

  const handleSaveAllChanges = async () => {
      if(!selectedEntity || !hasUnsavedChanges) return;
      setIsSavingOrder(true);
      try {
          const isGroup = selectedEntity.type === 'group';
          const entityId = selectedEntity.data.id;
          const original = originalPlaylistRef.current;
          const current = playlist;
          
          const originalIds = new Set(original.map(i => i.item_id));
          const currentIds = new Set(current.map(i => i.item_id));
          const toDeleteIds = [...originalIds].filter(id => !currentIds.has(id));
          const toAddItems = current.filter(i => String(i.item_id).startsWith('temp-'));
          const toUpdateItems = current.filter(curr => {
              if (String(curr.item_id).startsWith('temp-')) return false;
              const orig = original.find(o => o.item_id === curr.item_id);
              return orig && parseInt(orig.custom_duration) !== parseInt(curr.custom_duration);
          });

          const promises = [];
          toDeleteIds.forEach(id => promises.push(api.delete(`/playlist/${id}`)));
          toAddItems.forEach(item => promises.push(api.post('/playlist', { [isGroup ? 'groupId' : 'screenId']: entityId, mediaId: item.media_id, duration: parseInt(item.custom_duration) })));
          toUpdateItems.forEach(item => promises.push(api.put(`/playlist/${item.item_id}`, { duration: parseInt(item.custom_duration) })));

          if (isGroup) {
              const originalScreens = new Set(originalGroupScreensRef.current);
              const currentScreens = new Set(groupScreens);
              let screensChanged = false;
              if (originalScreens.size !== currentScreens.size) screensChanged = true;
              else { for (let id of currentScreens) if (!originalScreens.has(id)) screensChanged = true; }
              if (screensChanged) promises.push(api.put('/admin/groups/screens', { groupId: entityId, screenIds: groupScreens }));
          }

          if (promises.length > 0) await Promise.all(promises);

          const route = isGroup ? `/admin/groups/${entityId}/playlist` : `/playlist/${entityId}`;
          const freshRes = await api.get(route);
          let freshList = freshRes.data;
          
          const visualMediaOrder = current.map(i => i.media_id);
          freshList.sort((a,b) => visualMediaOrder.indexOf(a.media_id) - visualMediaOrder.indexOf(b.media_id));
          
          const orderPayload = freshList.map((item, idx) => ({ id: item.item_id, order: idx }));
          await api.put('/playlist/reorder', { items: orderPayload });

          const finalRes = await api.get(route);
          setPlaylist(finalRes.data);
          originalPlaylistRef.current = JSON.parse(JSON.stringify(finalRes.data));
          
          if (isGroup) { originalGroupScreensRef.current = [...groupScreens]; fetchData(); }
          
          setHasUnsavedChanges(false);
          showToast('Guardado correctamente.');
      } catch (error) { console.error(error); showAlert('danger', 'Error', 'No se pudo guardar.', () => closeAlert()); } finally { setIsSavingOrder(false); }
  };

  const handleCreateGroup = async (e) => { e.preventDefault(); if (!newGroupName.trim()) return; try { await api.post('/admin/groups', { clientId: id, name: newGroupName }); setShowCreateGroupModal(false); setNewGroupName(''); fetchData(); showToast('Grupo creado.'); } catch (e) { console.error(e); } };
  const handleDeleteGroup = (groupId) => { showAlert('danger', '¿Eliminar Grupo?', 'Las pantallas quedarán sueltas.', async () => { closeAlert(); try { await api.delete(`/admin/groups/${groupId}`); fetchData(); showToast('Grupo eliminado.'); } catch (e) { console.error(e); } }); };
  const toggleScreenInGroup = (screenId) => { if (groupScreens.includes(screenId)) { setGroupScreens(prev => prev.filter(id => id !== screenId)); } else { setGroupScreens(prev => [...prev, screenId]); } };
  const handleCloseRequest = () => { if (hasUnsavedChanges) { showAlert('warning', 'Cambios sin guardar', '¿Qué deseas hacer?', () => { closeAlert(); setSelectedEntity(null); }, true, async () => { closeAlert(); await handleSaveAllChanges(); setSelectedEntity(null); }); } else { setSelectedEntity(null); } };
  const addRow = () => { const newKey = String(Object.keys(items).length + Math.floor(Math.random()*1000)); setItems({ ...items, [newKey]: [] }); setSelectedRowId(newKey); setIsEditMode(true); };
  const requestDeleteRow = (rowId, items) => { showAlert('danger', 'Borrar Fila', 'Se borrarán las pantallas.', () => { closeAlert(); Promise.all(items.map(sid => api.delete(`/admin/screens/${sid}`))).then(() => { const n = {...items}; delete n[rowId]; setItems(n); fetchData(); }); }); };
  const confirmDeleteScreen = (id) => { const clean = String(id).split(':')[0]; showAlert('danger', 'Borrar Pantalla', 'Confirmar acción', async () => { closeAlert(); await api.delete(`/admin/screens/${clean}`); fetchData(); }); };
  const handleCreateScreen = async (e) => { e.preventDefault(); try { await api.post('/admin/screens', { clientId: id, name: newScreenName, orientation: newOrientation, row_index: parseInt(selectedRowId) }); setShowCreateModal(false); setNewScreenName(''); fetchData(); showToast('Pantalla creada.'); } catch (e){} };
  const handleLinkTV = async (e) => { e.preventDefault(); try { await api.post('/admin/screens/link', { screenId: selectedEntity.data.id, pairingCode: pairingCodeInput }); fetchData(); showToast('Vinculado'); setSelectedEntity(prev => ({...prev, data: {...prev.data, status:'online'}})); } catch(e){ console.error(e); } };
  const handleUnlinkTV = () => { showAlert('danger', 'Desvincular', '¿Seguro?', async () => { closeAlert(); await api.post('/admin/screens/unlink', { screenId: selectedEntity.data.id }); fetchData(); setSelectedEntity(prev => ({...prev, data: {...prev.data, status:'offline'}})); }); };
  const handleFileUpload = async (e) => { const file = e.target.files[0]; if(!file) return; setIsUploading(true); const fd = new FormData(); fd.append('file', file); fd.append('clientId', id); try { await api.post('/media/upload', fd); const res = await api.get(`/media/library?clientId=${id}`); setAvailableMedia(res.data); } finally { setIsUploading(false); } };
  
  const handleRemoveScreenFromGroup = async () => {
      showAlert('warning', 'Salir del Grupo', 'Esta pantalla dejará de sincronizarse con el grupo.', async () => {
          closeAlert();
          try {
              const currentGroupId = selectedEntity.data.group_id;
              const otherScreens = screensData.filter(s => s.group_id === currentGroupId && s.id !== selectedEntity.data.id).map(s => s.id);
              await api.put('/admin/groups/screens', { groupId: currentGroupId, screenIds: otherScreens });
              showToast('Pantalla desvinculada del grupo.');
              fetchData(); 
              setSelectedEntity(null); 
          } catch (e) { console.error(e); }
      });
  };

  const openEditScreenModal = (screen) => { setEditingScreen({...screen}); setShowEditScreenModal(true); };
  const handleUpdateScreen = async (e) => { e.preventDefault(); if (!editingScreen) return; try { await api.put(`/admin/screens/${editingScreen.id}`, { name: editingScreen.name, orientation: editingScreen.orientation }); setScreensData(prev => prev.map(s => s.id === editingScreen.id ? { ...s, name: editingScreen.name, orientation: editingScreen.orientation } : s)); setShowEditScreenModal(false); showToast('Pantalla actualizada.'); } catch (error) { showAlert('danger', 'Error', 'No se pudo actualizar.', closeAlert); } };
  const handleScreenClick = (screen) => handleEntityClick(screen, 'screen');

  if (loading) return <SidebarLayout><div style={{display:'flex', justifyContent:'center', marginTop:50, color:'#94a3b8'}}><Loader className="spin-anim"/></div></SidebarLayout>;
  if (!client) return <SidebarLayout><div style={{textAlign:'center', marginTop:50}}>No se encontró el cliente o hubo un error.</div></SidebarLayout>;

  const activeScreenData = activeId ? screensData.find(s => String(s.id) === String(activeId)) : null;
  const isScreenLockedByGroup = selectedEntity?.type === 'screen' && selectedEntity?.data?.group_id;

  return (
    <SidebarLayout>
      <CustomAlert config={alertConfig} onClose={closeAlert} />
      <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} />
      
      <style>{`
        /* ESTILOS CSS */
        .carousel-fade-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0; animation: fadeLoop 9s infinite; }
        @keyframes fadeLoop { 0% { opacity: 0; } 10% { opacity: 1; } 33% { opacity: 1; } 43% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0.7; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        
        .alert-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); backdrop-filter: blur(3px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
        .alert-modal { background-color: white; border-radius: 16px; padding: 25px; width: 90%; max-width: 420px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        .alert-icon-container { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
        .alert-title { fontSize: 18px; fontWeight: bold; color: #1e293b; textAlign: center; margin-bottom: 10px; }
        .alert-text { fontSize: 14px; color: #64748b; textAlign: center; margin-bottom: 25px; lineHeight: 1.5; }
        .alert-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }
        .btn-alert-base { flex: 1; padding: 10px 15px; border-radius: 8px; border: none; cursor: pointer; fontWeight: 600; font-size: 13px; }
        .btn-alert-secondary { background-color: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
        .btn-alert-primary { background-color: #3b82f6; color: white; }
        .btn-alert-danger { background-color: #fee2e2; color: #ef4444; border: 1px solid #fee2e2; }
        .toast-notification { position: fixed; bottom: 20px; right: 20px; background: white; color: #1e293b; padding: 12px 20px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; z-index: 10000; font-weight: 500; font-size: 14px; max-width: 90vw; }
        .toast-notification.error { border-left: 5px solid #ef4444; } /* Add error class */
        .toast-notification.success { border-left: 5px solid #10b981; } /* Add success class */
        
        .modal-container { background-color: white; border-radius: 20px; width: 90vw; max-width: 1200px; height: 85vh; display: flex; overflow: hidden; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); flex-direction: row; margin: auto; }
        .modal-left-panel { flex: 1; background-color: #0f172a; padding: 0; display: flex; flex-direction: column; alignItems: center; border-right: 1px solid #1e293b; color: white; position: relative; }
        .modal-right-panel { flex: 1.6; background-color: #f8fafc; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .btn-close-global { position: absolute; top: 15px; right: 15px; width: 36px; height: 36px; border-radius: 50%; border: none; background-color: rgba(0,0,0,0.1); color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); transition: background 0.2s; }
        .btn-close-global:hover { background-color: rgba(0,0,0,0.2); color: #1e293b; }
        .right-panel-header { padding: 15px 25px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .playlist-scroll-area { flex: 1; padding: 20px 25px; overflow-y: auto; }
        .library-section { padding: 15px 25px; background: white; border-top: 1px solid #e2e8f0; height: 180px; display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
        .playlist-item-card { background-color: white; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; display: flex; height: 90px; align-items: center; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); transition: all 0.2s; }
        .playlist-item-card.dragging { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border-color: #3b82f6; }
        .playlist-item-card.is-temp { border-left: 3px solid #f59e0b; background-color: #fffbeb; }
        .playlist-thumbnail-container { width: 160px; height: 100%; background-color: #f8fafc; position: relative; flex-shrink: 0; border-right: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .playlist-thumbnail-img { width: 100%; height: 100%; object-fit: cover; }
        .video-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0f172a; }
        .playlist-index-badge { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 4px; fontSize: 10px; fontWeight: bold; }
        .playlist-info-container { flex: 1; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .duration-input-wrapper { display: flex; align-items: center; gap: 5px; background-color: #f1f5f9; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .duration-input { width: 30px; border: none; background: transparent; fontSize: 13px; fontWeight: 600; color: #334155; outline: none; text-align: center; }
        .btn-delete-item { width: 28px; height: 28px; border-radius: 8px; background-color: transparent; border: 1px solid #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .btn-delete-item:hover { background-color: #fee2e2; border-color: #fee2e2; color: #ef4444; }
        .btn-save-primary { background-color: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; fontWeight: 600; fontSize: 13px; display: flex; alignItems: center; gap: 8px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); transition: all 0.2s; }
        .btn-save-disabled { background-color: #e2e8f0; color: #94a3b8; border: none; padding: 8px 16px; border-radius: 8px; cursor: not-allowed; fontWeight: 600; fontSize: 13px; display: flex; alignItems: center; gap: 8px; }
        .btn-save-primary:hover:not(:disabled) { background-color: #2563eb; }
        .group-card { cursor: pointer; transition: transform 0.2s; position: relative; }
        .group-card:hover { transform: translateY(-3px); }
        .group-screen-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s; }
        .group-screen-item:hover { background: rgba(255,255,255,0.1); }
        .group-screen-item.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .check-circle { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #64748b; display: flex; align-items: center; justify-content: center; }
        .group-screen-item.active .check-circle { border-color: #3b82f6; background: #3b82f6; }

        @media (max-width: 1024px) {
            .modal-container { flexDirection: column; width: 95vw; height: 85vh; max-height: 85vh; border-radius: 16px; }
            .modal-left-panel { display: none; }
            .right-panel-header { padding: 15px; }
            .mobile-tabs-container { display: flex; justify-content: space-around; background: white; border-bottom: 1px solid #e2e8f0; }
            .mobile-tab { padding: 12px; background: none; border: none; border-bottom: 2px solid transparent; font-weight: 600; color: #64748b; display: flex; align-items: center; gap: 5px; }
            .mobile-tab.active { color: #3b82f6; border-color: #3b82f6; }
            .mobile-monitor-panel { flex: 1; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; padding: 20px; overflow-y: auto; }
            .btn-close-global { top: 10px; right: 10px; background: rgba(255,255,255,0.2); color: white; }
            .playlist-thumbnail-container { width: 100px; }
            .playlist-item-card { height: 70px; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
          <div><h1 style={{fontSize:'28px', fontWeight:'800', color:'#1e293b'}}>Panel de Control</h1><p style={{color:'#64748b', marginTop:'5px'}}>{client?.name}</p></div>
          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
              <button onClick={() => setIsEditMode(!isEditMode)} style={{...btnSecondary, color: isEditMode ? '#e11d48' : '#64748b'}}>{isEditMode ? <Unlock size={18}/> : <Lock size={18}/>} {isEditMode ? 'Edición' : 'Bloqueado'}</button>
              <div style={{width:'1px', height:'30px', background:'#cbd5e1'}}></div>
              <button onClick={() => setShowCreateGroupModal(true)} style={btnSecondary}><FolderPlus size={18}/> Grupo</button>
              <button onClick={addRow} style={btnSecondary} disabled={!isEditMode}><Layers size={18}/> Fila</button>
              <button onClick={() => setShowCreateModal(true)} style={btnPrimaryFull}><Plus size={18}/> Pantalla</button>
          </div>
      </div>

      {/* GRID DE GRUPOS */}
      {groups.length > 0 && (
          <div style={{marginBottom:'40px'}}>
              <h4 style={{margin:'0 0 15px 0', color:'#64748b', fontSize:'13px', textTransform:'uppercase', letterSpacing:'1px'}}>Grupos de Sincronización</h4>
              <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
                  {groups.map(g => ( <GroupCard key={g.id} group={g} onClick={() => handleEntityClick(g, 'group')} onDelete={handleDeleteGroup} /> ))}
              </div>
          </div>
      )}

      {/* GRID DE PANTALLAS (DND) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div style={{display:'flex', flexDirection:'column', gap:'20px', paddingBottom:'100px'}}>
              {Object.keys(items).map(key => (
                  <SortableRow key={key} id={key} items={items[key]} screensData={screensData} groups={groups} onScreenClick={s => handleEntityClick(s, 'screen')} isSelected={selectedRowId === key} onSelectRow={setSelectedRowId} isEditMode={isEditMode} onDeleteRow={requestDeleteRow} onEditScreen={openEditScreenModal} onDeleteScreen={confirmDeleteScreen} />
              ))}
          </div>
          <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } })}>{activeId ? <div style={{...blueBoxStyle, width:'180px', height:'100px'}}>Moviendo...</div> : null}</DragOverlay>
      </DndContext>

      {/* MODAL PRINCIPAL */}
      {selectedEntity && (
        <div style={overlayStyle} onClick={handleCloseRequest}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <button onClick={handleCloseRequest} className="btn-close-global"><X size={20}/></button>

                {/* LEFT PANEL (DESKTOP) */}
                <div className="modal-left-panel">
                    {/* INFO HEADER */}
                    <div style={{textAlign:'center', padding: '30px 20px 10px 20px', width: '100%'}}>
                        <h2 style={{margin:0, fontSize:'22px'}}>{selectedEntity.data.name}</h2>
                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'5px', opacity:0.7, fontSize:'13px'}}>
                            {selectedEntity.type === 'screen' ? (
                                <><div style={{width:'8px', height:'8px', borderRadius:'50%', background: selectedEntity.data.status === 'online' ? '#4ade80' : '#f87171'}}></div>{selectedEntity.data.status === 'online' ? 'Online' : 'Offline'}</>
                            ) : ( <><Layers size={14}/> <span>Grupo Sincronizado</span></> )}
                        </div>
                    </div>

                    {/* CONTENT: SI ES GRUPO -> SELECTOR DE PANTALLAS */}
                    {selectedEntity.type === 'group' && (
                        <div style={{width:'100%', flex:1, overflowY:'auto', padding:'0 20px'}}>
                            
                            {/* PREVIEW DEL GRUPO */}
                            <div style={{width:'100%', aspectRatio:'16/9', background:'black', borderRadius:'12px', border:'2px solid #334155', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', marginBottom: '20px'}}>
                                {playlist.length > 0 ? ( (() => { const item = playlist[currentPreviewIndex]; return item?.type === 'video' ? <video src={item.url} style={{width:'100%', height:'100%', objectFit:'cover'}} muted loop autoPlay /> : <img src={item?.url} style={{width:'100%', height:'100%', objectFit:'cover'}} />; })() ) : <div style={{color:'white', opacity:0.5}}><Play/></div>}
                            </div>

                            <h4 style={{color:'#94a3b8', fontSize:'12px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'15px'}}>Pantallas Asignadas</h4>
                            {screensData.map(s => (
                                <div key={s.id} className={`group-screen-item ${groupScreens.includes(s.id) ? 'active' : ''}`} onClick={() => toggleScreenInGroup(s.id)}>
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        {s.orientation === 'vertical' ? <Smartphone size={16}/> : <Tv size={16}/>}
                                        <span style={{fontSize:'13px'}}>{s.name}</span>
                                    </div>
                                    <div className="check-circle">{groupScreens.includes(s.id) && <Check size={12} color="white"/>}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CONTENT: SI ES PANTALLA -> PREVIEW + VINCULAR */}
                    {selectedEntity.type === 'screen' && (
                        <div style={{width:'100%', display:'flex', flexDirection:'column', height:'100%'}}>
                            
                            {/* AREA DE PREVIEW (FLEXIBLE) */}
                            <div style={{flex: 1, display:'flex', alignItems:'center', justifyContent:'center', padding: '20px', width: '100%'}}>
                                <div style={{width: '100%', aspectRatio: selectedEntity.data.orientation === 'vertical' ? '9/16' : '16/9', background:'black', borderRadius:'12px', border:'2px solid #334155', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 20px 50px rgba(0,0,0,0.3)'}}>
                                    {playlist.length > 0 ? ( (() => { const item = playlist[currentPreviewIndex]; return item?.type === 'video' ? <video src={item.url} style={{width:'100%', height:'100%', objectFit:'cover'}} muted loop autoPlay /> : <img src={item?.url} style={{width:'100%', height:'100%', objectFit:'cover'}} />; })() ) : <div style={{color:'white', opacity:0.5}}><Play size={40}/></div>}
                                </div>
                            </div>
                            
                            {/* BLOQUEO POR GRUPO O ACCIONES (BOTTOM) */}
                            <div style={{padding:'20px', borderTop:'1px solid #1e293b'}}>
                                {selectedEntity.data.group_id ? (
                                    <div style={{textAlign:'center', color:'#94a3b8'}}>
                                        <Lock size={24} style={{marginBottom:10}}/>
                                        <p style={{fontSize:12, margin:0}}>Esta pantalla está sincronizada con un grupo.</p>
                                        <button onClick={handleRemoveScreenFromGroup} style={{...btnSecondary, background:'transparent', color:'#cbd5e1', border:'1px solid #334155', marginTop:15, width:'100%', justifyContent:'center'}}>Desvincular del Grupo</button>
                                    </div>
                                ) : (
                                    selectedEntity.data.status === 'online' ? 
                                        <button onClick={handleUnlinkTV} className="btn-alert-base btn-alert-danger" style={{width:'100%', padding: '12px', background: '#fee2e2', color: '#ef4444', border: 'none'}}>Desvincular TV</button> : 
                                        <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px'}}>
                                            <input type="text" placeholder="CÓDIGO" value={pairingCodeInput} onChange={e => setPairingCodeInput(e.target.value.toUpperCase())} style={{...inputStyle, textAlign:'center', color:'white', background:'transparent', borderColor:'#475569'}} maxLength={4} />
                                            <button onClick={handleLinkTV} style={{...btnPrimaryFull, width:'100%', marginTop:'10px'}}>Vincular</button>
                                        </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL (DESKTOP + MOBILE) */}
                <div className="modal-right-panel">
                    <div className="right-panel-header">
                        <div><h3 style={{margin:0, color:'#1e293b'}}>Playlist</h3></div>
                        {!isScreenLockedByGroup && (
                            <button onClick={handleSaveAllChanges} disabled={!hasUnsavedChanges || isSavingOrder} className={hasUnsavedChanges ? "btn-save-primary" : "btn-save-disabled"}>
                                {isSavingOrder ? <Loader className="spin-anim" size={16}/> : <Save size={16}/>} Guardar
                            </button>
                        )}
                    </div>

                    {/* MOBILE TABS */}
                    <div className="mobile-tabs-container">
                        <button className={`mobile-tab ${mobileTab === 'playlist' ? 'active' : ''}`} onClick={() => setMobileTab('playlist')}><List size={16}/> Playlist</button>
                        {!isScreenLockedByGroup && <button className={`mobile-tab ${mobileTab === 'library' ? 'active' : ''}`} onClick={() => setMobileTab('library')}><ImageIcon size={16}/> Biblioteca</button>}
                        <button className={`mobile-tab ${mobileTab === 'monitor' ? 'active' : ''}`} onClick={() => setMobileTab('monitor')}><Monitor size={16}/> {selectedEntity.type === 'group' ? 'Pantallas' : 'Monitor'}</button>
                    </div>

                    {/* VIEW: BLOCKED BY GROUP */}
                    {isScreenLockedByGroup ? (
                        <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px', color:'#94a3b8', padding:'40px'}}>
                            <div style={{background:'#f1f5f9', padding:'30px', borderRadius:'50%'}}><Lock size={40} color="#64748b"/></div>
                            <div style={{textAlign:'center'}}>
                                <h3 style={{color:'#334155', marginBottom:'5px'}}>Gestionado por Grupo</h3>
                                <p style={{maxWidth:'300px', fontSize:'14px', lineHeight:'1.5'}}>Esta pantalla está sincronizada con un grupo. Para editar su contenido individual, primero debes desvincularla.</p>
                            </div>
                        </div>
                    ) : (
                        /* VIEW: NORMAL PLAYLIST & LIBRARY */
                        <>
                            {/* PLAYLIST */}
                            <div className="playlist-scroll-area" style={{display: (mobileTab === 'playlist' || window.innerWidth > 1024) ? 'block' : 'none'}}>
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPlaylist}>
                                    <SortableContext items={playlist.map(p => p.item_id)} strategy={rectSortingStrategy}>
                                        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                            {playlist.map((item, index) => <SortablePlaylistItem key={item.item_id} item={item} index={index} onRemove={handleRemoveFromPlaylistLocal} onUpdateDuration={handleUpdateDurationLocal} />)}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                                {playlist.length === 0 && <div style={{padding:'40px', textAlign:'center', color:'#94a3b8', border:'2px dashed #e2e8f0', borderRadius:'12px'}}>Lista vacía</div>}
                            </div>

                            {/* LIBRARY */}
                            <div className="library-section" style={{display: (mobileTab === 'library' || window.innerWidth > 1024) ? 'flex' : 'none'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><h4 style={{margin:0, fontSize:'14px', color:'#475569'}}><ImageIcon size={14}/> Biblioteca</h4><label style={{...btnUploadStyle, cursor:'pointer'}}>{isUploading ? <Loader size={14} className="spin-anim"/> : <Upload size={14}/>} Subir<input type="file" hidden onChange={handleFileUpload}/></label></div>
                                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px, 1fr))', gap:'10px', overflowY:'auto', flex:1}}>
                                    {availableMedia.map(m => ( <div key={m.id} onClick={() => handleAddToPlaylistLocal(m.id)} style={{aspectRatio:'16/9', borderRadius:'8px', overflow:'hidden', cursor:'pointer', position:'relative'}}><img src={m.url} style={{width:'100%', height:'100%', objectFit:'cover'}}/></div> ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* VIEW: MONITOR MOBILE (Solo móvil) */}
                    <div className="mobile-monitor-panel" style={{display: mobileTab === 'monitor' ? 'flex' : 'none'}}>
                        {selectedEntity.type === 'screen' ? (
                            <div style={{textAlign:'center', width:'100%'}}>
                                <h3>{selectedEntity.data.name}</h3>
                                <div style={{width:'100%', aspectRatio:'16/9', background:'black', margin:'20px 0', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    {playlist.length > 0 ? <img src={playlist[currentPreviewIndex]?.url} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <p>Sin contenido</p>}
                                </div>
                                {selectedEntity.data.status === 'online' ? <button onClick={handleUnlinkTV} className="btn-alert-base btn-alert-danger">Desvincular</button> : <p>Offline</p>}
                            </div>
                        ) : (
                            <div style={{width:'100%'}}>
                                <h3>Pantallas del Grupo</h3>
                                {screensData.map(s => (
                                    <div key={s.id} onClick={() => toggleScreenInGroup(s.id)} style={{padding:'15px', borderBottom:'1px solid #334155', display:'flex', justifyContent:'space-between'}}>
                                        <span>{s.name}</span>
                                        {groupScreens.includes(s.id) && <Check size={16} color="#4ade80"/>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODALES CREAR */}
      {showCreateModal && <div style={overlayStyle} onClick={() => setShowCreateModal(false)}><div className="alert-modal" onClick={e=>e.stopPropagation()}><h3>Nueva Pantalla</h3><form onSubmit={handleCreateScreen}><input autoFocus type="text" placeholder="Nombre" value={newScreenName} onChange={e=>setNewScreenName(e.target.value)} style={inputStyle}/><button type="submit" style={{...btnPrimaryFull, width:'100%', marginTop:'15px'}}>Crear</button></form></div></div>}
      {showCreateGroupModal && <div style={overlayStyle} onClick={() => setShowCreateGroupModal(false)}><div className="alert-modal" onClick={e=>e.stopPropagation()}><h3>Nuevo Grupo</h3><form onSubmit={handleCreateGroup}><input autoFocus type="text" placeholder="Nombre del Grupo" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} style={inputStyle}/><button type="submit" style={{...btnPrimaryFull, width:'100%', marginTop:'15px'}}>Crear Grupo</button></form></div></div>}
    
    </SidebarLayout>
  );
}