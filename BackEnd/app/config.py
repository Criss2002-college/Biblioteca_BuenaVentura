import os
from dotenv import load_dotenv

#variables de entorno desde archivo .env (raíz del proyecto)
load_dotenv()

class Config:
    # Configuración de la base de datos usando variables de entorno
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
    DB_HOST = os.getenv('DB_HOST', 'db')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'biblioteca')
    
    # URL dinamico con archivo
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'clave-segura-por-defecto-cambiar')
    
    # Configuración de aplicación
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    ENV = os.getenv('FLASK_ENV', 'development')
    
class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    ENV = 'production'
    # En producción, usar variables de entorno reales
    
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}