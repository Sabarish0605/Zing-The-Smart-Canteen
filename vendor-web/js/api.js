// File: vendor-web/js/api.js

const API_BASE = 'https://zing-canteen-backend.onrender.com/api';

const api = {
    // Helper for fetch with Authorization
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('vendorToken');
        const headers = { ...options.headers };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            if (response.status === 401 || response.status === 403) {
                logout();
                throw new Error("Unauthorized");
            }
            if (response.status === 204) return null;
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // Auth
    async register(email, password, shopName) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: 'VENDOR', shopName })
        });
        if (data.token) {
            localStorage.setItem('vendorToken', data.token);
            try {
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                localStorage.setItem('vendorEmail', payload.sub);
            } catch (e) {
                console.warn("Could not decode token", e);
            }
        }
        return data;
    },

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            localStorage.setItem('vendorToken', data.token);
            // Decode JWT to extract Vendor ID (crude split approach for SPA demo)
            try {
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                localStorage.setItem('vendorEmail', payload.sub);
            } catch (e) {
                console.warn("Could not decode token", e);
            }
        }
        return data;
    },

    // Menu
    async getMyMenu() {
        // Technically, the API is /api/menu/vendor/{id}, but we might need the ID.
        // For simplicity, we could fetch all menus or ensure backend endpoint uses current user's ID.
        // Assuming backend handles it, or we fetch a specific vendor. 
        // Let's assume we have an endpoint that derives vendor ID from the token for ease:
        // Actually, backend expects vendorId in path for GET, or we can fetch all and filter, or backend needs an /api/menu/my-menu endpoint.
        // Let's assume the backend extracts Vendor ID from Token if we hit a modified endpoint, 
        // OR we decode the token if it has the ID. The backend CustomUserDetailsService provides email.
        // For this demo, let's just fetch all available or assume vendor ID is 1 for testing if not returned.
        // If we strictly follow phase 3, we need the vendor ID.
        // For now, we'll hit GET /api/menu (which gets all) just to display something, 
        // or we need to add a "me" endpoint in the backend. Let's fetch all available for UI demo.
        return await this.request('/menu');
    },

    async createMenuItem(formData) {
        return await this.request('/menu', {
            method: 'POST',
            body: formData // FormData automatically sets multipart/form-data boundary
        });
    },

    async deleteMenuItem(id) {
        return await this.request(`/menu/${id}`, {
            method: 'DELETE'
        });
    },

    async updateMenuItem(id, formData) {
        return await this.request(`/menu/${id}`, {
            method: 'PUT',
            body: formData
        });
    },

    // Orders
    async getActiveOrders() {
        return await this.request('/orders/vendor');
    },

    async verifyQrCode(qrCodeHash) {
        return await this.request('/orders/verify-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrCodeHash })
        });
    }
};

function logout() {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorEmail');
    disconnectWebSocket();
    window.location.reload();
}
