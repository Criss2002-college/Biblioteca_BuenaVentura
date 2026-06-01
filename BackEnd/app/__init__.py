from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from .config import config

# Inicializar extensiones
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # Configuración
    app.config.from_object(config[config_name])
    
    # Inicializar extensiones
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # Registrar blueprints (solo los que existen)
    from .routes import auth, libros, autores, editoriales, usuarios
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(libros.bp)
    app.register_blueprint(autores.bp)
    app.register_blueprint(editoriales.bp)
    app.register_blueprint(usuarios.bp)
    
    return app