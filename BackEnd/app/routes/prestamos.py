from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Prestamo, Usuario, Libro, EstadoPrestamo
from app import db
from datetime import datetime, timedelta
import json

bp = Blueprint('prestamos', __name__, url_prefix='/api/prestamos')

def obtener_usuario_actual():
    identity = get_jwt_identity()
    return json.loads(identity)

def verificar_permiso_gestion(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id in [1, 2]

def verificar_es_admin(usuario_id):
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return False
    return usuario.rol_id == 2

def prestamo_a_dict(prestamo):
    return {
        'prestamo_id': prestamo.prestamo_id,
        'solicitante': {
            'id': prestamo.solicitante.usuario_id if prestamo.solicitante else None,
            'nombre': f"{prestamo.solicitante.nombre} {prestamo.solicitante.apellidos}" if prestamo.solicitante else None
        },
        'gestor': {
            'id': prestamo.gestor.usuario_id if prestamo.gestor else None,
            'nombre': f"{prestamo.gestor.nombre} {prestamo.gestor.apellidos}" if prestamo.gestor else None
        },
        'libro': {
            'id': prestamo.libro.libro_id if prestamo.libro else None,
            'titulo': prestamo.libro.titulo if prestamo.libro else None,
            'isbn': prestamo.libro.isbn if prestamo.libro else None
        },
        'fecha_prestamo': prestamo.fecha_prestamo.strftime('%Y-%m-%d %H:%M:%S') if prestamo.fecha_prestamo else None,
        'fecha_dev_esperada': prestamo.fecha_dev_esperada.strftime('%Y-%m-%d') if prestamo.fecha_dev_esperada else None,
        'fecha_dev_real': prestamo.fecha_dev_real.strftime('%Y-%m-%d %H:%M:%S') if prestamo.fecha_dev_real else None,
        'estado': prestamo.estado.description if prestamo.estado else None,
        'estado_id': prestamo.id_estado
    }

def usuario_tiene_prestamo_activo(usuario_id):
    """Verifica si un usuario tiene un préstamo activo"""
    prestamo_activo = Prestamo.query.filter_by(
        solicitante_id=usuario_id, 
        id_estado=1  # estado ACTIVO
    ).first()
    return prestamo_activo is not None

def libro_tiene_prestamo_activo_hoy(libro_id, fecha_prestamo):
    """Verifica si un libro ya fue prestado hoy"""
    inicio_dia = datetime(fecha_prestamo.year, fecha_prestamo.month, fecha_prestamo.day, 0, 0, 0)
    fin_dia = datetime(fecha_prestamo.year, fecha_prestamo.month, fecha_prestamo.day, 23, 59, 59)
    
    prestamo_hoy = Prestamo.query.filter(
        Prestamo.libro_id == libro_id,
        Prestamo.id_estado == 1,  # ACTIVO
        Prestamo.fecha_prestamo >= inicio_dia,
        Prestamo.fecha_prestamo <= fin_dia
    ).first()
    return prestamo_hoy is not None

def libro_tiene_ejemplares_disponibles(libro_id):
    """Verifica si el libro tiene ejemplares disponibles"""
    libro = Libro.query.get(libro_id)
    if not libro:
        return False
    return libro.cantidad_disponible > 0

def actualizar_disponibilidad_libro(libro_id, cantidad):
    """Actualiza la cantidad disponible de un libro"""
    libro = Libro.query.get(libro_id)
    if libro:
        libro.cantidad_disponible += cantidad
        db.session.commit()

# ==================== ENDPOINTS ====================

@bp.route('/', methods=['GET'])
@jwt_required()
def obtener_prestamos():
    """Obtener todos los préstamos (solo Gestor/Admin)"""
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver los préstamos'
            }), 403
        
        prestamos = Prestamo.query.all()
        return jsonify({
            'success': True,
            'data': [prestamo_a_dict(p) for p in prestamos],
            'total': len(prestamos)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/activos', methods=['GET'])
@jwt_required()
def obtener_prestamos_activos():
    """Obtener préstamos activos (solo Gestor/Admin)"""
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver los préstamos'
            }), 403
        
        prestamos = Prestamo.query.filter_by(id_estado=1).all()
        return jsonify({
            'success': True,
            'data': [prestamo_a_dict(p) for p in prestamos],
            'total': len(prestamos)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/usuario/<int:usuario_id>', methods=['GET'])
@jwt_required()
def obtener_prestamos_usuario(usuario_id):
    """Obtener préstamos de un usuario específico"""
    try:
        current_user = obtener_usuario_actual()
        
        # Permitir si es admin/gestor o el mismo usuario
        if not verificar_permiso_gestion(current_user['usuario_id']) and current_user['usuario_id'] != usuario_id:
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver los préstamos de este usuario'
            }), 403
        
        prestamos = Prestamo.query.filter_by(solicitante_id=usuario_id).all()
        return jsonify({
            'success': True,
            'data': [prestamo_a_dict(p) for p in prestamos],
            'total': len(prestamos)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/libro/<int:libro_id>', methods=['GET'])
@jwt_required()
def obtener_prestamos_libro(libro_id):
    """Obtener historial de préstamos de un libro (solo Gestor/Admin)"""
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver el historial de préstamos'
            }), 403
        
        prestamos = Prestamo.query.filter_by(libro_id=libro_id).all()
        return jsonify({
            'success': True,
            'data': [prestamo_a_dict(p) for p in prestamos],
            'total': len(prestamos)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def crear_prestamo():
    """Crear un nuevo préstamo (solo Gestor/Admin)"""
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para crear préstamos'
            }), 403
        
        data = request.get_json()
        
        # Validar campos requeridos
        if not data.get('solicitante_id'):
            return jsonify({'success': False, 'error': 'El solicitante es obligatorio'}), 400
        
        if not data.get('libro_id'):
            return jsonify({'success': False, 'error': 'El libro es obligatorio'}), 400
        
        # Verificar que el usuario existe y está activo
        usuario = Usuario.query.filter_by(usuario_id=data['solicitante_id'], activo=True).first()
        if not usuario:
            return jsonify({'success': False, 'error': 'El usuario no existe o está inactivo'}), 400
        
        # REGLA: Un usuario no puede tener más de un préstamo activo
        if usuario_tiene_prestamo_activo(data['solicitante_id']):
            return jsonify({
                'success': False, 
                'error': 'El usuario ya tiene un préstamo activo. No puede tomar más libros hasta devolver el actual.'
            }), 400
        
        # Verificar que el libro existe y está activo
        libro = Libro.query.filter_by(libro_id=data['libro_id'], activo=True).first()
        if not libro:
            return jsonify({'success': False, 'error': 'El libro no existe o está inactivo'}), 400
        
        # REGLA: No se puede asignar un libro sin ejemplares disponibles
        if not libro_tiene_ejemplares_disponibles(data['libro_id']):
            return jsonify({
                'success': False, 
                'error': 'No hay ejemplares disponibles de este libro'
            }), 400
        
        fecha_prestamo = datetime.utcnow()
        
        # REGLA: Un libro no puede estar asignado a más de una persona el mismo día
        if libro_tiene_prestamo_activo_hoy(data['libro_id'], fecha_prestamo):
            return jsonify({
                'success': False, 
                'error': 'Este libro ya fue prestado hoy. Solo puede ser prestado una vez por día.'
            }), 400
        
        # Fecha de devolución esperada (5 días por defecto)
        dias_prestamo = data.get('dias_prestamo', 5)
        fecha_dev_esperada = fecha_prestamo + timedelta(days=dias_prestamo)
        
        # Crear préstamo
        prestamo = Prestamo(
            solicitante_id=data['solicitante_id'],
            gestor_id=current_user['usuario_id'],
            libro_id=data['libro_id'],
            fecha_prestamo=fecha_prestamo,
            fecha_dev_esperada=fecha_dev_esperada,
            id_estado=1  # ACTIVO
        )
        
        db.session.add(prestamo)
        
        # Reducir cantidad disponible del libro
        libro.cantidad_disponible -= 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Préstamo creado exitosamente. Fecha de devolución esperada: {fecha_dev_esperada.strftime("%Y-%m-%d")}',
            'data': prestamo_a_dict(prestamo)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:prestamo_id>/devolver', methods=['PUT'])
