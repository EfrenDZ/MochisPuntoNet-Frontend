import React from 'react';
import { X } from 'lucide-react';
import MediaManager from '../pages/MediaManager';

export default function MediaLibraryModal({ isOpen, onClose, clientId, clientName, onSelect, showToast }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={onClose}>
            <div style={{
                background: '#f8fafc', width: '90vw', maxWidth: '1400px', height: '85vh',
                borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    background: 'white', padding: '15px 25px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>
                        Biblioteca de Medios {clientName ? `- ${clientName}` : ''}
                    </h2>
                    <button onClick={onClose} style={{
                        background: '#ef4444', border: 'none', color: 'white', width: '30px', height: '30px',
                        borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <X size={18} />
                    </button>
                </div>

                {/* Contenido (Media Manager embebido) */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', width: '100%', height: '100%' }}>
                    <div style={{ width: '100%', height: '100%' }}>
                        <MediaManager
                            isEmbedded={true}
                            customClientId={clientId}
                            onSelectMedia={onSelect}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}