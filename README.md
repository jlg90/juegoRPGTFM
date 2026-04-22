# ArcaneClass — Guía de instalación y puesta en marcha

Juego RPG por turnos para el aula. El servidor sirve también el frontend, así que con un solo comando arranca todo.

---

## Requisitos previos

Solo necesitas instalar **Node.js** (incluye npm automáticamente).

### 1. Instalar Node.js

1. Ve a **https://nodejs.org**
2. Descarga la versión **LTS** (la recomendada, botón verde grande)
3. Ejecuta el instalador y sigue los pasos (siguiente, siguiente, instalar — opciones por defecto)
4. Al terminar, **reinicia el ordenador** (o abre un terminal nuevo)

Verifica que se instaló correctamente abriendo **cmd** o **PowerShell** y ejecutando:

```
node --version
npm --version
```

Deben aparecer números de versión (ej. `v22.x.x` y `10.x.x`). Si aparecen, estás listo.

---

## Puesta en marcha del proyecto

### 2. Obtener el proyecto

Copia la carpeta `JuegoRPGAct` en tu PC (por ejemplo en el Escritorio).

### 3. Abrir la terminal en la carpeta correcta

Abre **cmd** o **PowerShell** y navega hasta la carpeta `backend`:

```
cd C:\Users\TuUsuario\Desktop\JuegoRPGAct\backend
```

> **Truco rápido:** En el Explorador de Windows, abre la carpeta `backend`, haz clic en la barra de direcciones, escribe `cmd` y pulsa Enter. Se abre la terminal ya en esa carpeta.

### 4. Instalar las dependencias

Solo hay que hacerlo **la primera vez** (o si alguien borra la carpeta `node_modules`):

```
npm install
```

Espera a que termine. Verás que se crea una carpeta `node_modules` dentro de `backend`.

### 5. Arrancar el servidor

```
npm start
```

Si todo va bien verás:

```
ArcaneClass en http://localhost:3000
```

### 6. Abrir el juego en el navegador

Abre **Chrome, Edge o Firefox** y ve a:

```
http://localhost:3000
```

¡Ya está funcionando!

---

## Uso básico

| Rol | Usuario | Contraseña |
|---|---|---|
| Docente | `docente` | `docente123` |
| Alumno | (el que cree el docente) | (la que asigne el docente) |

**Flujo normal:**
1. El docente inicia sesión, crea alumnos y les asigna puntos
2. Los alumnos inician sesión, mejoran sus stats y desbloquean habilidades
3. El docente crea combates entre dos alumnos
4. Los alumnos reciben una notificación y van a la pestaña Combate

---

## Apagar el servidor

En la terminal donde está corriendo, pulsa `Ctrl + C`.

---

## Solución de problemas frecuentes

**"npm no se reconoce como comando"**
→ Node.js no se instaló correctamente o no reiniciaste la terminal. Instálalo de nuevo y abre una terminal nueva.

**"Error: Cannot find module '...'"**
→ Ejecuta `npm install` dentro de la carpeta `backend`.

**"EADDRINUSE: address already in use :::3000"**
→ El puerto 3000 ya está ocupado (quizás el servidor ya está corriendo en otra terminal). Cierra esa ventana o reinicia el PC.

**La página carga pero no responde / errores en consola**
→ Asegúrate de que abriste el navegador en `http://localhost:3000` y no en `file://...`.

---

## Estructura del proyecto

```
JuegoRPGAct/
├── backend/
│   ├── server.js          — Servidor principal (Express + Socket.io)
│   ├── package.json       — Dependencias Node.js
│   ├── data/
│   │   └── db.json        — Base de datos (jugadores, combates)
│   └── routes/
│       ├── auth.js        — Login
│       ├── players.js     — Gestión de alumnos y puntos
│       └── battle.js      — Motor de combate
└── frontend/
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── api.js         — Cliente API y estado global
        ├── auth.js        — Login/logout
        ├── hero.js        — Ficha del personaje y tienda
        ├── battle.js      — UI de combate
        └── teacher.js     — Panel del docente
```
