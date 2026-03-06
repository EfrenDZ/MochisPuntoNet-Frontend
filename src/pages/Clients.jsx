import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';
import {
    Plus, Folder, Monitor, Image as ImageIcon, ChevronRight,
    Search, MoreVertical, Trash2, Edit2, X, AlertTriangle,
    Power, CheckCircle2, Ban
} from 'lucide-react';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Modales de acción
    const [clientToDelete, setClientToDelete] = useState(null);
    const [newClientName, setNewClientName] = useState('');
    const [slug, setSlug] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [primaryColor, setPrimaryColor] = useState('#01597d');
    const [secondaryColor, setSecondaryColor] = useState('#003656');
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    // Estado del menú dropdown
    const [activeMenuId, setActiveMenuId] = useState(null);
    const menuRef = useRef(null);

    // Estado del modal de edición
    const [clientToEdit, setClientToEdit] = useState(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editPrimaryColor, setEditPrimaryColor] = useState('#01597d');
    const [editSecondaryColor, setEditSecondaryColor] = useState('#003656');
    const [editLogoFile, setEditLogoFile] = useState(null);
    const [editSubmitting, setEditSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchClients();

        // Cierra el menú al hacer clic fuera
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
            console.error("Error cargando clientes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newClientName.trim()) return;
        try {
            const formData = new FormData();
            formData.append('name', newClientName);
            formData.append('slug', slug);
            formData.append('primary_color', primaryColor);
            formData.append('secondary_color', secondaryColor);
            formData.append('admin_username', adminUsername);
            formData.append('admin_password', adminPassword);
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            await api.post('/admin/clients', formData);
            setShowCreateModal(false);
            setNewClientName('');
            setSlug('');
            setLogoFile(null);
            setPrimaryColor('#01597d');
            setSecondaryColor('#003656');
            setAdminUsername('');
            setAdminPassword('');
            fetchClients();
        } catch (error) {
            console.error(error);
            alert('Error creando cliente');
        }
    };

    const handleNameChange = (e) => {
        const val = e.target.value;
        setNewClientName(val);
        if (!slug || slug === val.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '').slice(0, -1)) {
            setSlug(val.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, ''));
        }
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;
        try {
            await api.delete(`/admin/clients/${clientToDelete.id}`);
            setClientToDelete(null);
            fetchClients();
        } catch (error) {
            alert('Error: Asegúrate de borrar primero las pantallas asociadas si es necesario.');
        }
    };

    const handleToggleStatus = async (client) => {
        try {
            const newStatus = client.status === 'active' ? 'inactive' : 'active';
            setActiveMenuId(null);
            setClients(clients.map(c => c.id === client.id ? { ...c, status: newStatus } : c));
            await api.put(`/admin/clients/${client.id}/status`, { status: newStatus });
        } catch (error) {
            console.error(error);
            alert("No se pudo cambiar el estado");
            fetchClients();
        }
    };

    const [clientUsers, setClientUsers] = useState([]);

    const openEditModal = async (client) => {
        setClientToEdit(client);
        setEditName(client.name);
        setEditSlug(client.slug || '');
        setEditPrimaryColor(client.primary_color || '#01597d');
        setEditSecondaryColor(client.secondary_color || '#003656');
        setEditLogoFile(null);
        setActiveMenuId(null);
        try {
            const res = await api.get(`/admin/users?clientId=${client.id}`);
            setClientUsers(res.data);
        } catch (error) {
            console.error("Error cargando usuarios del cliente:", error);
            setClientUsers([]);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editName.trim()) return;
        setEditSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', editName);
            formData.append('slug', editSlug);
            formData.append('primary_color', editPrimaryColor);
            formData.append('secondary_color', editSecondaryColor);
            if (editLogoFile) formData.append('logo', editLogoFile);
            await api.put(`/admin/clients/${clientToEdit.id}`, formData);
            setClientToEdit(null);
            fetchClients();
        } catch (error) {
            console.error(error);
            alert('Error al editar cliente');
        } finally {
            setEditSubmitting(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <SidebarLayout>
            {/* Estilos CSS Globales para animaciones y scroll */}
            <style>{`
        .client-card { transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1); border: 1px solid #f3f4f6; }
        .client-card:hover { transform: translateY(-3px); box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.08); border-color: #e5e7eb; }
        .menu-trigger { opacity: 0; transform: scale(0.9); transition: all 0.2s; }
        .client-card:hover .menu-trigger, .menu-trigger.active { opacity: 1; transform: scale(1); }
        
        /* Animación suave para el estado inactivo */
        .card-inactive { background-color: #f9fafb; border-style: dashed; }
        .card-inactive h3 { color: #6b7280; }
        .card-inactive .icon-box { background-color: #e5e7eb; color: #9ca3af; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

            {/* --- HEADER --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>


                    <button onClick={() => setShowCreateModal(true)} style={styles.btnPrimary}>
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Nuevo Cliente</span>
                    </button>
                </div>

                {/* Barra de búsqueda */}
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
            </div>

            {/* --- ESTADO DE CARGA --- */}
            {loading && (
                <div style={styles.grid}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ ...styles.card, height: '180px', backgroundColor: '#f3f4f6', animation: 'pulse 1.5s infinite' }}></div>
                    ))}
                </div>
            )}

            {/* --- GRID DE CLIENTES --- */}
            {!loading && filteredClients.length > 0 && (
                <div style={styles.grid}>
                    {filteredClients.map((client, index) => {
                        const isActive = client.status === 'active';
                        return (
                            <div
                                key={client.id}
                                className={`client-card animate-fade-in ${!isActive ? 'card-inactive' : ''}`}
                                style={{ ...styles.card, animationDelay: `${index * 50}ms` }}
                                onClick={() => navigate(`/clients/${client.slug || client.id}`)}
                            >
                                {/* Header Tarjeta */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div className="icon-box" style={{ ...styles.iconBox, ...(isActive ? {} : { backgroundColor: '#f3f4f6', color: '#9ca3af' }) }}>
                                        {isActive ? <CheckCircle2 size={20} /> : <Ban size={20} />}
                                    </div>

                                    {/* Menú Tres Puntos */}
                                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className={`menu-trigger ${activeMenuId === client.id ? 'active' : ''}`}
                                            onClick={() => setActiveMenuId(activeMenuId === client.id ? null : client.id)}
                                            style={styles.menuBtn}
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeMenuId === client.id && (
                                            <div ref={menuRef} style={styles.dropdown}>
                                                <div style={styles.dropdownItem} onClick={() => openEditModal(client)}>
                                                    <Edit2 size={14} /> Editar
                                                </div>

                                                <div style={styles.dropdownItem} onClick={() => handleToggleStatus(client)}>
                                                    <Power size={14} color={isActive ? '#f59e0b' : '#10b981'} />
                                                    {isActive ? 'Inhabilitar acceso' : 'Habilitar acceso'}
                                                </div>

                                                <div style={styles.divider}></div>

                                                <div style={{ ...styles.dropdownItem, color: '#ef4444' }} onClick={() => { setClientToDelete(client); setActiveMenuId(null); }}>
                                                    <Trash2 size={14} /> Eliminar permanentemente
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info Principal */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                                            {client.name}
                                        </h3>
                                        {/* Badge de Estado */}
                                        <span style={{
                                            fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px',
                                            backgroundColor: isActive ? '#dcfce7' : '#f3f4f6', color: isActive ? '#166534' : '#6b7280'
                                        }}>
                                            {isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>

                                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                                        {isActive ? 'Servicio operativo' : 'Acceso suspendido'}
                                    </p>
                                </div>

                                {/* Estadísticas */}
                                <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                    <div style={styles.statBadge}>
                                        <Monitor size={13} strokeWidth={2.5} />
                                        <span>{client.screen_count} <span style={{ fontWeight: '400', color: '#9ca3af' }}>Pantallas</span></span>
                                    </div>
                                    <div style={styles.statBadge}>
                                        <ImageIcon size={13} strokeWidth={2.5} />
                                        <span>{client.media_count} <span style={{ fontWeight: '400', color: '#9ca3af' }}>Archivos</span></span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- ESTADO VACÍO --- */}
            {!loading && filteredClients.length === 0 && (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>
                        <Folder size={28} />
                    </div>
                    <h3 style={{ margin: '10px 0 5px', color: '#374151', fontSize: '16px' }}>Sin resultados</h3>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>No se encontró cliente con ese nombre.</p>
                </div>
            )}

            {/* --- MODAL CREAR --- */}
            {showCreateModal && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Nuevo Cliente</h2>
                            <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.label}>Nombre de la Empresa</label>
                                <input type="text" placeholder="Ej: Tacos El Paisa" value={newClientName} onChange={handleNameChange} style={styles.input} required />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.label}>Identificador (Slug) - Usado para la URL de Login</label>
                                <input type="text" placeholder="tacos_el_paisa" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} style={styles.input} required />
                                {slug && <small style={{ color: '#6b7280', display: 'block', marginTop: '5px' }}>Link: mpn-tv.com/{slug}</small>}
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.label}>Logotipo</label>
                                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} style={styles.input} />
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Color Primario</label>
                                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ ...styles.input, padding: '5px', height: '40px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Color Secundario</label>
                                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ ...styles.input, padding: '5px', height: '40px' }} />
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '15px' }}>Usuario Administrador Inicial</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.label}>Usuario (Username)</label>
                                <input type="text" placeholder="admin.tacos" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} style={styles.input} required />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.label}>Contraseña</label>
                                <input type="text" placeholder="Clave segura" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={styles.input} required />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.btnSecondary}>Cancelar</button>
                                <button type="submit" style={styles.btnPrimaryModal}>Crear Cliente</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL ELIMINAR (Danger Zone) --- */}
            {clientToDelete && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, width: '400px', borderTop: '4px solid #ef4444' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ minWidth: '44px', height: '44px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>¿Eliminar definitivamente?</h3>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
                                    Estás a punto de borrar a <strong>{clientToDelete.name}</strong>.
                                    <br /><br />
                                    <span style={{ color: '#b91c1c', fontWeight: '500' }}>
                                        ⚠️ Esto eliminará sus carpetas, imágenes y configuraciones. No se puede deshacer.
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '28px' }}>
                            <button onClick={() => setClientToDelete(null)} style={styles.btnSecondary}>Cancelar</button>
                            <button onClick={handleDeleteClient} style={{ ...styles.btnPrimaryModal, backgroundColor: '#ef4444', boxShadow: 'none' }}>
                                Sí, Eliminar Todo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL EDITAR --- */}
            {clientToEdit && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, width: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>Editar Cliente</h2>
                            <button onClick={() => setClientToEdit(null)} style={styles.closeBtn}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.label}>Nombre de la Empresa</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={styles.input} required />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.label}>Identificador (Slug)</label>
                                <input type="text" value={editSlug} onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} style={styles.input} />
                                {editSlug && <small style={{ color: '#6b7280', display: 'block', marginTop: '5px' }}>Link: mpn-tv.com/{editSlug}</small>}
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.label}>Logotipo (dejar vacío para no cambiar)</label>
                                <input type="file" accept="image/*" onChange={e => setEditLogoFile(e.target.files[0])} style={styles.input} />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Color Primario</label>
                                    <input type="color" value={editPrimaryColor} onChange={e => setEditPrimaryColor(e.target.value)} style={{ ...styles.input, padding: '5px', height: '40px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Color Secundario</label>
                                    <input type="color" value={editSecondaryColor} onChange={e => setEditSecondaryColor(e.target.value)} style={{ ...styles.input, padding: '5px', height: '40px' }} />
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '15px' }}>Equipo Asignado</h3>
                            {clientUsers.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                    {clientUsers.map(u => (
                                        <li key={u.id} style={{ padding: '10px 15px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>{u.full_name}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    {u.username} • {u.role === 'client_admin' ? 'Admin' : 'Agente'}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: u.active ? '#dcfce7' : '#fee2e2', color: u.active ? '#15803d' : '#b91c1c' }}>
                                                {u.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>No hay usuarios asignados a este cliente.</p>
                            )}

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" onClick={() => setClientToEdit(null)} style={styles.btnSecondary}>Cancelar</button>
                                <button type="submit" style={styles.btnPrimaryModal} disabled={editSubmitting}>
                                    {editSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </SidebarLayout>
    );
}

// --- OBJECT STYLES (Modern CSS-in-JS approach) ---

const styles = {
    // Layout
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        paddingBottom: '40px'
    },

    // Cards
    card: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '20px',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '180px'
    },
    iconBox: {
        width: '40px',
        height: '40px',
        backgroundColor: '#eff6ff',
        color: '#2563eb',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s'
    },
    statBadge: {
        backgroundColor: '#f9fafb',
        padding: '6px 12px',
        borderRadius: '10px',
        fontSize: '12px',
        color: '#374151',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        border: '1px solid #e5e7eb'
    },

    // Inputs & Buttons
    searchInput: {
        width: '100%',
        padding: '12px 12px 12px 42px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        outline: 'none',
        fontSize: '14px',
        backgroundColor: 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'border-color 0.2s'
    },
    btnPrimary: {
        backgroundColor: '#111827', // Almost black for modern look
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'transform 0.1s'
    },
    btnPrimaryModal: {
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
    },
    btnSecondary: {
        backgroundColor: 'white',
        color: '#374151',
        border: '1px solid #d1d5db',
        padding: '10px 20px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px'
    },
    menuBtn: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#6b7280',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    },
    closeBtn: {
        border: 'none',
        background: '#f3f4f6',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#6b7280'
    },

    // Dropdown
    dropdown: {
        position: 'absolute',
        top: '40px',
        right: '0',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        zIndex: 50,
        minWidth: '180px',
        overflow: 'hidden',
        padding: '6px'
    },
    dropdownItem: {
        padding: '10px 12px',
        fontSize: '13px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        color: '#374151',
        borderRadius: '8px',
        transition: 'background 0.15s',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f3f4f6',
        margin: '6px 0'
    },

    // Modals
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)', // Glassmorphism light overlay
        backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 100
    },
    modal: {
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '24px',
        width: '420px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6'
    },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' },
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #d1d5db',
        fontSize: '15px',
        outlineColor: '#2563eb',
        transition: 'border-color 0.2s'
    },

    // Empty State
    emptyState: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 20px',
        backgroundColor: '#f9fafb',
        borderRadius: '24px',
        border: '2px dashed #e5e7eb',
        margin: '0 auto',
        maxWidth: '500px'
    },
    emptyIcon: {
        width: '56px', height: '56px',
        backgroundColor: 'white',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9ca3af',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }
};