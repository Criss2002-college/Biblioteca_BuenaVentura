import React, { useState, useEffect } from 'react';
import { LibroService } from './LibroService';
import { useAuth } from '../../context/authContext';
import LibroForm from './LibroForm';
import './LibroList.css';

const LibrosList = () => {
    const [libros, setLibros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingLibro, setEditingLibro] = useState(null);
    const [showInactivos, setShowInactivos] = useState(false);
    const { isAdmin, isGestorOrAdmin } = useAuth();

    useEffect(() => {
        fetchLibros();
    }, [showInactivos]);

    const fetchLibros = async () => {
        setLoading(true);
        try {
            let data;
            if (showInactivos && isAdmin) {
                data = await LibroService.getInactivos();
            } else {
                data = await LibroService.getAll();
            }
            if (data.success) {
                setLibros(data.data);
            }
        } catch (error) {
            console.error('Error fetching libros:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            fetchLibros();
            return;
        }
        setLoading(true);
        try {
            const data = await LibroService.search(searchTerm);
            if (data.success) {
                setLibros(data.data);
            }
        } catch (error) {
            console.error('Error en busqueda:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, titulo) => {
        if (window.confirm(`¿Estás seguro de desactivar el libro "${titulo}"?`)) {
            try {
                const data = await LibroService.delete(id);
                if (data.success) {
                    alert(data.message);
                    fetchLibros();
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert('Error al desactivar el libro');
            }
        }
    };

    const handleReactivate = async (id, titulo) => {
        if (window.confirm(`¿Reactivar el libro "${titulo}"?`)) {
            try {
                const data = await LibroService.reactivate(id);
                if (data.success) {
                    alert(data.message);
                    fetchLibros();
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert('Error al reactivar el libro');
            }
        }
    };

    const handleEdit = (libro) => {
        setEditingLibro(libro);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingLibro(null);
        fetchLibros();
    };

    return (
        <div className="libros-module">
            <div className="module-header">
                <div className="header-left">
                    <h2>Gestión de Libros</h2>
                    <p className="subtitle">Administrar catálogo de libros</p>
                </div>
                <div className="header-right">
                    {isAdmin && (
                        <button 
                            className={`toggle-inactivos ${showInactivos ? 'active' : ''}`}
                            onClick={() => setShowInactivos(!showInactivos)}
                        >
                            {showInactivos ? 'Ver Activos' : 'Ver Inactivos'}
                        </button>
                    )}
                    {isGestorOrAdmin && (
                        <button className="btn-primary" onClick={() => setShowForm(true)}>
                            + Nuevo Libro
                        </button>
                    )}
                </div>
            </div>

            <div className="search-bar">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        placeholder="Buscar por título o ISBN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch}>Buscar</button>
                    <button className="clear-btn" onClick={() => {
                        setSearchTerm('');
                        fetchLibros();
                    }}>✖ Limpiar</button>
                </div>
            </div>

            <div className="table-container">
                <table className="libros-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Título</th>
                            <th>Autor</th>
                            <th>Editorial</th>
                            <th>Año</th>
                            <th>ISBN</th>
                            <th>Disponibles</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="loading-cell">Cargando libros...</td>
                            </tr>
                        ) : libros.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="empty-cell">
                                    {showInactivos ? 'No hay libros inactivos' : 'No hay libros disponibles'}
                                </td>
                            </tr>
                        ) : (
                            libros.map((libro) => (
                                <tr key={libro.libro_id} className={!libro.activo ? 'inactive-row' : ''}>
                                    <td>{libro.libro_id}</td>
                                    <td className="title-cell">{libro.titulo}</td>
                                    <td>{libro.autor}</td>
                                    <td>{libro.editorial || '-'}</td>
                                    <td>{libro.anio_publicacion || '-'}</td>
                                    <td>{libro.isbn}</td>
                                    <td>
                                        <span className={`availability ${libro.cantidad_disponible > 0 ? 'available' : 'unavailable'}`}>
                                            {libro.cantidad_disponible}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status ${libro.activo ? 'active' : 'inactive'}`}>
                                            {libro.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        {isGestorOrAdmin && libro.activo && (
                                            <>
                                                <button 
                                                    className="action-btn edit" 
                                                    onClick={() => handleEdit(libro)}
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="action-btn delete" 
                                                    onClick={() => handleDelete(libro.libro_id, libro.titulo)}
                                                    title="Desactivar"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                        {isAdmin && !libro.activo && (
                                            <button 
                                                className="action-btn reactivate" 
                                                onClick={() => handleReactivate(libro.libro_id, libro.titulo)}
                                                title="Reactivar"
                                            >
                                                🔄 Reactivar
                                            </button>
                                        )}
                                        {!isGestorOrAdmin && (
                                            <span className="view-only">Solo lectura</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <LibroForm 
                    libro={editingLibro}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
};

export default LibrosList;