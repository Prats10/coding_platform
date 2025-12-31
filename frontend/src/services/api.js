// frontend/src/services/api.js - API Service with Auth

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests automatically
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

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: async (username, email, password, codeforcesHandle) => {
        const response = await api.post('/auth/register', {
            username,
            email,
            password,
            codeforcesHandle
        });
        return response.data;
    },

    login: async (email, password) => {
        const response = await api.post('/auth/login', {
            email,
            password
        });
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    updateCFHandle: async (codeforcesHandle) => {
        const response = await api.put('/auth/update-cf-handle', {
            codeforcesHandle
        });
        return response.data;
    }
};

export default api;
