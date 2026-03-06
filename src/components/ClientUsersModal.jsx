import React, { useState } from 'react';
import { User, Pencil, Power, Ban, CheckCircle, ChevronLeft, X, UserCog, Briefcase } from 'lucide-react';

const STYLES = `
  .client-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0,0,0,0.5); z-index: 999;
    display: flex; justify-content: center; align-items: center; padding: 20px;
  }
  .client-modal-content {
    background-color: white; border-radius: 16px; width: 100%; max-width: 800px;
    height: 80vh; max-height: 800px; display: flex; flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: slideUp 0.3s ease-out;
  }
  .client-modal-header {
    padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex;
    justify-content: space-between; align-items: center;
  }
  .client-modal-body {
    flex: 1; overflow-y: auto; padding: 24px; background: #f9fafb;
    border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;
  }
  .client-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;
  }
  .client-card {
    background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;
    cursor: pointer; transition: 0.2s; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .client-card:hover {
    border-color: #3b82f6; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(59,130,246,0.1);
  }
  .client-card-name { font-weight: 600; color: #1f2937; margin-top: 12px; font-size: 15px; }

  /* Tablas de usuarios */
  .cm-table-container { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
  .cm-table { width: 100%; border-collapse: collapse; }
  .cm-table th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
  .cm-table td { padding: 12px 16px; font-size: 14px; color: #4b5563; border-bottom: 1px solid #f3f4f6; }
`;

const ROLE_LABELS = {
    client_admin: { label: 'Admin Cliente', badge: 'badge-admin', icon: <UserCog size={14} /> },
    client_agent: { label: 'Agente', badge: 'badge-agent', icon: <Briefcase size={14} /> },
};

const RoleBadge = ({ role }) => {
    const info = ROLE_LABELS[role] || { label: role, badge: 'badge-agent', icon: null };
    return <span className={`badge ${info.badge}`}>{info.icon} {info.label}</span>;
};

export default function ClientUsersModal({ clients, users, onClose, onEditUser, onToggleStatus, onCreateUserForClient }) {
    const [selectedClient, setSelectedClient] = useState(null);

    // Filter users that belong to the selected client
    const clientUsers = selectedClient
        ? users.filter(u => u.client_id === selectedClient.id)
        : [];

    return (
        <div className="client-modal-overlay" onClick={onClose}>
            <style>{STYLES}</style>
            <div className="client-modal-content" onClick={e => e.stopPropagation()}>
                {/* HEADER */}
                <div className="client-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {selectedClient && (
                            <button
                                onClick={() => setSelectedClient(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#6b7280' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>
                                {selectedClient ? `Usuarios: ${selectedClient.name}` : 'Usuarios por Cliente'}
                            </h2>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                                {selectedClient ? 'Gestiona el equipo de este cliente.' : 'Selecciona un cliente para ver o editar sus agentes y administradores.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="client-modal-body">
                    {!selectedClient ? (
                        /* VISTA 1: LISTA DE CLIENTES */
                        <div className="client-grid">
                            {clients.map(client => (
                                <div key={client.id} className="client-card" onClick={() => setSelectedClient(client)}>
                                    <div style={{
                                        width: '48px', height: '48px', margin: '0 auto', borderRadius: '12px',
                                        background: client.primary_color || '#3b82f6', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold'
                                    }}>
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="client-card-name">{client.name}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                        {users.filter(u => u.client_id === client.id).length} Usuarios
                                    </div>
                                </div>
                            ))}
                            {clients.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    No hay clientes registrados en el sistema.
                                </div>
                            )}
                        </div>
                    ) : (
                        /* VISTA 2: USUARIOS DEL CLIENTE */
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                <button
                                    onClick={() => onCreateUserForClient(selectedClient.id)}
                                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}
                                >
                                    <User size={16} /> Nuevo Usuario
                                </button>
                            </div>

                            {clientUsers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#6b7280' }}>
                                    Este cliente aún no tiene usuarios asignados.
                                </div>
                            ) : (
                                <div className="cm-table-container">
                                    <table className="cm-table">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Rol</th>
                                                <th>Username</th>
                                                <th>Estado</th>
                                                <th style={{ textAlign: 'right' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientUsers.map(user => (
                                                <tr key={user.id} style={{ opacity: user.active ? 1 : 0.6 }}>
                                                    <td style={{ fontWeight: '500', color: '#1f2937' }}>{user.full_name}</td>
                                                    <td><RoleBadge role={user.role} /></td>
                                                    <td>{user.username || user.email || '—'}</td>
                                                    <td>
                                                        {user.active
                                                            ? <span className="badge badge-active"><CheckCircle size={10} /> Activo</span>
                                                            : <span className="badge badge-inactive"><Ban size={10} /> Inactivo</span>}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            className="action-btn btn-edit"
                                                            style={{ marginRight: '8px' }}
                                                            onClick={() => { onClose(); onEditUser(user); }}
                                                            title="Editar"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            className={`action-btn ${user.active ? 'btn-power-off' : 'btn-power-on'}`}
                                                            onClick={() => onToggleStatus(user)}
                                                            title={user.active ? 'Desactivar' : 'Activar'}
                                                        >
                                                            <Power size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
