# Mapa y siguiente etapa de UXARBEITI

## Estado del rediseño

La versión anterior era una sola página con CSS y traducciones ejecutadas en el navegador. Incluía referencias antiguas a Mendien Artean, datos de calendario de ejemplo y un formulario EmailJS/mailto que no aprovechaba el backend SQLite.

La nueva versión se construye desde `site/` hacia `dist/`. Las 13 páginas se generan en español (raíz), inglés (`en/`) y euskera (`eu/`). Se conserva Node + SQLite en un solo servidor, sin incorporar servicios de calendario ni un CMS remoto.

La ampliación del panel, la revisión editorial en primera persona y «Cómo llegar» están **publicados desde el 8 de septiembre de 2026 a las 18:13 CEST**. Los borradores legales siguen fuera de producción. El despliegue parcial conserva la información de privacidad anterior; no supone que la revisión jurídica esté completada. Estado y copia verificada en [HOSTING_ALWAYSDATA.md](HOSTING_ALWAYSDATA.md).

## Implementado

- UXARBEITI como identidad principal; Domo Gorbeia y Urkiola Etxea como alojamientos independientes.
- Portada con la foto del complejo y uso del logo original.
- Historia familiar de Urtza Sarrionandia, Edurtzeta Atutxa e Iñaki Sarrionandia; etapas de los años 80, 2008 y 2013.
- Dos caseríos, agricultura, superficies de cultivo, gallinas y productos propios.
- Productos enlazados al catálogo de BBK Azoka, sin checkout ni stock ficticios.
- Enlaces de entorno facilitados por el propietario, con apertura externa explícita.
- Galerías independientes y accesibles, selector de alojamiento, selección de fechas y presupuesto desglosado.
- Cálculo por noche y temporada compartido entre cliente y servidor.
- Persistencia, idempotencia, notificación SMTP duradera y exportación CSV privada.
- Panel `/gestion/`: contraseña scrypt, sesiones privadas, aceptación/rechazo/cancelación con aviso al huésped, alta de solicitudes manuales y bloqueos de fechas.
- Doble reserva evitada dentro de esta web con comprobación transaccional por alojamiento. Sin sincronización externa: Booking/Airbnb requieren bloqueo manual.
- Temporada alta en junio–septiembre y 20 diciembre–6 enero, incluida Navidad al cruzar de año.
- Copias SQLite online en el proceso web, verificación, retención de 14 instantáneas y estado en el panel; cierre de solicitudes si falla una copia requerida. Protección frente a apertura de SQLite WAL por NFS/SMB.
- Menú y páginas funcionales en los tres idiomas. Los nombres de meses se incluyen localmente para que el navegador no sustituya el euskera por español.
- Consultas generales por WhatsApp en un panel flotante y consultas de estancia con datos parciales, sin contacto obligatorio ni registro automático.
- Calendario compartido de entrada/salida con selección de intervalos, edición manual, teclado y adaptación móvil; revisión editorial de euskera batua.
- Calendario privado por alojamiento y próximas llegadas/salidas, independiente de la paginación de solicitudes.
- Edición de estancias con recálculo, precio acordado opcional, motivo e historial; revisiones y transacciones impiden pisar cambios o confirmar solapamientos.
- Registro auxiliar de señales, pagos y devoluciones en céntimos, reintentos idempotentes y saldo. No ejecuta operaciones bancarias ni factura.
- Primera persona del plural en ES/EN/EU, página de llegada y accesos desde alojamientos, reserva y correo de confirmación.
- Aviso legal, privacidad, condiciones y cookies en borrador, primera capa informativa y versión del aviso. Comprobación de completitud previa a publicación; revisión pendiente del titular según [CUMPLIMIENTO.md](CUMPLIMIENTO.md).
- Tipografías alojadas localmente; assets con hash y una lista explícita de imágenes publicables.
- Retirada del antiguo service worker para evitar contenido desactualizado y caché de datos de reserva.
- Tests de precios, migración, validación, API, privacidad, correo y coherencia de páginas.

## Deliberadamente fuera de esta fase

- iCal, Google Calendar y sincronización con Booking/Airbnb.
- Cobros online y confirmación inmediata.
- Cuentas de huéspedes, múltiples roles de personal y pagos automatizados.
- Venta directa de productos, logística e inventario.
- Supuestas valoraciones verificadas, premios concretos no documentados o disponibilidad inventada.

## Antes del lanzamiento

1. Revisar textos de marca e idiomas con el titular; confirmar teléfono de contacto, servicios, capacidad, precio y condiciones infantiles.
2. Hosting alwaysdata, dominio/HTTPS y proxy por visitante verificados; solicitudes abiertas el 7 de septiembre de 2026.
3. SMTP configurado; el titular confirma recepción en `pablosainz1998@gmail.com` tanto del mensaje inicial como de los tres correos del ciclo completo: solicitud, aceptación y cancelación con datos ficticios.
4. Contraseña de gestión independiente, login y primera copia automática verificados. Acordar conservación de datos, restauración de prueba y copias externas; rotar las credenciales SSH/SMTP expuestas.
5. Completar/revisar información legal y condiciones de reserva. Validar los datos de `shared/legal-config.json`, contratos con proveedores y obligaciones turísticas/fiscales; `npm run check:legal` debe pasar sin confundirlo con una certificación. La conservación y el borrado todavía requieren un procedimiento aprobado.
6. Revisar y fusionar el PR. Publicar de forma deliberada, sin sustituir producción automáticamente desde esta rama.

## Posibles mejoras posteriores

La siguiente etapa es la entrega a la persona que gestionará las reservas y la revisión legal y operativa. El flujo ya está probado en producción: solicitud ficticia web cancelada y solicitud manual rechazada, sin ocupar fechas. El titular confirma que no hay ocupaciones previas que importar. La sincronización iCal puede evaluarse después. No existe garantía de evitar conflictos con plataformas que aún no estén registradas en el panel.

## Fuentes del contenido

La historia, las tarifas y las características proceden de las indicaciones del propietario. Fotografías y logos ya existentes en el repositorio. Los enlaces originales se conservan en `site/content.js`, sin parámetros de sesión ni seguimiento:

- BBK Azoka: https://azoka.bbk.eus/colecciones/uxarbeiti-baserri
- Casa en Booking: https://www.booking.com/hotel/es/casa-de-campo-entre-dos-parques-naturales.es.html
- Casa en Airbnb: https://www.airbnb.es/rooms/26868295
- Domo en Booking: https://www.booking.com/hotel/es/domo-en-plena-naturaleza.es.html
- Domo en Airbnb: https://www.airbnb.es/rooms/1550920029631784546

Los anuncios externos no se usan como fuente automática de precios o disponibilidad. No se ha incorporado una copia de su contenido ni una API de scraping.
