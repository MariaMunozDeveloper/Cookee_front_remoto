# Cookee

Red social de recetas. TFG Maria Muñoz Ferrer — Ciclo Superior DAW 2024-25.

## Tecnologías

- Frontend: Angular 21 (standalone components, signals)
- Backend: Node.js 20 + Express
- Base de datos: MongoDB Atlas (cloud)
- Almacenamiento de imágenes: Cloudinary
- Autenticación: JWT

## Requisitos previos

- Node.js v20 o superior
- Angular CLI v21

```bash
npm install -g @angular/cli
```

## Instalación y arranque

### Backend

```bash
cd api
npm install
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### Frontend

```bash
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## Variables de entorno

Se adjunta el archivo `.env` en la carpeta `api/` con todas las credenciales necesarias (MongoDB Atlas, Cloudinary, JWT secret). No es necesario configurar nada adicional.

## Datos de prueba

La base de datos ya tiene datos cargados en MongoDB Atlas. Para cargar datos localmente:

```bash
cd api
npm run seed
```

## Credenciales de acceso

**Usuario normal:**
- Email: laura@cookee.com
- Contraseña: password123

**Usuario administrador** (acceso al panel de admin):
- Email: maria.munoz@solvam.es
- Contraseña: admin123