import React, { useState, useEffect, useRef, useCallback } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';
import {
  Folder, FolderOpen, File, Image, Film, Upload, Search, Plus,
  Trash2, Copy, Scissors, Clipboard, Pencil, X, ChevronRight,
  MoreVertical, FolderPlus, RefreshCw, ArrowLeft, Home
} from 'lucide-react';

// ==============================
// ESTILOS INLINE
// ==============================
const STYLES = `
  :root {
    --explorer-bg: #f1f5f9;
    --panel-bg: #ffffff;
    --card-bg: #f8fafc;
    --border: #e2e8f0;
    --text: #1e293b;
    --text-muted: #94a3b8;
    --accent: #3b82f6;
    --accent-hover: #2563eb;
    --danger: #ef4444;
    --success: #22c55e;
    --selected: rgba(59,130,246,0.10);
    --drag-over: rgba(59,130,246,0.18);
  }

  .explorer-root { display: flex; height: calc(100vh - 80px); background: var(--explorer-bg); border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }

  /* PANEL IZQUIERDO */
  .sidebar-panel { width: 220px; min-width: 180px; background: var(--panel-bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
  .sidebar-header { padding: 16px; border-bottom: 1px solid var(--border); }
  .sidebar-title { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
  .sidebar-folders { flex: 1; overflow-y: auto; padding: 8px; }
  .folder-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; cursor: pointer; color: var(--text); font-size: 13px; transition: 0.15s; position: relative; }
  .folder-item:hover { background: rgba(255,255,255,0.06); }
  .folder-item.active { background: var(--selected); color: var(--accent); }
  .folder-item.drag-over { background: var(--drag-over) !important; border: 1px dashed var(--accent); }
  .folder-delete-btn { position: absolute; right: 6px; opacity: 0; background: none; border: none; color: var(--danger); cursor: pointer; padding: 2px 4px; border-radius: 4px; }
  .folder-item:hover .folder-delete-btn { opacity: 1; }

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
  .btn-icon { background: white; color: var(--text); border: 1px solid var(--border); padding: 7px 10px; }
  .btn-icon:hover { background: #f8fafc; }

  /* BREADCRUMB */
  .breadcrumb { display: flex; align-items: center; gap: 4px; padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--text-muted); background: var(--panel-bg); }
  .breadcrumb-item { cursor: pointer; transition: 0.15s; }
  .breadcrumb-item:hover { color: var(--accent); }
  .breadcrumb-item.current { color: var(--text); font-weight: 600; cursor: default; }

  /* GRID DE ARCHIVOS */
  .files-area { flex: 1; overflow-y: auto; padding: 16px; }
  .files-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  
  .file-card { background: var(--panel-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; cursor: pointer; transition: 0.15s; position: relative; user-select: none; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .file-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.12); }
  .file-card.selected { border-color: var(--accent); background: var(--selected); }
  .file-card.dragging { opacity: 0.5; }
  .file-card.cut { opacity: 0.5; border-style: dashed; }

  .file-thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #f1f5f9; }
  .file-thumb-placeholder { width: 100%; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: var(--text-muted); }
  .file-thumb video { width: 100%; height: 100%; object-fit: cover; }
  .file-info { padding: 8px; background: white; }
  .file-name { font-size: 12px; color: var(--text); font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .file-type-badge { font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
  .file-checkbox { position: absolute; top: 6px; left: 6px; width: 16px; height: 16px; border-radius: 4px; background: var(--accent); border: none; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; opacity: 0; transition: 0.15s; }
  .file-card:hover .file-checkbox, .file-card.selected .file-checkbox { opacity: 1; }

  /* SELECTION BAR */
  .selection-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: rgba(59,130,246,0.12); border-top: 1px solid var(--accent); color: var(--text); font-size: 13px; }
  .selection-bar-actions { display: flex; gap: 8px; margin-left: auto; }

  /* CONTEXT MENU */
  .context-menu { position: fixed; background: white; border: 1px solid var(--border); border-radius: 10px; padding: 6px; z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.12); min-width: 180px; }
  .context-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: var(--text); transition: 0.1s; }
  .context-item:hover { background: #f8fafc; }
  .context-item.danger { color: var(--danger); }
  .context-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* MODAL */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 10000; }
  .modal-box { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 24px; width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
  .modal-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 16px; }
  .modal-input { width: 100%; background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text); font-size: 14px; outline: none; box-sizing: border-box; }
  .modal-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

  .upload-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; color: var(--text-muted); cursor: pointer; transition: 0.2s; margin: 0; display: block; }
  .upload-zone:hover { border-color: var(--accent); color: var(--accent); }
  .upload-zone-title { font-weight: 600; color: var(--text); margin-bottom: 4px; font-size: 14px; }
  .upload-zone-sub { font-size: 13px; color: var(--text-muted); }
  .upload-zone input { display: none; }

  .folder-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 16px 14px; cursor: pointer; transition: 0.15s; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; user-select: none; }
  .folder-card:hover { border-color: var(--accent); background: var(--selected); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.10); }
  .folder-card.drag-over-card { border-color: var(--accent); background: var(--drag-over); border-style: dashed; }
  .folder-card-name { font-size: 13px; font-weight: 600; color: var(--text); flex: 1; word-break: break-word; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .folder-card-del { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px 4px; border-radius: 4px; opacity: 0; transition: 0.15s; flex-shrink: 0; display: flex; align-items: center; }
  .folder-card:hover .folder-card-del { opacity: 1; }
  .folder-card-del:hover { color: var(--danger); background: #fee2e2; }

  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-muted); gap: 12px; }
  .empty-state svg { opacity: 0.3; }

  .loading-spinner { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-muted); }

  @media (max-width: 640px) {
    .sidebar-panel { width: 0; min-width: 0; overflow: hidden; }
    .explorer-root { border-radius: 8px; }
    .files-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
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
// COMPONENT: FileCard
// ==============================
const FileCard = React.memo(({ item, selected, inClipboard, clipboardAction, onSelect, onContextMenu, onDragStart, isEmbedded, onAdd }) => {
  const isImage = item.type === 'image';
  const isCut = inClipboard && clipboardAction === 'cut';

  return (
    <div
      className={`file-card ${selected ? 'selected' : ''} ${isCut ? 'cut' : ''}`}
      onClick={(e) => onSelect(item.id, e)}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, item); }}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
    >
      <div className="file-checkbox">✓</div>
      {isImage ? (
        <img src={item.url} alt={item.name} className="file-thumb" loading="lazy" />
      ) : (
        <div className="file-thumb-placeholder">
          <Film size={32} />
        </div>
      )}
      <div className="file-info">
        <div className="file-name" title={item.name}>{item.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <div className="file-type-badge">{item.type}</div>
          {isEmbedded && (
            <button
              className="btn btn-primary"
              style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
              onClick={(e) => { e.stopPropagation(); onAdd && onAdd(item); }}
            >
              Agregar
            </button>
          )}
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
  const [currentFolder, setCurrentFolder] = useState(null); // null = raíz
  const [folderPath, setFolderPath] = useState([]); // breadcrumb stack
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [clipboard, setClipboard] = useState({ items: [], action: null }); // copy | cut
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, item? }
  const [modal, setModal] = useState(null); // { type: 'rename'|'createFolder'|'deleteConfirm', item?, value }

  const clientId = customClientId || getClientId();
  const superAdmin = customClientId ? false : isSuperAdmin();
  const fileInputRef = useRef(null);

  // ---- LOAD ----
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const promises = [
        api.get(`/media/library${clientId && !superAdmin ? `?clientId=${clientId}` : ''}`),
        api.get(`/media/folders${clientId && !superAdmin ? `?clientId=${clientId}` : ''}`)
      ];
      if (superAdmin) {
        promises.push(api.get('/admin/clients'));
      }
      const results = await Promise.all(promises);
      setAllMedia(results[0].data);
      setFolders(results[1].data);
      if (superAdmin && results[2]) {
        setClients(results[2].data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clientId, superAdmin]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Close context menu on click outside
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // ---- FILTERED MEDIA & FOLDERS ----
  let currentFolders = [];
  let visibleMedia = [];

  if (superAdmin && currentFolder === null) {
    // Root level for super_admin -> Show clients as virtual folders
    currentFolders = clients.map(c => ({
      id: `client_${c.id}`,
      name: c.name,
      parent_id: null,
      isClientTopLevel: true,
      actual_client_id: c.id
    }));
    visibleMedia = []; // No media directly at system root
  } else {
    // Determine context based on if we are inside a client root or normal folder
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

  // ---- SELECTION ----
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

  // ---- CLIPBOARD ----
  const copySelected = () => {
    const items = [...selected];
    setClipboard({ items, action: 'copy' });
  };
  const cutSelected = () => {
    const items = [...selected];
    setClipboard({ items, action: 'cut' });
  };
  const paste = async () => {
    if (!clipboard.items.length) return;
    for (const id of clipboard.items) {
      if (clipboard.action === 'copy') {
        await api.post('/media/copy', { mediaId: id, targetClientId: clientId || 1 });
      } else {
        await api.patch(`/media/${id}/move`, { folder_id: currentFolder });
      }
    }
    if (clipboard.action === 'cut') setClipboard({ items: [], action: null });
    setSelected(new Set());
    loadAll();
  };

  // ---- DELETE ----
  const deleteSelected = async () => {
    if (!window.confirm(`¿Eliminar ${selected.size} archivo(s)?`)) return;
    for (const id of selected) {
      await api.delete(`/media/${id}`);
    }
    setSelected(new Set());
    loadAll();
  };

  // ---- UPLOAD ----
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      // APPEND FIELDS BEFORE FILE FOR MULTER
      if (clientId) fd.append('clientId', clientId);
      if (currentFolder) fd.append('folderId', currentFolder);
      fd.append('file', file);

      try {
        await api.post('/media/upload', fd, { headers: { 'Content-Type': undefined } });
      } catch (err) { console.error('Upload error:', err?.response?.data || err.message); }
    }
    setUploading(false);
    loadAll();
    e.target.value = '';
  };

  // ---- RENAME ----
  const doRename = async () => {
    if (!modal?.item || !modal.value?.trim()) return;
    await api.patch(`/media/${modal.item.id}/rename`, { name: modal.value.trim() });
    setModal(null);
    loadAll();
  };

  // ---- CREATE FOLDER ----
  const doCreateFolder = async () => {
    if (!modal.value.trim()) return;

    // Validation: cannot create a folder with the same name as a client
    if (superAdmin && clients.some(c => c.name.toLowerCase() === modal.value.trim().toLowerCase())) {
      alert("No se puede crear una carpeta con el mismo nombre que un cliente.");
      return;
    }

    let parentFolderId = currentFolder;
    let clientIdForFolder = clientId;

    // Si somos super_admin y estamos creando en el root de un cliente virtual
    if (superAdmin) {
      if (currentFolder === null) {
        alert("No puedes crear carpetas aquí. Entra a un cliente primero.");
        return;
      }
      if (typeof currentFolder === 'string' && currentFolder.startsWith('client_')) {
        parentFolderId = null;
        clientIdForFolder = parseInt(currentFolder.split('_')[1]);
      } else {
        // Find owner of current folder
        const parent = folders.find(f => f.id === currentFolder);
        if (parent) clientIdForFolder = parent.client_id;
      }
    }

    try {
      await api.post('/media/folders', {
        name: modal.value.trim(),
        parent_id: parentFolderId,
        client_id: clientIdForFolder
      });
      setModal(null);
      loadAll();
    } catch (e) {
      console.error(e);
      alert('Error al crear la carpeta');
    }
  };

  // ---- DELETE FOLDER ----
  const doDeleteFolder = async (folderId) => {
    if (!window.confirm('¿Eliminar carpeta? Los archivos quedarán en la raíz.')) return;
    await api.delete(`/media/folders/${folderId}`);
    if (currentFolder === folderId) { setCurrentFolder(null); setFolderPath([]); }
    loadAll();
  };

  // ---- NAVIGATE FOLDERS ----
  const navigateToFolder = (folder) => {
    setCurrentFolder(folder?.id || null);
    setFolderPath(folder ? [...folderPath.filter(f => f.id !== folder.id), folder] : []);
    setSelected(new Set());
    setSearch('');
  };
  const navigateBack = () => {
    const path = folderPath.slice(0, -1);
    setFolderPath(path);
    setCurrentFolder(path.length ? path[path.length - 1].id : null);
    setSelected(new Set());
  };

  // ---- DRAG & DROP TO FOLDER ----
  const [draggingOver, setDraggingOver] = useState(null);
  const draggedIdRef = useRef(null); // Always reliable, avoids stale closure

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('mediaId', String(item.id));
    e.dataTransfer.effectAllowed = 'move';
    draggedIdRef.current = item.id;
    // Also add to selection so multiple files can be moved
    setSelected(prev => { const n = new Set(prev); n.add(item.id); return n; });
  };

  const handleFolderDragOver = (e, folderId) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDraggingOver(folderId); };

  const handleFolderDrop = async (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingOver(null);

    // PRIMARY: always use the reliably dragged item ref
    const primaryId = draggedIdRef.current || parseInt(e.dataTransfer.getData('mediaId'));
    draggedIdRef.current = null;

    // Build a set of IDs to move: the dragged item + any already-selected items
    const idsToMove = new Set();
    if (primaryId) idsToMove.add(primaryId);
    // Only include selected items if they are in the same view (avoid moving unrelated items)
    selected.forEach(id => idsToMove.add(id));

    if (idsToMove.size === 0) return;

    try {
      await Promise.all([...idsToMove].map(id =>
        api.patch(`/media/${id}/move`, { folder_id: folderId })
      ));
    } catch (err) {
      console.error('Error moviendo archivos:', err);
    }
    setSelected(new Set());
    loadAll();
  };

  // ---- CONTEXT MENU ----
  const openContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
    if (!selected.has(item.id)) {
      setSelected(new Set([item.id]));
    }
  };

  // ---- BREADCRUMB ----
  const Breadcrumb = () => (
    <div className="breadcrumb">
      <Home size={14} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setCurrentFolder(null); setFolderPath([]); setSearch(''); }} />
      {folderPath.map(p => (
        <React.Fragment key={p.id}>
          <ChevronRight size={14} />
          <div
            className={`breadcrumb-item ${p.id === currentFolder ? 'current' : ''}`}
            onClick={() => {
              const idx = folderPath.findIndex(x => x.id === p.id);
              setFolderPath(folderPath.slice(0, idx + 1));
              setCurrentFolder(p.id);
            }}
          >
            {p.name}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const selectedItems = [...selected].map(id => allMedia.find(m => m.id === id)).filter(Boolean);
  const topFolders = folders.filter(f => !f.parent_id);
  const isEmpty = currentFolders.length === 0 && visibleMedia.length === 0;

  // Solo mostrar el árbol de carpetas izquierdo si no estamos en el root del superAdmin
  // (ya que mezclaría clientes con carpetas en el sidebar izquierdo de forma confusa)
  const isSuperAdminRoot = superAdmin && currentFolder === null;

  const content = (
    <>
      <div className="explorer-root" style={isEmbedded ? { height: '70vh', border: 'none', borderRadius: '0' } : {}}>
        {/* ===== PANEL IZQUIERDO (Árbol de carpetas) ===== */}
        <div className="sidebar-panel">
          <div className="sidebar-header">
            <div className="sidebar-title">Carpetas</div>
          </div>
          <div className="sidebar-folders">
            {/* Raíz */}
            <div
              className={`folder-item ${currentFolder === null ? 'active' : ''}`}
              onClick={() => { setCurrentFolder(null); setFolderPath([]); setSearch(''); }}
              onDragOver={e => handleFolderDragOver(e, null)}
              onDrop={e => handleFolderDrop(e, null)}
            >
              {currentFolder === null ? <FolderOpen size={16} /> : <Folder size={16} />}
              Inicio
            </div>

            {/* Carpetas del cliente */}
            {!isSuperAdminRoot && folders.filter(f => {
              if (superAdmin) {
                const activeClient = typeof currentFolder === 'string' ? parseInt(currentFolder.split('_')[1]) : (folders.find(x => x.id === currentFolder)?.client_id);
                return f.client_id === activeClient;
              }
              return !f.parent_id;
            }).map(folder => (
              <div
                key={folder.id}
                className={`folder-item ${currentFolder === folder.id ? 'active' : ''} ${draggingOver === folder.id ? 'drag-over' : ''}`}
                onClick={() => navigateToFolder(folder)}
                onDragOver={e => handleFolderDragOver(e, folder.id)}
                onDragLeave={() => setDraggingOver(null)}
                onDrop={e => handleFolderDrop(e, folder.id)}
              >
                {currentFolder === folder.id ? <FolderOpen size={16} /> : <Folder size={16} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                <button className="folder-delete-btn" onClick={e => { e.stopPropagation(); doDeleteFolder(folder.id); }} title="Eliminar carpeta">
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Botón Nueva Carpeta */}
            <div
              className="folder-item"
              style={{ color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}
              onClick={() => setModal({ type: 'createFolder', value: '' })}
            >
              <FolderPlus size={16} /> Nueva carpeta
            </div>
          </div>
        </div>

        {/* ===== PANEL DERECHO (Archivos) ===== */}
        <div className="main-panel">
          {/* Toolbar */}
          <div className="toolbar">
            {folderPath.length > 0 && (
              <button className="btn btn-icon" onClick={navigateBack} title="Volver">
                <ArrowLeft size={16} />
              </button>
            )}

            <div className="search-box">
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Buscar archivos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
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

          {/* Breadcrumb */}
          <Breadcrumb />

          {/* Selection bar */}
          {selected.size > 0 && (
            <div className="selection-bar">
              <span>{selected.size} seleccionado(s)</span>
              <div className="selection-bar-actions">
                <button className="btn btn-secondary" onClick={copySelected}><Copy size={14} /> Copiar</button>
                <button className="btn btn-secondary" onClick={cutSelected}><Scissors size={14} /> Cortar</button>
                {selected.size === 1 && (
                  <button className="btn btn-secondary" onClick={() => { const item = selectedItems[0]; setModal({ type: 'rename', item, value: item.name }); }}>
                    <Pencil size={14} /> Renombrar
                  </button>
                )}
                <button className="btn btn-secondary" style={{ color: 'var(--danger)' }} onClick={deleteSelected}><Trash2 size={14} /> Eliminar</button>
                <button className="btn btn-icon" onClick={() => setSelected(new Set())}><X size={14} /></button>
              </div>
            </div>
          )}

          {/* Files area */}
          <div className="files-area" onClick={(e) => { if (e.target === e.currentTarget) setSelected(new Set()); }}>
            {loading ? (
              <div className="loading-spinner">Cargando...</div>
            ) : isEmpty && !search ? (
              <label className="upload-zone">
                <Upload size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <div className="upload-zone-title">Arrastra archivos aquí</div>
                <div className="upload-zone-sub">o haz clic para seleccionar</div>
                <input type="file" multiple hidden onChange={handleUpload} accept="image/*,video/*" />
              </label>
            ) : search && visibleMedia.length === 0 && currentFolders.length === 0 ? (
              <div className="empty-state"><Search size={48} /><span>Sin resultados para "{search}"</span></div>
            ) : (
              <div className="files-grid">
                {/* CARPETAS PRIMERO */}
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
                    <button
                      className="folder-card-del"
                      onClick={(e) => { e.stopPropagation(); doDeleteFolder(folder.id); }}
                      title="Eliminar carpeta"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}

                {/* ARCHIVOS */}
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
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== CONTEXT MENU ===== */}
      {
        contextMenu && (
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={e => e.stopPropagation()}
          >
            <div className="context-item" onClick={() => { copySelected(); setContextMenu(null); }}>
              <Copy size={14} /> Copiar
            </div>
            <div className="context-item" onClick={() => { cutSelected(); setContextMenu(null); }}>
              <Scissors size={14} /> Cortar
            </div>
            {clipboard.items.length > 0 && (
              <div className="context-item" onClick={() => { paste(); setContextMenu(null); }}>
                <Clipboard size={14} /> Pegar
              </div>
            )}
            <div className="context-divider" />
            <div className="context-item" onClick={() => { setModal({ type: 'rename', item: contextMenu.item, value: contextMenu.item.name }); setContextMenu(null); }}>
              <Pencil size={14} /> Renombrar
            </div>
            <div className="context-divider" />
            <div className="context-item danger" onClick={() => { deleteSelected(); setContextMenu(null); }}>
              <Trash2 size={14} /> Eliminar
            </div>
          </div>
        )
      }

      {/* ===== MODALS ===== */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {modal.type === 'rename' && (
              <>
                <div className="modal-title">Renombrar archivo</div>
                <input
                  autoFocus
                  className="modal-input"
                  value={modal.value}
                  onChange={e => setModal({ ...modal, value: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setModal(null); }}
                />
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={doRename}>Guardar</button>
                </div>
              </>
            )}
            {modal.type === 'createFolder' && (
              <>
                <div className="modal-title">Nueva carpeta</div>
                <input
                  autoFocus
                  className="modal-input"
                  placeholder="Nombre de la carpeta"
                  value={modal.value}
                  onChange={e => setModal({ ...modal, value: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') doCreateFolder(); if (e.key === 'Escape') setModal(null); }}
                />
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
      <div className="media-manager-embedded">
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