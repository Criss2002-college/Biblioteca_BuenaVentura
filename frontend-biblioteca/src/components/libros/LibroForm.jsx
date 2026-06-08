import React, { useState, useEffect } from 'react';
import { LibroService } from './LibroService';
import { useAuth } from '../../context/authContext';
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
            const [autoresRes, editorialesRes] = await Promise.all([
                fetch('http://localhost:5000/api/autores/', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/editoriales/', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            const autoresData = await autoresRes.json();
            const editorialesData = await editorialesRes.json();
            
            if (autoresData.success) setAutores(autoresData.data);
            if (editorialesData.success) setEditoriales(editorialesData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let result;
            if (libro) {
                result = await LibroService.update(libro.libro_id, formData);
            } else {
                result = await LibroService.create(formData);
            }

            if (result.success) {
                alert(result.message);
                onClose();
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError('Error al guardar el libro');
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
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Título *</label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                required
                                placeholder="Ingrese el título"
                            />
                        </div>

                        <div className="form-group">
                            <label>Autor *</label>
                            <select
                                name="autor_id"
                                value={formData.autor_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Seleccione un autor</option>
                                {autores.map(autor => (
                                    <option key={autor.autor_id} value={autor.autor_id}>
                                        {autor.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Editorial</label>
                            <select
                                name="editorial_id"
                                value={formData.editorial_id}
                                onChange={handleChange}
                            >
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
                                placeholder="Ej: 2020"
                            />
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
                                required
                                placeholder="Ej: 9788437604947"
                            />
                        </div>

                        <div className="form-group">
                            <label>Cantidad Disponible</label>
                            <input
                                type="number"
                                name="cantidad_disponible"
                                value={formData.cantidad_disponible}
                                onChange={handleChange}
                                min="0"
                            />
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