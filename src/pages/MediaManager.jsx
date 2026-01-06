import { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout'; // Integrado al Sidebar
import api from '../config/api';
import { Trash2, Upload, Image as ImageIcon, Film, FilePlus } from 'lucide-react';

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
    formData.append('file', file);
    formData.append('clientId', 1); // Temporal: Cliente Agencia

    setLoading(true);

    try {
      await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      // Limpiamos el input file visualmente
      document.getElementById('fileInput').value = ""; 
      cargarGaleria();
    } catch (error) {
      alert('Error al subir archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Confirmas eliminar este archivo?")) return;
    try {
      await api.delete(`/media/${id}`);
      cargarGaleria();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <SidebarLayout>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Biblioteca Multimedia</h1>
        <p style={{ color: '#6b7280', marginTop: '5px' }}>Gestiona las imágenes y videos globales.</p>
      </div>

      {/* --- ZONA DE CARGA --- */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilePlus size={20} color="#4f46e5" />
            Subir Nuevo Contenido
        </h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            id="fileInput"
            type="file" 
            onChange={handleFileChange} 
            accept="image/*,video/*" 
            style={{ fontSize: '14px' }}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', 
              backgroundColor: loading ? '#9ca3af' : '#4f46e5', 
              color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
            }}
          >
            <Upload size={18} />
            {loading ? 'Cargando...' : 'Subir Archivo'}
          </button>
        </form>
      </div>

      {/* --- GALERÍA GRID --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {mediaList.map((item) => (
          <div key={item.id} style={cardStyle}>
            {/* VISTA PREVIA */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                {item.type === 'video' ? (
                  <>
                    <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={iconOverlay}><Film size={24} color="white" /></div>
                  </>
                ) : (
                  <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
            </div>

            {/* INFO Y ACCIONES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                        {item.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                        {item.type === 'video' ? 'Video MP4' : 'Imagen'}
                    </p>
                </div>

                <button 
                    onClick={() => handleDelete(item.id)}
                    title="Eliminar"
                    style={{ 
                        backgroundColor: '#fee2e2', color: '#ef4444', 
                        border: 'none', borderRadius: '6px', 
                        width: '32px', height: '32px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <Trash2 size={16} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </SidebarLayout>
  );
}

// Estilos
const cardStyle = { backgroundColor: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const iconOverlay = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' };