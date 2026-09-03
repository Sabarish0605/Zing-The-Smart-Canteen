// File: student-mobile/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// NOTE: Replace YOUR_LOCAL_IP with your machine's actual IP address on your local network
const API_BASE_URL = 'https://zing-canteen-backend.onrender.com/api'; 

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        // Skip adding token for auth routes to prevent 403s
        if (config.url && (config.url.includes('/auth/login') || config.url.includes('/auth/register'))) {
            return config;
        }

        const token = await SecureStore.getItemAsync('studentToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            await SecureStore.deleteItemAsync('studentToken');
            // Ideally trigger navigation to login
        }
        return Promise.reject(error);
    }
);

export default api;
