import { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import ClientUsersModal from '../components/ClientUsersModal';
import api from '../config/api';
import { UserPlus, Power, User, Pencil, Ban, CheckCircle, X, ShieldCheck, Briefcase, UserCog } from 'lucide-react';

const STYLES = `
  .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
  .page-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
  .page-subtitle { color: #6b7280; margin-top: 4px; font-size: 14px; }

  .btn-primary { background-color: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
  .btn-primary:hover { background-color: #2563eb; }

  .desktop-table-container { background-color: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  .users-table { width: 100%; border-collapse: collapse; }
  .users-table th { background-color: #f9fafb; padding: 16px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
  .users-table td { padding: 16px; font-size: 14px; color: #4b5563; border-bottom: 1px solid #f3f4f6; }

  .mobile-cards-container { display: none; flex-direction: column; gap: 15px; }
  .user-card { background: white; border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .card-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
  .card-value-main { font-size: 15px; color: #1f2937; font-weight: 600; }
  .card-value-sub { font-size: 13px; color: #6b7280; }

  .badge { padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
  .badge-active { background-color: #dcfce7; color: #166534; }
  .badge-inactive { background-color: #fee2e2; color: #991b1b; }
  .badge-super { background-color: #fef3c7; color: #d97706; }
  .badge-admin { background-color: #ede9fe; color: #6d28d9; }
  .badge-agent { background-color: #e0e7ff; color: #4f46e5; }

  .action-btn { border: none; background: transparent; cursor: pointer; padding: 6px; border-radius: 6px; transition: 0.2s; }
  .btn-edit { color: #3b82f6; } .btn-edit:hover { background: #eff6ff; }
  .btn-power-off { color: #ef4444; } .btn-power-off:hover { background: #fef2f2; }
  .btn-power-on { color: #16a34a; } .btn-power-on:hover { background: #f0fdf4; }

  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 20px; }
  .modal-content { background-color: white; padding: 25px; border-radius: 16px; width: 100%; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: slideUp 0.3s ease-out; }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .form-group { margin-bottom: 16px; }
  .form-label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; color: #374151; }
  .form-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 14px; outline: none; box-sizing: border-box; }
  .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px; }

  .role-selector { display: flex; gap: 10px; }
  .role-option { flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; text-align: center; transition: 0.2s; }
  .role-option.selected { border-color: #3b82f6; background: #eff6ff; }
  .role-option:hover { border-color: #93c5fd; }
  .role-option-icon { margin-bottom: 4px; }
  .role-option-label { font-size: 12px; font-weight: 600; color: #374151; }
  .role-option-desc { font-size: 11px; color: #9ca3af; margin-top: 2px; }

  @media (max-width: 768px) {
    .desktop-table-container { display: none; }
    .mobile-cards-container { display: flex; }
    .header-container { flex-direction: column; align-items: flex-start; }
    .btn-primary { width: 100%; justify-content: center; }
  }
`;

const ROLE_LABELS = {
  super_admin: { label: 'Super Admin', badge: 'badge-super', icon: <ShieldCheck size={14} /> },
  client_admin: { label: 'Admin Cliente', badge: 'badge-admin', icon: <UserCog size={14} /> },
  client_agent: { label: 'Agente', badge: 'badge-agent', icon: <Briefcase size={14} /> },
};

export default function UsersPage() {
  const loggedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = loggedUser.role === 'super_admin';

  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false); // New modal for clients
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: isSuperAdmin ? 'client_admin' : 'client_agent',
    client_id: '',
    active: true,
  });

  useEffect(() => {
    fetchUsers();
    if (isSuperAdmin) fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/admin/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setError('');
    setFormData({ full_name: '', username: '', password: '', role: isSuperAdmin ? 'super_agent' : 'client_agent', client_id: '', active: true });
    setShowModal(true);
  };

  const handleCreateUserForClient = (clientId) => {
    setShowClientModal(false);
    setIsEditing(false);
    setError('');
    setFormData({ full_name: '', username: '', password: '', role: 'client_admin', client_id: clientId, active: true });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setEditingId(user.id);
    setError('');
    setFormData({ full_name: user.full_name, username: user.username || user.email, password: '', role: user.role, client_id: user.client_id || '', active: user.active });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (isEditing) {
        await api.put(`/admin/users/${editingId}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!window.confirm(`¿Seguro que quieres ${user.active ? 'desactivar' : 'activar'} a ${user.full_name}?`)) return;
    try {
      await api.put(`/admin/users/${user.id}/status`);
      fetchUsers();
    } catch {
      alert('Error al cambiar estado');
    }
  };

  // Roles disponibles según quien está logueado
  const availableRoles = isSuperAdmin
    ? [
      { value: 'super_admin', label: 'Super Admin', desc: 'Acceso total al sistema', icon: <ShieldCheck size={20} color="#d97706" /> },
      { value: 'super_agent', label: 'Agente General', desc: 'Acceso total sin crear usuarios', icon: <Briefcase size={20} color="#059669" /> },
      { value: 'client_admin', label: 'Admin Cliente', desc: 'Gestiona un cliente', icon: <UserCog size={20} color="#6d28d9" /> },
    ]
    : [
      { value: 'client_admin', label: 'Administrador', desc: 'Admin dentro de tu empresa', icon: <UserCog size={20} color="#6d28d9" /> },
      { value: 'client_agent', label: 'Agente', desc: 'Acceso básico de cliente', icon: <Briefcase size={20} color="#4f46e5" /> },
    ];

  const RoleBadge = ({ role }) => {
    const info = ROLE_LABELS[role] || { label: role, badge: 'badge-agent', icon: null };
    return <span className={`badge ${info.badge}`}>{info.icon} {info.label}</span>;
  };

  // Only show super_admin and super_agent on the main table if the logged user is a super_admin
  const filteredUsers = isSuperAdmin
    ? users.filter(u => u.role === 'super_admin' || u.role === 'super_agent')
    : users;

  return (
    <SidebarLayout>
      <style>{STYLES}</style>

      <div className="header-container">
        <div>
          <h1 className="page-title">{isSuperAdmin ? 'Usuarios del Sistema' : 'Equipo'}</h1>
          <p className="page-subtitle">Gestión de usuarios y accesos.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isSuperAdmin && (
            <button
              onClick={() => setShowClientModal(true)}
              className="btn-primary"
              style={{ background: 'white', color: '#1f2937', border: '1px solid #d1d5db' }}
            >
              <Briefcase size={18} color="#6b7280" /> Usuarios por Cliente
            </button>
          )}
          <button onClick={openCreateModal} className="btn-primary">
            <UserPlus size={18} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* TABLA DESKTOP */}
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
            {filteredUsers.map(user => (
              <tr key={user.id} style={{ opacity: user.active ? 1 : 0.6 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '50%', color: '#6b7280' }}>
                      <User size={18} />
                    </div>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{user.full_name}</span>
                  </div>
                </td>
                <td><RoleBadge role={user.role} /></td>
                <td style={{ color: '#6b7280' }}>{user.username || user.email || '—'}</td>
                <td>
                  {user.active
                    ? <span className="badge badge-active"><CheckCircle size={12} /> Activo</span>
                    : <span className="badge badge-inactive"><Ban size={12} /> Inactivo</span>}
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
                        title={user.active ? 'Desactivar' : 'Activar'}
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

      {/* TARJETAS MÓVIL */}
      <div className="mobile-cards-container">
        {filteredUsers.map(user => (
          <div key={user.id} className="user-card" style={{ opacity: user.active ? 1 : 0.7 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '50%' }}>
                  <User size={20} />
                </div>
                <div>
                  <div className="card-value-main">{user.full_name}</div>
                  <div className="card-value-sub">@{user.username || user.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <button className="action-btn btn-edit" onClick={() => openEditModal(user)}><Pencil size={18} /></button>
                {user.role !== 'super_admin' && (
                  <button className={`action-btn ${user.active ? 'btn-power-off' : 'btn-power-on'}`} onClick={() => handleToggleStatus(user)}>
                    <Power size={18} />
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
              <RoleBadge role={user.role} />
              {user.active
                ? <span className="badge badge-active">Activo</span>
                : <span className="badge badge-inactive">Inactivo</span>}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input type="text" required className="form-input" value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" required className="form-input" value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="nombre.usuario" />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Contraseña {isEditing && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}>(Dejar vacío para no cambiar)</span>}
                </label>
                <input type="password" required={!isEditing} className="form-input"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEditing ? 'Sin cambios' : '••••••••'} />
              </div>

              <div className="form-group">
                <label className="form-label">Rol</label>
                <div className="role-selector">
                  {availableRoles.map(r => (
                    <div key={r.value}
                      className={`role-option ${formData.role === r.value ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, role: r.value })}
                    >
                      <div className="role-option-icon">{r.icon}</div>
                      <div className="role-option-label">{r.label}</div>
                      <div className="role-option-desc">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {isSuperAdmin && (formData.role === 'client_admin' || formData.role === 'client_agent') && (
                <div className="form-group">
                  <label className="form-label">Asignar a Cliente</label>
                  <select
                    className="form-input"
                    value={formData.client_id}
                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                    required={(formData.role === 'client_admin' || formData.role === 'client_agent')}
                  >
                    <option value="">-- Selecciona un cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f3f4f6', color: '#374151', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE USUARIOS POR CLIENTE */}
      {showClientModal && isSuperAdmin && (
        <ClientUsersModal
          clients={clients}
          users={users}
          onClose={() => setShowClientModal(false)}
          onEditUser={openEditModal}
          onToggleStatus={(u) => { handleToggleStatus(u); fetchUsers(); }} // Re-fetch to update table
          onCreateUserForClient={handleCreateUserForClient}
        />
      )}
    </SidebarLayout>
  );
}