# Backend UXARBEITI

La guía vigente está en [README.md](../README.md) y [docs/OPERACION.md](../docs/OPERACION.md).

Desde la raíz del repositorio:

```sh
npm ci
npm run build
npm start
```

Node.js >= 22.13. SQLite integrado, Express y Nodemailer. El servidor publica exclusivamente `dist/`; nunca el repositorio completo.

- `POST /api/booking-requests`: solicitud con precio recalculado, consentimiento e idempotencia.
- `GET /api/health`: disponibilidad técnica, sin datos privados.
- `GET /api/admin/booking-requests`: listado paginado protegido por bearer token.
- `GET /api/admin/booking-requests.csv`: descarga protegida compatible con Excel.

No existe un endpoint público de huéspedes ni disponibilidad sincronizada. Una solicitud no bloquea fechas ni confirma una reserva. Sin SMTP configurado, el envío queda deshabilitado salvo modo explícito de prueba local.
