# Hosting sencillo: alwaysdata + SQLite + correo

Cuenta contratada por el titular: **uxarbeiti**, plan **Plus Small**, dominio **uxarbeiti.eus**. Web publica, gestion privada y solicitudes de reserva activadas el 7 de septiembre de 2026. El titular ha confirmado la recepcion del correo SMTP inicial y que no hay fechas ocupadas en ninguno de los dos alojamientos. Flujo de reserva comprobado en produccion a las 18:27 CEST con datos ficticios y el Gmail del titular como unico destinatario; las fechas de prueba quedaron libres.

El acceso SSH por clave se ha comprobado contra la huella ED25519 mostrada en el panel del proveedor. Las claves privadas permanecen fuera del repositorio. El titular ha reutilizado una contrasena para SSH y SMTP y la ha compartido en capturas: debe sustituirla por claves distintas. La contrasena del panel de reservas es nueva, aleatoria e independiente; solo su hash scrypt se guarda en el servidor.

### Estado de esta instalacion

- **Actualizacion publicada el 8 de septiembre de 2026 a las 18:13 CEST:** `/home/uxarbeiti/apps/uxarbeiti/releases/20260908T161024Z`, seleccionada por `/home/uxarbeiti/uxarbeiti` y reiniciada desde el panel alwaysdata. Incluye primera persona ES/EN/EU, «Como llegar», calendario privado, llegadas/salidas, edicion con historial y registro auxiliar de pagos. SHA256 del paquete: `4000dd1ff659bd106bceabf562b3d909695953ca183b821d71edf0d2142c7838`. Contiene trabajo local no equivalente a `main`.
- **Publicacion parcial legal:** las 30 paginas publicadas usan `LEGAL_PAGES=published`. `shared/published-privacy.json` conserva las cinco secciones y el texto de aceptacion de privacidad que ya estaban visibles en los tres idiomas. No equivale a aprobacion juridica. Aviso legal, condiciones y cookies nuevos siguen fuera del paquete publico; no hay enlaces ni campos pendientes en el formulario publicado. `check:legal` sigue fallando y gestion muestra el aviso pendiente. Ver [CUMPLIMIENTO.md](CUMPLIMIENTO.md).
- Comprobadas las cuatro solicitudes existentes y los bloqueos antes/despues mediante huellas de sus datos, sin cambiarlos ni enviar correos. API de calendario autenticada comprobada y solicitudes abiertas. La copia previa a migracion se creo y verifico a las 18:13:15 CEST, privada con modo 600; el panel confirma copia sana. No se ha abierto la base por SSH.
- El paquete incluye el marcador `scripts/backup-before-start`: el lanzador ejecuta `scripts/backup.js` en el servidor web antes de iniciar la aplicacion y aplicar migraciones. Si falla, no arranca esta version. Ese marcador provoca una copia en cada reinicio de esta version, sujeta a la retencion de 14 instantaneas; no garantiza 14 dias de historial. No ejecutar el lanzador ni esa copia desde SSH/NFS.
- Validacion: 53 pruebas locales, tres recorridos de navegador sobre el paquete publicado y 32 pruebas en memoria con Node 24 en el hosting. Las dos pruebas de disco fueron excluidas del segundo pase remoto porque el primer pase rechazo correctamente NFS; no se deshabilito la proteccion. La copia real se verifico despues desde el proceso web. Las credenciales, destinatarios SMTP, rutas privadas y tarifas no han cambiado.
- Comprobacion publica final: las 30 paginas coinciden exactamente con el paquete, 23 recursos referenciados responden correctamente, rutas privadas y borradores devuelven 404, API privada 401 sin autenticar y gestion utiliza `no-store`. Navegador recargado con primera persona y acceso a «Como llegar» visibles.
- Version anterior conservada: `20260908T104502Z`, comprobada funcionando antes de este despliegue. Incluia consultas WhatsApp, calendario compartido y batua; SHA256 `42c62e87a0c847807a0014a866757c3fc0bf4fa4f61f10d78dc9073cbbddcd9b`. Detalles en [UX_CALENDARIO_WHATSAPP.md](UX_CALENDARIO_WHATSAPP.md).
- Las versiones `20260907T161305Z` y `20260907T153557Z` tambien se conservan como historial. No se ha reemplazado `www/index.html`.
- Configuracion privada en `/home/uxarbeiti/private/uxarbeiti/backend.env`, modo 600 y directorio 700. Contiene la credencial SMTP y el hash de gestion, nunca incluidos en Git. Activos `SMTP_ENABLED=true`, `BACKUP_ENABLED=true`, `BACKUP_REQUIRED=true` y `BOOKING_REQUESTS_ENABLED=true`. `ACCEPT_BOOKINGS_WITHOUT_EMAIL=false`.
- Dependencias instaladas con Node 24 y `npm ci --omit=dev --ignore-scripts`. Comprobacion remota con base exclusivamente en memoria: paginas, API privada y rutas sensibles correctas. No se ha abierto una base persistente por SSH.
- 45 pruebas locales y la prueba de navegador superadas; comprobacion remota con Node 24 y SQLite exclusivamente en memoria. El paquete de reservas tiene SHA256 `d0dee0dc3d5a90ed682cd3e990322464c99ca17bdce8e73161de197b8f08bcdc`. Incluye cambios locales aun no publicados en Git; no equivale a `main` ni a la revision actual del PR.
- Sitio alwaysdata `1074542`: el titular ha cambiado la configuracion a Node.js. Arranque confirmado a las 17:44 del 7 de septiembre de 2026, con el lanzador indicado y la configuracion privada externa. El proceso web ha creado `app.db` y sus auxiliares WAL/SHM con permisos 600, superando la comprobacion que rechaza NFS/SMB. No se ha abierto esa base desde SSH.
- `https://uxarbeiti.eus/` y `/api/health` responden 200; HTTPS validado con certificado Let's Encrypt para el dominio y redireccion desde HTTP comprobada. Al principio se sirvio el certificado por defecto mientras se emitia el propio; la comprobacion posterior ya valida sin excepciones TLS. El subdominio `www` todavia no tiene DNS.
- Chrome contra produccion: paginas ES/EN/EU, imagenes, menu movil y calendario comprobados sin errores JavaScript. `/gestion/` sirve solo la interfaz, con `no-store` y `noindex`; la API de reservas devuelve 401 sin autenticar. Rutas `.env`, Git, codigo de backend y base privada comprobadas con 404. No se han enviado formularios ni correos reales.
- Buzon `reservas@uxarbeiti.eus` creado por el titular. Destinatario confirmado: `pablosainz1998@gmail.com` (con 1998). Autenticacion real por SMTP 465/TLS comprobada. El titular ha confirmado la recepcion tanto del mensaje inicial como de los tres mensajes del flujo de prueba: solicitud, confirmacion y cancelacion. Esto verifica esta prueba concreta, no garantiza la entrega de todos los mensajes futuros.
- Asistente `scripts/setup-smtp.js` instalado aparte en `/home/uxarbeiti/private/uxarbeiti/setup-tools/scripts/`, sin modificar la version de la web en funcionamiento. Solicita la clave sin eco; valida TLS, prueba el destinatario fijo autorizado y actualiza el archivo privado de forma atomica. Rechaza una configuracion SMTP ya activa y conserva las solicitudes desactivadas. No muestra respuestas de error del proveedor que puedan incluir datos privados.
- Proxy comprobado: conexion desde `::1`, con `X-Real-IP` sobrescrito por alwaysdata. Activos `TRUST_PROXY=::1` y `REAL_IP_HEADER=x-real-ip`. Probado que cabeceras falsas no cambian la IP usada para limitar al visitante. La comprobacion de conexion solo existe tras autenticacion. `CANONICAL_REDIRECT=true` conserva el dominio propio como origen del panel.
- Login real por navegador, cookie Secure/HttpOnly/SameSite=Strict, cierre de sesion e inaccesibilidad posterior de la API verificados. Contraseña independiente entregada mediante archivo privado local, no mediante este documento ni Git.
- Primera copia automatica creada y verificada a las 18:22 CEST; permisos 600 comprobados. El proceso verifica la integridad de la instantanea y su tabla de reservas. Esta primera copia precede a las reservas ficticias; la siguiente copia diaria incorporara sus cambios. No se ha ensayado todavia una restauracion completa del sitio ni una copia externa.
- Prueba web `UX-000001`: casa, 12-13 enero 2027, dos adultos, un niño y un perro, total 122 EUR. Formulario, presupuesto servidor, reenvio idempotente, aviso al titular, aceptacion desde el panel, bloqueo solo de la casa, rechazo de solapamiento y cancelacion con liberacion comprobados. Estado final: cancelada.
- Prueba manual `UX-000002`: domo en las mismas fechas y con el mismo grupo, total 222 EUR. Alta por interfaz con canal WhatsApp y sin correo, sin enviar mensajes a WhatsApp. Estado final: rechazada. Se conservaron ambos registros claramente identificados como pruebas; no ocupan fechas.
- CSV privado y panel responsive verificados en Chrome a 1440, 390 y 320 px, sin errores JavaScript. Las paginas de reserva ES/EN/EU cargan calendario. `/api/health` indica `acceptsBookings: true`.
- Pendiente de operacion: sustituir credenciales SMTP/SSH compartidas, revisar informacion legal con el titular y acordar restauracion de prueba, conservacion y copia externa. No hay ocupaciones previas que importar segun su confirmacion. La sincronizacion con Booking/Airbnb no esta implementada.

