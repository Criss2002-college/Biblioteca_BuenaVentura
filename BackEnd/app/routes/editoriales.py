from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models import Editorial

bp = Blueprint('editoriales', __name__, url_prefix='/api/editoriales')

@bp.route('/', methods=['GET'])
@jwt_required()
def obtener_editoriales():
    """Obtener lista de editoriales"""
    try:
        editoriales = Editorial.query.all()
        return jsonify({
            'success': True,
            'data': [{'editorial_id': e.editorial_id, 'nombre': e.description} for e in editoriales]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500