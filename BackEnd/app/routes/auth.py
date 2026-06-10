from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import Usuario
from app import db
from datetime import timedelta
import json

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():

    data = request.get_json()
    
    if not data or not data.get('correo') or not data.get('password'):
        return jsonify({'error': 'Correo y contraseña requeridos'}), 400
    
    usuario = Usuario.query.filter_by(correo=data['correo']).first()
    
    if not usuario:
        return jsonify({'error': 'Credenciales inválidas'}), 401
    

    if not usuario.activo:
        return jsonify({
            'error': 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.',
            'inactive_account': True
        }), 401
    
    if not usuario.check_password(data['password']):
        return jsonify({'error': 'Credenciales inválidas'}), 401
    
    user_identity = json.dumps({
        'usuario_id': usuario.usuario_id,
        'nombre': f"{usuario.nombre} {usuario.apellidos}",
        'correo': usuario.correo,
        'rol_id': usuario.rol_id
    })
    
    access_token = create_access_token(
        identity=user_identity,
        expires_delta=timedelta(hours=8)
    )
    
    return jsonify({
        'access_token': access_token,
        'usuario': {
            'id': usuario.usuario_id,
            'nombre': f"{usuario.nombre} {usuario.apellidos}",
            'correo': usuario.correo,
            'rol': usuario.rol.description,
            'dni': usuario.dni,
            'activo': usuario.activo
        }
    }), 200

@bp.route('/perfil', methods=['GET'])
@jwt_required()
def perfil():

    current_user_identity = get_jwt_identity()
    # Decodificar el JSON string
    current_user = json.loads(current_user_identity)
    return jsonify({'usuario': current_user}), 200

@bp.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'service': 'Biblioteca BuenaVentura API',
        'version': '1.0.0'
    }), 200