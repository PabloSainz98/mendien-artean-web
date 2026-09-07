# Operación y puesta en producción

## 1. Configuración local

Desde la raíz, sin sobrescribir un `.env` que ya exista:

```sh
cp -n backend/.env.example backend/.env
npm ci
npm run dev
```

`backend/.env` no se publica. No compartas su contenido en capturas o conversaciones. El teléfono y correo de contacto del sitio son datos públicos; las contraseñas y `ADMIN_TOKEN` son secretos del servidor.

Para probar diferentes visitantes, usa ventanas privadas o perfiles distintos del navegador. No hay cuentas ni sesiones de usuario: cada solicitud es independiente. Los datos del formulario viven solo en memoria de la página, no en localStorage ni cookies.

Para probar almacenamiento **sin enviar correos reales**, arranca con:

```sh
DATABASE_PATH=/tmp/uxarbeiti-demo.db BOOKING_CSV_PATH=/tmp/uxarbeiti-demo.csv ACCEPT_BOOKINGS_WITHOUT_EMAIL=true npm start
```

Usa datos ficticios. Ese modo deja notificaciones pendientes; no reutilices esa base de prueba con SMTP real.

`ACCEPT_BOOKINGS_WITHOUT_EMAIL` se ignora con `NODE_ENV=production`: en producción el correo configurado es obligatorio para habilitar solicitudes.

## 2. Correo automático

En `backend/.env` configura el SMTP de una cuenta que ya controles:

```dotenv
SMTP_ENABLED=true
SMTP_HOST=servidor-smtp-de-tu-proveedor
SMTP_PORT=587
SMTP_USER=tu-cuenta
SMTP_PASS=contraseña-o-clave-de-aplicación
SMTP_FROM="Uxarbeiti Baserria <tu-cuenta@tu-dominio>"
BOOKING_NOTIFICATION_TO=pablosainz1998@gmail.com
SMTP_MESSAGE_DOMAIN=tu-dominio
```

El puerto 587 usa STARTTLS obligatorio; 465 usa TLS desde la conexión. No se desactiva la validación del certificado. Si el proveedor requiere una contraseña de aplicación, usa esa, no una clave frontend ni una clave de Google Cloud. Comprueba las instrucciones de tu proveedor antes de activar el envío.

No se envían correos de prueba automáticamente al instalar o arrancar. Las pruebas automatizadas usan un transportador simulado y direcciones `example.test`.

La solicitud y su notificación se guardan en una sola transacción SQLite. Una cola revisa los pendientes cada 15 segundos y reintenta errores con espera creciente, hasta una hora entre intentos. Los fallos son visibles en el listado administrativo (`notification_status`, `notification_error`, `notification_attempts`). Solo se registran códigos de error, no contraseñas ni el contenido del mensaje.

El correo incluye alojamiento, fechas, noches, grupo, contacto, mensaje y desglose. El asunto contiene una referencia estable. `Reply-To` dirige la respuesta al huésped. No se envía automáticamente una confirmación de estancia al visitante.

SMTP ofrece entrega al menos una vez, no exactamente una: si el proceso cae después de que el proveedor acepte el mensaje, podría repetirse una notificación. La referencia y el `Message-ID` son estables; no se duplica la solicitud en SQLite al reintentar el mismo formulario.

## 3. Dónde se guardan los datos

Valores por defecto, resueltos siempre desde `backend/`:

- `data/app.db`: fuente de verdad de solicitudes y cola de correo.
- `data/app.db-wal` y `data/app.db-shm`: archivos auxiliares de SQLite mientras está abierto.
- `data/bookings.csv`: copia regenerada con cada solicitud, compatible con Excel, delimitador `;`, UTF-8 con BOM.

El CSV es una instantánea, no una hoja de cálculo enlazada ni el registro maestro. El estado de correo puede cambiar después de generarlo; el endpoint administrativo exporta el estado actual. No tiene macros ni fórmulas y neutraliza celdas que Excel podría interpretar como fórmulas. Nunca se guarda en `dist/`.

