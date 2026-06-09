import React, { useState, useEffect } from 'react';
import { UsuarioService } from './UsuarioService';
import { useAuth } from '../../context/authContext';
import UsuarioForm from './UsuarioForm';
import './UsuariosList.css';

const UsuariosList = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState(null);
    const [showInactivos, setShowInactivos] = useState(false);
    const { user, isAdmin, isGestorOrAdmin } = useAuth();

    useEffect(() => {
        fetchUsuarios();
    }, [showInactivos]);

    const estaActivo = (usuario) => {
        return usuario.activo === true || usuario.activo === 1 || usuario.activo === '1' || usuario.activo === 'true';
    };

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            let data;
            if (showInactivos && isAdmin) {
                data = await UsuarioService.getInactivos();
            } else {
                data = await UsuarioService.getAll();
            }
            if (data.success) {
                setUsuarios(data.data);
            }
        } catch (error) {
            console.error('Error fetching usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            fetchUsuarios();
            return;
        }
        const filtered = usuarios.filter(u =>
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.dni.toString().includes(searchTerm) ||
            (u.correo && u.correo.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setUsuarios(filtered);
    };

    const handleDelete = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de desactivar al usuario "${nombre}"?`)) {
            try {
                const data = await UsuarioService.delete(id);
                if (data.success) {
                    alert(data.message);
                    fetchUsuarios();
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert('Error al desactivar el usuario');
            }
        }
    };

    const handleReactivate = async (id, nombre) => {
        if (window.confirm(`¿Reactivar al usuario "${nombre}"?`)) {
            try {
                const data = await UsuarioService.reactivate(id);
                if (data.success) {
                    alert(data.message);
                    fetchUsuarios();
                } else {
                    alert(data.error);
                }
            } catch (error) {
                alert('Error al reactivar el usuario');
            }
        }
    };

    const handleEdit = (usuario) => {
        setEditingUsuario(usuario);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingUsuario(null);
        fetchUsuarios();
    };

    const getRolNombre = (rolId) => {
        const roles = { 1: 'Gestor', 2: 'Administrador', 3: 'Lector' };
        return roles[rolId] || 'Desconocido';
    };

    return (
        <div className="usuarios-module">
            <div className="module-header">
                <div className="header-left">
                    <h2>Gestión de Usuarios</h2>
                    <p className="subtitle">Administrar usuarios del sistema</p>
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
                            + Nuevo Usuario
                        </button>
                    )}
                </div>
            </div>

            <div className="search-bar">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellidos, DNI o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch}>Buscar</button>
                    <button className="clear-btn" onClick={() => {
                        setSearchTerm('');
                        fetchUsuarios();
                    }}>✖ Limpiar</button>
                </div>
            </div>

            <div className="table-container">
                <table className="usuarios-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Apellidos</th>
                            <th>DNI</th>
                            <th>Correo</th>
                            <th>Teléfono</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="loading-cell">Cargando usuarios...</td>
                            </tr>
                        ) : usuarios.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="empty-cell">
                                    {showInactivos ? 'No hay usuarios inactivos' : 'No hay usuarios registrados'}
                                </td>
                            </tr>
                        ) : (
                            usuarios.map((usuario) => {
                                const activo = estaActivo(usuario);
                                return (
                                    <tr key={usuario.usuario_id} className={!activo ? 'inactive-row' : ''}>
                                        <td>{usuario.usuario_id}</td>
                                        <td className="name-cell">{usuario.nombre}</td>
                                        <td>{usuario.apellidos}</td>
                                        <td>{usuario.dni}</td>
                                        <td>{usuario.correo || '-'}</td>
                                        <td>{usuario.telefono || '-'}</td>
                                        <td>
                                            <span className={`rol-badge rol-${usuario.rol_id}`}>
                                                {usuario.rol}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status ${activo ? 'active' : 'inactive'}`}>
                                                {activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            {/* Usuarios ACTIVOS: Gestor/Admin pueden editar */}
                                            {activo && isGestorOrAdmin && (
                                                <>
                                                    <button 
                                                        className="action-btn edit" 
                                                        onClick={() => handleEdit(usuario)}
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {/* Solo Admin puede eliminar/desactivar */}
                                                    {isAdmin && usuario.usuario_id !== user?.usuario_id && (
                                                        <button 
                                                            className="action-btn delete" 
                                                            onClick={() => handleDelete(usuario.usuario_id, usuario.nombre)}
                                                            title="Desactivar"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {/* Usuarios INACTIVOS: solo Admin puede reactivar */}
                                            {!activo && isAdmin && (
                                                <button 
                                                    className="action-btn reactivate" 
                                                    onClick={() => handleReactivate(usuario.usuario_id, usuario.nombre)}
                                                    title="Reactivar"
                                                >
                                                    🔄 Reactivar
                                                </button>
                                            )}
                                            {/* Usuario LECTOR sin permisos */}
                                            {!isGestorOrAdmin && (
                                                <span className="view-only">Solo lectura</span>
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
                <UsuarioForm 
                    usuario={editingUsuario}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
};

export default UsuariosList;