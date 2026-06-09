from . import db
from datetime import datetime
from flask_bcrypt import generate_password_hash, check_password_hash

class Rol(db.Model):
    __tablename__ = 'roles'
    
    rol_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    description = db.Column(db.String(100), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación usuario con rol
    usuarios = db.relationship('Usuario', backref='rol', lazy=True)
    
    def __repr__(self):
        return f'<Rol {self.description}>'

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    usuario_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    dni = db.Column(db.BIGINT, unique=True, nullable=False)
    correo = db.Column(db.String(100), unique=True)
    telefono = db.Column(db.Integer)
    password_hash = db.Column(db.String(255), nullable=False)
    rol_id = db.Column(db.Integer, db.ForeignKey('roles.rol_id'), nullable=False)
    activo = db.Column(db.Boolean, default=True) 
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        """Hashear contraseña"""
        self.password_hash = generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Verificar contraseña"""
        return check_password_hash(self.password_hash, password)
    
    def es_gestor_o_admin(self):
        """Verificar si tiene rol de gestor o administrador"""
        return self.rol_id in [1, 2]  # 1: Gestor, 2: Administrador
    
    def es_admin(self):
        """Verificar si es administrador"""
        return self.rol_id == 2

class Autor(db.Model):
    __tablename__ = 'autores'
    
    autor_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    description = db.Column(db.String(100), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación libro con autor
    libros = db.relationship('Libro', backref='autor', lazy=True)
    
    def __repr__(self):
        return f'<Autor {self.description}>'

class Editorial(db.Model):
    __tablename__ = 'editoriales'
    
    editorial_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    description = db.Column(db.String(100), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciín libro con editorial
    libros = db.relationship('Libro', backref='editorial', lazy=True)
    
    def __repr__(self):
        return f'<Editorial {self.description}>'

class Libro(db.Model):
    __tablename__ = 'libros'
    
    libro_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titulo = db.Column(db.String(100), nullable=False)
    autor_id = db.Column(db.Integer, db.ForeignKey('autores.autor_id'), nullable=False)
    editorial_id = db.Column(db.Integer, db.ForeignKey('editoriales.editorial_id'))
    anio_publicacion = db.Column(db.Integer)
    cantidad_disponible = db.Column(db.Integer, default=1)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    isbn = db.Column(db.String(20), unique=True, nullable=False)
    activo = db.Column(db.Boolean, default=True) 
    
    # Relación prestamo con libro
    prestamos = db.relationship('Prestamo', backref='libro', lazy=True)
    
    def __repr__(self):
        return f'<Libro {self.titulo}>'

class EstadoPrestamo(db.Model):
    __tablename__ = 'estados_prestamo'
    
    estado_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    description = db.Column(db.String(100), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación prestamo con estados_prestamo
    prestamos = db.relationship('Prestamo', backref='estado', lazy=True)
    
    def __repr__(self):
        return f'<Estado {self.description}>'

class Prestamo(db.Model):
    __tablename__ = 'prestamos'
    
    prestamo_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    solicitante_id = db.Column(db.Integer, db.ForeignKey('usuarios.usuario_id'), nullable=False)
    gestor_id = db.Column(db.Integer, db.ForeignKey('usuarios.usuario_id'), nullable=False)
    libro_id = db.Column(db.Integer, db.ForeignKey('libros.libro_id'), nullable=False)
    fecha_prestamo = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    fecha_dev_esperada = db.Column(db.DateTime, nullable=False)
    fecha_dev_real = db.Column(db.DateTime)
    id_estado = db.Column(db.Integer, db.ForeignKey('estados_prestamo.estado_id'), default=1)
    
    # Relación entre usuario y prestammos, diferenciando una misma clave foranea con mismo campo para función de gestor y registrante
    solicitante = db.relationship('Usuario', foreign_keys=[solicitante_id], backref='prestamos_solicitados')
    gestor = db.relationship('Usuario', foreign_keys=[gestor_id], backref='prestamos_gestionados')
    
    def __repr__(self):
        return f'<Prestamo {self.prestamo_id}>'