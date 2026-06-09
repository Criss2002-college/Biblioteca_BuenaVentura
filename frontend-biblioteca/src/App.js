import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import Login from './components/login/Login';
import Dashboard from './components/dashboard/Dashboard';
import LibrosList from './components/libros/LibrosList';
import UsuariosList from './components/Usuarios/UsuariosList';
import PrivateRoute from './components/commons/PrivateRoute';
import './App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
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
                        <PrivateRoute>
                            <UsuariosList />
                        </PrivateRoute>
                    } />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;