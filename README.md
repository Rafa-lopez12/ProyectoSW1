# 1 
npm install
o
yarn install

# 2
docker-compose up -d 

# 3
crear el .env

DB_PASSWORD=
DB_NAME=
DB_HOST=localhost
DB_PORT=5432
DB_USER=
PORT=3000
HOST_API=http://localhost:3000/api
JWT_SECRET=
JWR_SECRET_CLIENTE=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# 4

Desarrollo
npm run start:dev

 Producción
npm run build
npm run start:prod



src/
├── ai-search/           # Búsqueda de productos con IA
├── auth/               # Autenticación de administradores
├── carrito/            # Gestión del carrito de compras
├── categoria/          # Gestión de categorías
├── cliente/            # Autenticación y gestión de clientes
├── common/             # Utilidades comunes, decoradores, middleware
├── funcionalidad/      # Sistema de permisos granulares
├── movimiento_inv/     # Movimientos de inventario
├── producto/           # Gestión de productos y variantes
├── proveedor/          # Gestión de proveedores
├── rol/                # Gestión de roles
├── size/               # Gestión de tallas
├── stripe/             # Integración con Stripe
├── tenant/             # Gestión multi-tenant
├── venta/              # Gestión de ventas
└── main.ts             # Punto de entrada



# 5
crear un  tenant

insert into tenant(nombre,subdominio,plan) values('Mi tienda', 'mitienda', 'basic')

POST /api/tenant  //algo falla creo xd
Content-Type: application/json

{
  "nombre": "Mi Tienda Test",
  "subdominio": "mitienda",
  "plan": "basic"
}


# 6
para todas las rutas (excepto las publicas) incluir:
X-Tenant-ID: mitienda
Authorization: Bearer <jwt_token>

# 7
crear las funcionalidades del sistema
INSERT INTO funcionalidad (nombre, "tenantId") VALUES 
-- Gestión de usuarios y roles
('crear-usuario', 'UUID_DEL_TENANT'),
('obtener-usuarios', 'UUID_DEL_TENANT'),
('actualizar-usuario', 'UUID_DEL_TENANT'),
('desactivar-usuario', 'UUID_DEL_TENANT'),
('crear-rol', 'UUID_DEL_TENANT'),
('obtener-roles', 'UUID_DEL_TENANT'),
('actualizar-rol', 'UUID_DEL_TENANT'),
('eliminar-rol', 'UUID_DEL_TENANT'),

-- Gestión de productos
('crear-producto', 'UUID_DEL_TENANT'),
('obtener-productos', 'UUID_DEL_TENANT'),
('obtener-producto', 'UUID_DEL_TENANT'),
('actualizar-producto', 'UUID_DEL_TENANT'),
('eliminar-producto', 'UUID_DEL_TENANT'),

-- Gestión de categorías
('crear-categoria', 'UUID_DEL_TENANT'),
('obtener-categorias', 'UUID_DEL_TENANT'),
('obtener-categoria', 'UUID_DEL_TENANT'),
('actualizar-categoria', 'UUID_DEL_TENANT'),
('eliminar-categoria', 'UUID_DEL_TENANT'),

-- Gestión de tallas
('crear-size', 'UUID_DEL_TENANT'),
('obtener-sizes', 'UUID_DEL_TENANT'),
('obtener-size', 'UUID_DEL_TENANT'),
('actualizar-size', 'UUID_DEL_TENANT'),
('eliminar-size', 'UUID_DEL_TENANT'),

-- Gestión de proveedores
('crear-proveedor', 'UUID_DEL_TENANT'),
('obtener-proveedores', 'UUID_DEL_TENANT'),
('obtener-proveedor', 'UUID_DEL_TENANT'),
('actualizar-proveedor', 'UUID_DEL_TENANT'),
('desactivar-proveedor', 'UUID_DEL_TENANT'),
('activar-proveedor', 'UUID_DEL_TENANT'),

-- Gestión de inventario
('crear-movimientoInv', 'UUID_DEL_TENANT'),
('obtener-movimientosInv', 'UUID_DEL_TENANT'),
('obtener-movimientoInv', 'UUID_DEL_TENANT'),

