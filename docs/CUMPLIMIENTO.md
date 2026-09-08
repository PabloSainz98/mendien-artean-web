# Revisión legal y de privacidad de UXARBEITI

Fecha: 8 de septiembre de 2026. Alcance: código, recorrido de solicitudes, panel de gestión y documentación pública consultada. No es un dictamen, una certificación ni una auditoría de licencias, instalaciones o contabilidad. No se han revisado contratos privados del titular ni firmado acuerdos con proveedores. La web no debe presentarse como «100 % conforme».

## Resultado y bloqueo de publicación

Los textos anteriores no identificaban suficientemente al responsable y mezclaban información de privacidad con consentimiento. Hay nuevas páginas de aviso legal, privacidad, condiciones y cookies en ES/EN/EU; son **borradores no aprobados**, con aviso visible y `noindex`. Noindex no es una medida de seguridad ni permite publicar información incorrecta.

`shared/legal-config.json` contiene únicamente datos destinados a hacerse públicos. Nunca añadir contraseñas, documentos de identidad, escrituras, IBAN ni documentación interna. Completar los siguientes campos con información verificada:

- Titular o razón social exacta, NIF y domicilio profesional. No deducir al titular de la historia familiar.
- Registro mercantil si procede; si no procede, declararlo expresamente después de comprobarlo.
- Número REATE y categoría autorizada de **cada alojamiento**. No asumir que el domo está cubierto por la inscripción de la casa o que el establecimiento es un hotel.
- Condiciones de señal, pagos, cambios, cancelación, no presentación, horarios, mascotas, cuna y capacidad infantil. No inventar una cancelación no reembolsable o un porcentaje de señal.
- Confirmación de que las tarifas publicadas son finales e incluyen los impuestos aplicables. El cálculo actual no añade impuestos; verificar su tratamiento fiscal antes de aprobar el texto.
- Plazos concretos o criterios suficientemente precisos de conservación, incluyendo solicitudes sin contrato, contratos, movimientos, correo, logs y copias.
- Proveedores, papeles contractuales, destinatarios y, cuando corresponda, países, garantías de transferencias y cómo obtener copia de dichas garantías.
- Revisión del titular/asesoría, fecha y traducciones equivalentes. El batua y las traducciones legales requieren una lectura humana final.

`npm run check:legal` falla mientras falten campos/aprobación. `npm run release:check` ejecuta esa comprobación antes del build y los tests; el flujo manual de publicación de Pages también lo exige. `REQUIRE_LEGAL_READY=true npm run build` bloquea un build destinado a publicación incompleto. Son controles de completitud, no validación automática de la veracidad o suficiencia jurídica. En la revisión inicial no se modificó producción. El 8 de septiembre, con autorización expresa del titular para publicar, se desplegaron las mejoras funcionales conservando el aviso anterior como se detalla a continuación.

## Marco revisado

| Materia                    | Aplicación al proyecto y actuación pendiente                                                                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RGPD                       | Solicitudes y estancia: base precontractual/contractual; obligaciones legales por separado. Información, minimización, derechos, seguridad, contratos con encargados y conservación. El checkbox acredita lectura; no autoriza marketing. |
| LOPDGDD                    | Información por capas y reglas españolas, incluido bloqueo cuando proceda. No borrar documentos sujetos a obligación de conservación al recibir una petición sin evaluarla.                                                               |
| LSSI                       | Identificación del prestador, contacto, condiciones e información del proceso electrónico. Cookies no exentas y comunicaciones comerciales requieren tratamiento específico.                                                              |
| Consumo                    | Información previa veraz, precio final y condiciones claras. La exclusión del desistimiento para estancias con fechas concretas no convierte toda cancelación en no reembolsable.                                                         |
| Turismo de Euskadi         | Confirmar categoría, inscripción, capacidad, distintivos, publicidad y régimen de funcionamiento de cada unidad. Especial atención a la autorización del domo.                                                                            |
| Registro de viajeros       | El panel de reservas no es el registro obligatorio ni comunica datos a las autoridades. Revisar altas y procedimiento con la Ertzaintza.                                                                                                  |
| Facturación de Bizkaia     | Consultar situación fiscal, epígrafes y obligaciones Batuz/TicketBAI con gestoría. El registro de cobros del panel y su CSV no emiten ni sustituyen facturas.                                                                             |
| Accesibilidad              | Revisar la aplicación de Ley 11/2023 al servicio y posible excepción para microempresas prestadoras de servicios. No presumir excepción por ser un negocio familiar ni prometer conformidad WCAG sin auditoría.                           |
| Alquiler de corta duración | Consultar si las categorías concretas entran en RD 1312/2024 y normativa de desarrollo para anuncios en plataformas. No confundir su número registral con REATE.                                                                          |
| Productos del caserío      | Esta web enlaza al catálogo externo; no tiene carrito ni vende directamente. Las obligaciones de la explotación/venta física no quedan auditadas aquí. Reabrir revisión de venta, alimentación y consumo si se incorpora checkout.        |

