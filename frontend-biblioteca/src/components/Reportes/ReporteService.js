import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const ReporteService = {
   
    getAllPrestamos: async () => {
        try {
            const response = await axios.get(`${API_URL}/prestamos/`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error en getAllPrestamos:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || 'Error al obtener préstamos' 
            };
        }
    },

    // Exportar a CSV
    exportToCSV: (data) => {
        if (!data || data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const headers = [
            'ID Préstamo',
            'Solicitante',
            'DNI Solicitante',
            'Libro',
            'ISBN',
            'Fecha Préstamo',
            'Fecha Devolución Esperada',
            'Fecha Devolución Real',
            'Estado',
            'Gestionado por'
        ];

        const rows = data.map(p => [
            p.prestamo_id,
            p.solicitante?.nombre || 'N/A',
            p.solicitante?.dni || 'N/A',
            p.libro?.titulo || 'N/A',
            p.libro?.isbn || 'N/A',
            p.fecha_prestamo,
            p.fecha_dev_esperada,
            p.fecha_dev_real || 'Pendiente',
            p.estado,
            p.gestor?.nombre || 'N/A'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_prestamos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};