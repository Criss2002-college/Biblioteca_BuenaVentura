import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Cargar usuario al iniciar
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    const login = async (correo, password) => {
        try {
            setError(null);
            const data = await authService.login(correo, password);
            setUser(data.usuario);
            return { success: true };
        } catch (error) {
            setError(error.error || 'Error al iniciar sesión');
            return { success: false, error: error.error };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: authService.isAuthenticated(),
        isAdmin: user?.rol === 'Administrador',
        isGestorOrAdmin: user?.rol === 'Administrador' || user?.rol === 'Gestor'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};