from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import Usuario
from app import db
from datetime import timedelta

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():
    """Endpoint de autenticación"""
    data = request.get_json()
    
    if not data or not data.get('correo') or not data.get('password'):
        return jsonify({'error': 'Correo y contraseña requeridos'}), 400
    
    usuario = Usuario.query.filter_by(correo=data['correo']).first()
    
    if not usuario or not usuario.check_password(data['password']):
        return jsonify({'error': 'Credenciales inválidas'}), 401
    
    # Crear token de acceso
    access_token = create_access_token(
        identity={
            'usuario_id': usuario.usuario_id,
            'nombre': f"{usuario.nombre} {usuario.apellidos}",
            'correo': usuario.correo,
            'rol_id': usuario.rol_id
        },
        expires_delta=timedelta(hours=8)
    )
    
    return jsonify({
        'access_token': access_token,
        'usuario': {
            'id': usuario.usuario_id,
            'nombre': f"{usuario.nombre} {usuario.apellidos}",
            'correo': usuario.correo,
            'rol': usuario.rol.description,
            'dni': usuario.dni
        }
    }), 200

@bp.route('/perfil', methods=['GET'])
@jwt_required()
def perfil():
    """Obtener perfil del usuario autenticado"""
    current_user = get_jwt_identity()
    return jsonify({'usuario': current_user}), 200