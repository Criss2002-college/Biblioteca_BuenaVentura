import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const LibroService = {
    // Obtener libros activos
    getAll: async () => {
        const response = await axios.get(`${API_URL}/libros/`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Obtener libro por ID
    getById: async (id) => {
        const response = await axios.get(`${API_URL}/libros/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Crear libro
    create: async (libro) => {
        const response = await axios.post(`${API_URL}/libros/`, libro, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Actualizar libro
    update: async (id, libro) => {
        const response = await axios.put(`${API_URL}/libros/${id}`, libro, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Eliminar libro
    delete: async (id) => {
        const response = await axios.delete(`${API_URL}/libros/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Reactivar libro
    reactivate: async (id) => {
        const response = await axios.put(`${API_URL}/libros/${id}/reactivar`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Buscar libros, por nombre o ISBN
    search: async (query) => {
        const response = await axios.get(`${API_URL}/libros/buscar?q=${query}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Obtener libros inactivos
    getInactivos: async () => {
        const response = await axios.get(`${API_URL}/libros/inactivos`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};