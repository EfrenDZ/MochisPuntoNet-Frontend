import React from 'react';
import { X, Film, Image as ImageIcon } from 'lucide-react';
import { getMediaUrl } from '../utils/getMediaUrl';

export default function MediaPreviewModal({ isOpen, onClose, item }) {
    if (!isOpen || !item) return null;

    const isVideo = item.type === 'video';
    const displayName = item.name || item.media_name || (isVideo ? 'Video' : 'Imagen');

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Cabecera del modal */}
                <div style={styles.header}>
                    <div style={styles.titleArea}>
                        {isVideo ? <Film size={18} color="#3b82f6" /> : <ImageIcon size={18} color="#22c55e" />}
                        <h3 style={styles.title}>{displayName}</h3>
                    </div>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido (Video o Imagen) */}
                <div style={styles.content}>
                    {isVideo ? (
                        <video
                            src={getMediaUrl(item.url)}
                            controls /* Esto agrega la barra de tiempo y volumen nativa */
                            autoPlay
                            style={styles.media}
                        />
                    ) : (
                        <img
                            src={getMediaUrl(item.url)}
                            alt="Preview"
                            style={styles.media}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    },
    modal: {
        backgroundColor: '#0f172a', border: '1px solid #334155',
        borderRadius: '16px', width: '100%', maxWidth: '800px',
        overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '15px 20px', borderBottom: '1px solid #1e293b', backgroundColor: '#1e293b'
    },
    titleArea: {
        display: 'flex', alignItems: 'center', gap: '10px'
    },
    title: {
        color: 'white', margin: 0, fontSize: '16px', fontWeight: '600',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px'
    },
    closeBtn: {
        background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
        width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
    },
    content: {
        width: '100%', backgroundColor: 'black', display: 'flex',
        alignItems: 'center', justifyContent: 'center', minHeight: '300px', maxHeight: '70vh'
    },
    media: {
        width: '100%', height: '100%', maxHeight: '70vh', objectFit: 'contain'
    }
};