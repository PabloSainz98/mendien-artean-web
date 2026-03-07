# Backend propio (sin terceros)

Este backend reemplaza el envio por email del cliente con una API propia y base de datos local.

## Stack

- Node.js (>= 22)
- Express
- SQLite nativo de Node (`node:sqlite`)

## Que hace

- Sirve la web estatica (`/`, `/css`, `/js`, `/images`)
- `POST /api/booking-requests` para guardar solicitudes de reserva
- `GET /api/health` para monitorizacion
- `GET /api/admin/booking-requests` para ver solicitudes (token de admin)

## Seguridad incluida

- Headers de seguridad con `helmet`
- API sin `x-powered-by`
- Validacion server-side de todos los campos
- Rate limiting en memoria por IP
- Honeypot anti-bots
- Hash de IP en base de datos (no IP en claro)

## Configuracion

1. Copia variables:

```bash
cp backend/.env.example backend/.env
```

2. Ajusta al menos `ADMIN_TOKEN`.

## Desarrollo local

```bash
cd backend
npm install
npm run dev
```

Abre la web en [http://localhost:8787](http://localhost:8787)

## Produccion (sin coste de terceros)

- Ejecutar este backend en tu propio servidor/VPS.
- Poner Nginx o Caddy delante con HTTPS.
- Hacer backup diario de `backend/data/app.db`.

## Consultar solicitudes (admin)

```bash
curl -H "Authorization: Bearer TU_TOKEN" "http://localhost:8787/api/admin/booking-requests?limit=100"
```

