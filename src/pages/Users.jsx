import { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import api from '../config/api';
import { UserPlus, Power, User, Pencil, Ban, CheckCircle, X } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '', 
    password: '',
    role: 'client_admin',
    active: true // 1. Agregamos el campo de estado por defecto
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

  const openCreateModal = () => {
    setIsEditing(false);
    // 2. Al crear, el estado por defecto es true (Activo)
    setFormData({ full_name: '', email: '', password: '', role: 'client_admin', active: true });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setEditingId(user.id);
    // 3. Al editar, cargamos el estado actual del usuario
    setFormData({ 
        full_name: user.full_name, 
        email: user.email, 
        password: '', 
        role: user.role,
        active: user.active // Cargamos si está activo o inactivo
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/admin/users/${editingId}`, formData);
        alert('✅ Usuario actualizado');
      } else {
        await api.post('/admin/users', formData);
        alert('✅ Usuario registrado');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.error || 'Ocurrió un error'));
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.active ? "desactivar" : "activar";
    if(!window.confirm(`¿Seguro que quieres ${action} a ${user.full_name}?`)) return;
    
    try {
        await api.put(`/admin/users/${user.id}/status`); 
        fetchUsers();
    } catch (error) {
        alert('Error al cambiar estado');
    }
  };

  return (
    <SidebarLayout>
      <style>{`
        .header-container {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 25px; flex-wrap: wrap; gap: 15px;
        }
        .page-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
        .page-subtitle { color: #6b7280; margin-top: 4px; font-size: 14px; }
        
        .btn-primary {
          background-color: #3b82f6; color: white; border: none;
          padding: 10px 20px; border-radius: 8px; cursor: pointer;
          font-weight: 500; display: flex; align-items: center; gap: 8px;
          transition: background 0.2s;
        }
        .btn-primary:hover { background-color: #2563eb; }

        /* TABLA DESKTOP */
        .desktop-table-container {
          background-color: white; border-radius: 12px;
          border: 1px solid #e5e7eb; overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .users-table { width: 100%; border-collapse: collapse; }
        .users-table th {
          background-color: #f9fafb; padding: 16px; text-align: left;
          font-size: 12px; color: #6b7280; text-transform: uppercase;
          font-weight: 600; border-bottom: 1px solid #e5e7eb;
        }
        .users-table td {
          padding: 16px; font-size: 14px; color: #4b5563;
          border-bottom: 1px solid #f3f4f6;
        }

        /* TARJETAS MÓVIL */
        .mobile-cards-container { display: none; flex-direction: column; gap: 15px; }
        .user-card {
          background: white; border-radius: 12px; padding: 16px;
          border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .card-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .card-value-main { font-size: 15px; color: #1f2937; font-weight: 600; }
        .card-value-sub { font-size: 13px; color: #6b7280; }

        /* BADGES */
        .badge { padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
        .badge-active { background-color: #dcfce7; color: #166534; }
        .badge-inactive { background-color: #fee2e2; color: #991b1b; }
        .badge-admin { background-color: #fef3c7; color: #d97706; }
        .badge-agent { background-color: #e0e7ff; color: #4f46e5; }

        /* BOTONES ACCION */
        .action-btn { border: none; background: transparent; cursor: pointer; padding: 6px; border-radius: 6px; transition: 0.2s; }
        .btn-edit { color: #3b82f6; } .btn-edit:hover { background: #eff6ff; }
        .btn-power-off { color: #ef4444; } .btn-power-off:hover { background: #fef2f2; }
        .btn-power-on { color: #16a34a; } .btn-power-on:hover { background: #f0fdf4; }

        /* MODAL */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0,0,0,0.5); z-index: 1000;
          display: flex; justify-content: center; align-items: center; padding: 20px;
        }
        .modal-content {
          background-color: white; padding: 25px; border-radius: 16px;
          width: 100%; max-width: 450px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; color: #374151; }
        .form-input {
          width: 100%; padding: 10px 12px; border-radius: 8px;
          border: 1px solid #d1d5db; font-size: 14px; outline: none; box-sizing: border-box;
        }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px; }

        /* MEDIA QUERY */
        @media (max-width: 768px) {
          .desktop-table-container { display: none; }
          .mobile-cards-container { display: flex; }
          .header-container { flex-direction: column; align-items: flex-start; }
          .btn-primary { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="header-container">
        <div>
          <h1 className="page-title">Equipo de Agencia</h1>
          <p className="page-subtitle">Gestión de usuarios y accesos.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="desktop-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Username</th> 
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ opacity: user.active ? 1 : 0.6 }}>
                <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '50%', color: '#6b7280' }}>
                            <User size={18} />
                        </div>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>{user.full_name}</span>
                    </div>
                </td>
                <td>
                    {user.role === 'super_admin' ? (
                        <span className="badge badge-admin">Super Admin</span>
                    ) : (
                        <span className="badge badge-agent">Agente</span>
                    )}
                </td>
                <td>{user.email}</td>
                <td>
                    {user.active ? (
                        <span className="badge badge-active"><CheckCircle size={12} /> Activo</span>
                    ) : (
                        <span className="badge badge-inactive"><Ban size={12} /> Inactivo</span>
                    )}
                </td>
                <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="action-btn btn-edit" onClick={() => openEditModal(user)} title="Editar">
                            <Pencil size={18} />
                        </button>
                        {user.role !== 'super_admin' && (
                            <button 
                                className={`action-btn ${user.active ? 'btn-power-off' : 'btn-power-on'}`}
                                onClick={() => handleToggleStatus(user)} 
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

      <div className="mobile-cards-container">
        {users.map(user => (
            <div key={user.id} className="user-card" style={{ opacity: user.active ? 1 : 0.7 }}>
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '50%' }}>
                            <User size={20} className="text-gray-500" />
                        </div>
                        <div>
                            <div className="card-value-main">{user.full_name}</div>
                            <div className="card-value-sub">@{user.email}</div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex' }}>
                         <button className="action-btn btn-edit" onClick={() => openEditModal(user)}>
                            <Pencil size={18} />
                        </button>
                        {user.role !== 'super_admin' && (
                            <button 
                                className={`action-btn ${user.active ? 'btn-power-off' : 'btn-power-on'}`}
                                onClick={() => handleToggleStatus(user)}
                            >
                                <Power size={18} />
                            </button>
                        )}
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
                    {user.role === 'super_admin' ? (
                        <span className="badge badge-admin">Super Admin</span>
                    ) : (
                        <span className="badge badge-agent">Agente</span>
                    )}
                    
                    {user.active ? (
                        <span className="badge badge-active">Activo</span>
                    ) : (
                        <span className="badge badge-inactive">Inactivo</span>
                    )}
                </div>
            </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input 
                  type="text" required
                  className="form-input"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" required
                  className="form-input"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="nombre.usuario"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                    Contraseña 
                    {isEditing && <span style={{fontSize: '12px', color: '#6b7280', fontWeight: 'normal'}}> (Opcional)</span>}
                </label>
                <input 
                  type="password" 
                  required={!isEditing} 
                  className="form-input"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder={isEditing ? "Sin cambios" : "••••••••"}
                />
              </div>

              {/* 4. Selector de Estado y Rol en una fila o separados */}
              <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Rol</label>
                    <select 
                        className="form-input"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                        <option value="client_admin">Agente</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Estado</label>
                    <select 
                        className="form-input"
                        value={formData.active.toString()} // Convertimos a string para el select
                        onChange={e => setFormData({...formData, active: e.target.value === 'true'})}
                    >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                    </select>
                  </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f3f4f6', color: '#374151', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary">{isEditing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}