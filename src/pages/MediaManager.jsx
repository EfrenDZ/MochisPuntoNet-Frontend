import { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';
import { Trash2, Upload, Film, FilePlus, AlertCircle } from 'lucide-react';

export default function MediaManager() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaList, setMediaList] = useState([]);

  useEffect(() => {
    cargarGaleria();
  }, []);

  const cargarGaleria = async () => {
    try {
      const res = await api.get('/media/library');
      setMediaList(res.data);
    } catch (error) {
      console.error("Error cargando galería:", error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Selecciona un archivo primero");

    const formData = new FormData();
    
    // 1. IMPORTANTE: Enviamos el ID del cliente PRIMERO
    // Esto asegura que Multer pueda leer el body antes de procesar el archivo
    // (Aquí usamos '1' fijo, pero podrías traerlo de useParams o del usuario logueado)
    formData.append('clientId', 1); 

    // 2. Enviamos el archivo DESPUÉS
    formData.append('file', file);

    setLoading(true);

    try {
      // 3. NO agregamos headers manuales. Axios lo hace solo.
      await api.post('/media/upload', formData);
      
      // Limpieza y recarga
      setFile(null);
      document.getElementById('fileInput').value = ""; 
      cargarGaleria();
      // Opcional: alert("Archivo subido correctamente");
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message;
      alert(`Error al subir archivo: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este archivo permanentemente?")) return;
    try {
      await api.delete(`/media/${id}`);
      cargarGaleria();
    } catch (error) {
      alert("Error al eliminar el archivo.");
    }
  };

  return (
    <SidebarLayout>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Biblioteca Multimedia</h1>
        <p style={{ color: '#64748b', marginTop: '5px' }}>Sube imágenes y videos para usar en tus pantallas.</p>
      </div>

      {/* --- ZONA DE CARGA --- */}
      <div style={uploadBoxStyle}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight:'600', color:'#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilePlus size={20} color="#3b82f6" />
            Subir Nuevo Contenido
        </h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            id="fileInput"
            type="file" 
            onChange={handleFileChange} 
            accept="image/*,video/*" 
            style={inputStyle}
          />
          
          <button 
            type="submit" 
            disabled={loading || !file}
            style={{ 
              ...btnUpload,
              backgroundColor: loading || !file ? '#94a3b8' : '#3b82f6',
              cursor: loading || !file ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? <span className="spin">↻</span> : <Upload size={18} />}
            {loading ? ' Subiendo...' : ' Subir Archivo'}
          </button>
        </form>
      </div>

      {/* --- GALERÍA GRID --- */}
      {mediaList.length === 0 ? (
        <div style={emptyStateStyle}>
            <AlertCircle size={40} color="#cbd5e1" />
            <p>No hay archivos multimedia aún.</p>
        </div>
      ) : (
        <div style={gridStyle}>
            {mediaList.map((item) => (
            <div key={item.id} style={cardStyle}>
                {/* VISTA PREVIA */}
                <div style={previewContainer}>
                    {item.type === 'video' ? (
                    <>
                        <video src={item.url} style={mediaStyle} muted />
                        <div style={iconOverlay}><Film size={24} color="white" /></div>
                    </>
                    ) : (
                    <img src={item.url} alt={item.name} style={mediaStyle} loading="lazy" />
                    )}
                </div>

                {/* INFO Y ACCIONES */}
                <div style={cardFooter}>
                    <div style={{ overflow: 'hidden', flex: 1, marginRight: '10px' }}>
                        <p style={fileNameStyle} title={item.name}>{item.name}</p>
                        <p style={fileTypeStyle}>
                            {item.type === 'video' ? 'VIDEO' : 'IMAGEN'} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <button 
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar"
                        style={btnDelete}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            ))}
        </div>
      )}
      
      {/* Estilo para animación de carga */}
      <style>{`.spin { display: inline-block; animation: spin 1s infinite linear; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </SidebarLayout>
  );
}

// ==========================================
// ESTILOS CSS-IN-JS
// ==========================================

const uploadBoxStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const inputStyle = { fontSize: '14px', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px', flex: 1, minWidth: '200px', backgroundColor: '#f8fafc' };

const btnUpload = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 25px', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', transition: 'background 0.2s' };

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' };

const cardStyle = { backgroundColor: 'white', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } };

const previewContainer = { position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' };
const mediaStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const iconOverlay = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' };

const cardFooter = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const fileNameStyle = { fontSize: '14px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 };
const fileTypeStyle = { fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: '700' };

const btnDelete = { backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' };

const emptyStateStyle = { textAlign: 'center', color: '#94a3b8', padding: '50px', border: '2px dashed #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' };