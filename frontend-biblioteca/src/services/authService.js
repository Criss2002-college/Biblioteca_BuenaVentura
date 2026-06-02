import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const authService = {
  
    login: async (correo, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                correo,
                password
            });
            
            if (response.data.access_token) {
                // Guardardo de token y usuario en localStorage
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('user', JSON.stringify(response.data.usuario));
            }
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Error de conexión' };
        }
    },
    
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    
   
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    
    getToken: () => {
        return localStorage.getItem('token');
    },
    
    
    isAuthenticated: () => {
        return localStorage.getItem('token') !== null;
    },
    
    
    isAdmin: () => {
        const user = authService.getCurrentUser();
        return user?.rol === 'Administrador';
    },
    
   
    isGestorOrAdmin: () => {
        const user = authService.getCurrentUser();
        return user?.rol === 'Administrador' || user?.rol === 'Gestor';
    }
};

// Configuración de interceptor de axios para agregar token
axios.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor manejos de errores 400
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authService.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default authService;