Fuentes oficiales de protección de datos: [RGPD, texto BOE](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807), [LOPDGDD](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673), [AEPD: información no equivale a consentimiento](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/6-el-deber-de-informacion/FAQ-0248-sobre-si-el-usuario-tiene-que-dar-consentimiento-a-clausula-de-privacidad), [información por capas](https://www.aepd.es/prensa-y-comunicacion/blog/la-importancia-de-la-informacion-por-capas-en-el-reglamento-general-de), [guía de cookies](https://www.aepd.es/guias/guia-cookies.pdf).

Fuentes de contratación: [LSSI, artículos 10, 22, 27 y 28](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758), [consumo, información y artículo 103.l](https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555). El acuse de solicitud y la aceptación comercial son pasos distintos: facilitar las condiciones antes de vincular al huésped y entregar confirmación conservable. No añadir el enlace antiguo a la plataforma europea ODR sin verificar su vigencia; no se incluye en estos textos.

Fuentes de turismo: [Ley 13/2016](https://www.boe.es/buscar/act.php?id=BOE-A-2016-8346), [Decreto 199/2013 de alojamientos rurales](https://www.euskadi.eus/eli/es-pv/d/2013/04/16/199/dof/spa/html/web01-a2nekaza/es/), [REATE](https://www.euskadi.eus/registro/registro-de-empresas-y-actividades-turisticas-de-euskadi/web01-tramite/es/), [índice oficial de legislación turística](https://www.euskadi.eus/web01-a2turism/es/contenidos/informacion/legislacion_turistica/es_def/index.shtml). Debe verificarse la versión y tipología aplicable al expediente real; la investigación de código no sustituye esa comprobación administrativa.

Fuentes específicas: [registro hostelero de la Ertzaintza, orden de 2022 e instrucciones](https://www.ertzaintza.euskadi.eus/lfr/es/web/ertzaintza/actividades-relevantes-sc), [AEPD: no solicitar copias de DNI/pasaporte para hospedaje](https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-informa-de-que-no-esta-permitido-solicitar-copia-dni-o-pasaporte-en-hospedajes), [calendario Batuz](https://www.batuz.eus/es/implantacion-definitiva), [Ley 11/2023](https://www.boe.es/buscar/act.php?id=BOE-A-2023-11022), [RD 1312/2024](https://www.boe.es/buscar/act.php?id=BOE-A-2024-26931), [modelo informativo de alquileres](https://www.boe.es/buscar/act.php?id=BOE-A-2025-27116).

## Medidas verificables en el código

- Datos y copias fuera de `dist/`; SQLite no accesible por URL. APIs privadas autenticadas, no-store y protecciones CSRF. Sesión técnica de hasta 8 horas.
- No scripts, píxeles, mapas o chats externos cargados automáticamente. WhatsApp y mapas son enlaces elegidos por el visitante. No añadir un banner vacío como sustituto de una revisión de cookies.
- Primera capa informativa antes del envío, enlaces a segunda capa y condiciones. Aviso versionado mediante fecha y hash del contenido configurado; edición de reservas preserva la versión original. Clientes nuevos mandan la versión y un aviso obsoleto devuelve error; se mantiene compatibilidad con clientes antiguos sin ese campo.
- Desglose calculado en servidor, comprobación transaccional de solapamientos y revisiones para impedir pérdida de cambios entre sesiones.
- Historial interno de cambios limitado a datos de estancia e importes; no conserva copias de los antiguos datos de contacto. Evitar información sensible en motivos y notas libres.
- Movimientos de pago en céntimos enteros, con identificador de reintento y devoluciones explícitas. No hay campos de tarjeta ni conexión con bancos, ni promesa de validez fiscal del registro.
- Cierre de modales y limpieza de datos del DOM al salir o caducar sesión; descargas privadas deben eliminarse del dispositivo cuando dejen de ser necesarias.

## Trabajo organizativo que falta

### Responsable, encargados y transferencias

Preparar un registro de actividades de tratamiento con finalidades, categorías, base, destinatarios, conservación y medidas. Evaluar riesgos y documentar la ponderación de la seguridad. No asumir que una empresa pequeña está exenta de documentar un tratamiento habitual de reservas.

Comprobar el contrato de encargo con alwaysdata, sus subencargados, ubicación, logs y copias. Verificar también los acuerdos y transferencias de correo/WhatsApp. La configuración actual envía datos de reservas a Gmail y puede reenviar correo: **no es correcto afirmar que no intervienen terceros o que toda la información permanece en Europa**. Recomendación para simplificar: usar el buzón profesional del dominio para la gestión, pero solo después de acordar el cambio de destinatario y revisar los reenvíos. No se ha cambiado el correo del titular sin permiso.

### Derechos y conservación

Designar a quien atiende `reservas@uxarbeiti.eus` y comprobar su recepción. Registrar fecha, alcance y respuesta de cada solicitud de derechos; responder en general en un mes, justificando y notificando ampliaciones permitidas. Identificar de manera proporcionada, sin pedir sistemáticamente copia de DNI. Acceso: reunir solo los datos de esa persona, no descargar y remitir el CSV de todos los huéspedes. Rectificación: usar la edición de la ficha y corregir las otras copias relevantes. Supresión/limitación: valorar obligaciones y reclamaciones; bloquear cuando proceda y documentar la actuación.

La conservación **no está automatizada** y no se ha fijado un plazo comercial/fiscal ficticio. Una vez aprobado, implementar una revisión o depuración que incluya SQLite, histórico, colas, CSV, correo y copias. Al restaurar, reaplicar las supresiones registradas para no reintroducir datos eliminados. No borrar datos reales para probar esta función. Los 14 snapshots técnicos actuales no son un calendario jurídico de conservación.

### Seguridad e incidentes

Rotar las contraseñas SSH/SMTP compartidas anteriormente y evitar reutilización; la contraseña del panel es independiente. Activar MFA en el hosting/correo si está disponible, controlar permisos y quién tiene acceso. Mantener dependencias y pruebas. Probar una restauración completa en un entorno aislado sin SMTP saliente y disponer de copia independiente protegida. Documentar incidentes, valorar riesgo y notificación a la autoridad en el plazo RGPD de 72 horas cuando proceda; comunicar a afectados si existe alto riesgo. No se ha contratado ni activado monitorización externa.

### Operación comercial y llegada

Acordar política infantil/cuna: actualmente se cobra 5 € por niño/noche y se cuenta a los niños en la capacidad; no se ha cambiado sin decisión del titular. Confirmar horarios y servicios reales. Entregar las condiciones antes de confirmar y conservar evidencia del acuerdo; un clic de la persona administradora no demuestra por sí solo que el huésped aceptó nuevas condiciones. «Cómo llegar» usa la ubicación ya facilitada y un teléfono, sin inventar calles, distancias ni accesos. Verificar el pin y el último tramo con el titular.

No se automatiza el registro de viajeros, la facturación, iCal ni el reporte a plataformas. Mantener los canales externos actualizados para evitar dobles reservas.

## Cierre de la revisión

Completar configuración y contratos, ejecutar `npm run release:check`, revisar accesibilidad con teclado/lector de pantalla y hacer una reserva de prueba acordada antes de publicar. Guardar fecha, versión y persona que aprueba cada decisión fuera de la web pública. Un check técnico verde no convierte las obligaciones pendientes en cumplidas.

## Publicación parcial autorizada del 8 de septiembre

El titular pidió publicar las mejoras. Se desplegaron textos, llegada y gestión, pero no los borradores legales. `LEGAL_PAGES=published SITE_URL=https://uxarbeiti.eus/ npm run build` genera 30 páginas y elimina las tres rutas legales nuevas de cada idioma si había un build de borradores previo. Conserva el contenido público anterior de privacidad desde `shared/published-privacy.json`, obtenido del dominio antes de actualizarlo. No altera la aprobación ni hace pasar `check:legal`. No es una forma de aprobar textos nuevos incompletos.

El formulario publicado mantiene el texto anterior y registra su versión `published-2026-09-08-...`, sin atribuirle el aviso nuevo. La API admite esa versión transitoria mientras la revisión nueva siga incompleta. Las páginas de aviso legal, condiciones y cookies, y la nueva primera capa informativa, siguen pendientes de datos reales. No se ha certificado el aviso antiguo ni se han resuelto las obligaciones organizativas anteriores. Las mejoras de gestión se han desplegado sin modificar las cuatro solicitudes ni sus bloqueos; copia previa sana comprobada en el proceso web. No se enviaron nuevos correos de prueba.
