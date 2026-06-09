import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const UsuarioService = {
    // Obtener los usuarios activos
    getAll: async () => {
        try {
            const response = await axios.get(`${API_URL}/usuarios/`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getAll:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener usuarios' 
            };
        }
    },

    // Obtener usuarios inactivos
    getInactivos: async () => {
        try {
            const response = await axios.get(`${API_URL}/usuarios/inactivos`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getInactivos:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener usuarios inactivos' 
            };
        }
    },

    // Obtener roles
    getRoles: async () => {
        try {
            const response = await axios.get(`${API_URL}/usuarios/roles`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getRoles:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener roles' 
            };
        }
    },

    // Crear usuario
    create: async (usuario) => {
        try {
            const response = await axios.post(`${API_URL}/usuarios/`, usuario, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en create:', error);
            const errorMsg = error.response?.data?.error || '';
            if (errorMsg.includes('DNI') || errorMsg.includes('dni')) {
                return { 
                    success: false, 
                    error: ' Ya existe un usuario con este DNI.' 
                };
            }
            if (errorMsg.includes('correo') || errorMsg.includes('email')) {
                return { 
                    success: false, 
                    error: ' Ya existe un usuario con este correo electrónico.' 
                };
            }
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al crear el usuario' 
            };
        }
    },

    // Actualizar usuario
    update: async (id, usuario) => {
        try {
            const response = await axios.put(`${API_URL}/usuarios/${id}`, usuario, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en update:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al actualizar el usuario' 
            };
        }
    },

    // Desactivar usuario
    delete: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/usuarios/${id}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en delete:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al desactivar el usuario' 
            };
        }
    },

    // Reactivar usuario
    reactivate: async (id) => {
        try {
            const response = await axios.put(`${API_URL}/usuarios/${id}/reactivar`, {}, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en reactivate:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al reactivar el usuario' 
            };
        }
    }
};