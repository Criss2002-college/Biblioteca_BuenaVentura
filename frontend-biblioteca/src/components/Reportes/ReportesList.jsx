import React, { useState, useEffect } from 'react';
import { ReporteService } from './ReporteService';
import { useAuth } from '../../context/authContext';
import { Navigate } from 'react-router-dom';
import './ReportesList.css';

const ReportesList = () => {
    const [prestamos, setPrestamos] = useState([]);
    const [filteredPrestamos, setFilteredPrestamos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({
        isbn: '',
        titulo: '',
        nombre_usuario: ''
    });
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (isAdmin) {
            fetchPrestamos();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (isAdmin) {
            aplicarFiltros();
        }
    }, [filtros, prestamos, isAdmin]);

    if (!isAdmin) {
        return <Navigate to="/dashboard" />;
    }

    const fetchPrestamos = async () => {
        setLoading(true);
        try {
            const data = await ReporteService.getAllPrestamos();
            if (data.success) {
                setPrestamos(data.data);
                setFilteredPrestamos(data.data);
            }
        } catch (error) {
            console.error('Error fetching prestamos:', error);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let resultados = [...prestamos];

        if (filtros.isbn.trim()) {
            resultados = resultados.filter(p => 
                p.libro?.isbn?.toLowerCase().includes(filtros.isbn.toLowerCase())
            );
        }

        if (filtros.titulo.trim()) {
            resultados = resultados.filter(p => 
                p.libro?.titulo?.toLowerCase().includes(filtros.titulo.toLowerCase())
            );
        }

        if (filtros.nombre_usuario.trim()) {
            resultados = resultados.filter(p => 
                p.solicitante?.nombre?.toLowerCase().includes(filtros.nombre_usuario.toLowerCase())
            );
        }

        setFilteredPrestamos(resultados);
    };

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            isbn: '',
            titulo: '',
            nombre_usuario: ''
        });
    };

    const handleExportCSV = () => {
        ReporteService.exportToCSV(filteredPrestamos);
    };

    const getEstadoClase = (estado) => {
        switch (estado) {
            case 'ACTIVO': return 'estado-activo';
            case 'DEVUELTO': return 'estado-devuelto';
            case 'VENCIDO': return 'estado-vencido';
            case 'CANCELADO': return 'estado-cancelado';
            default: return '';
        }
    };

    return (
        <div className="reportes-module">
            <div className="module-header">
                <div className="header-left">
                    <h2>Reportes de Préstamos</h2>
                    <p className="subtitle">Consulta y exporta el historial de préstamos</p>
                </div>
                <div className="header-right">
                    <button className="btn-export" onClick={handleExportCSV}>
                        Exportar a CSV
                    </button>
                </div>
            </div>

            <div className="filtros-container">
                <h3>Filtros de búsqueda</h3>
                <div className="filtros-grid">
                    <div className="filtro-group">
                        <label>ISBN</label>
                        <input
                            type="text"
                            name="isbn"
                            value={filtros.isbn}
                            onChange={handleFiltroChange}
                            placeholder="Buscar por ISBN..."
                        />
                    </div>
                    <div className="filtro-group">
                        <label>Título del Libro</label>
                        <input
                            type="text"
                            name="titulo"
                            value={filtros.titulo}
                            onChange={handleFiltroChange}
                            placeholder="Buscar por título..."
                        />
                    </div>
                    <div className="filtro-group">
                        <label>Nombre de Usuario</label>
                        <input
                            type="text"
                            name="nombre_usuario"
                            value={filtros.nombre_usuario}
                            onChange={handleFiltroChange}
                            placeholder="Buscar por nombre..."
                        />
                    </div>
                    <div className="filtro-actions">
                        <button className="btn-clear" onClick={limpiarFiltros}>
                            ✖ Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="resultados-info">
                <p>
                    Mostrando <strong>{filteredPrestamos.length}</strong> de <strong>{prestamos.length}</strong> préstamos
                </p>
            </div>

            <div className="table-container">
                <table className="reportes-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Solicitante</th>
                            <th>DNI</th>
                            <th>Libro</th>
                            <th>ISBN</th>
                            <th>Fecha Préstamo</th>
                            <th>Fecha Devolución</th>
                            <th>Estado</th>
                            <th>Gestionado por</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="loading-cell">Cargando reportes...</td>
                            </tr>
                        ) : filteredPrestamos.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="empty-cell">
                                    No se encontraron préstamos
                                </td>
                            </tr>
                        ) : (
                            filteredPrestamos.map((prestamo) => (
                                <tr key={prestamo.prestamo_id}>
                                    <td>{prestamo.prestamo_id}</td>
                                    <td><strong>{prestamo.solicitante?.nombre || 'N/A'}</strong></td>
                                    <td>{prestamo.solicitante?.dni || 'N/A'}</td>
                                    <td><strong>{prestamo.libro?.titulo || 'N/A'}</strong></td>
                                    <td>{prestamo.libro?.isbn || 'N/A'}</td>
                                    <td>{prestamo.fecha_prestamo?.split(' ')[0]}</td>
                                    <td>
                                        {prestamo.fecha_dev_esperada}
                                        {prestamo.fecha_dev_real && (
                                            <span className="devuelto-fecha">
                                                <br/>Devuelto: {prestamo.fecha_dev_real.split(' ')[0]}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`estado-badge ${getEstadoClase(prestamo.estado)}`}>
                                            {prestamo.estado}
                                        </span>
                                    </td>
                                    <td>{prestamo.gestor?.nombre || 'N/A'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && filteredPrestamos.length > 0 && (
                <div className="resumen-stats">
                    <h4>📈 Resumen del reporte</h4>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-value">{filteredPrestamos.filter(p => p.estado === 'ACTIVO').length}</span>
                            <span className="stat-label">Activos</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{filteredPrestamos.filter(p => p.estado === 'DEVUELTO').length}</span>
                            <span className="stat-label">Devueltos</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{filteredPrestamos.filter(p => p.estado === 'VENCIDO').length}</span>
                            <span className="stat-label">Vencidos</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{filteredPrestamos.filter(p => p.estado === 'CANCELADO').length}</span>
                            <span className="stat-label">Cancelados</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportesList;