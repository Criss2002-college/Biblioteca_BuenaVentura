import React from 'react';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                Biblioteca BuenaVentura
            </div>
            <div className="navbar-user">
                <span>{user?.nombre}</span>
                <span className="role-badge">{user?.rol}</span>
                <button onClick={handleLogout} className="logout-nav-btn">
                    Cerrar Sesión
                </button>
            </div>
        </nav>
    );
};

export default Navbar;