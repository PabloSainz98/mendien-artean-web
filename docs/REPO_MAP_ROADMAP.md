# Mapa y siguiente etapa de UXARBEITI

## Estado del rediseño

La versión anterior era una sola página con CSS y traducciones ejecutadas en el navegador. Incluía referencias antiguas a Mendien Artean, datos de calendario de ejemplo y un formulario EmailJS/mailto que no aprovechaba el backend SQLite.

La nueva versión se construye desde `site/` hacia `dist/`. Las 9 páginas se generan en español (raíz), inglés (`en/`) y euskera (`eu/`). Se conserva Node + SQLite en un solo servidor, sin incorporar servicios de calendario ni un CMS remoto.

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
- Menú y páginas funcionales en los tres idiomas. Los nombres de meses se incluyen localmente para que el navegador no sustituya el euskera por español.
- Tipografías alojadas localmente; assets con hash y una lista explícita de imágenes publicables.
- Retirada del antiguo service worker para evitar contenido desactualizado y caché de datos de reserva.
- Tests de precios, migración, validación, API, privacidad, correo y coherencia de páginas.

## Deliberadamente fuera de esta fase

- iCal, Google Calendar y sincronización con Booking/Airbnb.
- Cobros online y confirmación inmediata.
- Usuarios, inicio de sesión y un panel de gestión completo.
- Venta directa de productos, logística e inventario.
- Supuestas valoraciones verificadas, premios concretos no documentados o disponibilidad inventada.

## Antes del lanzamiento

1. Revisar textos de marca e idiomas con el titular; confirmar teléfono de contacto, servicios, capacidad, precio y condiciones infantiles.
2. Elegir servidor con disco persistente y configurar dominio/HTTPS.
3. Configurar SMTP y verificar recepción real en `pablosainz1998@gmail.com`.
4. Configurar administración, copias y conservación de datos.
5. Completar/revisar información legal y condiciones de reserva.
6. Revisar y fusionar el PR. Publicar de forma deliberada, sin sustituir producción automáticamente desde esta rama.

## Posibles mejoras posteriores

La siguiente mejora útil sería un panel privado sencillo para marcar solicitudes como confirmadas, rechazadas o canceladas. La sincronización iCal puede evaluarse después, manteniendo separados los dos alojamientos. Ninguna de estas funciones es necesaria para revisar el nuevo diseño o recibir consultas con el backend propio.

## Fuentes del contenido

La historia, las tarifas y las características proceden de las indicaciones del propietario. Fotografías y logos ya existentes en el repositorio. Los enlaces originales se conservan en `site/content.js`, sin parámetros de sesión ni seguimiento:

- BBK Azoka: https://azoka.bbk.eus/colecciones/uxarbeiti-baserri
- Casa en Booking: https://www.booking.com/hotel/es/casa-de-campo-entre-dos-parques-naturales.es.html
- Casa en Airbnb: https://www.airbnb.es/rooms/26868295
- Domo en Booking: https://www.booking.com/hotel/es/domo-en-plena-naturaleza.es.html
- Domo en Airbnb: https://www.airbnb.es/rooms/1550920029631784546

Los anuncios externos no se usan como fuente automática de precios o disponibilidad. No se ha incorporado una copia de su contenido ni una API de scraping.
