# Operación y puesta en producción

## 1. Configuración local

Desde la raíz, sin sobrescribir un `.env` que ya exista:

```sh
cp -n backend/.env.example backend/.env
npm ci
npm run dev
```

`backend/.env` no se publica. No compartas su contenido en capturas o conversaciones. El teléfono y correo de contacto del sitio son datos públicos; las contraseñas y `ADMIN_TOKEN` son secretos del servidor.

Para probar diferentes visitantes, usa ventanas privadas o perfiles distintos del navegador. No hay cuentas de visitantes: cada solicitud es independiente. El panel del equipo sí usa sesiones privadas con una cookie HttpOnly. Los datos del formulario viven solo en memoria de la página, no en localStorage ni cookies.

Para probar almacenamiento **sin enviar correos reales**, arranca con:

```sh
DATABASE_PATH=/tmp/uxarbeiti-demo.db BOOKINGS_CSV_PATH=/tmp/uxarbeiti-demo.csv ACCEPT_BOOKINGS_WITHOUT_EMAIL=true npm start
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

El correo incluye alojamiento, fechas, noches, grupo, contacto, mensaje y desglose. El asunto contiene una referencia estable. `Reply-To` dirige la respuesta al huésped. El aviso incluye un enlace al panel cuando PUBLIC_ORIGIN está configurado. Al aceptar, rechazar o cancelar desde el panel se encola un correo al huésped en ES/EN/EU, salvo que el equipo decida explícitamente avisarle de forma manual. No se modifica ninguna reserva simplemente al abrir un enlace del correo.

SMTP ofrece entrega al menos una vez, no exactamente una: si el proceso cae después de que el proveedor acepte el mensaje, podría repetirse una notificación. La referencia y el `Message-ID` son estables; no se duplica la solicitud en SQLite al reintentar el mismo formulario.

## 3. Dónde se guardan los datos

Valores por defecto, resueltos siempre desde `backend/`:

- `data/app.db`: fuente de verdad de solicitudes, estados, bloqueos, sesiones y colas de correo.
- `data/app.db-wal` y `data/app.db-shm`: archivos auxiliares de SQLite mientras está abierto.
- `data/bookings.csv`: copia regenerada con cada solicitud o cambio de estado, compatible con Excel, delimitador `;`, UTF-8 con BOM.

El CSV es una instantánea, no una hoja de cálculo enlazada ni el registro maestro. El estado de correo puede cambiar después de generarlo; el endpoint administrativo exporta el estado actual. No tiene macros ni fórmulas y neutraliza celdas que Excel podría interpretar como fórmulas. Nunca se guarda en `dist/`.

Las migraciones son aditivas. Las solicitudes antiguas conservan su ID, datos y estado; los campos nuevos permanecen vacíos si no existían, sin atribuirles un alojamiento inventado.

Si vienes de la versión anterior, verifica la ubicación real de tu base antes de arrancar. Aquella versión dependía del directorio de ejecución al resolver rutas relativas. Usa una ruta absoluta en `DATABASE_PATH` y `BOOKINGS_CSV_PATH` para apuntar a los datos existentes y haz una copia antes de migrar.

## 4. Administración sin conocimientos técnicos

La persona que instala el servidor ejecuta, desde la raíz:

```sh
npm run admin:password
```

Pide y confirma una contraseña de 12 a 128 caracteres sin mostrarla. Guarda únicamente un hash scrypt en el archivo privado (`backend/.env`, o `UXARBEITI_ENV_PATH` si está definido). Reinicia el backend para aplicarlo. No se pasan contraseñas en argumentos, URLs, chats ni código público. Cambiarla invalida las sesiones anteriores al reiniciar.

Después, entrar en `/gestion/`. Permite revisar, aceptar, rechazar y cancelar solicitudes; consultar el desglose; registrar solicitudes de WhatsApp/teléfono sin correo obligatorio; bloquear ocupaciones externas y descargar CSV. Sin SMTP muestra claramente que hay que avisar personalmente.

La ampliación publicada el 8 de septiembre añade calendario por alojamiento, próximas llegadas/salidas y «Estancia y pagos». Editar requiere un motivo y conserva historial; cambiar fechas vuelve a comprobar conflictos. Cada operación usa la revisión actual para evitar sobrescribir otra sesión. Un cambio de estancia no manda correo por sí solo: acordarlo y comunicarlo al huésped antes de guardarlo. Si un correo está en envío, esperar antes de editar.

Las señales y movimientos son un registro de dinero recibido/devuelto **fuera de la web**, no órdenes al banco ni facturas. No introducir tarjetas, IBAN o datos sensibles en notas. Una cancelación no elimina cobros ni genera devoluciones. Los nuevos datos y el historial están en la misma SQLite; el CSV añade precio acordado, señal, pagado y saldo. Para datos antiguos sin desglose, no se inventan tarifas ni movimientos. Ver [GUIA_RESERVAS.md](GUIA_RESERVAS.md).

Las sesiones duran 8 horas, usan cookie HttpOnly/SameSite=Strict/Secure en producción y un token CSRF en operaciones de escritura. La base conserva únicamente el hash del identificador de sesión. Hay límites de intentos y de verificaciones simultáneas de contraseña. No hay contraseña predeterminada ni recuperación por email; se restablece con el mismo comando por la persona que mantiene el hosting.

El antiguo ADMIN_TOKEN es opcional para integraciones técnicas y conserva el acceso Bearer a los endpoints privados. No es necesario para la propietaria. Nunca se pone en una URL ni en el navegador como sustituto de la contraseña.

Al confirmar se comprueban solapamientos en una transacción SQLite para ese alojamiento. Se permite llegar el mismo día que sale otra reserva. Pendientes no bloquean; confirmadas y bloqueos manuales sí. Rechazar libera una solicitud; cancelar libera una reserva. No hay cobros, devoluciones ni automatización de Booking/Airbnb.

El acceso flotante de WhatsApp permite consultas generales y el botón del formulario admite datos de estancia parciales, sin exigir fechas ni contacto. Solo prepara un borrador con la pregunta o con los detalles disponibles y un presupuesto cuando sea válido. No copia el contacto del formulario ni registra una solicitud en SQLite. El usuario pulsa Enviar; cuando se acuerde una estancia, el equipo debe registrarla y confirmarla en el panel. Sincronización automática de plataformas pendiente. Detalles y pruebas en [UX_CALENDARIO_WHATSAPP.md](UX_CALENDARIO_WHATSAPP.md).

## 5. Hosting propio

La instalación actual usa alwaysdata Plus Small y https://uxarbeiti.eus/, con solicitudes abiertas y gestión privada comprobada. Seguir [HOSTING_ALWAYSDATA.md](HOSTING_ALWAYSDATA.md) para su estado y configuración específica, y [GUIA_RESERVAS.md](GUIA_RESERVAS.md) para el uso diario. No necesita administrar un VPS.

Configuración mínima: una única instancia Node con disco persistente, un proxy HTTPS delante y tu proveedor SMTP existente. No uses almacenamiento efímero ni varias réplicas con la misma SQLite en un sistema de archivos de red.

Los siguientes pasos son para un servidor genérico. En alwaysdata, usar el lanzador y las variables `HOST`/`IP` y `PORT` proporcionadas por el sitio, no los valores locales de este ejemplo.

1. Instala Node compatible, obtén el repositorio y ejecuta `npm ci`.
2. Define `SITE_URL` con tu dominio y ejecuta `npm run build`.
3. Configura `.env`: `NODE_ENV=production`, `HOST=127.0.0.1`, la contraseña del panel, SMTP y rutas de datos persistentes fuera del despliegue.
4. Configura `PUBLIC_ORIGIN=https://tu-dominio` y `TRUST_PROXY=loopback` si el proxy corre en la misma máquina. No uses `TRUST_PROXY=true`.
5. Ejecuta `npm start` bajo el gestor de servicios de tu sistema para reiniciar tras fallos o reinicios.
6. El proxy sirve HTTPS y reenvía **todo** a `127.0.0.1:8787`. No debe publicar la raíz del repositorio ni los archivos de datos.
7. Verifica `GET /api/health`, una solicitud autorizada con datos ficticios, la recepción real del correo y el listado protegido. Elimina los datos de prueba siguiendo tu política de conservación.

