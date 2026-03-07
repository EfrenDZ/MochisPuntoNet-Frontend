/**
 * Convierte una ruta de media (nueva o de Cloudinary) a una URL completa.
 *
 * - Si es null/undefined → retorna un string vacío.
 * - Si ya empieza con "http" (Cloudinary legacy) → la retorna tal cual.
 * - Si empieza con "/uploads" (nueva, VPS) → construye la URL completa.
 *
 * NOTA: Express sirve los archivos en /api/uploads/... (dentro del router /api),
 * así que usamos VITE_API_URL directamente (sin quitar /api).
 * En local: http://localhost:4000/api/uploads/...  (proxy Vite lo maneja)
 * En producción: /api/uploads/...  (proxy Vercel lo reenvía al backend)
 */
export const getMediaUrl = (urlPath) => {
    if (!urlPath) return '';

    // URLs absolutas (Cloudinary legacy, etc.) se usan directo
    if (urlPath.startsWith('http')) {
        return urlPath;
    }

    // Rutas relativas del VPS: /uploads/...
    // En producción con Vercel usamos ruta relativa /api/uploads/... para que
    // el proxy de vercel.json lo reenvíe al backend automáticamente.
    const apiBase = import.meta.env.VITE_API_URL || '';

    if (apiBase) {
        // Modo local (VITE_API_URL = http://localhost:4000/api)
        // → construye http://localhost:4000/api/uploads/...
        return `${apiBase}${urlPath}`;
    }

    // Modo producción sin VITE_API_URL definida → usa ruta relativa
    // Vercel reescribe /api/* al backend
    return `/api${urlPath}`;
};
