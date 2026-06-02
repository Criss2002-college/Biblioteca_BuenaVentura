import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const PrivateRoute = ({ children, roles = [] }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (roles.length > 0 && !roles.includes(user?.rol)) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default PrivateRoute;