-- Gestión de ventas
('crear-venta', 'UUID_DEL_TENANT'),
('obtener-ventas', 'UUID_DEL_TENANT'),
('obtener-venta', 'UUID_DEL_TENANT'),
('actualizar-estado-venta', 'UUID_DEL_TENANT'),
('obtener-reportes-ventas', 'UUID_DEL_TENANT'),

-- Gestión de carritos (admin)
('obtener-carritos', 'UUID_DEL_TENANT'),
('obtener-estadisticas-carritos', 'UUID_DEL_TENANT'),
('obtener-carrito-cliente', 'UUID_DEL_TENANT'),
('vaciar-carrito-cliente', 'UUID_DEL_TENANT'),

-- Gestión de clientes (admin)
('obtener-clientes', 'UUID_DEL_TENANT'),
('obtener-cliente', 'UUID_DEL_TENANT'),
('actualizar-cliente', 'UUID_DEL_TENANT'),
('desactivar-cliente', 'UUID_DEL_TENANT'),
('activar-cliente', 'UUID_DEL_TENANT'),

-- Gestión de pagos
('obtener-pagos', 'UUID_DEL_TENANT'),
('obtener-pago', 'UUID_DEL_TENANT'),

-- Búsqueda con IA
('buscar-productos-ia', 'UUID_DEL_TENANT');


# 8
crear el rol

insert into rol('nombre') values('admin')

# 9

asignar funcionalidades al rol
INSERT INTO rol_funcionalidades_funcionalidad ("rolId", "funcionalidadId") VALUES
('ROL_UUID_AQUI', 1),
('ROL_UUID_AQUI', 2),
('ROL_UUID_AQUI', 3),
('ROL_UUID_AQUI', 4),
('ROL_UUID_AQUI', 5),
('ROL_UUID_AQUI', 6),
('ROL_UUID_AQUI', 7),
('ROL_UUID_AQUI', 8),
('ROL_UUID_AQUI', 9),
('ROL_UUID_AQUI', 10),
('ROL_UUID_AQUI', 11),
('ROL_UUID_AQUI', 12),
('ROL_UUID_AQUI', 13),
('ROL_UUID_AQUI', 14),
('ROL_UUID_AQUI', 15),
('ROL_UUID_AQUI', 16),
('ROL_UUID_AQUI', 17),
('ROL_UUID_AQUI', 18),
('ROL_UUID_AQUI', 19),
('ROL_UUID_AQUI', 20),
('ROL_UUID_AQUI', 21),
('ROL_UUID_AQUI', 22),
('ROL_UUID_AQUI', 23),
('ROL_UUID_AQUI', 24),
('ROL_UUID_AQUI', 25),
('ROL_UUID_AQUI', 26),
('ROL_UUID_AQUI', 27),
('ROL_UUID_AQUI', 28),
('ROL_UUID_AQUI', 29),
('ROL_UUID_AQUI', 30),
('ROL_UUID_AQUI', 31),
('ROL_UUID_AQUI', 32),
('ROL_UUID_AQUI', 33),
('ROL_UUID_AQUI', 34),
('ROL_UUID_AQUI', 35),
('ROL_UUID_AQUI', 36),
('ROL_UUID_AQUI', 37),
('ROL_UUID_AQUI', 38),
('ROL_UUID_AQUI', 39),
('ROL_UUID_AQUI', 40),
('ROL_UUID_AQUI', 41),
('ROL_UUID_AQUI', 42),
('ROL_UUID_AQUI', 43),
('ROL_UUID_AQUI', 44),
('ROL_UUID_AQUI', 45),
('ROL_UUID_AQUI', 46),
('ROL_UUID_AQUI', 47);


# 10
crear un usuario con este rol

POST /api/auth/register
Headers: X-Tenant-ID: mitienda
Content-Type: application/json

{
  "email": "admin@mitienda.com",
  "password": "Admin123!",
  "fullName": "Administrador Principal",
  "rolId": "UUID_DEL_ROL_ADMINISTRADOR"
}


# 11
POST /api/auth/login
Headers: X-Tenant-ID: mitienda
Content-Type: application/json

{
  "email": "admin@mitienda.com",
  "password": "Admin123!"
}



con todo eso deberias poder hacer pruebas, sino habla a rafa xd










