from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Usuario, Rol
from app import db
import json

bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')

def obtener_usuario_actual():
    identity = get_jwt_identity()
    return json.loads(identity)

def verificar_permiso_gestion(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id in [1, 2]

def verificar_permiso_actualizacion(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id in [1, 2]

def verificar_permiso_eliminacion(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id == 2

def verificar_es_admin(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id == 2

def verificar_es_gestor(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id == 1

def usuario_a_dict(usuario):
    return {
        'usuario_id': usuario.usuario_id,
        'nombre': usuario.nombre,
        'apellidos': usuario.apellidos,
        'dni': usuario.dni,
        'correo': usuario.correo,
        'telefono': usuario.telefono,
        'rol_id': usuario.rol_id,
        'rol': usuario.rol.description if usuario.rol else None,
        'activo': usuario.activo,  
        'fecha_creacion': usuario.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S') if usuario.fecha_creacion else None
    }

# ==================== ENDPOINTS CRUD ====================

@bp.route('/', methods=['GET'])
@jwt_required()
def obtener_usuarios():
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver la lista de usuarios'
            }), 403
        
        # Solo mostrar usuarios activos
        usuarios = Usuario.query.filter_by(activo=True).all()
        return jsonify({
            'success': True,
            'data': [usuario_a_dict(u) for u in usuarios],
            'total': len(usuarios)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/inactivos', methods=['GET'])
@jwt_required()
def obtener_usuarios_inactivos():
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_es_admin(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver usuarios inactivos'
            }), 403
        
        usuarios = Usuario.query.filter_by(activo=False).all()
        return jsonify({
            'success': True,
            'data': [usuario_a_dict(u) for u in usuarios],
            'total': len(usuarios)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:usuario_id>', methods=['GET'])
@jwt_required()
def obtener_usuario(usuario_id):
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']) and current_user['usuario_id'] != usuario_id:
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver este usuario'
            }), 403
        
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404
        
        return jsonify({'success': True, 'data': usuario_a_dict(usuario)}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def crear_usuario():
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para crear usuarios'
            }), 403
        
        data = request.get_json()
        
        if not data.get('nombre'):
            return jsonify({'success': False, 'error': 'El nombre es obligatorio'}), 400
        
        if not data.get('dni'):
            return jsonify({'success': False, 'error': 'El DNI es obligatorio'}), 400
        
        if not data.get('password'):
            return jsonify({'success': False, 'error': 'La contraseña es obligatoria'}), 400
        
        dni_value = data['dni']
        
        # Verificar DNI único entre usuarios activos
        usuario_existente = Usuario.query.filter_by(dni=dni_value).first()
        if usuario_existente:
            return jsonify({'success': False, 'error': 'Ya existe un usuario con este DNI'}), 400
        
        if data.get('correo'):
            if Usuario.query.filter_by(correo=data['correo'], activo=True).first():
                return jsonify({'success': False, 'error': 'Ya existe un usuario activo con este correo'}), 400
        
        rol_id = data.get('rol_id', 1)
        rol = Rol.query.get(rol_id)
        if not rol:
            return jsonify({'success': False, 'error': 'El rol no existe'}), 400
        
        usuario = Usuario(
            nombre=data['nombre'],
            apellidos=data.get('apellidos', ''),
            dni=data['dni'],
            correo=data.get('correo'),
            telefono=data.get('telefono'),
            rol_id=rol_id,
            activo=True 
        )
        usuario.set_password(data['password'])
        
        db.session.add(usuario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario creado exitosamente',
            'data': usuario_a_dict(usuario)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:usuario_id>', methods=['PUT'])
@jwt_required()
def actualizar_usuario(usuario_id):
    try:
        current_user = obtener_usuario_actual()
        es_admin = verificar_es_admin(current_user['usuario_id'])
        es_gestor = verificar_es_gestor(current_user['usuario_id'])
        es_mismo_usuario = current_user['usuario_id'] == usuario_id
        
        if not es_admin and not es_gestor and not es_mismo_usuario:
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para actualizar este usuario'
            }), 403
        
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404
        
        if not usuario.activo and not es_admin:
            return jsonify({
                'success': False, 
                'error': 'No puedes modificar un usuario inactivo'
            }), 400
        
        data = request.get_json()
        
        # Si es el mismo usuario no puede cambiar rol
        if es_mismo_usuario and not es_admin and not es_gestor and 'rol_id' in data:
            return jsonify({
                'success': False, 
                'error': 'No puedes cambiar tu propio rol'
            }), 403
        
        if 'nombre' in data:
            usuario.nombre = data['nombre']
        
        if 'apellidos' in data:
            usuario.apellidos = data['apellidos']
        
        if 'telefono' in data:
            usuario.telefono = data['telefono']
        
        if 'correo' in data:
            if data['correo']:
                otro_usuario = Usuario.query.filter_by(correo=data['correo'], activo=True).first()
                if otro_usuario and otro_usuario.usuario_id != usuario_id:
                    return jsonify({'success': False, 'error': 'Ya existe otro usuario con este correo'}), 400
            usuario.correo = data['correo']
        
        if es_admin:
            if 'rol_id' in data:
                rol = Rol.query.get(data['rol_id'])
                if not rol:
                    return jsonify({'success': False, 'error': 'El rol no existe'}), 400
                usuario.rol_id = data['rol_id']
            
            if 'dni' in data and data['dni'] != usuario.dni:
                if Usuario.query.filter_by(dni=data['dni'], activo=True).first():
                    return jsonify({'success': False, 'error': 'Ya existe otro usuario con este DNI'}), 400
                usuario.dni = data['dni']
            
            if 'activo' in data:
                usuario.activo = data['activo']
        
        if 'password' in data and data['password']:
            usuario.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario actualizado exitosamente',
            'data': usuario_a_dict(usuario)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:usuario_id>', methods=['DELETE'])
@jwt_required()
def eliminar_usuario(usuario_id):
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_es_admin(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para eliminar usuarios. Solo administradores.'
            }), 403
        
        if current_user['usuario_id'] == usuario_id:
            return jsonify({
                'success': False, 
                'error': 'No puedes eliminar tu propio usuario'
            }), 400
        
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404
        
        if not usuario.activo:
            return jsonify({'success': False, 'error': 'El usuario ya está inactivo'}), 400
        
        prestamos_activos = [p for p in usuario.prestamos_solicitados if p.id_estado == 1]
        if prestamos_activos:
            return jsonify({
                'success': False, 
                'error': 'No se puede eliminar el usuario porque tiene préstamos activos'
            }), 400
        
        usuario.activo = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario desactivado exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:usuario_id>/reactivar', methods=['PUT'])
@jwt_required()
def reactivar_usuario(usuario_id):
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_es_admin(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para reactivar usuarios. Solo administradores.'
            }), 403
        
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'success': False, 'error': 'Usuario no encontrado'}), 404
        
        if usuario.activo:
            return jsonify({'success': False, 'error': 'El usuario ya está activo'}), 400
        
        usuario.activo = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario reactivado exitosamente',
            'data': usuario_a_dict(usuario)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/roles', methods=['GET'])
@jwt_required()
def obtener_roles():
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver los roles'
            }), 403
        
        roles = Rol.query.all()
        return jsonify({
            'success': True,
            'data': [{'rol_id': r.rol_id, 'nombre': r.description} for r in roles]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500