La apertura de solicitudes se controla con `BOOKING_REQUESTS_ENABLED`; en producción requiere SMTP y acceso administrativo. Con `BACKUP_REQUIRED=true` también requiere una copia saludable. GitHub Pages puede mostrar las 39 páginas, pero no puede ofrecer la API: no pongas secretos SMTP ni `ADMIN_TOKEN` en GitHub Pages para intentar resolverlo.

Los nuevos textos legales son borradores locales no publicados. Completar [CUMPLIMIENTO.md](CUMPLIMIENTO.md) y `shared/legal-config.json` antes de publicar la revisión legal completa; ejecutar `SITE_URL=https://uxarbeiti.eus/ npm run release:check`. Si otro proceso construye el despliegue directamente, exigir `REQUIRE_LEGAL_READY=true`. El control no verifica licencias ni sustituye asesoramiento jurídico.

## 6. Copias, actualizaciones y privacidad

- En alwaysdata, activa `BACKUP_ENABLED=true` y `BACKUP_REQUIRED=true`: el proceso web ejecuta copias SQLite online cada 24 horas, verifica integridad y conserva 14 instantáneas privadas en `BACKUP_DIRECTORY`. La primera copia y los reintentos se gestionan dentro de ese proceso; no programes otra tarea por SSH, que accede al disco por NFS. Comprueba el estado en el panel. Un fallo o una copia de más de 36 horas cierra nuevas solicitudes, pero no borra reservas ni impide gestionarlas.
- Antes de actualizar, haz una copia coherente de SQLite con su API de backup o detén el servidor limpiamente y copia la base cerrada. No copies únicamente `app.db` mientras hay escrituras pendientes en WAL.
- Conserva copias privadas cifradas, con acceso limitado, y comprueba que puedes restaurarlas.
- `npm ci` usa el único lockfile de la raíz. `npm run check` y `npm audit` verifican cambios antes de reiniciar producción.
- Publica solo `dist/`. El código y las imágenes originales quedan en Git; bases, CSV y `.env` están excluidos.
- Define con el titular la política de conservación y borrado. El programa no borra automáticamente solicitudes históricas.
- Revisa antes de lanzar los datos legales del titular, condiciones de estancia, cancelación, tratamiento de menores, política de mascotas y fiscalidad. La página de privacidad es una explicación del flujo implementado, no una validación legal.
- El límite por IP es básico y se reinicia con el proceso. El proxy puede añadir protección adicional frente a abuso. No sustituye una auditoría de seguridad de producción.
