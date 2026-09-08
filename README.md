# UXARBEITI Baserria

Web del complejo rural y explotación familiar de Uxarbeiti, en Igorre (Arratia, Bizkaia). Dos alojamientos: **Domo Gorbeia** y **Urkiola Etxea**.

## Ver la web

Requisito: Node.js >= 22.16 (recomendado Node 24 LTS).

```sh
npm ci
npm run dev
```

Abre `http://localhost:8787`. El comando genera la web, inicia el backend y vuelve a generar las páginas cuando cambias los archivos de `site/` o `shared/`. Recarga el navegador para ver las modificaciones.

No abras un `index.html` antiguo ni publiques la carpeta del repositorio. Las **39 páginas públicas** están en `dist/`, generadas a partir de una única fuente de contenido. Los textos legales nuevos siguen en borrador hasta completar su revisión.

```sh
npm run build  # Generar las páginas públicas
npm test       # Precios, validación, API, migración, emails y enlaces
npm start      # Servir dist/ y la API sin vigilancia de archivos
```

Prueba de navegador reproducible, sin correos reales ni base de datos de producción:

```sh
npx playwright install chromium
npm run test:browser
# Alternativa si ya tienes Google Chrome instalado:
PLAYWRIGHT_CHROME_CHANNEL=chrome npm run test:browser
```

## Qué incluye

- Identidad UXARBEITI, fotografía original del complejo y logo original.
- Inicio, historia familiar, alojamientos, dos fichas individuales con galería, productos, entorno, cómo llegar, reserva y cuatro páginas legales.
- Voz de anfitriones en primera persona del plural; indicaciones de llegada y enlace a la ubicación original, sin mapas incrustados.
- Español, inglés y euskera, con rutas reales y navegación equivalente.
- Tarifas compartidas entre navegador y servidor; temporadas calculadas por noche, niños, mascotas y limpieza.
- Solicitudes persistentes en SQLite, notificación SMTP con reintentos y CSV compatible con Excel.
- Panel privado en `/gestion/`: aceptar, rechazar, cancelar, registrar WhatsApp/teléfono y bloquear fechas.
- Calendario de ocupación por alojamiento, llegadas y salidas próximas, edición con historial y protección ante cambios simultáneos.
- Registro de señales, pagos y devoluciones, con saldo pendiente. Es contabilidad auxiliar: no cobra, no devuelve dinero ni emite facturas.
- Panel flotante para consultas por WhatsApp sin iniciar una reserva y calendario compartido para elegir entrada/salida con dos clics, con edición manual opcional.
- Contraseña con hash scrypt, sesiones privadas de 8 horas, comprobación de solapamientos y correo de decisión al huésped.
- Copias SQLite verificadas dentro del proceso web con `BACKUP_ENABLED=true`, retención de 14 instantáneas y estado visible en gestión. No se abre la base por SSH/NFS.
- Sin framework de navegador, analítica, cookies publicitarias, fuentes remotas, EmailJS ni calendarios externos.

## Mapa del proyecto

| Ruta                       | Contenido                                                                  |
| -------------------------- | -------------------------------------------------------------------------- |
| `site/content.js`          | Textos ES/EN/EU, nombres, fotos, teléfono público y enlaces                |
| `site/templates.js`        | Plantillas HTML de las trece páginas por idioma                            |
| `site/arrival.js`          | Cómo llegar en ES/EN/EU                                                    |
| `site/legal.js`            | Textos legales y primera capa del formulario                               |
| `shared/legal-config.json` | Datos públicos legales pendientes de verificación y aprobación             |
| `site/management/`         | Panel privado de reservas, calendario y registro de pagos                  |
| `site/styles.css`          | Diseño responsive común a los tres idiomas                                 |
| `site/app.js`              | Menú móvil, galerías y consultas generales por WhatsApp                    |
| `site/booking.js`          | Calendario, formulario y resumen móvil; solo se carga en reserva           |
| `site/fonts/`              | Fuentes locales y licencias OFL                                            |
| `shared/pricing.js`        | Única implementación de tarifas y fechas                                   |
| `scripts/build.js`         | Generador estático; solo copia recursos públicos permitidos                |
| `scripts/dev.js`           | Entorno local con regeneración                                             |
| `backend/src/`             | API, SQLite, cola de correo y exportación CSV                              |
| `backend/.env.example`     | Variables del servidor sin credenciales                                    |
| `tests/`                   | Pruebas de regresión y seguridad                                           |
| `images/`                  | Fotografías y logos originales; el archivo de fotos completo no se publica |
| `dist/`                    | Resultado generado, ignorado por Git                                       |

## Tarifas actuales

