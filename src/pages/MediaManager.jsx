import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';
import { getMediaUrl } from '../utils/getMediaUrl';
import {
  Folder, FolderOpen, File, Image as ImageIcon, Film, Upload, Search, Plus,
  Trash2, Copy, Scissors, Clipboard, Pencil, X, ChevronRight, ChevronDown,
  MoreVertical, FolderPlus, RefreshCw, ArrowLeft, Home, Play, Eye
} from 'lucide-react';
import MediaPreviewModal from '../components/MediaPreviewModal'; // Asegúrate de que la ruta sea correcta

// ==============================
// ESTILOS INLINE (Actualizados)
// ==============================
const STYLES = `
  :root {
    --explorer-bg: #f1f5f9;
    --panel-bg: #ffffff;
    --card-bg: #f8fafc;
    --border: #e2e8f0;
    --text: #1e293b;
    --text-muted: #64748b;
    --accent: #3b82f6;
    --accent-hover: #2563eb;
    --danger: #ef4444;
    --success: #22c55e;
    --selected: #eff6ff;
    --drag-over: rgba(59,130,246,0.18);
  }

  .explorer-root { display: flex; height: calc(100vh - 80px); background: var(--explorer-bg); border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }

  /* PANEL IZQUIERDO */
  .sidebar-panel { width: 260px; min-width: 220px; background: var(--panel-bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
  .sidebar-header { padding: 16px; border-bottom: 1px solid var(--border); }
  .sidebar-title { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
  .sidebar-folders { flex: 1; overflow-y: auto; padding: 8px; }
  
  /* ESTILOS NUEVOS PARA CARPETAS RECURSIVAS */
  .folder-tree-item { display: flex; align-items: center; padding: 6px 8px; border-radius: 6px; cursor: pointer; color: var(--text); font-size: 13px; transition: all 0.2s ease; position: relative; user-select: none; margin-bottom: 2px;}
  .folder-tree-item:hover { background: #f8fafc; }
  .folder-tree-item.active { background: var(--selected); color: var(--accent); font-weight: 500;}
  .folder-tree-item.drag-over { background: var(--drag-over) !important; border: 1px dashed var(--accent); }
  .folder-tree-icon-wrapper { width: 20px; display: flex; justify-content: center; align-items: center; color: var(--text-muted); }
  .folder-tree-icon-wrapper:hover { color: var(--text); }
  .folder-delete-btn { position: absolute; right: 6px; opacity: 0; background: none; border: none; color: var(--danger); cursor: pointer; padding: 4px; border-radius: 4px; display:flex; align-items:center; justify-content:center;}
  .folder-tree-item:hover .folder-delete-btn { opacity: 1; }
  .folder-delete-btn:hover { background: #fee2e2; }

  /* PANEL DERECHO */
  .main-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .toolbar { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--panel-bg); flex-wrap: wrap; }
  
  .search-box { display: flex; align-items: center; gap: 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 7px 12px; flex: 1; min-width: 160px; }
  .search-box input { background: none; border: none; outline: none; color: var(--text); font-size: 13px; width: 100%; }
  .search-box input::placeholder { color: var(--text-muted); }

  .btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: 0.15s; }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-secondary { background: white; color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { background: #f8fafc; }
  .btn-icon { background: white; color: var(--text); border: 1px solid var(--border); padding: 7px 10px; border-radius: 8px; cursor: pointer;}
  .btn-icon:hover { background: #f8fafc; }

  /* BREADCRUMB */
  .breadcrumb { display: flex; align-items: center; gap: 4px; padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--text-muted); background: var(--panel-bg); }
  .breadcrumb-item { cursor: pointer; transition: 0.15s; }
  .breadcrumb-item:hover { color: var(--accent); }
  .breadcrumb-item.current { color: var(--text); font-weight: 600; cursor: default; }

  /* GRID DE ARCHIVOS */
  .files-area { flex: 1; overflow-y: auto; padding: 16px; }
  .files-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
  
  .file-card { background: var(--panel-bg); border: 2px solid transparent; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.2s ease; position: relative; user-select: none; box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column; aspect-ratio: 1; }
  .file-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  .file-card.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 10px 15px -3px rgba(59,130,246,0.2); }
  .file-card.dragging { opacity: 0.5; }
  .file-card.cut { opacity: 0.5; border-style: dashed; border-color: var(--border); }

  .file-thumb-container { position: relative; flex: 1; width: 100%; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center;}
  .file-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
  
  /* ESTILOS PARA EL BOTÓN DE PLAY EN VIDEOS */
  .video-play-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
  .video-play-btn { background: rgba(59, 130, 246, 0.9); color: white; padding: 12px; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transform: scale(0.9); transition: all 0.2s ease; display:flex; align-items:center; justify-content:center;}
  .file-card:hover .video-play-overlay { background: rgba(0,0,0,0.3); }
  .file-card:hover .video-play-btn { transform: scale(1.1); background: var(--accent); }

  .file-info { padding: 10px; background: white; border-top: 1px solid var(--border); height: 50px; display:flex; flex-direction: column; justify-content:center;}
  .file-name { font-size: 13px; color: var(--text); font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .file-type-badge { display:flex; align-items:center; gap: 4px; font-size: 11px; color: var(--text-muted); margin-top: 2px;}
  
  .file-checkbox { position: absolute; top: 8px; left: 8px; width: 20px; height: 20px; border-radius: 6px; background: var(--accent); border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: 0.2s; z-index: 10;}
  .file-card:hover .file-checkbox, .file-card.selected .file-checkbox { opacity: 1; }

  .file-preview-btn { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 6px; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: 0.2s; z-index: 10; cursor: pointer; }
  .file-card:hover .file-preview-btn { opacity: 1; }
  .file-preview-btn:hover { background: var(--accent); border-color: var(--accent); transform: scale(1.1); }

  /* SELECTION BAR */
  .selection-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #eff6ff; border-top: 1px solid #bfdbfe; color: var(--text); font-size: 13px; }
  .selection-bar-actions { display: flex; gap: 8px; margin-left: auto; }

  /* CONTEXT MENU */
  .context-menu { position: fixed; background: white; border: 1px solid var(--border); border-radius: 10px; padding: 6px; z-index: 9999; box-shadow: 0 10px 25px rgba(0,0,0,0.1); min-width: 180px; }
  .context-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: var(--text); transition: 0.1s; }
  .context-item:hover { background: #f8fafc; }
  .context-item.danger { color: var(--danger); }
  .context-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* MODAL */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10000; }
  .modal-box { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 24px; width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
  .modal-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 16px; }
  .modal-input { width: 100%; background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text); font-size: 14px; outline: none; box-sizing: border-box; }
  .modal-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

  /* ZONA SUBIDA Y ESTADOS VACÍOS */
  .upload-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; color: var(--text-muted); cursor: pointer; transition: 0.2s; margin: 0; display: block; background: #f8fafc;}
  .upload-zone:hover { border-color: var(--accent); color: var(--accent); background: #eff6ff;}
  .upload-zone-title { font-weight: 600; color: var(--text); margin-bottom: 4px; font-size: 14px; }
  .upload-zone-sub { font-size: 13px; color: var(--text-muted); }
  .upload-zone input { display: none; }

  .folder-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 16px 14px; cursor: pointer; transition: 0.15s; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; user-select: none; }
  .folder-card:hover { border-color: var(--accent); background: var(--selected); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.10); }
  .folder-card.drag-over-card { border-color: var(--accent); background: var(--drag-over); border-style: dashed; }
  .folder-card-name { font-size: 13px; font-weight: 600; color: var(--text); flex: 1; word-break: break-word; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .folder-card-del { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; opacity: 0; transition: 0.15s; flex-shrink: 0; display: flex; align-items: center; }
  .folder-card:hover .folder-card-del { opacity: 1; }
  .folder-card-del:hover { color: var(--danger); background: #fee2e2; }

  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-muted); gap: 12px; }
  .empty-state svg { opacity: 0.3; }
  .loading-spinner { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-muted); }

  @media (max-width: 640px) {
    .sidebar-panel { width: 0; min-width: 0; overflow: hidden; border:none;}
    .explorer-root { border-radius: 8px; }
    .files-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
  }
`;

