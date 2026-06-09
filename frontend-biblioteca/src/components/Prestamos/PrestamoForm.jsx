import React, { useState, useEffect } from 'react';
import { PrestamoService } from './PrestamosService';
import { useAuth } from '../../context/authContext';
import { LibroService } from '../libros/LibroService';
import { UsuarioService } from '../Usuarios/UsuarioService';
import './PrestamoForm.css';

const PrestamoForm = ({ onClose }) => {
    const [formData, setFormData] = useState({
        solicitante_id: '',
        libro_id: '',
        dias_prestamo: 5
    });
    const [usuarios, setUsuarios] = useState([]);
    const [libros, setLibros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const { getToken } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usuariosRes, librosRes] = await Promise.all([
                UsuarioService.getAll(),
                LibroService.getAll()
            ]);
            
            if (usuariosRes.success) {
                // solo usuarios activos
                setUsuarios(usuariosRes.data.filter(u => u.activo === true || u.activo === 1));
            }
            if (librosRes.success) {
                // Solo libros con stock
                setLibros(librosRes.data.filter(l => l.activo === true && l.cantidad_disponible > 0));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.solicitante_id) {
            errors.solicitante_id = 'Debe seleccionar un solicitante';
        }
        
        if (!formData.libro_id) {
            errors.libro_id = 'Debe seleccionar un libro';
        }
        
        if (!formData.dias_prestamo || formData.dias_prestamo < 1) {
            errors.dias_prestamo = 'Los días de préstamo deben ser al menos 1';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            const dataToSend = {
                solicitante_id: parseInt(formData.solicitante_id),
                libro_id: parseInt(formData.libro_id),
                dias_prestamo: parseInt(formData.dias_prestamo)
            };
            
            const result = await PrestamoService.create(dataToSend);

            if (result.success) {
                alert(result.message);
                onClose();
            } else {
                setError(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error al crear el préstamo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Nuevo Préstamo</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">❌ {error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Solicitante *</label>
                            <select
                                name="solicitante_id"
                                value={formData.solicitante_id}
                                onChange={handleChange}
                                className={fieldErrors.solicitante_id ? 'error' : ''}
                            >
                                <option value="">Seleccione un usuario</option>
                                {usuarios.map(usuario => (
                                    <option key={usuario.usuario_id} value={usuario.usuario_id}>
                                        {usuario.nombre} {usuario.apellidos} (DNI: {usuario.dni})
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.solicitante_id && <span className="field-error">{fieldErrors.solicitante_id}</span>}
                        </div>

                        <div className="form-group">
                            <label>Libro *</label>
                            <select
                                name="libro_id"
                                value={formData.libro_id}
                                onChange={handleChange}
                                className={fieldErrors.libro_id ? 'error' : ''}
                            >
                                <option value="">Seleccione un libro</option>
                                {libros.map(libro => (
                                    <option key={libro.libro_id} value={libro.libro_id}>
                                        {libro.titulo} - {libro.autor} (Disponibles: {libro.cantidad_disponible})
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.libro_id && <span className="field-error">{fieldErrors.libro_id}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Días de Préstamo *</label>
                            <input
                                type="number"
                                name="dias_prestamo"
                                value={formData.dias_prestamo}
                                onChange={handleChange}
                                min="1"
                                max="30"
                                className={fieldErrors.dias_prestamo ? 'error' : ''}
                            />
                            {fieldErrors.dias_prestamo && <span className="field-error">{fieldErrors.dias_prestamo}</span>}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Creando préstamo...' : 'Crear Préstamo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PrestamoForm;