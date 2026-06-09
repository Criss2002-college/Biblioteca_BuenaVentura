import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const PrestamoService = {
    // Obtener todos los préstamos
    getAll: async () => {
        try {
            const response = await axios.get(`${API_URL}/prestamos/`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getAll:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener préstamos' 
            };
        }
    },

    // Obtener préstamos activos
    getActivos: async () => {
        try {
            const response = await axios.get(`${API_URL}/prestamos/activos`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getActivos:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener préstamos activos' 
            };
        }
    },

    // Obtener préstamos vencidos
    getVencidos: async () => {
        try {
            const response = await axios.get(`${API_URL}/prestamos/vencidos`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getVencidos:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener préstamos vencidos' 
            };
        }
    },

    // Obtener préstamos por usuario
    getByUsuario: async (usuarioId) => {
        try {
            const response = await axios.get(`${API_URL}/prestamos/usuario/${usuarioId}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getByUsuario:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener préstamos del usuario' 
            };
        }
    },

    // Obtener préstamos por libro
    getByLibro: async (libroId) => {
        try {
            const response = await axios.get(`${API_URL}/prestamos/libro/${libroId}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getByLibro:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener préstamos del libro' 
            };
        }
    },

    // Crear préstamo
    create: async (prestamo) => {
        try {
            const response = await axios.post(`${API_URL}/prestamos/`, prestamo, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en create:', error);
            const errorMsg = error.response?.data?.error || '';
            
            if (errorMsg.includes('préstamo activo')) {
                return { 
                    success: false, 
                    error: 'El usuario ya tiene un préstamo activo. Debe devolver el libro actual para tomar otro.' 
                };
            }
            if (errorMsg.includes('mismo día') || errorMsg.includes('hoy')) {
                return { 
                    success: false, 
                    error: 'Este libro ya fue prestado hoy. Solo puede ser prestado una vez por día.' 
                };
            }
            if (errorMsg.includes('ejemplares disponibles')) {
                return { 
                    success: false, 
                    error: 'No hay ejemplares disponibles de este libro.' 
                };
            }
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al crear el préstamo' 
            };
        }
    },

    // Registrar devolución
    devolver: async (prestamoId) => {
        try {
            const response = await axios.put(`${API_URL}/prestamos/${prestamoId}/devolver`, {}, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en devolver:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al registrar devolución' 
            };
        }
    },

    // Cancelar préstamo
    cancelar: async (prestamoId) => {
        try {
            const response = await axios.delete(`${API_URL}/prestamos/${prestamoId}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en cancelar:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al cancelar el préstamo' 
            };
        }
    }
};