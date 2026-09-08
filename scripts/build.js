'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pages, renderPage } = require('../site/templates');
const { properties, business, locales } = require('../site/content');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function build() {
  if (!['draft', 'published'].includes(process.env.LEGAL_PAGES || 'draft'))
    throw new Error('Invalid LEGAL_PAGES mode');
  if (process.env.REQUIRE_LEGAL_READY === 'true') {
    const { issues } = require('../shared/legal');
    if (issues().length) throw new Error('Legal information incomplete. Run npm run check:legal.');
  }
  const siteUrl = new URL(
    process.env.SITE_URL || 'https://pablosainz98.github.io/mendien-artean-web/',
  );
  if (
    !['https:', 'http:'].includes(siteUrl.protocol) ||
    siteUrl.search ||
    siteUrl.hash ||
    siteUrl.username ||
    siteUrl.password
  )
    throw new Error('Invalid SITE_URL');
  siteUrl.pathname = siteUrl.pathname.replace(/\/?$/, '/');
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  if (process.env.LEGAL_PAGES === 'published') {
    // Switching from a local draft build must never leave unpublished pages behind.
    for (const lang of ['', 'en', 'eu'])
      for (const page of ['aviso-legal', 'condiciones', 'cookies'])
        fs.rmSync(path.join(dist, lang, `${page}.html`), { force: true });
  }
  const assets = {};
  for (const [key, source, extension] of [
    ['css', 'site/styles.css', 'css'],
    ['js', 'site/app.js', 'js'],
    ['pricing', 'shared/pricing.js', 'js'],
  ]) {
    const content = fs.readFileSync(path.join(root, source));
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 10);
    assets[key] =
      `assets/${key === 'js' ? 'app' : key === 'css' ? 'styles' : key}.${hash}.${extension}`;
    fs.writeFileSync(path.join(dist, assets[key]), content);
  }
  fs.cpSync(path.join(root, 'site/fonts'), path.join(dist, 'assets/fonts'), { recursive: true });
  fs.cpSync(path.join(root, 'site/management'), path.join(dist, 'gestion'), { recursive: true });
  fs.copyFileSync(path.join(root, 'shared/pricing.js'), path.join(dist, 'gestion/pricing.js'));
  // Only publish explicitly referenced media, never the repository or original photo archive.
  const media = new Set([
    business.hero,
    'images/uxarbeiti/logo-light.png',
    ...Object.values(properties).flatMap((p) => p.photos),
  ]);
  for (const file of media) {
    fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(dist, file));
  }
  for (const lang of Object.keys(locales)) {
    const dir = lang === 'es' ? dist : path.join(dist, lang);
    fs.mkdirSync(dir, { recursive: true });
    for (const page of pages)
      fs.writeFileSync(
        path.join(dir, `${page}.html`),
        renderPage(page, lang, assets, siteUrl.href),
      );
  }
  const urls = Object.keys(locales).flatMap((lang) =>
    pages.map(
      (page) =>
        `${siteUrl.href}${lang === 'es' ? '' : lang + '/'}${page === 'index' ? '' : page + '.html'}`,
    ),
  );
  fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`,
  );
  fs.writeFileSync(
    path.join(dist, 'robots.txt'),
    `User-agent: *\nDisallow: /api/\nDisallow: /gestion/\nSitemap: ${siteUrl.href}sitemap.xml\n`,
  );
  fs.writeFileSync(
    path.join(dist, 'manifest.webmanifest'),
    JSON.stringify({
      name: 'UXARBEITI Baserria',
      short_name: 'UXARBEITI',
      lang: 'es',
      start_url: './',
      scope: './',
      display: 'browser',
      background_color: '#f8f7f1',
      theme_color: '#243e32',
      icons: [
        {
          src: './images/uxarbeiti/logo-light.png',
          sizes: '900x900',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    }),
  );
  fs.writeFileSync(path.join(dist, '.nojekyll'), '');
  fs.copyFileSync(path.join(root, 'site/sw.js'), path.join(dist, 'sw.js'));
  console.log(
    `Built ${pages.length * Object.keys(locales).length} pages in dist/ (${media.size} original images).`,
  );
  return { dist, assets };
}

if (require.main === module) build();
module.exports = { build };
