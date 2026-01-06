// src/config/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // Lee la variable del .env
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor: Antes de cada petición, inyecta el token si existe
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;