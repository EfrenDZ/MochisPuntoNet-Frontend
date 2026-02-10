// src/config/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // Lee la variable del .env
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================================
// 1. REQUEST INTERCEPTOR (Lo que ya tenías)
// Inyecta el token en cada petición que sale hacia el servidor
// ============================================================
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// ============================================================
// 2. RESPONSE INTERCEPTOR (LO NUEVO)
// Escucha las respuestas. Si recibe un error 401 (No autorizado),
// significa que el token venció o es falso -> Te saca al Login.
// ============================================================
api.interceptors.response.use(
    (response) => {
        // Si la respuesta es correcta, la deja pasar sin cambios
        return response;
    },
    (error) => {
        // Si el error es 401 (Unauthorized)
        if (error.response && error.response.status === 401) {
            console.warn('Sesión expirada o token inválido. Cerrando sesión...');
            
            // 1. Limpiamos el almacenamiento local
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // 2. Forzamos la recarga hacia el Login
            // Usamos window.location en vez de navigate porque este archivo no es un componente React
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;