import { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';
import { UserPlus, Power, User, Pencil, Ban, CheckCircle } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Para saber si editamos
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'client_admin'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  // Abrir modal para CREAR
  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({ full_name: '', email: '', password: '', role: 'client_admin' });
    setShowModal(true);
  };

  // Abrir modal para EDITAR
  const openEditModal = (user) => {
    setIsEditing(true);
    setEditingId(user.id);
    // Llenamos el form con los datos del usuario, password vacío (solo se llena si se quiere cambiar)
    setFormData({ 
        full_name: user.full_name, 
        email: user.email, 
        password: '', 
        role: user.role 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // MODO EDICIÓN
        await api.put(`/admin/users/${editingId}`, formData);
        alert('✅ Usuario actualizado');
      } else {
        // MODO CREACIÓN
        await api.post('/admin/users', formData);
        alert('✅ Empleado registrado');
      }
      
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.error || 'Ocurrió un error'));
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.active ? "suspender" : "reactivar";
    if(!window.confirm(`¿Seguro que quieres ${action} a ${user.full_name}?`)) return;
    
    try {
        // Nota la ruta nueva /status
        await api.put(`/admin/users/${user.id}/status`);
        fetchUsers();
    } catch (error) {
        alert('Error al cambiar estado');
    }
  };

  return (
    <SidebarLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Equipo de Agencia</h1>
          <p style={{ color: '#6b7280', marginTop: '5px' }}>Gestiona accesos y permisos.</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
        >
          <UserPlus size={18} /> Nuevo Empleado
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: user.active ? 'white' : '#f9fafb', opacity: user.active ? 1 : 0.6 }}>
                <td style={tdStyle}>
                    {user.active ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontWeight: '600', fontSize: '12px' }}>
                            <CheckCircle size={14} /> Activo
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444', fontWeight: '600', fontSize: '12px' }}>
                            <Ban size={14} /> Inactivo
                        </div>
                    )}
                </td>
                <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', backgroundColor: user.active ? '#eff6ff' : '#e5e7eb', borderRadius: '50%', color: user.active ? '#3b82f6' : '#9ca3af' }}>
                            <User size={16} />
                        </div>
                        <span style={{ fontWeight: '500', color: '#111827' }}>{user.full_name}</span>
                    </div>
                </td>
                <td style={tdStyle}>
                    {user.role === 'super_admin' ? (
                        <span style={{ ...badge, backgroundColor: '#fef3c7', color: '#d97706' }}>Super Admin</span>
                    ) : (
                        <span style={{ ...badge, backgroundColor: '#e0e7ff', color: '#4f46e5' }}>Agente</span>
                    )}
                </td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Botón Editar */}
                        <button 
                            onClick={() => openEditModal(user)} 
                            title="Editar"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6' }}
                        >
                            <Pencil size={18} />
                        </button>

                        {/* Botón Suspender/Activar */}
                        {user.role !== 'super_admin' && (
                            <button 
                                onClick={() => handleToggleStatus(user)} 
                                title={user.active ? "Suspender" : "Reactivar"}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: user.active ? '#ef4444' : '#16a34a' }}
                            >
                                <Power size={18} />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (Sirve para Crear y Editar) */}
      {showModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ marginTop: 0 }}>{isEditing ? 'Editar Empleado' : 'Nuevo Miembro'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Nombre Completo</label>
                <input 
                  type="text" required
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  style={inputStyle}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Correo Electrónico</label>
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>
                    Contraseña 
                    {isEditing && <span style={{fontSize: '11px', color: '#6b7280', fontWeight: 'normal'}}> (Déjala vacía para no cambiarla)</span>}
                </label>
                <input 
                  type="password" 
                  required={!isEditing} // Solo obligatoria si estamos creando
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  style={inputStyle}
                  placeholder={isEditing ? "••••••••" : ""}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Rol</label>
                <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    style={inputStyle}
                >
                    <option value="client_admin">Agente (Empleado)</option>
                    <option value="super_admin">Super Admin (Gerente)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={btnSecondary}>Cancelar</button>
                <button type="submit" style={btnPrimary}>{isEditing ? 'Guardar Cambios' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}

// Estilos
const thStyle = { padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' };
const tdStyle = { padding: '16px', fontSize: '14px', color: '#4b5563' };
const badge = { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '5px', fontSize: '14px' };
const labelStyle = { fontSize: '14px', fontWeight: '500', color: '#374151' };
const btnPrimary = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' };
const btnSecondary = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' };