import axios from 'axios';

// ============================================================
// 1. CONFIGURACIÓN BÁSICA
// Usamos una variable de entorno, pero si falla, usamos la URL directa.
// ============================================================
const API_URL = import.meta.env.VITE_API_URL || 'https://mochispuntonet-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================================
// 2. REQUEST INTERCEPTOR (ENVIAR EL TOKEN)
// Antes de que la petición salga, le pegamos el token si existe.
// ============================================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        // Si el servidor nos rechaza (401 Unauthorized)
        if (error.response && error.response.status === 401) {
            console.warn('Acceso denegado o sesión expirada. Cerrando sesión...');
            
            // 1. Limpieza de datos locales
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // 2. Redirección forzada al Login
            // Usamos window.location.href para asegurar una recarga limpia
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;