// ==============================
// HELPERS
// ==============================
const getClientId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.client_id || null;
};
const isSuperAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'super_admin';
};

// ==============================
// COMPONENT: TreeNode (Carpeta Recursiva)
// ==============================
const TreeNode = ({ folder, allFolders, currentFolder, onNavigate, onDrop, onDragOver, draggingOver, onDelete, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = currentFolder === folder.id;
  const isDraggingOver = draggingOver === folder.id;

  const children = allFolders.filter(f => f.parent_id === folder.id);
  const hasChildren = children.length > 0;

  useEffect(() => {
    const isDescendantActive = (childrenArray) => {
      if (childrenArray.some(child => child.id === currentFolder)) return true;
      return childrenArray.some(child => {
        const grandChildren = allFolders.filter(f => f.parent_id === child.id);
        return isDescendantActive(grandChildren);
      });
    };
    if (hasChildren && isDescendantActive(children)) {
      setIsExpanded(true);
    }
  }, [currentFolder, children, allFolders, hasChildren]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onNavigate(folder);
    if (hasChildren && !isExpanded) setIsExpanded(true);
  };

  return (
    <div>
      <div
        className={`folder-tree-item ${isActive ? 'active' : ''} ${isDraggingOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${(depth * 16) + 8}px` }}
        onClick={handleClick}
        onDragOver={(e) => onDragOver(e, folder.id)}
        onDragLeave={() => onDragOver(null, null)}
        onDrop={(e) => onDrop(e, folder.id)}
      >
        <div className="folder-tree-icon-wrapper" onClick={hasChildren ? handleToggle : undefined}>
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : <span style={{ width: '14px' }}></span>}
        </div>

        {isExpanded && hasChildren ? <FolderOpen size={16} style={{ marginRight: '8px', color: isActive ? 'var(--accent)' : 'inherit' }} /> : <Folder size={16} style={{ marginRight: '8px', color: isActive ? 'var(--accent)' : 'inherit' }} />}

        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {folder.name}
        </span>

        <button
          className="folder-delete-btn"
          onClick={e => { e.stopPropagation(); onDelete(folder.id); }}
          title="Eliminar carpeta"
        >
          <X size={12} />
        </button>
      </div>

      {isExpanded && hasChildren && (
        <div className="folder-tree-children">
          {children.map(childFolder => (
            <TreeNode
              key={childFolder.id}
              folder={childFolder}
              allFolders={allFolders}
              currentFolder={currentFolder}
              onNavigate={onNavigate}
              onDrop={onDrop}
              onDragOver={onDragOver}
              draggingOver={draggingOver}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==============================
// COMPONENT: FileCard (Actualizado con Video y Botón de Preview)
// ==============================
const FileCard = React.memo(({ item, selected, inClipboard, clipboardAction, onSelect, onContextMenu, onDragStart, isEmbedded, onAdd, onPreview }) => {
  const isVideo = item.type?.startsWith('video') || item.url?.match(/\.(mp4|webm|ogg)$/i);
  const isImage = item.type?.startsWith('image') || item.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isCut = inClipboard && clipboardAction === 'cut';

  const renderThumbnail = () => {
    if (isImage) {
      return <img src={getMediaUrl(item.url)} alt={item.name} className="file-thumb" loading="lazy" />;
    } else if (isVideo) {
      return (
        <>
          <video
            src={getMediaUrl(item.url)}
            className="file-thumb"
            preload="metadata"
            muted
          />
          <div className="video-play-overlay">
            <div className="video-play-btn">
              <Play size={20} fill="white" />
            </div>
          </div>
        </>
      );
    } else {
      return <File size={32} color="var(--text-muted)" />;
    }
  };

  return (
    <div
      className={`file-card ${selected ? 'selected' : ''} ${isCut ? 'cut' : ''}`}
      onClick={(e) => onSelect(item.id, e)}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, item); }}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
    >
      <div className="file-checkbox"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>

      <button
        className="file-preview-btn"
        onClick={(e) => { e.stopPropagation(); onPreview(item); }}
        title="Previsualizar"
      >
        <Eye size={14} />
      </button>

      <div className="file-thumb-container">
        {renderThumbnail()}
      </div>

      <div className="file-info">
        <div className="file-name" title={item.name}>{item.name}</div>
        <div className="file-type-badge">
          {isVideo ? <Film size={12} /> : isImage ? <ImageIcon size={12} /> : <File size={12} />}
          <span>{isVideo ? 'Video' : isImage ? 'Imagen' : 'Documento'}</span>
        </div>
      </div>
    </div>
  );
});

// ==============================
// MAIN COMPONENT
// ==============================
export default function MediaManager({ isEmbedded = false, onSelectMedia = null, customClientId = null }) {
  const [allMedia, setAllMedia] = useState([]);
  const [folders, setFolders] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [clipboard, setClipboard] = useState({ items: [], action: null });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [draggingOver, setDraggingOver] = useState(null);
  const [previewItem, setPreviewItem] = useState(null); // Estado para el modal de previsualización

  const clientId = customClientId || getClientId();
  const superAdmin = customClientId ? false : isSuperAdmin();
  const fileInputRef = useRef(null);
  const draggedIdRef = useRef(null);

  const getEffectiveClientId = useCallback(() => {
    if (clientId) return clientId;
    if (typeof currentFolder === 'string' && currentFolder.startsWith('client_')) {
      const suffix = currentFolder.split('_').slice(1).join('_');
      const numericId = parseInt(suffix);
      if (!isNaN(numericId)) return numericId;
      const match = clients.find(c => String(c.id) === suffix || c.slug === suffix || c.folder_name === suffix);
      if (match) return match.id;
    }
    if (currentFolder && typeof currentFolder === 'number') {
      const parentFolder = folders.find(f => f.id === currentFolder);
      if (parentFolder?.client_id) return parentFolder.client_id;
    }
    return null;
  }, [clientId, currentFolder, folders, clients]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const promises = [
        api.get(`/media/library${clientId && !superAdmin ? `?clientId=${clientId}` : ''}`),
        api.get(`/media/folders${clientId && !superAdmin ? `?clientId=${clientId}` : ''}`)
      ];
      if (superAdmin) promises.push(api.get('/admin/clients'));
      const results = await Promise.all(promises);
      setAllMedia(results[0].data);
      setFolders(results[1].data);
      if (superAdmin && results[2]) setClients(results[2].data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clientId, superAdmin]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (isEmbedded && onSelectMedia) {
      if (selected.size === 1) {
        const selectedId = Array.from(selected)[0];
        const item = allMedia.find(m => m.id === selectedId);
        onSelectMedia(item);
      } else {
        onSelectMedia(null);
      }
    }
  }, [selected, isEmbedded, allMedia]);

  let currentFolders = [];
  let visibleMedia = [];

  if (superAdmin && currentFolder === null) {
    currentFolders = clients.map(c => ({
      id: `client_${c.id}`, name: c.name, parent_id: null, isClientTopLevel: true, actual_client_id: c.id
    }));
    visibleMedia = [];
  } else {
    let clientFilter = null;
    let parentFolderId = currentFolder;
    if (superAdmin && typeof currentFolder === 'string' && currentFolder.startsWith('client_')) {
      clientFilter = parseInt(currentFolder.split('_')[1]);
      parentFolderId = null;
    }
    currentFolders = folders.filter(f => {
      if (clientFilter !== null) return f.parent_id === null && f.client_id === clientFilter;
      return f.parent_id === parentFolderId;
    });
    visibleMedia = allMedia.filter(m => {
      if (clientFilter !== null) return !m.folder_id && m.client_id === clientFilter;
      const inFolder = (parentFolderId === null ? (!m.folder_id && (!superAdmin || m.client_id === clientId)) : m.folder_id === parentFolderId);
      const matchesSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase());
      return inFolder && matchesSearch;
    });
  }

  const handleSelect = (id, e) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (e.ctrlKey || e.metaKey) {
        next.has(id) ? next.delete(id) : next.add(id);
      } else if (e.shiftKey && prev.size > 0) {
        const ids = visibleMedia.map(m => m.id);
        const lastId = [...prev].at(-1);
        const a = ids.indexOf(lastId), b = ids.indexOf(id);
        const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
        ids.slice(lo, hi + 1).forEach(i => next.add(i));
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const copySelected = () => { setClipboard({ items: [...selected], action: 'copy' }); };
  const cutSelected = () => { setClipboard({ items: [...selected], action: 'cut' }); };
  const paste = async () => {
    if (!clipboard.items.length) return;
    const effectiveClientId = getEffectiveClientId();
    for (const id of clipboard.items) {
      if (clipboard.action === 'copy') await api.post('/media/copy', { mediaId: id, targetClientId: effectiveClientId });
      else await api.patch(`/media/${id}/move`, { folder_id: currentFolder });
    }
    if (clipboard.action === 'cut') setClipboard({ items: [], action: null });
    setSelected(new Set());
    loadAll();
  };
  const deleteSelected = async () => {
    if (!window.confirm(`¿Eliminar ${selected.size} archivo(s)?`)) return;
    for (const id of selected) await api.delete(`/media/${id}`);
    setSelected(new Set());
    loadAll();
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const effectiveClientId = getEffectiveClientId();
    for (const file of files) {
      const fd = new FormData();
      if (effectiveClientId) fd.append('clientId', effectiveClientId);
      if (currentFolder && typeof currentFolder === 'number') fd.append('folderId', currentFolder);
      fd.append('file', file);
      try { await api.post('/media/upload', fd, { headers: { 'Content-Type': undefined } }); }
      catch (err) { console.error('Upload error:', err?.response?.data || err.message); }
    }
    setUploading(false);
    loadAll();
    e.target.value = '';
  };

  const doRename = async () => {
    if (!modal?.item || !modal.value?.trim()) return;
    await api.patch(`/media/${modal.item.id}/rename`, { name: modal.value.trim() });
    setModal(null);
    loadAll();
  };

  const doCreateFolder = async () => {
    if (!modal.value.trim()) return;
    if (superAdmin && clients.some(c => c.name.toLowerCase() === modal.value.trim().toLowerCase())) {
      alert("No se puede crear una carpeta con el mismo nombre que un cliente.");
      return;
    }
    let parentFolderId = currentFolder;
    let clientIdForFolder = clientId;
    if (superAdmin) {
      if (currentFolder === null) { alert("No puedes crear carpetas aquí. Entra a un cliente primero."); return; }
      if (typeof currentFolder === 'string' && currentFolder.startsWith('client_')) {
        parentFolderId = null; clientIdForFolder = parseInt(currentFolder.split('_')[1]);
      } else {
        const parent = folders.find(f => f.id === currentFolder);
        if (parent) clientIdForFolder = parent.client_id;
      }
    }
    try {
      await api.post('/media/folders', { name: modal.value.trim(), parent_id: parentFolderId, client_id: clientIdForFolder });
      setModal(null); loadAll();
    } catch (e) { alert('Error al crear la carpeta'); }
  };

  const doDeleteFolder = async (folderId) => {
    if (!window.confirm('¿Eliminar carpeta? Los archivos quedarán en la raíz.')) return;
    await api.delete(`/media/folders/${folderId}`);
    if (currentFolder === folderId) { setCurrentFolder(null); setFolderPath([]); }
    loadAll();
  };

  const navigateToFolder = (folder) => {
    setCurrentFolder(folder?.id || null);

    if (folder) {
      const newPath = [];
      let current = folder;
      while (current) {
        newPath.unshift(current);
        current = folders.find(f => f.id === current.parent_id);
      }
      setFolderPath(newPath);
    } else {
      setFolderPath([]);
    }

    setSelected(new Set());
    setSearch('');
  };

  const navigateBack = () => {
    const path = folderPath.slice(0, -1);
    setFolderPath(path);
    setCurrentFolder(path.length ? path[path.length - 1].id : null);
    setSelected(new Set());
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('mediaId', String(item.id));
    e.dataTransfer.effectAllowed = 'move';
    draggedIdRef.current = item.id;
    if (!selected.has(item.id)) {
      setSelected(new Set([item.id]));
    }
  };

  const handleFolderDragOver = (e, folderId) => {
    e.preventDefault();
    if (folderId === null) {
      setDraggingOver(null);
    } else {
      setDraggingOver(folderId);
    }
  };

  const handleFolderDrop = async (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingOver(null);

    const primaryId = draggedIdRef.current || parseInt(e.dataTransfer.getData('mediaId'));
    draggedIdRef.current = null;

    const idsToMove = new Set(selected);
    if (primaryId) idsToMove.add(primaryId);

    if (idsToMove.size === 0) return;

    try {
      await Promise.all([...idsToMove].map(id => api.patch(`/media/${id}/move`, { folder_id: folderId })));
    } catch (err) { console.error('Error moviendo archivos:', err); }
    setSelected(new Set());
    loadAll();
  };

  const openContextMenu = (e, item) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
    if (!selected.has(item.id)) setSelected(new Set([item.id]));
  };

  const Breadcrumb = () => (
    <div className="breadcrumb">
      <Home size={14} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setCurrentFolder(null); setFolderPath([]); setSearch(''); }} />
      {folderPath.map(p => (
        <React.Fragment key={p.id}>
          <ChevronRight size={14} />
          <div className={`breadcrumb-item ${p.id === currentFolder ? 'current' : ''}`} onClick={() => navigateToFolder(p)}>
            {p.name}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const selectedItems = [...selected].map(id => allMedia.find(m => m.id === id)).filter(Boolean);
  const isEmpty = currentFolders.length === 0 && visibleMedia.length === 0;
  const isSuperAdminRoot = superAdmin && currentFolder === null;

  const rootFolders = useMemo(() => {
    if (isSuperAdminRoot) return [];

    let activeClient = null;
    if (superAdmin) {
      activeClient = typeof currentFolder === 'string' ? parseInt(currentFolder.split('_')[1]) : (folders.find(x => x.id === currentFolder)?.client_id);
    }

    return folders.filter(f => !f.parent_id && (superAdmin ? f.client_id === activeClient : true));
  }, [folders, superAdmin, currentFolder, isSuperAdminRoot]);

  const content = (
    <>
      <div className="explorer-root" style={isEmbedded ? { height: '100%', border: 'none', borderRadius: '0' } : {}}>
        {!isSuperAdminRoot && (
          <div className="sidebar-panel">
            <div className="sidebar-header">
              <div className="sidebar-title">Carpetas</div>
            </div>
            <div className="sidebar-folders">
              <div
                className={`folder-tree-item ${currentFolder === null ? 'active' : ''}`}
                style={{ paddingLeft: '8px' }}
                onClick={() => { setCurrentFolder(null); setFolderPath([]); setSearch(''); }}
                onDragOver={e => handleFolderDragOver(e, null)}
                onDrop={e => handleFolderDrop(e, null)}
              >
                <div className="folder-tree-icon-wrapper"></div>
                {currentFolder === null ? <FolderOpen size={16} style={{ marginRight: '8px', color: 'var(--accent)' }} /> : <Folder size={16} style={{ marginRight: '8px' }} />}
                <span>Inicio</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}></div>

              {rootFolders.map(folder => (
                <TreeNode
                  key={folder.id}
                  folder={folder}
                  allFolders={folders}
                  currentFolder={currentFolder}
                  onNavigate={navigateToFolder}
                  onDrop={handleFolderDrop}
                  onDragOver={handleFolderDragOver}
                  draggingOver={draggingOver}
                  onDelete={doDeleteFolder}
                  depth={0}
                />
              ))}

              <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0 8px 0' }}></div>
              <div
                className="folder-tree-item"
                style={{ color: 'var(--text-muted)', paddingLeft: '8px' }}
                onClick={() => setModal({ type: 'createFolder', value: '' })}
              >
                <FolderPlus size={16} style={{ marginRight: '8px' }} /> <span style={{ fontWeight: 500 }}>Nueva carpeta</span>
              </div>
            </div>
          </div>
        )}

        <div className="main-panel">
          <div className="toolbar">
            {folderPath.length > 0 && (
              <button className="btn btn-icon" onClick={navigateBack} title="Volver">
                <ArrowLeft size={16} />
              </button>
            )}

            <div className="search-box">
              <Search size={14} color="var(--text-muted)" />
              <input type="text" placeholder="Buscar archivos..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />}
            </div>

            {clipboard.items.length > 0 && (
              <button className="btn btn-secondary" onClick={paste} title="Pegar">
                <Clipboard size={16} /> Pegar ({clipboard.items.length})
              </button>
            )}

            <button className="btn btn-secondary" onClick={() => setModal({ type: 'createFolder', value: '' })}>
              <FolderPlus size={16} /> Carpeta
            </button>

            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload size={16} /> {uploading ? 'Subiendo...' : 'Subir'}
            </button>
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload} accept="image/*,video/*" />

            <button className="btn btn-icon" onClick={loadAll} title="Refrescar">
              <RefreshCw size={15} />
            </button>
          </div>

          <Breadcrumb />

          {selected.size > 0 && (
            <div className="selection-bar">
              <span style={{ fontWeight: 500 }}>{selected.size} elemento(s) seleccionado(s)</span>
              <div className="selection-bar-actions">
                <button className="btn btn-secondary" onClick={copySelected}><Copy size={14} /> Copiar</button>
                <button className="btn btn-secondary" onClick={cutSelected}><Scissors size={14} /> Cortar</button>
                {selected.size === 1 && (
                  <button className="btn btn-secondary" onClick={() => { const item = selectedItems[0]; setModal({ type: 'rename', item, value: item.name }); }}>
                    <Pencil size={14} /> Renombrar
                  </button>
                )}
                <button className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: '#fca5a5' }} onClick={deleteSelected}><Trash2 size={14} /> Eliminar</button>
                <button className="btn btn-icon" onClick={() => setSelected(new Set())}><X size={14} /></button>
              </div>
            </div>
          )}

          <div className="files-area" onClick={(e) => { if (e.target === e.currentTarget) setSelected(new Set()); }}>
            {loading ? (
              <div className="loading-spinner">Cargando...</div>
            ) : isEmpty && !search ? (
              <label className="upload-zone">
                <Upload size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <div className="upload-zone-title">Arrastra tus archivos aquí</div>
                <div className="upload-zone-sub">o haz clic para seleccionar (imágenes y videos)</div>
                <input type="file" multiple hidden onChange={handleUpload} accept="image/*,video/*" />
              </label>
            ) : search && visibleMedia.length === 0 && currentFolders.length === 0 ? (
              <div className="empty-state"><Search size={48} /><span>Sin resultados para "{search}"</span></div>
            ) : (
              <div className="files-grid">
                {currentFolders.map(folder => (
                  <div
                    key={`folder-${folder.id}`}
                    className={`folder-card ${draggingOver === folder.id ? 'drag-over-card' : ''}`}
                    onClick={(e) => { e.stopPropagation(); navigateToFolder(folder); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingOver(folder.id); }}
                    onDragLeave={() => setDraggingOver(null)}
                    onDrop={(e) => { e.stopPropagation(); handleFolderDrop(e, folder.id); }}
                  >
                    <Folder size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                    <span className="folder-card-name">{folder.name}</span>
                    <button className="folder-card-del" onClick={(e) => { e.stopPropagation(); doDeleteFolder(folder.id); }} title="Eliminar carpeta">
                      <X size={13} />
                    </button>
                  </div>
                ))}

                {visibleMedia.map(item => (
                  <FileCard
                    key={item.id}
                    item={item}
                    selected={selected.has(item.id)}
                    inClipboard={clipboard.items.includes(item.id)}
                    clipboardAction={clipboard.action}
                    onSelect={handleSelect}
                    onContextMenu={openContextMenu}
                    onDragStart={handleDragStart}
                    isEmbedded={isEmbedded}
                    onAdd={onSelectMedia}
                    onPreview={setPreviewItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={e => e.stopPropagation()}>
          <div className="context-item" onClick={() => { setPreviewItem(contextMenu.item); setContextMenu(null); }}><Eye size={14} /> Previsualizar</div>
          <div className="context-divider" />
          <div className="context-item" onClick={() => { copySelected(); setContextMenu(null); }}><Copy size={14} /> Copiar</div>
          <div className="context-item" onClick={() => { cutSelected(); setContextMenu(null); }}><Scissors size={14} /> Cortar</div>
          {clipboard.items.length > 0 && <div className="context-item" onClick={() => { paste(); setContextMenu(null); }}><Clipboard size={14} /> Pegar</div>}
          <div className="context-divider" />
          <div className="context-item" onClick={() => { setModal({ type: 'rename', item: contextMenu.item, value: contextMenu.item.name }); setContextMenu(null); }}><Pencil size={14} /> Renombrar</div>
          <div className="context-divider" />
          <div className="context-item danger" onClick={() => { deleteSelected(); setContextMenu(null); }}><Trash2 size={14} /> Eliminar</div>
        </div>
      )}

      {/* ===== PREVIEW MODAL ===== */}
      <MediaPreviewModal
        isOpen={!!previewItem}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {modal.type === 'rename' && (
              <>
                <div className="modal-title">Renombrar archivo</div>
                <input autoFocus className="modal-input" value={modal.value} onChange={e => setModal({ ...modal, value: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setModal(null); }} />
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={doRename}>Guardar</button>
                </div>
              </>
            )}
            {modal.type === 'createFolder' && (
              <>
                <div className="modal-title">Nueva carpeta</div>
                <input autoFocus className="modal-input" placeholder="Nombre de la carpeta" value={modal.value} onChange={e => setModal({ ...modal, value: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') doCreateFolder(); if (e.key === 'Escape') setModal(null); }} />
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={doCreateFolder}>Crear</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (isEmbedded) {
    return (
      <div className="media-manager-embedded" style={{ height: '100%' }}>
        <style>{STYLES}</style>
        {content}
      </div>
    );
  }

  return (
    <SidebarLayout>
      <style>{STYLES}</style>
      {content}
    </SidebarLayout>
  );
}