Las migraciones son aditivas. Las solicitudes antiguas conservan su ID, datos y estado; los campos nuevos permanecen vacíos si no existían, sin atribuirles un alojamiento inventado.

Si vienes de la versión anterior, verifica la ubicación real de tu base antes de arrancar. Aquella versión dependía del directorio de ejecución al resolver rutas relativas. Usa una ruta absoluta en `DATABASE_PATH` y `BOOKINGS_CSV_PATH` para apuntar a los datos existentes y haz una copia antes de migrar.

## 4. Administración

Genera un token aleatorio y configúralo solo en `backend/.env`:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Los endpoints requieren `Authorization: Bearer <ADMIN_TOKEN>`. No introduzcas el token en URLs, código público ni capturas. Puedes usar un cliente HTTP local o estas peticiones tras establecer la variable de entorno en tu terminal de forma segura:

```sh
curl -H "Authorization: Bearer $ADMIN_TOKEN" 'http://127.0.0.1:8787/api/admin/booking-requests?limit=100&offset=0'
curl -H "Authorization: Bearer $ADMIN_TOKEN" 'http://127.0.0.1:8787/api/admin/booking-requests.csv' -o /tmp/uxarbeiti-reservas.csv
```

La shell no carga automáticamente `backend/.env`; la variable del comando debe estar definida en esa terminal. No hay panel administrativo público ni usuarios registrados. Nunca abras el repositorio completo con un servidor estático para facilitar el acceso al CSV.

## 5. Hosting propio

Configuración mínima: una única instancia Node con disco persistente, un proxy HTTPS delante y tu proveedor SMTP existente. No uses almacenamiento efímero ni varias réplicas con la misma SQLite en un sistema de archivos de red.

1. Instala Node compatible, obtén el repositorio y ejecuta `npm ci`.
2. Define `SITE_URL` con tu dominio y ejecuta `npm run build`.
3. Configura `.env`: `NODE_ENV=production`, `HOST=127.0.0.1`, un `ADMIN_TOKEN` robusto, SMTP y rutas de datos persistentes fuera del despliegue.
4. Configura `PUBLIC_ORIGIN=https://tu-dominio` y `TRUST_PROXY=loopback` si el proxy corre en la misma máquina. No uses `TRUST_PROXY=true`.
5. Ejecuta `npm start` bajo el gestor de servicios de tu sistema para reiniciar tras fallos o reinicios.
6. El proxy sirve HTTPS y reenvía **todo** a `127.0.0.1:8787`. No debe publicar la raíz del repositorio ni los archivos de datos.
7. Verifica `GET /api/health`, una solicitud autorizada con datos ficticios, la recepción real del correo y el listado protegido. Elimina los datos de prueba siguiendo tu política de conservación.

El modo público completo no está desplegado por este cambio. GitHub Pages puede mostrar las 27 páginas, pero no puede ofrecer la API: no pongas secretos SMTP ni `ADMIN_TOKEN` en GitHub Pages para intentar resolverlo.

## 6. Copias, actualizaciones y privacidad

- Antes de actualizar, haz una copia coherente de SQLite con su API de backup o detén el servidor limpiamente y copia la base cerrada. No copies únicamente `app.db` mientras hay escrituras pendientes en WAL.
- Conserva copias privadas cifradas, con acceso limitado, y comprueba que puedes restaurarlas.
- `npm ci` usa el único lockfile de la raíz. `npm run check` y `npm audit` verifican cambios antes de reiniciar producción.
- Publica solo `dist/`. El código y las imágenes originales quedan en Git; bases, CSV y `.env` están excluidos.
- Define con el titular la política de conservación y borrado. El programa no borra automáticamente solicitudes históricas.
- Revisa antes de lanzar los datos legales del titular, condiciones de estancia, cancelación, tratamiento de menores, política de mascotas y fiscalidad. La página de privacidad es una explicación del flujo implementado, no una validación legal.
- El límite por IP es básico y se reinicia con el proceso. El proxy puede añadir protección adicional frente a abuso. No sustituye una auditoría de seguridad de producción.
