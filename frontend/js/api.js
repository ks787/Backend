class API {
    constructor() {
        // Automatically detect if running locally or in production
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // TODO: REPLACE 'https://your-backend-app.onrender.com' with your actual Render Backend URL after deployment
        this.baseURL = isLocal ? 'http://localhost:5003/api' : 'https://backend-manager-z5rc.onrender.com/api';
    }

    getToken() {
        return localStorage.getItem('token');
    }

    setToken(token) {
        localStorage.setItem('token', token);
    }

    removeToken() {
        localStorage.removeItem('token');
    }

    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);

            // Check if response is OK but not JSON (e.g. empty 204)
            if (response.status === 204) {
                return {};
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Server returned non-JSON:', text);
                throw new Error(`Server returned non-JSON: ${text.substring(0, 50)}...`);
            }

            if (!response.ok) {
                if (response.status === 401) {
                    this.removeToken();
                    window.location.href = '/index.html';
                }
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async post(endpoint, body) {
        return this.request(endpoint, 'POST', body);
    }

    async get(endpoint) {
        return this.request(endpoint, 'GET');
    }

    async put(endpoint, body) {
        return this.request(endpoint, 'PUT', body);
    }

    async delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    }
}

const api = new API();
