import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api'; // Asegúrate que tu instancia de Axios esté bien configurada
import { Trash2, Upload, Film, FilePlus, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function MediaManager() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaList, setMediaList] = useState([]);

  // Cargar galería al inicio
  useEffect(() => {
    cargarGaleria();
  }, []);

  const cargarGaleria = async () => {
    try {
      // Ajusta la ruta si necesitas filtrar por cliente: /media/library?clientId=1
      const res = await api.get('/media/library');
      setMediaList(res.data);
    } catch (error) {
      console.error("Error cargando galería:", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Selecciona un archivo primero");

    // Validar tamaño antes de enviar (ejemplo: 50MB)
    if (file.size > 50 * 1024 * 1024) {
        return alert("El archivo es demasiado grande (Máx 50MB)");
    }

    const formData = new FormData();
    // NOTA: Algunos servidores Multer procesan mejor si los campos de texto van primero.
    formData.append('clientId', 1); // ID harcodeado (cámbialo según tu auth)
    formData.append('file', file);  // Este nombre 'file' debe coincidir con upload.single('file')

    setLoading(true);

    try {
      // Axios detecta FormData y pone el Content-Type: multipart/form-data automáticamente
      await api.post('/media/upload', formData);
      
      // Éxito
      setFile(null);
      // Limpiar input file visualmente
      const fileInput = document.getElementById('fileInput');
      if(fileInput) fileInput.value = "";
      
      await cargarGaleria(); // Recargar lista
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "Error de conexión";
      alert(`Error al subir: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar archivo permanentemente?")) return;
    try {
      await api.delete(`/media/${id}`);
      // Actualización optimista de la UI
      setMediaList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert("Error al eliminar el archivo.");
    }
  };

  return (
    <SidebarLayout>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Biblioteca Multimedia</h1>
        <p style={{ color: '#64748b', marginTop: '5px' }}>Gestión de contenidos para tus pantallas.</p>
      </div>

      {/* --- ZONA DE CARGA --- */}
      <div style={styles.uploadBox}>
        <h3 style={styles.sectionTitle}>
            <FilePlus size={20} color="#3b82f6" />
            Subir Nuevo Contenido
        </h3>
        <form onSubmit={handleUpload} style={styles.form}>
          <input 
            id="fileInput"
            type="file" 
            onChange={handleFileChange} 
            accept="image/*,video/*" 
            style={styles.input}
          />
          
          <button 
            type="submit" 
            disabled={loading || !file}
            style={{ 
              ...styles.btnUpload,
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
        <div style={styles.emptyState}>
            <AlertCircle size={40} color="#cbd5e1" />
            <p>No hay archivos multimedia aún.</p>
        </div>
      ) : (
        <div style={styles.grid}>
            {mediaList.map((item) => (
            <div key={item.id} style={styles.card}>
                {/* VISTA PREVIA */}
                <div style={styles.previewContainer}>
                    {item.type === 'video' ? (
                    <>
                        <video src={item.url} style={styles.media} muted onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                        <div style={styles.iconOverlay}><Film size={24} color="white" /></div>
                    </>
                    ) : (
                    <div style={{width:'100%', height:'100%'}}>
                        <img src={item.url} alt={item.name} style={styles.media} loading="lazy" />
                        <div style={{...styles.iconOverlay, opacity: 0, ':hover': {opacity: 1} }}><ImageIcon size={24} color="white" /></div>
                    </div>
                    )}
                </div>

                {/* INFO Y ACCIONES */}
                <div style={styles.cardFooter}>
                    <div style={{ overflow: 'hidden', flex: 1, marginRight: '10px' }}>
                        <p style={styles.fileName} title={item.name}>{item.name}</p>
                        <p style={styles.fileType}>
                            {item.type === 'video' ? 'VIDEO' : 'IMG'} • {(item.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                    </div>

                    <button 
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar"
                        style={styles.btnDelete}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            ))}
        </div>
      )}
      
      <style>{`.spin { display: inline-block; animation: spin 1s infinite linear; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </SidebarLayout>
  );
}

// ==========================================
// ESTILOS (Organizados en Objeto)
// ==========================================
const styles = {
    uploadBox: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    sectionTitle: { margin: '0 0 15px 0', fontSize: '16px', fontWeight:'600', color:'#334155', display: 'flex', alignItems: 'center', gap: '8px' },
    form: { display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' },
    input: { fontSize: '14px', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '8px', flex: 1, minWidth: '200px', backgroundColor: '#f8fafc' },
    btnUpload: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 25px', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', transition: 'background 0.2s' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' },
    card: { backgroundColor: 'white', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' },
    previewContainer: { position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' },
    media: { width: '100%', height: '100%', objectFit: 'cover' },
    iconOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', pointerEvents: 'none' },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    fileName: { fontSize: '14px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 },
    fileType: { fontSize: '10px', color: '#94a3b8', margin: '2px 0 0 0', fontWeight: '700', textTransform: 'uppercase' },
    btnDelete: { backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' },
    emptyState: { textAlign: 'center', color: '#94a3b8', padding: '50px', border: '2px dashed #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }
};