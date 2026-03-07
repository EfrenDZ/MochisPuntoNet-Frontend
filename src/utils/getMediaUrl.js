/**
 * Convierte una ruta de media (nueva o de Cloudinary) a una URL completa.
 *
 * - Si es null/undefined → retorna un string vacío.
 * - Si ya empieza con "http" (Cloudinary legacy) → la retorna tal cual.
 * - Si empieza con "/uploads" (nueva, VPS) → le antepone VITE_API_URL.
 */
export const getMediaUrl = (urlPath) => {
    if (!urlPath) return '';

    // URLs absolutas (Cloudinary legacy, etc.) se usan directo
    if (urlPath.startsWith('http')) {
        return urlPath;
    }

    // Rutas relativas del VPS: /uploads/...
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    // Eliminamos el segmento "/api" si existe, ya que /uploads está en la raíz del backend
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}${urlPath}`;
};