En **Advanced**, usar `Idle time = 0` para evitar paradas por inactividad que retrasen los reintentos de correo. Esto no garantiza disponibilidad permanente ni reinicios automaticos ante cualquier parada del proveedor. Mantener **Cache > Enable cache** desactivado durante la puesta en marcha y activar **SSL > Force HTTPS**. [Opciones de inactividad del proveedor](https://help.alwaysdata.com/en/docs/web-hosting/sites/misc/).

## Por qué esta opción

Un solo proveedor para ejecutar Node, guardar la base privada y disponer de un buzón SMTP. Evita administrar un VPS, instalar un servidor de correo o contratar un gestor de reservas.

El plan Plus Small publica **5 €/mes sin IVA**, 50 GB SSD, 1 GB RAM, correo y 7 días de copias. El dominio puede tener un coste adicional si no existe. [Tarifas oficiales](https://www.alwaysdata.com/en/offers/plus/).

El plan gratuito está limitado a usos personales, no comerciales. No es adecuado para las reservas de este negocio. [Restricciones oficiales](https://help.alwaysdata.com/en/docs/admin-billing/profile/suspension/).

El proveedor mantiene su plataforma; la aplicación todavía necesita actualizaciones ocasionales y comprobar las copias. No existe una solución honestamente «sin mantenimiento». La propietaria sí puede limitar su trabajo diario al panel de reservas.

## Preparación técnica, una sola vez

1. El titular crea o autoriza una cuenta y el plan. Confirmar primero si ya tiene dominio, hosting y correo; no duplicar servicios innecesariamente. Activar la doble verificación del panel del proveedor.
2. Añadir el dominio al hosting, configurar DNS y HTTPS siguiendo el asistente del proveedor. Revisar SPF, DKIM y DMARC para el buzón de envío. No sustituir registros de correo existentes sin comprobar su uso.
3. Seleccionar **Node 24 LTS**. Crear un sitio de tipo Node.js en **Web > Sites**, no un sitio estático que publique el repositorio. El comando de arranque será `node /home/CUENTA/uxarbeiti/backend/src/server.js`. Sustituir `CUENTA` por el nombre real. [Configuración oficial de Node](https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/).
4. Obtener una revisión aprobada del repositorio en `/home/CUENTA/uxarbeiti`, ejecutar `npm ci` y construir con `SITE_URL=https://TU-DOMINIO/ npm run build`. No desplegar una rama sin revisar. El dominio del build debe ser el mismo que el del backend.
5. Crear `/home/CUENTA/private/uxarbeiti/` con permisos 700, fuera de `dist/`. Aquí estarán configuración, SQLite, CSV y copias. Mantener esta carpeta al actualizar la aplicación.
6. Crear el archivo privado `/home/CUENTA/private/uxarbeiti/backend.env` con permisos 600 y los valores del ejemplo siguiente. No poner claves en Git, GitHub Pages ni variables que genere el frontend.
7. En el entorno del sitio, definir `UXARBEITI_ENV_PATH=/home/CUENTA/private/uxarbeiti/backend.env`. El servidor carga ese archivo sin depender del directorio de arranque.
8. Configurar la contraseña del panel desde una terminal segura, dentro del proyecto: `UXARBEITI_ENV_PATH=/home/CUENTA/private/uxarbeiti/backend.env npm run admin:password`. Se introduce sin eco y solo se guarda el hash. La propietaria conserva la contraseña en su gestor, no el hash.
9. Reiniciar el sitio desde el panel del hosting. La instalación usa una sola instancia y una única base SQLite sobre disco persistente. No activar varias réplicas ni colocar SQLite en un disco compartido entre servidores.

Para esta cuenta, el comando puede ser `sh /home/uxarbeiti/uxarbeiti/scripts/start-alwaysdata.sh`, con `UXARBEITI_ENV_PATH=/home/uxarbeiti/private/uxarbeiti/backend.env` en el entorno del sitio. El lanzador exige las variables del sitio y utiliza Node 24. No iniciar procesos permanentes por SSH.

**Cambios y vuelta atras:** cerrar solicitudes con `BOOKING_REQUESTS_ENABLED=false` y reiniciar antes de una intervencion. Conservar siempre el directorio privado de datos. No volver a la version antigua con SMTP activado: esa version no aplica los controles nuevos de apertura y copias. Las configuraciones anteriores estan en archivos privados `backend.before-bookings.env` y `backend.before-opening.env`; contienen secretos y nunca deben publicarse. Restaurar una configuracion requiere revisar que corresponde a la version y las credenciales actuales, no copiarla a ciegas.

**Almacenamiento comprobado por SSH:** el directorio de la cuenta aparece montado por NFS desde `http22.paris1` en el servidor `ssh2`. Esto no verifica el sistema de archivos visto por el proceso web. Antes de abrir reservas, comprobar que el sitio Node utiliza almacenamiento local. El backend y el programa de copias ahora rechazan montajes NFS/SMB para no abrir SQLite WAL de forma insegura. No crear, consultar ni copiar la base activa desde la sesion SSH si se ve por NFS. [Limitaciones oficiales de SQLite WAL](https://www.sqlite.org/wal.html).

### Configuración privada de producción

Plantilla orientativa: todos los marcadores se sustituyen en el servidor. No contiene credenciales utilizables.

```dotenv
NODE_ENV=production
PUBLIC_ORIGIN=https://TU-DOMINIO
DATABASE_PATH=/home/CUENTA/private/uxarbeiti/app.db
BOOKINGS_CSV_PATH=/home/CUENTA/private/uxarbeiti/bookings.csv
BACKUP_DIRECTORY=/home/CUENTA/private/uxarbeiti/backups
BACKUP_KEEP=14
BACKUP_ENABLED=true
BACKUP_REQUIRED=true
BOOKING_REQUESTS_ENABLED=false
ADMIN_PASSWORD_HASH=
ADMIN_TOKEN=
TRUST_PROXY=false
REAL_IP_HEADER=
CANONICAL_REDIRECT=true
RATE_LIMIT_MAX=120
SMTP_ENABLED=true
SMTP_HOST=smtp-CUENTA.alwaysdata.net
SMTP_PORT=465
SMTP_USER=reservas@TU-DOMINIO
SMTP_PASS=CONTRASENA_DEL_BUZON
SMTP_FROM="Uxarbeiti Baserria <reservas@TU-DOMINIO>"
BOOKING_NOTIFICATION_TO=pablosainz1998@gmail.com
SMTP_MESSAGE_DOMAIN=TU-DOMINIO
ACCEPT_BOOKINGS_WITHOUT_EMAIL=false
```

**No copies `HOST=127.0.0.1` ni `PORT=8787` del ejemplo local a este archivo.** alwaysdata facilita la IP y el puerto del sitio mediante `IP`/`HOST` y `PORT`; el servidor los utiliza. Verifica las direcciones reales de su proxy antes de configurar `TRUST_PROXY` con su lista exacta. Nunca uses `true` o una confianza abierta en cualquier `X-Forwarded-For`. Mientras sea `false`, el límite puede agrupar visitantes tras el proxy. En alwaysdata se usa `REAL_IP_HEADER=x-real-ip` una vez verificado el proxy: el proveedor sobrescribe esa cabecera y la aplicacion la acepta solo de los proxies indicados. [Arquitectura HTTP oficial](https://help.alwaysdata.com/en/docs/web-hosting/sites/http-stack/).

`BOOKING_REQUESTS_ENABLED=false` mantiene cerradas las solicitudes aunque SMTP funcione. Cambiar a `true` y reiniciar solo despues de comprobar gestion, copias y disponibilidad. Con `BACKUP_REQUIRED=true`, se cierran tambien si una copia falla o la ultima copia valida supera 36 horas. La web y el panel siguen accesibles para resolverlo. `/api/admin/system` muestra el estado solo al personal autenticado.

El buzón de envío se crea en el hosting. Usa `smtp-CUENTA.alwaysdata.net` con 465 TLS, el correo completo como usuario y la contraseña de ese buzón. También se admite 587 STARTTLS. No hace falta un proyecto Google Cloud; el destinatario puede seguir siendo Gmail. [SMTP oficial](https://help.alwaysdata.com/en/docs/e-mails/use-an-e-mail-address/).

## Copias automáticas

Con `BACKUP_ENABLED=true`, el proceso web crea y verifica una copia al arrancar si no existe una copia valida de menos de 24 horas. Despues comprueba cada cinco minutos si corresponde otra copia diaria. Reintenta los fallos en esa comprobacion y el panel muestra la ultima copia y los errores. No se necesita una tarea adicional en el panel de alwaysdata.

Las copias se ejecutan en el mismo servidor que abre la base, usando el backup online de SQLite. Se comprueba la integridad y se cierra cada instantanea como archivo independiente, con permisos 600; se conservan las ultimas 14. Esto no garantiza 14 dias de historial ni una copia por cada reserva. Los temporizadores dependen del proceso web: mantener `Idle time = 0`, comprobar el panel y vigilar los avisos del hosting.

El comando manual sigue disponible **solo en el servidor web con acceso local al disco**:

```sh
cd /home/CUENTA/uxarbeiti && UXARBEITI_ENV_PATH=/home/CUENTA/private/uxarbeiti/backend.env node scripts/backup.js
```

**No ejecutar ese comando desde el SSH de esta cuenta:** ve la base por NFS y el programa lo rechaza. Tampoco programarlo en las tareas SSH del proveedor ni copiar un `app.db` abierto ignorando el WAL. [Entorno de tareas del proveedor](https://help.alwaysdata.com/en/docs/web-hosting/tasks/).

Las copias permanecen privadas en el disco del hosting y quedan sujetas a sus copias generales. Esto no sustituye una copia independiente para la pérdida completa de la cuenta: acordar con el titular una copia externa cifrada y una política de conservación, sin contratarla ni transferir datos sin su autorización.

Para restaurar: detener el sitio, conservar la base actual por seguridad, colocar una copia verificada en `DATABASE_PATH` con permisos 600 y retirar los auxiliares WAL/SHM de la base anterior solo con el servidor detenido. No sobrescribir en caliente. Cambiar la contraseña de gestión para invalidar sesiones restauradas y revisar correos pendientes antes de reactivar SMTP. Una copia antigua podría contener notificaciones aún pendientes que ya se enviaron después de tomarla.

## Comprobación antes de abrir reservas

- `/api/health` muestra `acceptsBookings: true`: apertura explicita, SMTP habilitado, acceso administrativo configurado y copia requerida saludable. **No prueba la entrega de correo**.
- `/gestion/` exige contraseña y no muestra reservas sin entrar.
- Realizar una solicitud de prueba acordada con el titular y con destinatarios que controle. Comprobar aviso a `pablosainz1998@gmail.com`, enlace al panel, aceptación y correo al huésped. Confirmar que no llega a spam.
- Probar bloqueo y liberación por alojamiento. Importar manualmente las ocupaciones futuras de Booking/Airbnb antes de permitir solicitudes públicas.
- Comprobar la primera copia automatica, su integridad y sus permisos; verificar posteriormente una copia que contenga la solicitud de prueba.
- Verificar HTTPS, IP de proxy, registros DNS de correo y que `.env`, SQLite, CSV y Git responden 404 desde la web.
- Confirmar datos legales del titular, condiciones de pago/cancelación y conservación de datos con las personas responsables. La web no cobra ni gestiona devoluciones.

## Uso diario de la propietaria

**Correo recibido → abrir enlace → revisar → aceptar o rechazar.** La primera vez inicia sesión; permanece activa 8 horas. El email del huésped se envía en su idioma cuando la decisión se guarda. «Enviado» significa que el servidor de correo lo aceptó, no que el destinatario lo haya leído.

**WhatsApp recibido → Añadir reserva → guardar → aceptar.** Puede dejar el correo vacío y responder por WhatsApp desde la tarjeta. Cada mensaje de WhatsApp debe enviarlo una persona. No hay chatbot ni API de pago. [Funcionamiento de click-to-chat](https://faq.whatsapp.com/5913398998672934).

**Reserva en Booking/Airbnb → Bloquear fechas.** No existe sincronización automática en esta fase. Las solicitudes pendientes no bloquean fechas; las confirmadas y los bloqueos sí. La comprobación de solapamientos protege este registro, no las plataformas que todavía no se hayan anotado.

**Necesita una tabla → Descargar Excel (CSV).** Es una copia de las reservas en ese momento; editarla no cambia la web.
