# UXARBEITI Baserria

Web del complejo rural y explotación familiar de Uxarbeiti, en Igorre (Arratia, Bizkaia). Dos alojamientos: **Domo Gorbeia** y **Urkiola Etxea**.

## Ver la web

Requisito: Node.js >= 22.13 (recomendado Node 24 LTS).

```sh
npm ci
npm run dev
```

Abre `http://localhost:8787`. El comando genera la web, inicia el backend y vuelve a generar las páginas cuando cambias los archivos de `site/` o `shared/`. Recarga el navegador para ver las modificaciones.

No abras un `index.html` antiguo ni publiques la carpeta del repositorio. Las **27 páginas finales** están en `dist/`, generadas a partir de una única fuente de contenido.

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
- Inicio, historia familiar, alojamientos, dos fichas individuales con galería, productos, entorno, reserva y privacidad.
- Español, inglés y euskera, con rutas reales y navegación equivalente.
- Tarifas compartidas entre navegador y servidor; temporadas calculadas por noche, niños, mascotas y limpieza.
- Solicitudes persistentes en SQLite, notificación SMTP con reintentos y CSV compatible con Excel.
- Sin framework de navegador, analítica, cookies publicitarias, fuentes remotas, EmailJS ni calendarios externos.

## Mapa del proyecto

| Ruta                   | Contenido                                                                  |
| ---------------------- | -------------------------------------------------------------------------- |
| `site/content.js`      | Textos ES/EN/EU, nombres, fotos, teléfono público y enlaces                |
| `site/templates.js`    | Plantillas HTML de las nueve páginas                                       |
| `site/styles.css`      | Diseño responsive común a los tres idiomas                                 |
| `site/app.js`          | Menú móvil, galerías, calendario y formulario                              |
| `site/fonts/`          | Fuentes locales y licencias OFL                                            |
| `shared/pricing.js`    | Única implementación de tarifas y fechas                                   |
| `scripts/build.js`     | Generador estático; solo copia recursos públicos permitidos                |
| `scripts/dev.js`       | Entorno local con regeneración                                             |
| `backend/src/`         | API, SQLite, cola de correo y exportación CSV                              |
| `backend/.env.example` | Variables del servidor sin credenciales                                    |
| `tests/`               | Pruebas de regresión y seguridad                                           |
| `images/`              | Fotografías y logos originales; el archivo de fotos completo no se publica |
| `dist/`                | Resultado generado, ignorado por Git                                       |

## Tarifas actuales

| Concepto                                 | Urkiola Etxea | Domo Gorbeia  |
| ---------------------------------------- | ------------- | ------------- |
| Enero-mayo y octubre-diciembre, 1 adulto | 57 €/noche    | 157 €/noche   |
| Junio-septiembre, 1 adulto               | 75 €/noche    | 175 €/noche   |
| Adulto adicional                         | 10 €/noche    | 10 €/noche    |
| Niño (cuna)                              | 5 €/noche     | 5 €/noche     |
| Mascota                                  | 10 €/noche    | 10 €/noche    |
| Limpieza final                           | 40 €/estancia | 40 €/estancia |

Capacidad total: casa 4, domo 3, contando adultos y niños. Se aceptan consultas de 1 a 60 noches y hasta dos años de antelación. El campo niños aplica el suplemento indicado por el propietario; conviene confirmar edades y política de cunas antes del lanzamiento.

Ejemplo: una noche de invierno en la casa, 2 adultos, 1 niño y 1 perro = **82 € + 40 € de limpieza = 122 €**. En el domo, **222 €**. No se realiza cobro ni confirmación automática.

## Reservas y correo

Sin configuración SMTP puedes navegar y calcular precios, pero **no enviar solicitudes**. No se simula ningún envío. Configura `backend/.env` siguiendo [la guía de operación](docs/OPERACION.md).

El destinatario de las notificaciones es **pablosainz1998@gmail.com**. El remitente debe ser una cuenta autorizada por tu proveedor SMTP. Al responder al mensaje se contacta con el huésped mediante `Reply-To`. Las credenciales nunca se incluyen en el HTML ni en GitHub.

## Publicación

**GitHub Pages sirve solo la web estática. No ejecuta el backend ni envía correos.** El formulario mostrará esa limitación y permitirá contactar por WhatsApp. No se requiere Google Cloud ni una aplicación de gestión de reservas.

Para la experiencia completa se necesita un servidor con Node, almacenamiento persistente para SQLite y acceso al SMTP de tu correo. No se añade ninguna suscripción de software, pero el servidor/dominio/correo pueden tener costes si todavía no dispones de ellos.

- El flujo de CI construye, prueba y guarda `dist/` como artefacto del PR.
- El despliegue a Pages es **manual**, desde Actions, sobre `main`, después de revisar el cambio.
- Antes de fusionar, prepara el cambio de Pages a **Settings → Pages → Source: GitHub Actions**. Ya no se sirve un `index.html` desde la raíz del repositorio; después del merge ejecuta el flujo manual de publicación. No dejes Pages configurado para publicar la raíz de `main`.
- Para un dominio propio, configura `SITE_URL=https://tu-dominio/` al construir.

Consulta [OPERACION.md](docs/OPERACION.md) y [REPO_MAP_ROADMAP.md](docs/REPO_MAP_ROADMAP.md) antes de publicar.
