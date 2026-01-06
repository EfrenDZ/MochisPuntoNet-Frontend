import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';
import { 
    Plus, Folder, Monitor, Image as ImageIcon, ChevronRight, 
    Search, Building, MoreVertical, Trash2, Edit2, X, AlertTriangle 
} from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // Guarda el objeto cliente a eliminar
  const [newClientName, setNewClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para manejar el menú desplegable de cada tarjeta
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
    // Cierra el menú si haces click fuera
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setActiveMenuId(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/admin/clients');
      setClients(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    try {
      await api.post('/admin/clients', { name: newClientName });
      setShowCreateModal(false);
      setNewClientName('');
      fetchClients();
    } catch (error) {
      alert('Error creando cliente');
    }
  };

  const handleDeleteClient = async () => {
    if (!showDeleteModal) return;
    try {
        await api.delete(`/admin/clients/${showDeleteModal.id}`);
        setShowDeleteModal(null);
        fetchClients();
    } catch (error) {
        alert('No se pudo eliminar el cliente. Asegúrate de que no tenga pantallas activas.');
    }
  };

  // Filtrado de clientes
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.id.toString().includes(searchTerm)
  );

  return (
    <SidebarLayout>
      {/* Estilos CSS inyectados para Media Queries y Hovers */}
      <style>{`
        .client-card { transition: all 0.3s ease; border: 1px solid #f3f4f6; }
        .client-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #bfdbfe; }
        .menu-btn { opacity: 0; transition: opacity 0.2s; }
        .client-card:hover .menu-btn, .menu-btn.active { opacity: 1; }
        
        @media (max-width: 768px) {
            .header-responsive { flex-direction: column; align-items: flex-start; gap: 15px; }
            .search-responsive { width: 100%; }
            .grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* --- HEADER --- */}
      <div className="header-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Cartera de Clientes</h1>
          <p style={{ color: '#6b7280', marginTop: '5px', fontSize: '15px' }}>Administra empresas y asigna recursos.</p>
        </div>
        
        <div className="search-responsive" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Buscador */}
            <div style={{ position: 'relative', minWidth: '250px' }} className="search-responsive">
                <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                    type="text" 
                    placeholder="Buscar empresa..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '14px' }}
                />
            </div>
            
            <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>
                <Plus size={20} /> <span style={{display: 'inline-block'}}>Nuevo</span>
            </button>
        </div>
      </div>

      {/* --- ESTADO DE CARGA --- */}
      {loading && (
        <div style={gridStyle}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ ...cardStyle, height: '200px', backgroundColor: '#f9fafb', animation: 'pulse 1.5s infinite' }}></div>
            ))}
        </div>
      )}

      {/* --- GRID DE CLIENTES --- */}
      {!loading && filteredClients.length > 0 && (
        <div className="grid-responsive" style={gridStyle}>
            {filteredClients.map(client => (
            <div key={client.id} className="client-card" style={cardStyle} onClick={() => navigate(`/clients/${client.id}`)}>
                
                {/* Header de la Tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={iconBox}>
                        <Building size={24} strokeWidth={1.5} />
                    </div>
                    
                    {/* Menú de Tres Puntos */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={`menu-btn ${activeMenuId === client.id ? 'active' : ''}`}
                            onClick={() => setActiveMenuId(activeMenuId === client.id ? null : client.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: '#6b7280' }}
                        >
                            <MoreVertical size={20} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeMenuId === client.id && (
                            <div ref={menuRef} style={dropdownStyle}>
                                {/* Podrías agregar funcionalidad de editar nombre aquí */}
                                <div style={dropdownItemStyle} onClick={() => { alert('Funcionalidad editar pendiente'); setActiveMenuId(null); }}>
                                    <Edit2 size={14} /> Editar Nombre
                                </div>
                                <div style={{ ...dropdownItemStyle, color: '#ef4444' }} onClick={() => { setShowDeleteModal(client); setActiveMenuId(null); }}>
                                    <Trash2 size={14} /> Eliminar Cliente
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Nombre */}
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {client.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>ID: {client.id}</span>
                
                {/* Estadísticas */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <div style={badgeStat}>
                        <Monitor size={14} /> {client.screen_count} TVs
                    </div>
                    <div style={badgeStat}>
                        <ImageIcon size={14} /> {client.media_count} Media
                    </div>
                </div>

                {/* Footer Visual (Flecha) */}
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#3b82f6', fontSize: '13px', fontWeight: '600' }}>
                    Gestionar <ChevronRight size={16} />
                </div>
            </div>
            ))}
        </div>
      )}

      {/* --- ESTADO VACÍO --- */}
      {!loading && filteredClients.length === 0 && (
          <div style={emptyStateStyle}>
              <div style={emptyIconCircle}>
                  <Folder size={32} strokeWidth={1.5} />
              </div>
              <h3 style={{ margin: '10px 0 5px', color: '#374151' }}>
                  {searchTerm ? 'No se encontraron resultados' : 'No hay clientes registrados'}
              </h3>
              <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>
                  {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Comienza registrando tu primera empresa.'}
              </p>
              {!searchTerm && <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>Registrar Ahora</button>}
          </div>
      )}

      {/* --- MODAL CREAR --- */}
      {showCreateModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Nueva Empresa</h2>
                <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <label style={labelStyle}>Nombre Comercial</label>
              <input 
                  type="text" 
                  placeholder="Ej: Restaurante El Centro" 
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  style={inputStyle}
                  autoFocus
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={btnSecondary}>Cancelar</button>
                <button type="submit" style={btnPrimaryModal}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ELIMINAR (Danger Zone) --- */}
      {showDeleteModal && (
          <div style={overlayStyle}>
            <div style={{...modalStyle, width: '380px', borderTop: '4px solid #ef4444'}}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1f2937' }}>¿Eliminar Empresa?</h3>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
                            Estás a punto de eliminar a <strong>{showDeleteModal.name}</strong>. Esta acción borrará todas sus pantallas y contenido. No se puede deshacer.
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                    <button onClick={() => setShowDeleteModal(null)} style={btnSecondary}>Cancelar</button>
                    <button onClick={handleDeleteClient} style={{ ...btnPrimaryModal, backgroundColor: '#ef4444' }}>Sí, Eliminar</button>
                </div>
            </div>
          </div>
      )}

    </SidebarLayout>
  );
}

// --- ESTILOS JAVASCRIPT ---

const gridStyle = {
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
    gap: '20px',
    paddingBottom: '40px'
};

const cardStyle = { 
    backgroundColor: 'white', 
    padding: '20px', 
    borderRadius: '16px', 
    cursor: 'pointer',
    position: 'relative'
};

const iconBox = {
    width: '42px',
    height: '42px',
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const badgeStat = {
    backgroundColor: '#f9fafb',
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#4b5563',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #e5e7eb'
};

// Botones y Modales
const btnPrimary = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)', whiteSpace: 'nowrap' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', outlineColor: '#3b82f6', marginTop: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151' };
const btnSecondary = { backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' };
const btnPrimaryModal = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' };

// Dropdown Menu
const dropdownStyle = { position: 'absolute', top: '30px', right: '0', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 10, minWidth: '140px', overflow: 'hidden' };
const dropdownItemStyle = { padding: '10px 15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#374151', transition: 'background 0.1s' };

// Empty State
const emptyStateStyle = { textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #e5e7eb', margin: '0 auto', maxWidth: '500px' };
const emptyIconCircle = { margin: '0 auto 15px', width: '64px', height: '64px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' };