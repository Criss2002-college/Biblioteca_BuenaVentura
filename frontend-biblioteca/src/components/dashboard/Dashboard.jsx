import React from 'react';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout, isAdmin, isGestorOrAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Biblioteca BuenaVentura</h1>
                <div className="user-info">
                    <span>Hola, {user?.nombre}</span>
                    <span className="role-badge">{user?.rol}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
            
            <div className="dashboard-content">
                <div className="welcome-card">
                    <h2>Bienvenido a tu biblioteca</h2>
                    <p>Has iniciado sesión correctamente.</p>
                </div>
                
                <div className="cards-grid">
                    {isGestorOrAdmin && (
                        <>
                            <div className="card" onClick={() => navigate('/libros')}>
                                <div className="card-icon">📖</div>
                                <h3>Gestión de Libros</h3>
                                <p>Administrar catálogo de libros</p>
                            </div>
                            <div className="card" onClick={() => navigate('/usuarios')}>
                                <div className="card-icon">👥</div>
                                <h3>Gestión de Usuarios</h3>
                                <p>Administrar usuarios del sistema</p>
                            </div>
                            <div className="card" onClick={() => navigate('/prestamos')}>
                                <div className="card-icon">🔄</div>
                                <h3>Préstamos</h3>
                                <p>Gestionar préstamos de libros</p>
                            </div>
                        </>
                    )}
                    
                    {isAdmin && (
                        <div className="card" onClick={() => navigate('/reportes')}>
                            <div className="card-icon">📊</div>
                            <h3>Reportes</h3>
                            <p>Consultar reportes del sistema</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;