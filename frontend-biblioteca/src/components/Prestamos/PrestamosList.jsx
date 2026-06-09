import React, { useState, useEffect } from 'react';
import { PrestamoService } from './PrestamosService';
import { useAuth } from '../../context/authContext';
import PrestamoForm from './PrestamoForm';
import './PrestamosList.css';

const PrestamosList = () => {
    const [prestamos, setPrestamos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('todos');
    const { isAdmin, isGestorOrAdmin, user, isLector } = useAuth();

    useEffect(() => {
        fetchPrestamos();
    }, [filter]);

    const fetchPrestamos = async () => {
    setLoading(true);
    try {
        let data;
        
        // Si es LECTOR, usar su ID del token
        if (isLector) {
            console.log('Lector detectado, usuario:', user);
  
            const usuarioId = user?.usuario_id || user?.id;
            if (usuarioId) {
                data = await PrestamoService.getByUsuario(usuarioId);
                console.log('Préstamos del lector:', data);
            } else {
                console.error('No se encontró ID de usuario');
                data = { success: true, data: [] };
            }
        } else {
            if (filter === 'activos') {
                data = await PrestamoService.getActivos();
            } else if (filter === 'vencidos') {
                data = await PrestamoService.getVencidos();
            } else {
                data = await PrestamoService.getAll();
            }
        }
        
        if (data.success) {
            setPrestamos(data.data);
        } else {
            console.error('Error en respuesta:', data.error);
        }
    } catch (error) {
        console.error('Error fetching prestamos:', error);
    } finally {
        setLoading(false);
    }
};

    const handleDevolver = async (id, libroTitulo, solicitante) => {
        if (window.confirm(`¿Registrar devolución del libro "${libroTitulo}" a ${solicitante}?`)) {
            try {
                const data = await PrestamoService.devolver(id);
                if (data.success) {
                    alert(data.message);
                    fetchPrestamos();
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert('Error al registrar devolución');
            }
        }
    };

    const handleCancelar = async (id, libroTitulo) => {
        if (!isAdmin) {
            alert('Solo los administradores pueden cancelar préstamos');
            return;
        }
        
        if (window.confirm(`¿Cancelar el préstamo del libro "${libroTitulo}"? Esta acción no se puede deshacer.`)) {
            try {
                const data = await PrestamoService.cancelar(id);
                if (data.success) {
                    alert(data.message);
                    fetchPrestamos();
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert('Error al cancelar el préstamo');
            }
        }
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

    const isVencido = (fechaDevEsperada) => {
        const hoy = new Date();
        const fechaDev = new Date(fechaDevEsperada);
        return fechaDev < hoy;
    };

    return (
        <div className="prestamos-module">
            <div className="module-header">
                <div className="header-left">
                    <h2>🔄 {isLector ? 'Mis Préstamos' : 'Gestión de Préstamos'}</h2>
                    <p className="subtitle">
                        {isLector 
                            ? 'Historial de tus préstamos de libros' 
                            : 'Administrar préstamos de libros'}
                    </p>
                </div>
                <div className="header-right">
                    {!isLector && (
                        <>
                            <div className="filter-buttons">
                                <button 
                                    className={`filter-btn ${filter === 'todos' ? 'active' : ''}`}
                                    onClick={() => setFilter('todos')}
                                >
                                    Todos
                                </button>
                                <button 
                                    className={`filter-btn ${filter === 'activos' ? 'active' : ''}`}
                                    onClick={() => setFilter('activos')}
                                >
                                    Activos
                                </button>
                                <button 
                                    className={`filter-btn ${filter === 'vencidos' ? 'active' : ''}`}
                                    onClick={() => setFilter('vencidos')}
                                >
                                    Vencidos
                                </button>
                            </div>
                            {isGestorOrAdmin && (
                                <button className="btn-primary" onClick={() => setShowForm(true)}>
                                    + Nuevo Préstamo
                                </button>
                            )}
                        </>
                    )}
                    {isLector && (
                        <button className="refresh-btn" onClick={fetchPrestamos}>
                            Actualizar
                        </button>
                    )}
                </div>
            </div>

            <div className="table-container">
                <table className="prestamos-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Solicitante</th>
                            <th>Libro</th>
                            <th>Fecha Préstamo</th>
                            <th>Fecha Devolución</th>
                            <th>Estado</th>
                            {!isLector && <th>Gestión por</th>}
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={!isLector ? 8 : 7} className="loading-cell">
                                    Cargando préstamos...
                                </td>
                            </tr>
                        ) : prestamos.length === 0 ? (
                            <tr>
                                <td colSpan={!isLector ? 8 : 7} className="empty-cell">
                                    {isLector 
                                        ? 'No tienes préstamos registrados' 
                                        : 'No hay préstamos registrados'}
                                </td>
                            </tr>
                        ) : (
                            prestamos.map((prestamo) => {
                                const vencido = prestamo.estado === 'ACTIVO' && isVencido(prestamo.fecha_dev_esperada);
                                
                                return (
                                    <tr key={prestamo.prestamo_id} className={vencido ? 'vencido-row' : ''}>
                                        <td>{prestamo.prestamo_id}</td>
                                        <td>
                                            <strong>{prestamo.solicitante?.nombre || 'N/A'}</strong>
                                            <br />
                                            <small>ID: {prestamo.solicitante?.id}</small>
                                        </td>
                                        <td>
                                            <strong>{prestamo.libro?.titulo || 'N/A'}</strong>
                                            <br />
                                            <small>ISBN: {prestamo.libro?.isbn}</small>
                                        </td>
                                        <td>{prestamo.fecha_prestamo?.split(' ')[0]}</td>
                                        <td className={vencido ? 'fecha-vencida' : ''}>
                                            {prestamo.fecha_dev_esperada}
                                            {vencido && <span className="vencido-badge">VENCIDO</span>}
                                        </td>
                                        <td>
                                            <span className={`estado-badge ${getEstadoClase(prestamo.estado)}`}>
                                                {prestamo.estado}
                                            </span>
                                        </td>
                                        {!isLector && (
                                            <td>
                                                <span className="gestion-nombre">
                                                    {prestamo.gestor?.nombre || 'N/A'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="actions-cell">
                                            {prestamo.estado === 'ACTIVO' && isGestorOrAdmin && (
                                                <button 
                                                    className="action-btn devolver" 
                                                    onClick={() => handleDevolver(
                                                        prestamo.prestamo_id, 
                                                        prestamo.libro?.titulo,
                                                        prestamo.solicitante?.nombre
                                                    )}
                                                    title="Registrar devolución"
                                                >
                                                    Devolver
                                                </button>
                                            )}
                                            {prestamo.estado === 'ACTIVO' && isAdmin && (
                                                <button 
                                                    className="action-btn cancelar" 
                                                    onClick={() => handleCancelar(prestamo.prestamo_id, prestamo.libro?.titulo)}
                                                    title="Cancelar préstamo"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                            {prestamo.estado === 'DEVUELTO' && (
                                                <span className="view-only">✓ Completado</span>
                                            )}
                                            {prestamo.estado === 'CANCELADO' && (
                                                <span className="view-only">✗ Cancelado</span>
                                            )}
                                            {isLector && prestamo.estado === 'ACTIVO' && (
                                                <span className="view-only">Pendiente devolución</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <PrestamoForm 
                    onClose={() => {
                        setShowForm(false);
                        fetchPrestamos();
                    }}
                />
            )}
        </div>
    );
};

export default PrestamosList;