# Plataforma de Mandados y Delivery 🛵

App web mobile-first (PWA) para pedir cualquier diligencia: comida, supermercado, farmacia, pagos, recargas, paquetes, documentos y mandados personalizados. Tres roles: **cliente**, **administrador** y **repartidor**.

Stack: **Next.js 15 + React + TypeScript + TailwindCSS + Zustand** (frontend) y **NestJS + Prisma + PostgreSQL + Socket.io** (backend).

---

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL corriendo en tu máquina (o un Postgres en la nube)

---

## 1. Backend (NestJS)

```bash
cd backend
npm install
cp .env.example .env        # edita DATABASE_URL y JWT_SECRET
npx prisma migrate dev --name init   # crea las tablas
npx prisma db seed          # carga servicios y usuarios demo
npm run start:dev           # arranca en http://localhost:4000/api
```

### Usuarios demo (contraseña: `123456`)

| Rol         | Teléfono     |
|-------------|--------------|
| Cliente     | 8092222222   |
| Administrador | 8090000000 |
| Repartidor  | 8091111111   |

---

## 2. Frontend (Next.js)

En otra terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local   # apunta a http://localhost:4000/api
npm run dev                        # arranca en http://localhost:3000
```

Abre **http://localhost:3000** en el navegador (o en el móvil con el modo responsive). Es mobile-first: se ve mejor en pantalla de teléfono.

---

## 3. Prueba el flujo completo

1. Entra como **cliente** (8092222222) → elige un servicio → llena el formulario → escribe una dirección → mira el precio estimado actualizarse → confirma.
2. Entra como **admin** (8090000000) en otra ventana → pestaña Pedidos → Revisar → Aprobar → asigna un repartidor.
3. Entra como **repartidor** (8091111111) → acepta el pedido → avanza los estados hasta Entregado.
4. Vuelve al cliente → Historial → ve el progreso del pedido.

---

## Estructura

```
backend/
  prisma/schema.prisma   → las 10 tablas y relaciones
  prisma/seed.ts         → datos iniciales
  src/modules/           → auth, orders, pricing, deliveries,
                           tracking (WebSocket), notifications, etc.
frontend/
  src/app/               → landing, login, cliente, admin, repartidor
  src/lib/api.ts         → cliente HTTP tipado
  src/stores/auth.ts     → estado global (Zustand)
  src/components/ui.tsx   → botones, inputs, badges
```

---

## Notas para producción

- **Mapas**: el cálculo de distancia usa Haversine (línea recta). Reemplázalo por Google Distance Matrix API para distancia real por carretera, y añade autocompletado con Places API en el campo de dirección.
- **Notificaciones**: el módulo registra y loguea los envíos. Conecta WhatsApp Business API, FCM (push) y SMTP (email) en `notifications.service.ts`.
- **Tracking en vivo**: el gateway de Socket.io ya está listo (`tracking.gateway.ts`). Conecta la app del repartidor para emitir GPS y el cliente para escuchar.
- **Tarifas**: se editan desde la base (`pricing_rules`) sin tocar código. El endpoint admin `/pricing-rules` ya existe.
- **Seguridad**: cambia `JWT_SECRET`, usa HTTPS, añade rate limiting en login y creación de pedidos.

---

## Cómo agregar un servicio nuevo (sin tocar el código)

Inserta una fila en la tabla `services` con su `formSchema` (los campos del formulario). La app lo muestra solo en el slider y genera el formulario. Esa es la idea central: **los servicios son datos, no código**.
