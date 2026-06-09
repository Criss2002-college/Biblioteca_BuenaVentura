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
        
        // Verificar si el usuario está activo
        if (data.usuario && data.usuario.activo === false) {
            return { 
                success: false, 
                error: 'Tu cuenta ha sido desactivada',
                inactive: true 
            };
        }
        
        setUser(data.usuario);
        return { success: true };
    } catch (error) {
        // Verificar si es error por cuenta inactiva
        if (error.response?.data?.inactive_account) {
            setError('Cuenta desactivada');
            return { 
                success: false, 
                error: error.response.data.error,
                inactive: true 
            };
        }
        setError(error.response?.data?.error || 'Error al iniciar sesión');
        return { success: false, error: error.response?.data?.error };
    }
};

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const getToken = () => {
        return localStorage.getItem('token');
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        getToken,
        isAuthenticated: authService.isAuthenticated(),
        isAdmin: user?.rol === 'Administrador',
        isGestor: user?.rol === 'Gestor',
        isLector: user?.rol === 'Lector',
        isGestorOrAdmin: user?.rol === 'Administrador' || user?.rol === 'Gestor',
        canManage: user?.rol === 'Administrador' || user?.rol === 'Gestor',
        canView: true 
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};