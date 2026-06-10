import React,  { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth  } from './context/authContext';
import Login from './components/login/Login';
import Dashboard from './components/dashboard/Dashboard';
import LibrosList from './components/libros/LibrosList';
import UsuariosList from './components/Usuarios/UsuariosList';
import PrestamosList from './components/Prestamos/PrestamosList';
import ReportesList from './components/Reportes/ReportesList';
import PrivateRoute from './components/commons/PrivateRoute';
import './App.css';

const NavigationGuard = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
    
        if (isAuthenticated && location.pathname === '/login') {
            navigate('/dashboard', { replace: true });
        }
        
        const handlePopState = () => {
            if (!isAuthenticated && location.pathname !== '/login') {
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isAuthenticated, location, navigate]);

    return children;
};


function App() {
    return (
        <Router>
            <AuthProvider>
                <NavigationGuard>
                <Routes>
           
                    <Route path="/login" element={<Login />} />
                    
               
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/libros" element={
                        <PrivateRoute>
                            <LibrosList />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/usuarios" element={
                        <PrivateRoute roles={['Administrador', 'Gestor']}>
                            <UsuariosList />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/prestamos" element={
                        <PrivateRoute>
                            <PrestamosList />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/reportes" element={
                        <PrivateRoute roles={['Administrador']}>
                            <ReportesList />
                        </PrivateRoute>
                    } />
                    
           
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
                </NavigationGuard>
            </AuthProvider>
        </Router>
    );
}

export default App;