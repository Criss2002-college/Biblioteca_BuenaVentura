import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import './LibroList.css';

const LibrosList = () => {
    const [libros, setLibros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { getToken, isGestorOrAdmin } = useAuth();

    useEffect(() => {
        fetchLibros();
    }, []);

    const fetchLibros = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/libros/', {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setLibros(response.data.data);
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
        
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/libros/buscar?q=${searchTerm}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setLibros(response.data.data);
        } catch (error) {
            console.error('Error searching libros:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Cargando libros...</div>;

    return (
        <div className="libros-container">
            <div className="libros-header">
                <h2>Catálogo de Libros</h2>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Buscar por título o ISBN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch}>Buscar</button>
                </div>
            </div>

            <div className="libros-grid">
                {libros.length === 0 ? (
                    <p>No hay libros disponibles</p>
                ) : (
                    libros.map(libro => (
                        <div key={libro.libro_id} className="libro-card">
                            <div className="libro-icon">📚</div>
                            <h3>{libro.titulo}</h3>
                            <p><strong>Autor:</strong> {libro.autor}</p>
                            <p><strong>Editorial:</strong> {libro.editorial || 'N/A'}</p>
                            <p><strong>Año:</strong> {libro.anio_publicacion}</p>
                            <p><strong>ISBN:</strong> {libro.isbn}</p>
                            <p className={`disponibilidad ${libro.cantidad_disponible > 0 ? 'disponible' : 'no-disponible'}`}>
                                {libro.cantidad_disponible > 0 ? 'Disponible' : 'No disponible'}
                            </p>
                            {isGestorOrAdmin && (
                                <div className="acciones">
                                    <button className="edit-btn">Editar</button>
                                    <button className="delete-btn">Eliminar</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LibrosList;