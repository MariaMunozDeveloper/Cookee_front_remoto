# Cookee

> Red social de recetas — PFC · Maria Muñoz Ferrer · DAW 2025-26

Una plataforma donde los amantes de la cocina publican recetas, siguen a otros usuarios y construyen su recetario personal. Combina la profundidad de un blog de cocina con la interacción de una red social.

**Producción →** https://cookee-front-remoto.vercel.app

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 21 · Standalone Components · Signals |
| Backend | Node.js 20 · Express · API REST |
| Base de datos | MongoDB Atlas |
| Imágenes | Cloudinary |
| Autenticación | JWT · Access token + Refresh token |

---

## Arranque local

Requisitos: `Node.js v20` · `Angular CLI v21`

```bash
npm install -g @angular/cli
```

```bash
# 1. Backend
cd FUENTES/CookeeBack
npm install
npm run dev
# → http://localhost:3000

# 2. Frontend (nueva terminal)
cd FUENTES/CookeeFront
npm install
npm start
# → http://localhost:4200
```

El archivo `.env` ya está incluido en `FUENTES/CookeeBack/` con todas las credenciales configuradas.

---

## Base de datos

La app usa MongoDB Atlas. El archivo `.env` incluido ya tiene la conexión configurada — no es necesario instalar nada adicional.

### Opción alternativa: base de datos en local

Si no hay conexión a internet o prefieres ejecutar la BD localmente:

1. Instala MongoDB Community Server v8: https://www.mongodb.com/try/download/community

2. Desde la carpeta raíz del proyecto (`Maria_Muñoz_Ferrer/`), importa los datos:

```bash
mongorestore --db cookee ./BBDD/Cookee
```

3. Cambia la línea `MONGODB_URI` en `FUENTES/CookeeBack/.env` por :

            MONGODB_URI=mongodb://localhost:27017/cookee

4. Arranca el backend y el frontend siguiendo los pasos de **Arranque local**.

---

## Acceso

Usuario:  maria.munoz@solvam.es
Contraseña:  admin123 