@jwt_required()
def devolver_prestamo(prestamo_id):
    """Registrar devolución de un préstamo (solo Gestor/Admin)"""
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para registrar devoluciones'
            }), 403
        
        prestamo = Prestamo.query.get(prestamo_id)
        if not prestamo:
            return jsonify({'success': False, 'error': 'Préstamo no encontrado'}), 404
        
        if prestamo.id_estado != 1:
            return jsonify({'success': False, 'error': 'Este préstamo ya fue devuelto'}), 400
        
        # Registrar devolución
        prestamo.fecha_dev_real = datetime.utcnow()
        prestamo.id_estado = 2  # DEVUELTO
        
        # Aumentar cantidad disponible del libro
        actualizar_disponibilidad_libro(prestamo.libro_id, 1)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Devolución registrada exitosamente',
            'data': prestamo_a_dict(prestamo)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/<int:prestamo_id>', methods=['DELETE'])
@jwt_required()
def cancelar_prestamo(prestamo_id):
    """Cancelar un préstamo (solo Administrador)"""
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_es_admin(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para cancelar préstamos. Solo administradores.'
            }), 403
        
        prestamo = Prestamo.query.get(prestamo_id)
        if not prestamo:
            return jsonify({'success': False, 'error': 'Préstamo no encontrado'}), 404
        
        if prestamo.id_estado != 1:
            return jsonify({'success': False, 'error': 'Solo se pueden cancelar préstamos activos'}), 400
        
        # Cancelar préstamo (cambiar a estado cancelado o simplemente eliminar)
        # En este caso, cambiamos a estado 3 (VENCIDO/otro) o lo eliminamos lógicamente
        prestamo.id_estado = 3  # VENCIDO/CANCELADO
        
        # Devolver el libro al inventario
        actualizar_disponibilidad_libro(prestamo.libro_id, 1)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Préstamo cancelado exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/vencidos', methods=['GET'])
@jwt_required()
def obtener_prestamos_vencidos():
    """Obtener préstamos vencidos (solo Gestor/Admin)"""
    try:
        current_user = obtener_usuario_actual()
        
        if not verificar_permiso_gestion(current_user['usuario_id']):
            return jsonify({
                'success': False, 
                'error': 'No tienes permiso para ver préstamos vencidos'
            }), 403
        
        hoy = datetime.utcnow().date()
        prestamos_vencidos = Prestamo.query.filter(
            Prestamo.id_estado == 1,
            Prestamo.fecha_dev_esperada < hoy
        ).all()
        
        return jsonify({
            'success': True,
            'data': [prestamo_a_dict(p) for p in prestamos_vencidos],
            'total': len(prestamos_vencidos)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500