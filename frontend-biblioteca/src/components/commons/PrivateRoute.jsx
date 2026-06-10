import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const PrivateRoute = ({ children, roles = [] }) => {
     const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div className="loading-screen">Verificando sesión...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles.length > 0 && !roles.includes(user?.rol)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PrivateRoute;