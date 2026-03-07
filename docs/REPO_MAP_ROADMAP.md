# Mapa del Repositorio y Roadmap

Fecha de corte: 7 de marzo de 2026  
Rama actual: `feature/phase2-pro`  
PR activo: https://github.com/PabloSainz98/mendien-artean-web/pull/2

## 1) Objetivo del documento

Este documento resume:

- Que existe hoy en el repositorio.
- Que esta funcionando ya en frontend y backend.
- Que falta para una solucion de reservas propia, segura y facil de mantener.
- Hacia donde se propone evolucionar por fases.

## 2) Stack actual

- Frontend: HTML + CSS + JavaScript vanilla (sin framework).
- Backend propio: Node.js + Express + SQLite nativo (`node:sqlite`).
- Sin servicios de terceros para envio del formulario.
- Sin coste extra de SaaS en el flujo principal actual.

## 3) Inventario del repositorio

### 3.1 Raiz

- `index.html`: pagina principal y secciones (hero, servicios, disponibilidad, formulario, contacto, footer).
- `css/index.css`: variables de diseno, tipografia, base y utilidades.
- `css/components.css`: estilos de componentes (navbar, calendario, formulario, cards, etc.).
- `css/responsive.css`: ajustes responsive y media queries.
- `js/i18n.js`: sistema de traducciones (ES/EN/EU) y switcher.
- `js/main.js`: logica UI (navbar, calendario, galeria, scroll, formulario).
- `images/*.jpg`: recursos visuales del sitio.
- `.gitignore`: exclusiones (logs, node_modules, `.env`, BD local de backend).

### 3.2 Backend

- `backend/package.json`: scripts y dependencias del backend.
- `backend/package-lock.json`: lockfile de dependencias.
- `backend/.env.example`: plantilla de variables de entorno.
- `backend/src/server.js`: servidor Express, rutas API, seguridad base y static serving.
- `backend/src/db.js`: inicializacion SQLite y acceso a tabla de solicitudes.
- `backend/src/validation.js`: validacion de payload del formulario.
- `backend/README.md`: guia de uso local y despliegue.
- `backend/data/app.db`: base de datos SQLite local (ignorada por git).

### 3.3 Git / estado de trabajo

- Remote principal: `origin` -> `https://github.com/PabloSainz98/mendien-artean-web.git`
- Commits recientes clave:
- `810bbb1` backend propio + conexion de formulario.
- `2d5d907` hardening seguridad + mejora visual calendario desktop.

## 4) Funcionalidad implementada hoy

### 4.1 Frontend

- Web multiidioma ES/EN/EU.
- Calendario visual de disponibilidad (actualmente simulado).
- CTA a Booking/Airbnb.
- Formulario de reserva con UX inline de envio:
- estado "enviando",
- mensaje de exito,
- mensaje de error.

### 4.2 Backend API

- `GET /api/health`: estado de servicio.
- `POST /api/booking-requests`: recibe y persiste solicitudes.
- `GET /api/admin/booking-requests`: listado (protegido por token).

### 4.3 Persistencia

- Tabla `booking_requests` con campos:
- `name`, `email`, `phone`, `guests`, `checkin_date`, `checkout_date`, `message`.
- `status`, `source`, `ip_hash`, `created_at`.

## 5) Seguridad actual

- Enlaces externos con `rel="noopener noreferrer"`.
- Aperturas en nueva pestaña endurecidas (`noopener` / `noreferrer`).
- Sanitizacion de traducciones con subconjunto de HTML permitido (`BR`, `STRONG`, `EM`).
- Cabeceras de seguridad via `helmet` en backend.
- `x-powered-by` deshabilitado.
- Validacion server-side estricta del formulario.
- Rate limit basico por IP en memoria.
- Honeypot anti-bots.
- Hash SHA-256 de IP antes de persistir.

## 6) Flujo funcional actual de reservas

1. Usuario rellena formulario en la web.
2. Frontend envia `POST /api/booking-requests` por `fetch`.
3. Backend valida payload.
4. Si pasa validacion, guarda en SQLite.
5. Frontend muestra confirmacion en la propia pagina (sin abrir cliente de correo).

## 7) Limitaciones actuales

- Calendario de disponibilidad aun no refleja reservas reales (es simulado).
- Endpoint admin usa token estatico (sin panel UI ni gestion de sesiones).
- Rate limit en memoria (se pierde al reiniciar proceso).
- Sin suite de tests automatizados (solo checks de sintaxis y pruebas manuales).
- Sin pipeline CI/CD definido.

## 8) Direccion objetivo (sin terceros y facil mantenimiento)

### Fase A: Cierre del backend MVP (inmediata)

1. Endurecer autenticacion admin (usuario + password con hash, no solo token fijo).
2. Exponer un mini panel admin para ver y cambiar estado de solicitudes.
3. Registrar auditoria minima de cambios de estado.
4. Agregar backups automatizados de SQLite.

### Fase B: Operacion segura en produccion

1. Despliegue en VPS propio con Node LTS.
2. Reverse proxy con Caddy o Nginx y TLS.
3. Servicio gestionado por `systemd`.
4. Rotacion de logs y monitoreo basico (healthcheck + alertas sencillas).

### Fase C: Disponibilidad real (cuando se decida)

1. Integrar sync por iCal de Airbnb/Booking.
2. Unificar bloqueos en BD local.
3. Pintar calendario real en frontend via endpoint propio.
4. Mantener la UX de reserva directa para conversion.

## 9) Criterios de exito

- El formulario siempre envia sin abrir aplicaciones externas.
- Las solicitudes quedan persistidas y consultables por admin.
- El stack sigue siendo simple de operar por una sola persona.
- No se introducen costes de SaaS para el flujo base.
- Se minimiza superficie de ataque con configuracion segura por defecto.

## 10) Comandos utiles

- Instalar backend: `cd backend && npm install`
- Ejecutar en desarrollo: `cd backend && npm run dev`
- Ejecutar checks: `cd backend && npm run check`
- Healthcheck local: `curl http://localhost:8787/api/health`

## 11) Decision log breve

- Decidido: backend propio, sin terceros para envio de formulario.
- Decidido: posponer integracion iCal para una fase posterior.
- En curso: consolidar backend y operaciones para preparar merge a `main`.

