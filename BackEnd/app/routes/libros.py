from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Libro, Autor, Editorial, Usuario
from app import db
import json

bp = Blueprint('libros', __name__, url_prefix='/api/libros')

def obtener_usuario_actual():
    identity = get_jwt_identity()
    return json.loads(identity)

def verificar_permiso_gestion(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id in [1, 2]

def verificar_permiso_lectura(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id in [1, 2, 3]

def verificar_es_admin(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id == 2

def libro_a_dict(libro):
    return {
        'libro_id': libro.libro_id,
        'titulo': libro.titulo,
        'autor': libro.autor.description if libro.autor else None,
        'autor_id': libro.autor_id,
        'editorial': libro.editorial.description if libro.editorial else None,
        'editorial_id': libro.editorial_id,
        'anio_publicacion': libro.anio_publicacion,
        'cantidad_disponible': libro.cantidad_disponible,
        'isbn': libro.isbn,
        'fecha_registro': libro.fecha_registro.strftime('%Y-%m-%d %H:%M:%S') if libro.fecha_registro else None,
        'activo': libro.activo
    }

# ==================== ENDPOINTS ====================

@bp.route('/', methods=['GET'])
@jwt_required()
def obtener_libros():
    try:
        libros = Libro.query.filter_by(activo=True).all()
        return jsonify({
            'success': True,
            'data': [libro_a_dict(libro) for libro in libros],
            'total': len(libros)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:libro_id>', methods=['GET'])
@jwt_required()
def obtener_libro(libro_id):
    try:
        libro = Libro.query.get(libro_id)
        if not libro or not libro.activo:
            return jsonify({'success': False, 'error': 'Libro no encontrado'}), 404
        
        return jsonify({'success': True, 'data': libro_a_dict(libro)}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
@bp.route('/inactivos', methods=['GET'])
@jwt_required()
def obtener_libros_inactivos():
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_es_admin(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver libros inactivos'
            }), 403
        
        libros = Libro.query.filter_by(activo=False).all()
        return jsonify({
            'success': True,
            'data': [libro_a_dict(libro) for libro in libros],
            'total': len(libros)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def crear_libro():
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para crear libros'
            }), 403
        
        data = request.get_json()
        
        if not data.get('titulo'):
            return jsonify({'success': False, 'error': 'El título es obligatorio'}), 400
        
        if not data.get('isbn'):
            return jsonify({'success': False, 'error': 'El ISBN es obligatorio'}), 400
        
        if Libro.query.filter_by(isbn=data['isbn']).first():
            return jsonify({'success': False, 'error': 'Ya existe un libro con este ISBN'}), 400
        
        autor = Autor.query.get(data.get('autor_id'))
        if not autor:
            return jsonify({'success': False, 'error': 'El autor no existe'}), 400
        
        cantidad = data.get('cantidad_disponible', 1)
        if cantidad < 0:
            return jsonify({'success': False, 'error': 'La cantidad disponible no puede ser negativa'}), 400
        
        libro = Libro(
            titulo=data['titulo'],
            autor_id=data['autor_id'],
            editorial_id=data.get('editorial_id'),
            anio_publicacion=data.get('anio_publicacion'),
            cantidad_disponible=cantidad,
            isbn=data['isbn']
        )
        
        db.session.add(libro)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Libro creado exitosamente',
            'data': libro_a_dict(libro)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:libro_id>', methods=['PUT'])
@jwt_required()
def actualizar_libro(libro_id):
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para actualizar libros'
            }), 403
        
        libro = Libro.query.get(libro_id)
        if not libro:
            return jsonify({'success': False, 'error': 'Libro no encontrado'}), 404
        
        data = request.get_json()
        
        if 'titulo' in data:
            libro.titulo = data['titulo']
        
        if 'autor_id' in data:
            autor = Autor.query.get(data['autor_id'])
            if not autor:
                return jsonify({'success': False, 'error': 'El autor no existe'}), 400
            libro.autor_id = data['autor_id']
        
        if 'editorial_id' in data:
            libro.editorial_id = data['editorial_id']
        
        if 'anio_publicacion' in data:
            libro.anio_publicacion = data['anio_publicacion']
        
        if 'cantidad_disponible' in data:
            if data['cantidad_disponible'] < 0:
                return jsonify({'success': False, 'error': 'La cantidad disponible no puede ser negativa'}), 400
            libro.cantidad_disponible = data['cantidad_disponible']
        
        if 'isbn' in data:
            otro_libro = Libro.query.filter_by(isbn=data['isbn']).first()
            if otro_libro and otro_libro.libro_id != libro_id:
                return jsonify({'success': False, 'error': 'Ya existe otro libro con este ISBN'}), 400
            libro.isbn = data['isbn']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Libro actualizado exitosamente',
            'data': libro_a_dict(libro)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:libro_id>', methods=['DELETE'])
@jwt_required()
def eliminar_libro(libro_id):
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_es_admin(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para eliminar libros. Solo administradores.'
            }), 403
        
        libro = Libro.query.get(libro_id)
        if not libro:
            return jsonify({'success': False, 'error': 'Libro no encontrado'}), 404
        
        if not libro.activo:
            return jsonify({'success': False, 'error': 'El libro ya está inactivo'}), 400
        
        # Verificar si el libro tiene préstamos activos
        prestamos_activos = [p for p in libro.prestamos if p.id_estado == 1]
        if prestamos_activos:
            return jsonify({
                'success': False, 
                'error': 'No se puede eliminar el libro porque tiene préstamos activos'
            }), 400
        
        # Borrado lógico
        libro.activo = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Libro desactivado exitosamente (borrado lógico)'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:libro_id>/reactivar', methods=['PUT'])
@jwt_required()
def reactivar_libro(libro_id):
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_es_admin(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para reactivar libros. Solo administradores.'
            }), 403
        
        libro = Libro.query.get(libro_id)
        if not libro:
            return jsonify({'success': False, 'error': 'Libro no encontrado'}), 404
        
        if libro.activo:
            return jsonify({'success': False, 'error': 'El libro ya está activo'}), 400
        
        libro.activo = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Libro reactivado exitosamente',
            'data': libro_a_dict(libro)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/buscar', methods=['GET'])
@jwt_required()
def buscar_libros():
    """Buscar libros ACTIVOS por título o ISBN"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'success': False, 'error': 'Parámetro de búsqueda requerido'}), 400
        
        libros = Libro.query.filter(
            (Libro.titulo.like(f'%{query}%')) | 
            (Libro.isbn.like(f'%{query}%')),
            Libro.activo == True
        ).all()
        
        return jsonify({
            'success': True,
            'data': [libro_a_dict(libro) for libro in libros],
            'total': len(libros)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500