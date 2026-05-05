# Cookee

Red social de recetas. TFC Maria Muñoz Ferrer — Ciclo Superior DAW 2024-25.

##  Ver en producción
https://cookee-front-remoto.vercel.app

## Tecnologías

- Frontend: Angular 21 
- Backend: Node.js 22 + Express
- Base de datos: MongoDB Atlas (cloud)
- Almacenamiento de imágenes: Cloudinary
- Autenticación: JWT

## Requisitos previos

- Node.js v22 o superior
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


## Base de datos

La base de datos está en MongoDB Atlas y el `.env` ya viene configurado para conectarse directamente, no es necesario instalar MongoDB en local.

Si prefieres usar una copia local, importa los datos de la carpeta `BBDD/`:

```bash
mongorestore --db cookee ./BBDD/Cookee
```

Y cambia `MONGODB_URI` en el `.env` a `mongodb://localhost:27017/cookee`


## Credenciales de acceso

**Usuario normal:**
- Email: laura@cookee.com
- Contraseña: password123

**Usuario administrador** (acceso al panel de admin):
- Email: maria.munoz@solvam.es
- Contraseña: admin123
