import axios from 'axios';

// ============================================================
// 1. CONFIGURACIÓN BÁSICA
// Forzamos la ruta relativa "/api" para que SIEMPRE pase por 
// el Proxy Reverso de Vercel (Producción) y Vite (Local)
// ============================================================
const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});

// ============================================================
// 2. REQUEST INTERCEPTOR (ENVIAR EL TOKEN)
// Antes de que la petición salga, le pegamos el token si existe.
// ============================================================
api.interceptors.request.use(
    (config) => {
        // 1. Añadimos el token si no existe
        if (!config.headers.Authorization) {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // 2. Si estamos mandando FormData (ej. imágenes), dejamos que el navegador
        // ponga automáticamente el Content-Type multipart/form-data con su boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ============================================================
// 3. RESPONSE INTERCEPTOR (MANEJAR ERRORES DE SESIÓN)
// Si el servidor responde 401 (Token vencido o inválido),
// limpiamos todo y mandamos al usuario al Login.
// ============================================================
api.interceptors.response.use(
    (response) => {
        // Si todo sale bien, dejamos pasar la respuesta
        return response;
    },
    (error) => {
        // Rutas públicas que NO deben redireccionar al login si fallan con 401
        const isTVRoute = error.config && error.config.url && error.config.url.startsWith('/tv');

        // Si el servidor nos rechaza (401 Unauthorized) y NO es una ruta pública de TV
        if (error.response && error.response.status === 401 && !isTVRoute) {
            console.warn('Acceso denegado o sesión expirada. Cerrando sesión...');

            // 1. Limpieza de datos locales
            const slug = localStorage.getItem('clientSlug');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');

            // 2. Redirección forzada al Login (Solo si no estamos ya en una página de login)
            if (window.location.pathname !== '/admin' && !window.location.pathname.endsWith('/login')) {
                window.location.href = slug ? `/${slug}/login` : '/admin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;