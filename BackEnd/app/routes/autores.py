from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models import Autor

bp = Blueprint('autores', __name__, url_prefix='/api/autores')

@bp.route('/', methods=['GET'])
@jwt_required()
def obtener_autores():
    """Obtener lista de autores"""
    try:
        autores = Autor.query.all()
        return jsonify({
            'success': True,
            'data': [{'autor_id': a.autor_id, 'nombre': a.description} for a in autores]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500