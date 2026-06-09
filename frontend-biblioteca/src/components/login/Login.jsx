import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        correo: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Limpiar error cuando el usuario escribe
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const result = await login(formData.correo, formData.password);
            
            if (result.success) {
                navigate('/dashboard');
            } else {

                if (result.inactive) {
                    setError('Tu cuenta ha sido desactivada. Por favor contacta al administrador.');
                } else {
                    setError(result.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
                }
            }
        } catch (error) {
            setError('Error de conexión. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Biblioteca BuenaVentura</h1>
                    <p>Bienvenido inicia sesión</p>
                </div>
                
                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="correo">Correo electrónico</label>
                        <input
                            type="email"
                            id="correo"
                            name="correo"
                            value={formData.correo}
                            onChange={handleChange}
                            required
                            placeholder="admin@biblioteca.com"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <hr />
                    <p style={{ fontSize: '11px', color: '#dc2626' }}>
                        Si tu cuenta está desactivada, no podrás acceder
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;