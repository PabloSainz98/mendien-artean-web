# Consultas y selección de fechas

Actualización del 8 de septiembre de 2026. Conserva el diseño, las tarifas y el backend existente; no añade dependencias ni servicios de pago.

## Consultas por WhatsApp

- El acceso flotante de las páginas públicas abre un panel de consultas: disponibilidad, precios u otra pregunta. No aparece en la gestión privada.
- El mensaje es opcional. Al continuar se abre WhatsApp en otra pestaña con un borrador; una persona debe enviarlo.
- El panel no carga un SDK de WhatsApp, no llama al backend ni crea solicitudes. El texto se mantiene únicamente en memoria mientras la página está abierta.
- Sin JavaScript, el acceso sigue funcionando como enlace directo a WhatsApp.
- El botón del formulario también funciona sin fechas, sin contacto, sin consentimiento marcado y sin completar el grupo. Incluye solo las fechas y cantidades válidas disponibles y, si se puede calcular, el presupuesto.
- No se copian el nombre, el correo, el teléfono ni las notas del formulario al borrador de consulta de la estancia. La pregunta escrita expresamente en el panel general sí forma parte de ese borrador.
- La solicitud formal sigue requiriendo sus datos, consentimiento y un presupuesto válido, con la validación del servidor intacta.

## Calendario compartido

- Las casillas de entrada y salida abren el mismo diálogo. El primer clic elige entrada; el siguiente elige salida y cierra el calendario.
- La casilla de salida permite cambiar solo esa fecha. Elegir otra entrada inicia un intervalo nuevo.
- Dos meses en escritorio y uno en móvil, selección entre meses, vista previa del intervalo y total actualizado.
- Flechas del teclado para recorrer fechas, Intro para seleccionar y Escape para cerrar. El foco vuelve al control que abrió el diálogo.
- La opción «Escribir las fechas a mano» conserva los campos de fecha nativos. Sin JavaScript se muestran directamente.
- Se mantienen el límite de 60 noches, el horizonte de entrada y los bloqueos por alojamiento. Se permite salir el día que empieza otra reserva, pero no atravesar una estancia ocupada.

## Euskera batua

Revisión editorial de los textos públicos, formularios, avisos y notificaciones en euskera. Se han simplificado calcos, unificado «eskaera» en el flujo de solicitudes, mejorado la narración de la historia y corregido la expresión de intervalos de fechas. No se han alterado nombres propios, cifras, capacidad, servicios ni tarifas.

Se mantienen las formas estándar «denboraldi», «behe-denboraldi» y «goi-denboraldi», diferenciadas de las formas vizcaínas en el [diccionario Labayru](https://hiztegia.labayru.eus/emaitza/LH/all/denboraldi/2458361?locale=es). Los meses se incluyen localmente para evitar que el navegador cambie de idioma.

Esta revisión busca una redacción natural en batua, no constituye una certificación lingüística. Una lectura final por una persona competente en batua puede afinar el tono de marca.

## Verificación

45 pruebas de Node y dos recorridos de navegador superados. Chrome comprobado en ES/EN/EU a 1440, 390 y 320 px: selección por clic y teclado, cambio de mes, edición de salida, entrada nueva, fechas bloqueadas, edición manual y modo sin JavaScript. Consultas generales, parciales y con campos inválidos sin guardado ni filtración de datos del formulario. Las pruebas usan datos ficticios, sin enviar correos ni mensajes reales.

El despliegue conserva configuración, SQLite y copias privadas. Requiere seleccionar la nueva versión y reiniciar el sitio; editar el repositorio por sí solo no cambia la web publicada.
