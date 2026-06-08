import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const LibroService = {
    // Obtener libros activos
    getAll: async () => {
        try {
            const response = await axios.get(`${API_URL}/libros/`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getAll:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener libros' 
            };
        }
    },

    // Obtener libro por ID
    getById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/libros/${id}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getById:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener el libro' 
            };
        }
    },

    // Crear libro
    create: async (libro) => {
        try {
            const response = await axios.post(`${API_URL}/libros/`, libro, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en create:', error);
            console.error('Detalles del error:', error.response?.data);
            
            // Capturar error específico de ISBN duplicado
            const errorMsg = error.response?.data?.error || '';
            if (errorMsg.includes('ISBN') || errorMsg.includes('duplicado')) {
                return { 
                    success: false, 
                    error: 'Ya existe un libro con este ISBN. Por favor verifica.' 
                };
            }
            
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al crear el libro' 
            };
        }
    },

    // Actualizar libro
    update: async (id, libro) => {
        try {
            const response = await axios.put(`${API_URL}/libros/${id}`, libro, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en update:', error);
            const errorMsg = error.response?.data?.error || '';
            if (errorMsg.includes('ISBN') || errorMsg.includes('duplicado')) {
                return { 
                    success: false, 
                    error: 'Ya existe otro libro con este ISBN.' 
                };
            }
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al actualizar el libro' 
            };
        }
    },

    // Eliminar libro
    delete: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/libros/${id}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en delete:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al desactivar el libro' 
            };
        }
    },

    // Reactivar libro
    reactivate: async (id) => {
        try {
            const response = await axios.put(`${API_URL}/libros/${id}/reactivar`, {}, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en reactivate:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al reactivar el libro' 
            };
        }
    },

    // Buscar libros
    search: async (query) => {
        try {
            const response = await axios.get(`${API_URL}/libros/buscar?q=${query}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en search:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al buscar libros' 
            };
        }
    },

    // Obtener libros inactivos
    getInactivos: async () => {
        try {
            const response = await axios.get(`${API_URL}/libros/inactivos`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getInactivos:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener libros inactivos' 
            };
        }
    }
}