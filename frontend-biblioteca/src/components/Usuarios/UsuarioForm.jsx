import React, { useState, useEffect } from 'react';
import { UsuarioService } from './UsuarioService';
import { useAuth } from '../../context/authContext';
import './UsuarioForm.css';

const UsuarioForm = ({ usuario, onClose }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        dni: '',
        correo: '',
        telefono: '',
        rol_id: 3,
        password: ''
    });
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const { isAdmin } = useAuth();

    useEffect(() => {
        fetchRoles();
        if (usuario) {
            setFormData({
                nombre: usuario.nombre || '',
                apellidos: usuario.apellidos || '',
                dni: usuario.dni || '',
                correo: usuario.correo || '',
                telefono: usuario.telefono || '',
                rol_id: usuario.rol_id || 3,
                password: ''
            });
        }
    }, [usuario]);

    const fetchRoles = async () => {
        try {
            const data = await UsuarioService.getRoles();
            if (data.success) {
                setRoles(data.data);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.nombre?.trim()) {
            errors.nombre = 'El nombre es obligatorio';
        }
        
        if (!formData.apellidos?.trim()) {
            errors.apellidos = 'Los apellidos son obligatorios';
        }
        
        // Validación de DNI
        if (!formData.dni) {
            errors.dni = 'El DNI es obligatorio';
        } else {
            const dniStr = String(formData.dni).trim();
            if (!/^\d+$/.test(dniStr)) {
                errors.dni = 'El DNI solo debe contener números';
            } else if (dniStr.length !== 13) {
                errors.dni = 'El DNI debe tener 13 ígitos';
            }
        }
        
        // Validación de correo
        if (formData.correo && formData.correo.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.correo.trim())) {
                errors.correo = 'Ingrese un correo electrónico válido';
            }
        }
        
        // Validación de contraseña
        if (!usuario && (!formData.password || !formData.password.trim())) {
            errors.password = 'La contraseña es obligatoria para nuevos usuarios';
        } else if (formData.password && formData.password.trim().length < 4) {
            errors.password = 'La contraseña debe tener al menos 4 caracteres';
        }
        
        if (!formData.rol_id) {
            errors.rol_id = 'Debe seleccionar un rol';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Para DNI, solo permitir números
        if (name === 'dni') {
            const numbersOnly = value.replace(/\D/g, '');
            setFormData(prev => ({ ...prev, [name]: numbersOnly }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    setLoading(true);
    setError(null);

    try {
        const dataToSend = {
            nombre: formData.nombre.trim(),
            apellidos: formData.apellidos.trim(),
            dni: parseInt(formData.dni, 10),
            correo: formData.correo?.trim() || null,
            telefono: formData.telefono ? parseInt(formData.telefono, 10) : null,
            rol_id: parseInt(formData.rol_id, 10)
        };
        
        if (formData.password && formData.password.trim()) {
            dataToSend.password = formData.password.trim();
        }
        
        console.log('Enviando usuario:', dataToSend);
        
        let result;
        if (usuario) {
            result = await UsuarioService.update(usuario.usuario_id, dataToSend);
        } else {
            result = await UsuarioService.create(dataToSend);
        }

        if (result.success) {
            alert(result.message);
            onClose();
        } else {
            setError(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        setError(error.response?.data?.error || 'Error al guardar el usuario');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{usuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">❌ {error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className={fieldErrors.nombre ? 'error' : ''}
                            />
                            {fieldErrors.nombre && <span className="field-error">{fieldErrors.nombre}</span>}
                        </div>

                        <div className="form-group">
                            <label>Apellidos *</label>
                            <input
                                type="text"
                                name="apellidos"
                                value={formData.apellidos}
                                onChange={handleChange}
                                className={fieldErrors.apellidos ? 'error' : ''}
                            />
                            {fieldErrors.apellidos && <span className="field-error">{fieldErrors.apellidos}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>DNI *</label>
                            <input
                                type="text"
                                name="dni"
                                value={formData.dni}
                                onChange={handleChange}
                                placeholder="12345678"
                                maxLength="13"
                                className={fieldErrors.dni ? 'error' : ''}
                            />
                            {fieldErrors.dni && <span className="field-error">{fieldErrors.dni}</span>}
                        </div>

                        <div className="form-group">
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                placeholder="usuario@ejemplo.com"
                                className={fieldErrors.correo ? 'error' : ''}
                            />
                            {fieldErrors.correo && <span className="field-error">{fieldErrors.correo}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="12345678"
                            />
                        </div>

                        <div className="form-group">
                            <label>Rol *</label>
                            <select
                                name="rol_id"
                                value={formData.rol_id}
                                onChange={handleChange}
                                className={fieldErrors.rol_id ? 'error' : ''}
                                disabled={usuario && !isAdmin}
                            >
                                {roles.map(rol => (
                                    <option key={rol.rol_id} value={rol.rol_id}>
                                        {rol.nombre}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.rol_id && <span className="field-error">{fieldErrors.rol_id}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group full-width">
                            <label>{usuario ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className={fieldErrors.password ? 'error' : ''}
                            />
                            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Guardando...' : (usuario ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsuarioForm;