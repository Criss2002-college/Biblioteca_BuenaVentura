import os
from app import create_app, db
from app.models import Rol, EstadoPrestamo, Autor, Editorial, Usuario
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = create_app()

with app.app_context():
    print("Inicializando base de datos")
    print(f"Conectando a: {os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '3306')}")
    
    # Crear todas las tablas
    db.create_all()
    
    # Insertar roles
    roles_default = [
        {'rol_id': 1, 'description': 'Gestor'},
        {'rol_id': 2, 'description': 'Administrador'},
        {'rol_id': 3, 'description': 'Lector'}
    ]
    
    for rol_data in roles_default:
        if not db.session.get(Rol, rol_data['rol_id']):
            rol = Rol(rol_id=rol_data['rol_id'], description=rol_data['description'])
            db.session.add(rol)
            print(f"Rol creado: {rol_data['description']}")
    
    # Insertar estados de préstamo
    estados_default = [
        {'estado_id': 1, 'description': 'ACTIVO'},
        {'estado_id': 2, 'description': 'DEVUELTO'},
        {'estado_id': 3, 'description': 'VENCIDO'}
    ]
    
    for estado_data in estados_default:
        if not db.session.get(EstadoPrestamo, estado_data['estado_id']):
            estado = EstadoPrestamo(estado_id=estado_data['estado_id'], 
                                   description=estado_data['description'])
            db.session.add(estado)
            print(f"Estado creado: {estado_data['description']}")
    
    # Crear usuario administrador por defecto
    admin = Usuario.query.filter_by(dni=12345678).first()
    if not admin:
        admin = Usuario(
            nombre='Admin',
            apellidos='Sistema',
            dni=12345678,
            correo='admin@biblioteca.com',
            telefono=123456789,
            rol_id=2
        )
        admin.set_password('admin123')
        db.session.add(admin)
        print("Usuario administrador creado: admin@biblioteca.com / admin123")
    
    # Crear usuario gestor por defecto
    gestor = Usuario.query.filter_by(dni=87654321).first()
    if not gestor:
        gestor = Usuario(
            nombre='Gestor',
            apellidos='Biblioteca',
            dni=87654321,
            correo='gestor@biblioteca.com',
            telefono=987654321,
            rol_id=1
        )
        gestor.set_password('gestor123')
        db.session.add(gestor)
        print("Usuario gestor creado: gestor@biblioteca.com / gestor123")

    # Crear usuario lector por defecto
    lector = Usuario.query.filter_by(dni=11111111).first()
    if not lector:
        lector = Usuario(
            nombre='Lector',
            apellidos='Prueba',
            dni=11111111,
            correo='lector@biblioteca.com',
            telefono=111111111,
            rol_id=3, 
            activo=True
        )
    lector.set_password('lector123')
    db.session.add(lector)
    print("Usuario lector creado: lector@biblioteca.com / lector123")
    
    # Insertar autores
    autores_ejemplo = ['Gabriel García Márquez', 'Julio Cortázar', 'Mario Vargas Llosa']
    for autor_nombre in autores_ejemplo:
        if not Autor.query.filter_by(description=autor_nombre).first():
            autor = Autor(description=autor_nombre)
            db.session.add(autor)
            print(f"Autor creado: {autor_nombre}")
    
    # Insertar editoriales
    editoriales_ejemplo = ['Penguin Random House', 'Planeta', 'Alfaguara']
    for editorial_nombre in editoriales_ejemplo:
        if not Editorial.query.filter_by(description=editorial_nombre).first():
            editorial = Editorial(description=editorial_nombre)
            db.session.add(editorial)
            print(f"Editorial creada: {editorial_nombre}")
    
    db.session.commit()
    
    #eliminar en versión final, solo lo tengo para validar levantamiento correcto en pruebas
    print("\n" + "="*50)
    print("BASE DE DATOS INICIALIZADA CON ÉXITO")
    print("="*50)
    print(f"Base de datos: {os.getenv('DB_NAME', 'biblioteca')}")
    print(f"Host: {os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '3306')}")
    print("\nCREDENCIALES DE PRUEBA:")
    print(" Administrador: admin@biblioteca.com / admin123")
    print("Gestor: gestor@biblioteca.com / gestor123")
    print("="*50)