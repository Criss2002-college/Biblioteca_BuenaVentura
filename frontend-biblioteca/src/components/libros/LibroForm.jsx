import React, { useState, useEffect } from 'react';
import { LibroService } from './LibroService';
import { useAuth } from '../../context/authContext';
import axios from 'axios';
import './LibroForm.css';

const LibroForm = ({ libro, onClose }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        autor_id: '',
        editorial_id: '',
        anio_publicacion: '',
        cantidad_disponible: 1,
        isbn: ''
    });
    const [autores, setAutores] = useState([]);
    const [editoriales, setEditoriales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const { getToken } = useAuth();

    useEffect(() => {
        fetchAutoresEditoriales();
        if (libro) {
            setFormData({
                titulo: libro.titulo || '',
                autor_id: libro.autor_id || '',
                editorial_id: libro.editorial_id || '',
                anio_publicacion: libro.anio_publicacion || '',
                cantidad_disponible: libro.cantidad_disponible || 1,
                isbn: libro.isbn || ''
            });
        }
    }, [libro]);

    const fetchAutoresEditoriales = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const [autoresRes, editorialesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/autores/', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/editoriales/', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            
            if (autoresRes.data.success) setAutores(autoresRes.data.data);
            if (editorialesRes.data.success) setEditoriales(editorialesRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.titulo?.trim()) {
            errors.titulo = 'El título es obligatorio';
        }
        
        if (!formData.autor_id) {
            errors.autor_id = 'Debe seleccionar un autor';
        }
        
        if (!formData.isbn?.trim()) {
            errors.isbn = 'El ISBN es obligatorio';
        } else {
            const isbnClean = formData.isbn.replace(/\s/g, '');
            if (isbnClean.length < 10 || isbnClean.length > 13) {
                errors.isbn = 'El ISBN debe tener entre 10 y 13 dígitos';
            } else if (!/^\d+$/.test(isbnClean)) {
                errors.isbn = 'El ISBN solo debe contener números';
            }
        }
        
        const cantidad = parseInt(formData.cantidad_disponible);
        if (isNaN(cantidad) || cantidad < 0) {
            errors.cantidad_disponible = 'La cantidad debe ser un número positivo';
        }
        
        const anio = parseInt(formData.anio_publicacion);
        if (formData.anio_publicacion && (isNaN(anio) || anio < 1000 || anio > new Date().getFullYear())) {
            errors.anio_publicacion = `El año debe estar entre 1000 y ${new Date().getFullYear()}`;
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
                titulo: formData.titulo.trim(),
                autor_id: parseInt(formData.autor_id),
                editorial_id: formData.editorial_id ? parseInt(formData.editorial_id) : null,
                anio_publicacion: formData.anio_publicacion ? parseInt(formData.anio_publicacion) : null,
                cantidad_disponible: parseInt(formData.cantidad_disponible) || 1,
                isbn: formData.isbn.toString().replace(/\s/g, '')
            };
            
            console.log('Enviando:', dataToSend);
            
            let result;
            if (libro) {
                result = await LibroService.update(libro.libro_id, dataToSend);
            } else {
                result = await LibroService.create(dataToSend);
            }

            if (result.success) {
                alert(result.message);
                onClose();
            } else {
                setError(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.response?.data?.error || 'Error al guardar el libro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{libro ? 'Editar Libro' : 'Nuevo Libro'}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">X{error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Título *</label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                className={fieldErrors.titulo ? 'error' : ''}
                            />
                            {fieldErrors.titulo && <span className="field-error">{fieldErrors.titulo}</span>}
                        </div>

                        <div className="form-group">
                            <label>Autor *</label>
                            <select
                                name="autor_id"
                                value={formData.autor_id}
                                onChange={handleChange}
                                className={fieldErrors.autor_id ? 'error' : ''}
                            >
                                <option value="">Seleccione un autor</option>
                                {autores.map(autor => (
                                    <option key={autor.autor_id} value={autor.autor_id}>
                                        {autor.nombre}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.autor_id && <span className="field-error">{fieldErrors.autor_id}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Editorial</label>
                            <select name="editorial_id" value={formData.editorial_id} onChange={handleChange}>
                                <option value="">Seleccione una editorial</option>
                                {editoriales.map(ed => (
                                    <option key={ed.editorial_id} value={ed.editorial_id}>
                                        {ed.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Año de Publicación</label>
                            <input
                                type="number"
                                name="anio_publicacion"
                                value={formData.anio_publicacion}
                                onChange={handleChange}
                                className={fieldErrors.anio_publicacion ? 'error' : ''}
                            />
                            {fieldErrors.anio_publicacion && <span className="field-error">{fieldErrors.anio_publicacion}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>ISBN *</label>
                            <input
                                type="text"
                                name="isbn"
                                value={formData.isbn}
                                onChange={handleChange}
                                className={fieldErrors.isbn ? 'error' : ''}
                                placeholder="9788437604947"
                            />
                            {fieldErrors.isbn && <span className="field-error">{fieldErrors.isbn}</span>}
                        </div>

                        <div className="form-group">
                            <label>Cantidad Disponible</label>
                            <input
                                type="number"
                                name="cantidad_disponible"
                                value={formData.cantidad_disponible}
                                onChange={handleChange}
                                min="0"
                                className={fieldErrors.cantidad_disponible ? 'error' : ''}
                            />
                            {fieldErrors.cantidad_disponible && <span className="field-error">{fieldErrors.cantidad_disponible}</span>}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Guardando...' : (libro ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LibroForm;