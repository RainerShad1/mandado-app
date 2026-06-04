# Guía de despliegue — Plataforma de Mandados 🛵

Vamos a poner la app en internet **gratis**. Tres piezas, tres servicios:

| Pieza | Servicio | Por qué |
|-------|----------|---------|
| Base de datos (PostgreSQL) | **Neon** | Postgres gratis en la nube |
| Backend (NestJS) | **Render** | Servidor que corre siempre + WebSockets |
| Frontend (Next.js) | **Vercel** | Hecho para Next.js |

Todos dan HTTPS y URL gratis (`*.neon.tech`, `*.onrender.com`, `*.vercel.app`). No necesitas dominio para empezar.

> **Orden obligatorio:** Base de datos → Backend → Frontend. Cada parte necesita la URL de la anterior.

---

## PASO 0 — Antes de empezar

Tu código ya está listo para desplegar (tiene `render.yaml`, `vercel.json` y los scripts de producción). Solo asegúrate de que **lo último esté subido a GitHub**:

```bash
git add .
git commit -m "Preparar despliegue"
git push
```

---

## PASO 1 — Base de datos (Neon)

1. Crea cuenta en **https://neon.tech**
2. **Create project** → región más cercana (ej. *US East*).
3. Te dan un **connection string**. Cópialo. Se ve así:
   ```
   postgresql://usuario:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Guárdalo. Es tu `DATABASE_URL`.

> El `?sslmode=require` al final es importante. No lo quites.

---

## PASO 2 — Backend (Render)

### 2.1 Genera tu JWT_SECRET
En tu terminal (tu PC), corre esto y copia el resultado largo:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2.2 Crea el servicio en Render
1. Crea cuenta en **https://render.com** (entra con GitHub, es más fácil).
2. **New → Blueprint** → elige tu repo `mandado`.
3. Render lee el `render.yaml` solo y detecta el backend. Confirma.

### 2.3 Pega las variables de entorno
Render te va a pedir estas (porque están marcadas como secretas):
```
DATABASE_URL    = (el connection string de Neon del Paso 1)
JWT_SECRET      = (el valor largo que generaste en 2.1)
FRONTEND_URL    = https://temporal.vercel.app   ← provisional, lo arreglas en el Paso 3
GOOGLE_MAPS_KEY = (tu llave de Google, o déjala vacía)
```

### 2.4 Deploy
- Render construye e inicia. El comando de arranque (`deploy:start`) **crea las tablas en Neon automáticamente** la primera vez. No tienes que hacer nada.
- Cuando termine, te da una URL: `https://mandados-backend.onrender.com`
- Tu API queda en esa URL + `/api`. **Guárdala** para el Paso 3.

### 2.5 Carga los datos iniciales (seed)
Para tener los servicios y usuarios demo, abre la pestaña **Shell** de tu servicio en Render y corre:
```bash
npm run prisma:seed
```
Esto crea los 8 servicios y los 3 usuarios demo.

> ⚠️ **El plan gratis de Render duerme el backend tras 15 min sin uso.** La primera petición después tarda ~1 minuto en despertar. Normal para demos. Si quieres que esté siempre despierto, el plan pago arranca en unos dólares al mes.

---

## PASO 3 — Frontend (Vercel)

1. Crea cuenta en **https://vercel.com** (entra con GitHub).
2. **Add New → Project** → importa el mismo repo `mandado`.
3. Configura:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (lo detecta solo)
4. **Environment Variables** — apuntan al backend de Render:
   ```
   NEXT_PUBLIC_API_URL          = https://mandados-backend.onrender.com/api
   NEXT_PUBLIC_WS_URL           = https://mandados-backend.onrender.com
   NEXT_PUBLIC_GOOGLE_MAPS_KEY  = (tu llave de Google, o déjala vacía)
   ```
   > Las `NEXT_PUBLIC_*` se incrustan al construir. Ponlas ANTES de desplegar. Si las cambias después, hay que volver a desplegar (Redeploy).
5. **Deploy.** Te da la URL: `https://mandado.vercel.app`

### 3.1 Cierra el círculo
Vuelve a **Render** (backend) → variable `FRONTEND_URL` → pon la URL real de Vercel:
```
FRONTEND_URL = https://mandado.vercel.app
```
Render redespliega solo. Esto es lo que permite que el frontend hable con el backend (CORS).

---

## PASO 4 — Seguridad antes de abrir al público

1. **Cambia las contraseñas demo.** El seed crea usuarios con clave `123456`. Crea un admin nuevo con clave fuerte, o cámbiala directo en la base de Neon.
2. **JWT_SECRET:** confirma que NO es el de ejemplo (usaste el generado).
3. **No subiste `.env` a GitHub.** Verifica con `git status` que no aparece.
4. **Restringe tu llave de Google** por dominio (la del frontend va expuesta en el navegador).

---

## PASO 5 — Prueba el flujo completo

Desde tu teléfono (con datos móviles, para simular un cliente real):
1. Abre la URL de Vercel.
2. Regístrate o entra como cliente (8092222222 / 123456).
3. Pide un servicio → llena el formulario → confirma.
4. En otra ventana, entra como admin (8090000000) → revisa → aprueba → asigna repartidor.
5. Entra como repartidor (8091111111) → acepta → avanza estados.
6. Vuelve al cliente → mira el progreso.

Si los tres roles funcionan, **estás en internet.** 🎉

---

## Respaldos

Neon hace backups en su plan. Para algo crítico, exporta de vez en cuando:
```bash
pg_dump "TU_DATABASE_URL" > backup.sql
```

---

## Costos

| Servicio | Free | Cuando crezca |
|----------|------|---------------|
| Neon | Sí, generoso | ~$19/mes |
| Render | Sí (duerme tras 15 min) | desde ~$7/mes (siempre despierto) |
| Vercel | Sí, de sobra | — |

**Arrancar: $0.** Cuando tengas tráfico real: ~$7-25/mes.

---

## Limitaciones conocidas (no bloquean lanzar)

- **Backend gratis duerme:** primera carga lenta tras inactividad.
- **Distancia:** si no pones llave de Google, usa línea recta, no carretera.
- **Notificaciones:** WhatsApp/push están en código pero falta conectar el proveedor real.
- **Tracking en vivo y pago online:** todavía no conectados (siguiente fase).
- **Sin recuperación de contraseña** todavía.

Cuando todo esté verde, estás oficialmente en internet. ¡Vamos David! 🪨