| Concepto                          | Urkiola Etxea | Domo Gorbeia  |
| --------------------------------- | ------------- | ------------- |
| Baja (resto del año), 1 adulto    | 57 €/noche    | 157 €/noche   |
| Alta (verano + Navidad), 1 adulto | 75 €/noche    | 175 €/noche   |
| Adulto adicional                  | 10 €/noche    | 10 €/noche    |
| Niño (cuna)                       | 5 €/noche     | 5 €/noche     |
| Mascota                           | 10 €/noche    | 10 €/noche    |
| Limpieza final                    | 40 €/estancia | 40 €/estancia |

Alta: **1 de junio a 30 de septiembre y 20 de diciembre a 6 de enero, ambos incluidos**. Cada noche se cobra según su temporada; la salida no se cobra.

Capacidad total: casa 4, domo 3, contando adultos y niños. Se aceptan consultas de 1 a 60 noches y hasta dos años de antelación. El campo niños aplica el suplemento indicado por el propietario; conviene confirmar edades y política de cunas antes del lanzamiento.

Ejemplo: una noche de temporada baja en la casa, 2 adultos, 1 niño y 1 perro = **82 € + 40 € de limpieza = 122 €**. En el domo, **222 €**. No se realiza cobro ni confirmación automática.

## Reservas y correo

Sin configuración SMTP puedes navegar y calcular precios, pero **no enviar solicitudes**. No se simula ningún envío. Configura `backend/.env` siguiendo [la guía de operación](docs/OPERACION.md).

El destinatario de las notificaciones es **pablosainz1998@gmail.com**. El remitente debe ser una cuenta autorizada por tu proveedor SMTP. Al responder al mensaje se contacta con el huésped mediante `Reply-To`. Las credenciales nunca se incluyen en el HTML ni en GitHub.

## Gestión diaria

La persona que instala el backend configura una contraseña con `npm run admin:password` y reinicia el servidor. La propietaria solo necesita entrar en `/gestion/`, revisar la solicitud y pulsar **Aceptar**. No necesita manejar `ADMIN_TOKEN` ni SQLite. El token sigue disponible como alternativa técnica, no para el uso diario.

WhatsApp permite preguntas generales y consultas de estancia sin completar el formulario. Prepara un borrador, pero el cliente debe pulsar Enviar. Cuando se acuerda una estancia, la propietaria la registra en el panel. No hay API de WhatsApp ni sincronización con Booking/Airbnb: registra sus fechas como bloqueos.

## Publicación

**GitHub Pages sirve solo la web estática. No ejecuta el backend ni envía correos.** El formulario mostrará esa limitación y permitirá contactar por WhatsApp. No se requiere Google Cloud ni una aplicación de gestión de reservas.

Para la experiencia completa se necesita un servidor con Node, almacenamiento persistente para SQLite y acceso al SMTP de tu correo. No se añade ninguna suscripción de software, pero el servidor/dominio/correo pueden tener costes si todavía no dispones de ellos.

- El flujo de CI construye, prueba y guarda `dist/` como artefacto del PR.
- El despliegue a Pages es **manual**, desde Actions, sobre `main`, después de revisar el cambio.
- Antes de fusionar, prepara el cambio de Pages a **Settings → Pages → Source: GitHub Actions**. Ya no se sirve un `index.html` desde la raíz del repositorio; después del merge ejecuta el flujo manual de publicación. No dejes Pages configurado para publicar la raíz de `main`.
- Para un dominio propio, configura `SITE_URL=https://tu-dominio/` al construir.

El titular ha contratado alwaysdata Plus Small y la web está disponible en https://uxarbeiti.eus/, con solicitudes abiertas y panel privado en `/gestion/`. Flujo real de formulario, correo, aceptación y cancelación probado con datos ficticios; primera copia verificada. Consulta el estado comprobado en la [guía alwaysdata](docs/HOSTING_ALWAYSDATA.md) y el uso diario en la [guía de reservas](docs/GUIA_RESERVAS.md). El despliegue incluye cambios locales aún no incorporados a `main`.

**La ampliación del panel, los textos en primera persona y «Cómo llegar» están publicados desde el 8 de septiembre a las 18:13 CEST.** Los nuevos avisos legales siguen en borrador: la versión pública conserva la privacidad anterior con `LEGAL_PAGES=published` (30 páginas), sin aprobarla jurídicamente. El build normal mantiene 39 páginas para revisar los borradores localmente. Antes de publicar la revisión legal completa, completa [CUMPLIMIENTO.md](docs/CUMPLIMIENTO.md) y ejecuta:

```sh
SITE_URL=https://uxarbeiti.eus/ npm run release:check
PLAYWRIGHT_CHROME_CHANNEL=chrome npm run test:browser
```

`check:legal` falla de forma deliberada mientras falten titular, registros, condiciones y aprobación. Para construir borradores localmente sigue disponible `npm run build`; para exigir la comprobación en un despliegue, usa `REQUIRE_LEGAL_READY=true`. El control verifica campos, no certifica cumplimiento jurídico.

Consulta [OPERACION.md](docs/OPERACION.md) y [REPO_MAP_ROADMAP.md](docs/REPO_MAP_ROADMAP.md) antes de publicar.
