'use strict';
const { business, properties, activityLinks, locales } = require('./content');
const { legalContent } = require('./legal');
const arrival = require('./arrival');
const { config: legalConfig } = require('../shared/legal');
const legalMode = process.env.LEGAL_PAGES || 'draft';
const pages = [
  'como-llegar',
  'aviso-legal',
  'condiciones',
  'cookies',
  'index',
  'historia',
  'alojamientos',
  'domo-gorbeia',
  'urkiola-etxea',
  'productos',
  'entorno',
  'reserva',
  'privacidad',
].filter(
  (page) => legalMode !== 'published' || !['aviso-legal', 'condiciones', 'cookies'].includes(page),
);
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const lines = (text) => escape(text).replace(/\n/g, ' <br>');
const arrow =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
const diagonal =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const check =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>';
const chatIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8 9 9 0 0 1-3.7-.8L4 20l1.3-4.3a8 8 0 1 1 14.7-4.2Z"/><path d="M8 10h8M8 14h5"/></svg>';

function renderPage(page, lang, assets, siteUrl, options = {}) {
  const t = locales[lang];
  const legal = legalContent(lang, options.legalMode || legalMode);
  const a = arrival[lang];
  const root = lang === 'es' ? './' : '../';
  const link = (name, language = lang) =>
    `${root}${language === 'es' ? '' : `${language}/`}${name === 'index' ? 'index.html' : `${name}.html`}`;
  const asset = (file) => root + file;
  const whatsappUrl = (message) => {
    const url = new URL(`https://wa.me/${business.phoneRaw}`);
    url.searchParams.set('text', message);
    return escape(url.href);
  };
  const contactPopup = `<a id="contact-launcher" class="contact-launcher" href="${whatsappUrl(t.chat.hello)}" target="_blank" rel="noopener noreferrer" aria-label="${t.ui.whatsapp}">${chatIcon}<span>${t.chat.launcher}</span></a><dialog id="contact-dialog" class="contact-dialog" aria-labelledby="contact-title" aria-describedby="contact-intro"><div class="contact-panel"><button type="button" class="icon-button close-dialog" aria-label="${t.ui.close}">×</button><p class="eyebrow">UXARBEITI · WHATSAPP</p><h2 id="contact-title" tabindex="-1" autofocus>${t.chat.title}</h2><p id="contact-intro">${t.chat.intro}</p><div class="contact-topics">${t.chat.topics.map((topic, i) => `<button type="button" data-chat-message="${escape(t.chat.messages[i])}" aria-pressed="false">${topic}</button>`).join('')}</div><label for="contact-message">${t.chat.question}</label><textarea id="contact-message" rows="3" maxlength="800" placeholder="${t.chat.placeholder}"></textarea><a class="button" id="contact-continue" href="${whatsappUrl(t.chat.hello)}" data-default-message="${escape(t.chat.hello)}" target="_blank" rel="noopener noreferrer">${t.chat.continue}${diagonal}<span class="sr-only"> (${t.ui.external})</span></a><p class="fine-print">${t.chat.note}</p></div></dialog>`;
  const img = (src, alt, { priority = false, className = '' } = {}) =>
    `<img src="${asset(src)}" alt="${escape(alt)}" width="${src === business.hero ? 1600 : src.includes('domo/') ? 1600 : 1024}" height="${src === business.hero ? 1200 : src.includes('domo/') ? 737 : 768}" ${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" class="${className}">`;
  const external = (href, text, className = 'text-link') =>
    `<a class="${className}" href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(text)}${diagonal}<span class="sr-only"> (${t.ui.external})</span></a>`;
  const cta = (href, text, className = 'button') =>
    `<a class="${className}" href="${escape(href)}">${escape(text)}${arrow}</a>`;
  const eyebrow = (text) => `<p class="eyebrow">${escape(text)}</p>`;
  const intro = (data, className = '') =>
    `<header class="page-intro wrap ${className}">${eyebrow(data.eyebrow)}<h1>${lines(data.title)}</h1><p class="lead">${escape(data.intro)}</p></header>`;
  const logo = (className = '') =>
    `<span class="brand-logo ${className}"><img src="${asset('images/uxarbeiti/logo-light.png')}" width="900" height="900" alt="UXARBEITI · barruko begirada"></span>`;
  const navigation = (mobile = false) =>
    `<nav aria-label="${t.ui.menu}" class="${mobile ? 'mobile-links' : 'desktop-links'}">${['historia', 'alojamientos', 'productos', 'entorno', 'como-llegar'].map((name) => `<a href="${link(name)}" ${page === name || (name === 'alojamientos' && page.includes('etxea')) || (name === 'alojamientos' && page.includes('gorbeia')) ? 'aria-current="page"' : ''}>${name === 'como-llegar' ? a.nav : t.nav[name]}</a>`).join('')}</nav>`;
  const languages = () =>
    `<nav class="languages" aria-label="Language">${Object.keys(locales)
      .map(
        (code) =>
          `<a href="${link(page, code)}" lang="${code}" hreflang="${code}" aria-label="${locales[code].language}" ${lang === code ? 'aria-current="true"' : ''}>${code.toUpperCase()}</a>`,
      )
      .join('')}</nav>`;
  const header = `<a class="skip-link" href="#main">${t.ui.skip}</a><header class="site-header"><div class="header-inner"><a class="brand" href="${link('index')}" aria-label="UXARBEITI · ${t.nav.home}">${logo()}<span class="brand-type">UXARBEITI<small>BASERRIA</small></span></a>${navigation()}<div class="header-actions">${languages()}${cta(link('reserva'), t.nav.reserva, 'button button-small')}<button class="menu-toggle icon-button" aria-label="${t.ui.menu}" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button></div></div></header><dialog id="mobile-menu" class="mobile-menu"><button class="icon-button close-dialog" aria-label="${t.ui.close}">×</button>${eyebrow('UXARBEITI BASERRIA')}${navigation(true)}${cta(link('reserva'), t.nav.reserva)}${languages()}<p>${t.ui.location}</p></dialog>`;
  const footer = `<footer class="site-footer"><div class="wrap"><div class="footer-top"><div>${eyebrow(t.ui.location)}<h2>${escape(t.ui.footer)}</h2><p>${escape(t.ui.footerNote)}</p></div><div class="footer-contact">${eyebrow(t.ui.contact)}<a href="mailto:${business.email}">${business.email}</a><a href="tel:+${business.phoneRaw}">${business.phone}</a>${cta(link('como-llegar'), a.nav, 'text-link')}</div></div><div class="footer-bottom">${logo('footer-logo')}<p>${new Date().getUTCFullYear()} · ${t.ui.rights}</p><nav class="legal-links" aria-label="${legal.notice}">${Object.entries(
    legal.pages,
  )
    .map(([key, value]) => `<a href="${link(key)}">${value.title}</a>`)
    .join('')}</nav>${languages()}</div></div></footer>`;
  const facts = (key) =>
    `<ul class="facts">${t.properties[key].facts.map((fact) => `<li>${escape(fact)}</li>`).join('')}</ul>`;
  const card = (key, index = 1) => {
    const p = properties[key];
    const copy = t.properties[key];
    return `<a class="stay-card stay-card-${key}" href="${link(p.page)}"><div class="stay-image">${img(p.cover, copy.photoLabels[0])}<span class="stay-number">0${index}</span><span class="round-arrow">${arrow}</span></div><div class="stay-copy">${eyebrow(copy.type)}<h3>${p.name}</h3><p>${escape(copy.short)}</p>${facts(key)}<div class="stay-bottom"><span>${t.ui.from} <strong>${p.low} €</strong> ${t.ui.night}</span><span class="text-link">${t.ui.discover}${arrow}</span></div></div></a>`;
  };
  const stats = () =>
    `<div class="farm-stats">${t.story.stats.map(([number, text]) => `<div><strong>${escape(number)}</strong><span>${escape(text)}</span></div>`).join('')}</div>`;
  const bookingCta = () =>
    `<section class="closing-cta wrap"><div>${eyebrow(t.booking.eyebrow)}<h2>${lines(t.booking.title)}</h2></div><div>${cta(link('reserva'), t.ui.book)}<p class="fine-print">${t.ui.availabilityNote}</p></div></section>`;
  let body;
  let title;
  let description;
  let image = business.hero;

  if (page === 'index') {
    title = 'UXARBEITI Baserria · Igorre, Arratia';
    description = t.home.intro;
    body = `<section class="hero">${img(business.hero, `Uxarbeiti Baserria · ${t.ui.location}`, { priority: true, className: 'hero-image' })}<div class="hero-shade"></div><div class="hero-copy wrap">${eyebrow(t.home.eyebrow)}<h1>${lines(t.home.title)}</h1><p>${escape(t.home.intro)}</p>${cta(link('alojamientos'), t.ui.allStays, 'button button-cream')}</div><div class="hero-bottom wrap"><span>${t.ui.location}</span><a href="#raices">${t.home.scroll}<span aria-hidden="true">↓</span></a></div></section>
      <section class="story-preview wrap section" id="raices"><div class="story-visual"><figure>${img(business.hero, 'Uxarbeiti Baserria')}</figure><span class="farm-stamp">${lines(t.home.stamp)}</span><span class="photo-caption">UXARBEITI · IGORRE, BIZKAIA</span></div><div class="editorial-copy">${eyebrow(t.home.storyEyebrow)}<h2>${lines(t.home.storyTitle)}</h2><p>${escape(t.home.storyText)}</p>${cta(link('historia'), t.ui.story, 'text-link')}</div></section>
      <section class="stays-section section"><div class="wrap"><header class="section-heading"><div>${eyebrow(t.home.staysEyebrow)}<h2>${lines(t.home.staysTitle)}</h2></div><p>${escape(t.home.staysText)}</p></header><div class="stays-grid">${card('domo', 1)}${card('casa', 2)}</div><p class="fine-print">${t.ui.pricingNote}</p></div></section>
      <section class="produce-preview"><div class="wrap produce-layout"><div>${eyebrow(t.home.produceEyebrow)}<h2>${lines(t.home.produceTitle)}</h2><p>${escape(t.home.produceText)}</p>${cta(link('productos'), t.nav.productos, 'button button-cream')}</div><div class="produce-list">${t.products.groups
        .slice(0, 3)
        .map(
          ([num, name]) =>
            `<a href="${link('productos')}"><span>${num}</span><h3>${name}</h3>${diagonal}</a>`,
        )
        .join('')}</div></div></section>
      <section class="surroundings-preview wrap section"><div class="landscape-frame">${img('images/domo/domo-exterior-aerea.jpg', 'Gorbeia · Arratia')}<span class="image-label">43° N / 2° W<br>ARRATIA · EUSKAL HERRIA</span></div><div class="editorial-copy">${eyebrow(t.surroundings.eyebrow)}<h2>${lines(t.home.surroundingsTitle)}</h2><p>${escape(t.home.surroundingsText)}</p>${cta(link('entorno'), t.home.surroundingsCta, 'text-link')}</div></section>${bookingCta()}`;
  } else if (page === 'historia') {
    title = `${t.nav.historia} · UXARBEITI`;
    description = t.story.intro;
    body = `${intro(t.story)}<figure class="wide-photo wrap">${img(business.hero, 'Uxarbeiti Baserria', { priority: true })}<figcaption>Uxarbeiti · Iauribarrigoikoan Behekoa</figcaption></figure><section class="story-body wrap section"><h2>${t.story.heading}</h2><div>${t.story.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('')}</div></section><section class="timeline-section section"><div class="wrap timeline">${t.story.timeline.map(([date, copy]) => `<article><span class="timeline-dot"></span><h3>${date}</h3><p>${escape(copy)}</p></article>`).join('')}</div></section><section class="wrap section land-story"><div>${eyebrow(t.home.produceEyebrow)}<h2>${t.story.landTitle}</h2><p>${escape(t.story.landText)}</p><p class="fine-print">${escape(t.story.recognition)}</p>${cta(link('productos'), t.nav.productos, 'text-link')}</div>${stats()}</section>${bookingCta()}`;
  } else if (page === 'alojamientos') {
    title = `${t.nav.alojamientos} · UXARBEITI`;
    description = t.stays.intro;
    body = `${intro(t.stays)}<section class="wrap stays-list"><div class="stays-grid">${card('domo', 1)}${card('casa', 2)}</div><p class="fine-print">${t.ui.pricingNote}</p></section><section class="shared-notes wrap section"><h2>${t.stays.practical}</h2><ul>${[t.stays.arrival, t.stays.departure, t.stays.pets].map((text) => `<li>${check}${text}</li>`).join('')}</ul><p>${t.stays.capacityNote}</p></section>${bookingCta()}`;
  } else if (page === 'domo-gorbeia' || page === 'urkiola-etxea') {
    const key = page === 'domo-gorbeia' ? 'domo' : 'casa';
    const p = properties[key];
    const copy = t.properties[key];
    title = `${p.name} · UXARBEITI`;
    description = copy.desc;
    image = p.cover;
    const galleryButton = (i, css) =>
      `<button type="button" class="gallery-trigger ${css || ''}" data-gallery-index="${i}" aria-label="${escape(copy.photoLabels[i])}">${img(p.photos[i], copy.photoLabels[i], { priority: i === 0 })}<span class="gallery-magnify" aria-hidden="true">+</span></button>`;
    body = `<header class="property-header wrap"><a class="back-link" href="${link('alojamientos')}">← ${t.ui.back}</a><div>${eyebrow(copy.type)}<h1>${p.name}</h1><p>${escape(copy.tagline)}</p></div>${facts(key)}</header><section class="property-photo wrap">${galleryButton(0, 'property-main-photo')}<button class="button button-cream gallery-open" data-gallery-index="0">${t.ui.photos}<span aria-hidden="true">↗</span></button></section><section class="property-details wrap section"><div><div class="editorial-copy">${eyebrow(t.stays.inside)}<h2>${escape(copy.tagline)}</h2><p>${escape(copy.desc)}</p></div><h3 class="features-heading">${t.stays.features}</h3><ul class="amenities">${copy.features.map((text) => `<li>${check}${escape(text)}</li>`).join('')}</ul><h3 class="features-heading">${t.stays.practical}</h3><ul class="practical-list">${[t.stays.arrival, t.stays.departure, t.stays.capacityNote].map((text) => `<li>${escape(text)}</li>`).join('')}</ul></div><aside class="rate-card">${eyebrow(t.stays.rates)}<p class="price-large"><span>${t.ui.from}</span><strong>${p.low} €</strong><span>${t.ui.night}</span></p><dl class="season-prices"><div><dt>${t.stays.low}</dt><dd>${p.low} €</dd></div><div><dt>${t.stays.summer}</dt><dd>${p.summer} €</dd></div></dl><p class="fine-print">${t.ui.pricingNote}</p><p class="fine-print">${t.stays.extras}</p>${cta(`${link('reserva')}?property=${key}`, t.ui.book)}<p class="fine-print">${t.ui.availabilityNote}</p><div class="platform-links"><span>${t.stays.alternatives}</span>${external(p.booking, 'Booking.com')}${external(p.airbnb, 'Airbnb')}</div></aside></section><section class="gallery-section wrap section"><header class="section-heading"><h2>${t.stays.gallery}</h2><span>${p.photos.length} ${t.ui.photos.toLowerCase()}</span></header><div class="photo-strip">${p.photos
      .slice(1)
      .map((_, i) => galleryButton(i + 1))
      .join(
        '',
      )}</div></section><section class="other-stay wrap"><div>${eyebrow(t.stays.other)}<h2>${properties[key === 'domo' ? 'casa' : 'domo'].name}</h2></div>${cta(link(properties[key === 'domo' ? 'casa' : 'domo'].page), t.ui.discover, 'text-link')}</section><dialog class="lightbox" id="lightbox" aria-label="${t.ui.photos}"><button class="icon-button close-dialog" aria-label="${t.ui.close}">×</button><figure><img alt=""><figcaption></figcaption></figure><div class="lightbox-controls"><button class="icon-button" data-photo-step="-1" aria-label="${t.ui.previous}">←</button><span class="photo-counter" aria-live="polite"></span><button class="icon-button" data-photo-step="1" aria-label="${t.ui.next}">→</button></div></dialog><script type="application/json" id="gallery-data">${JSON.stringify({ photos: p.photos.map((src) => asset(src)), captions: copy.photoLabels }).replace(/</g, '\\u003c')}</script>`;
  } else if (page === 'productos') {
    title = `${t.nav.productos} · UXARBEITI`;
    description = t.products.intro;
    body = `<section class="products-hero"><div class="wrap">${eyebrow(t.products.eyebrow)}<h1>${lines(t.products.title)}</h1><p class="lead">${escape(t.products.intro)}</p>${external(business.catalogue, t.ui.catalogue, 'button button-cream')}</div><div class="products-image">${img(business.hero, 'Uxarbeiti Baserria', { priority: true })}</div></section><section class="wrap section product-groups">${t.products.groups.map(([num, name, desc]) => `<article><span class="product-number">${num}</span><h2>${name}</h2><p>${escape(desc)}</p></article>`).join('')}</section><section class="farm-band"><div class="wrap">${stats()}</div></section><section class="catalogue-section wrap section"><div>${logo('catalogue-logo')}</div><div class="editorial-copy">${eyebrow('UXARBEITI × BBK AZOKA')}<h2>${lines(t.products.catalogueTitle)}</h2><p>${escape(t.products.catalogueText)}</p>${external(business.catalogue, t.ui.catalogue)}<p class="fine-print">${escape(t.products.visitText)}</p></div></section>${bookingCta()}`;
  } else if (page === 'entorno') {
    title = `${t.nav.entorno} · UXARBEITI`;
    description = t.surroundings.intro;
    body = `${intro(t.surroundings)}<figure class="wide-photo surroundings-photo wrap">${img('images/domo/domo-exterior-terraza.jpg', 'Arratia · Bizkaia', { priority: true })}</figure><section class="activity-grid wrap section">${t.surroundings.activities.map(([category, name, desc, source], i) => `<a class="activity-card" href="${activityLinks[i]}" target="_blank" rel="noopener noreferrer"><div class="activity-top">${eyebrow(category)}<span>0${i + 1}</span></div><h2>${name}</h2><p>${escape(desc)}</p><span class="activity-bottom">${t.surroundings.open} · ${source}${diagonal}</span><span class="sr-only">${t.ui.external}</span></a>`).join('')}</section><section class="directions wrap"><div>${eyebrow(t.ui.location)}<h2>${t.surroundings.directionsTitle}</h2><p>${escape(t.surroundings.directionsText)}</p></div>${external(business.maps, t.ui.map, 'button')}</section>${bookingCta()}`;
  } else if (page === 'reserva') {
    title = `${t.nav.reserva} · UXARBEITI`;
    description = t.booking.intro;
    const b = t.booking;
    const field = (name, label, type, options = '') =>
      `<label for="${name}">${label}<input id="${name}" name="${name}" type="${type}" ${options}></label>`;
    const count = (name, label, min, max, initial) =>
      `<label for="${name}">${label}<span class="stepper"><button type="button" data-step="-1" data-field="${name}" aria-label="${label} −">−</button><input id="${name}" name="${name}" type="number" min="${min}" max="${max}" value="${initial}" required inputmode="numeric"><button type="button" data-step="1" data-field="${name}" aria-label="${label} +">+</button></span></label>`;
    const dates = `<div class="booking-dates"><div id="date-fields" class="date-fields" hidden>${['checkin', 'checkout'].map((name) => `<button type="button" id="choose-${name}" class="date-trigger" aria-haspopup="dialog" aria-controls="date-picker" aria-expanded="false"><span>${b[name]}</span><strong id="${name}-display">${b.datePlaceholder}</strong></button>`).join('')}</div><div id="date-inputs" class="fields-row manual-date-inputs">${field('checkin', b.checkin, 'date', 'required')}${field('checkout', b.checkout, 'date', 'required')}</div>${field('nights', b.nights, 'number', 'min="1" max="60" inputmode="numeric"')}</div><dialog id="date-picker" class="date-picker" aria-labelledby="date-title" aria-describedby="calendar-announcement"><div class="date-panel"><button type="button" class="icon-button close-dialog" aria-label="${t.ui.close}">×</button>${eyebrow(b.step1)}<h2 id="date-title" tabindex="-1" autofocus>${b.dateTitle}</h2><div id="calendar" class="calendar" hidden><div class="calendar-toolbar"><span id="calendar-announcement" aria-live="polite"></span><div><button class="icon-button" type="button" id="previous-month" aria-label="${b.previousMonth}">←</button><button class="icon-button" type="button" id="next-month" aria-label="${b.nextMonth}">→</button></div></div><div class="calendar-months"></div></div><details id="manual-dates"><summary>${b.manualDates}</summary></details><p id="date-error" class="quote-error" role="status" hidden></p><div class="date-picker-footer"><button type="button" id="clear-dates" class="text-link">${b.dateClear}</button><button type="button" id="apply-dates" class="button button-small">${b.dateDone}${check}</button></div></div></dialog><p class="fine-print">${b.datesHelp}</p>`;
    body = `${intro(b, 'booking-intro')}<section class="booking-layout wrap"><form id="booking-form" action="${root}api/booking-requests" method="post"><div id="booking-service-status" class="service-status" role="status" hidden><p>${b.unavailable}</p>${external(`https://wa.me/${business.phoneRaw}`, t.ui.whatsapp)}</div><fieldset><legend><span>01</span>${b.step1}</legend><div class="property-options">${Object.entries(
      properties,
    )
      .map(
        ([key, p]) =>
          `<label class="property-option"><input type="radio" name="property" value="${key}" ${key === 'domo' ? 'checked' : ''}><span>${img(p.cover, '')}<span><strong>${p.name}</strong><small>${p.capacity} ${t.ui.guests} · ${p.area} m²</small></span>${check}</span></label>`,
      )
      .join(
        '',
      )}</div>${dates}</fieldset><fieldset><legend><span>02</span>${b.step2}</legend><div class="fields-row">${count('adults', b.adults, 1, 4, 2)}${count('children', b.children, 0, 3, 0)}${count('pets', b.pets, 0, 4, 0)}</div><p class="fine-print">${b.capacity} <strong id="capacity">3</strong>. ${b.childHelp}</p></fieldset><fieldset><legend><span>03</span>${b.step3}</legend>${field('name', b.name, 'text', 'required minlength="2" maxlength="120" autocomplete="name"')}<div class="fields-row contact-row">${field('email', b.email, 'email', 'required maxlength="200" autocomplete="email"')}${field('phone', b.phone, 'tel', 'required minlength="6" maxlength="30" autocomplete="tel"')}</div><label for="message">${b.message}<textarea id="message" name="message" rows="4" maxlength="1500" placeholder="${escape(b.messagePlaceholder)}"></textarea></label><label class="honeypot" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>${legal.preserved ? '' : `<div class="privacy-layer fine-print"><strong>${legal.holder}: ${escape(legalConfig.holder || legal.pending)}</strong><p>${escape(legal.layer)} <a href="mailto:${escape(legalConfig.privacyEmail)}">${escape(legalConfig.privacyEmail)}</a>.</p><a href="${link('privacidad')}">${legal.privacy}</a> · <a href="${link('condiciones')}">${legal.terms}</a></div>`}<label class="consent"><input type="checkbox" name="consent" required><span>${legal.read} <a href="${link('privacidad')}" target="_blank" rel="noopener">${b.privacy}</a></span></label></fieldset><section class="mobile-summary" aria-label="${b.summary}"><h2>${b.summary}</h2><div id="mobile-price-breakdown" aria-live="polite"></div><p class="fine-print">${b.included}</p></section><p id="form-status" class="form-status" role="alert" tabindex="-1" hidden></p><button type="submit" class="button submit-button">${b.submit}${arrow}</button><p class="fine-print">${b.noPayment}</p><div class="whatsapp-request"><button type="button" class="button button-outline" id="booking-whatsapp">${b.whatsappRequest} ↗</button><p class="fine-print">${b.whatsappHelp}</p></div><noscript><p>${b.errors.offline}</p>${external(`https://wa.me/${business.phoneRaw}`, t.ui.whatsapp)}</noscript></form><aside class="booking-summary"><div class="summary-image">${img(properties.domo.cover, t.properties.domo.photoLabels[0])}</div><div class="summary-content">${eyebrow(b.summary)}<h2 id="summary-property">Domo Gorbeia</h2><p id="summary-dates" class="fine-print"></p><div id="price-breakdown" aria-live="polite"><p>${b.empty}</p></div><p class="fine-print">${b.included}</p><div class="summary-contact"><span>${t.ui.contact}</span>${external(`https://wa.me/${business.phoneRaw}`, t.ui.whatsapp)}</div></div></aside></section><section id="booking-success" class="booking-success wrap" tabindex="-1" hidden>${eyebrow('UXARBEITI BASERRIA')}<span class="success-mark">${check}</span><h2>${b.successTitle}</h2><p>${b.success}</p><p class="reference">${b.reference}: <strong id="booking-reference"></strong></p>${cta(link('como-llegar'), a.nav)}${cta(link('reserva'), b.newRequest, 'text-link')}<p>${business.email}</p></section><script type="application/json" id="booking-data">${JSON.stringify({ ...b, privacyVersion: legal.version, locale: t.locale, root, phoneRaw: business.phoneRaw, properties: Object.fromEntries(Object.entries(properties).map(([key, p]) => [key, { name: p.name, cover: asset(p.cover), alt: t.properties[key].photoLabels[0], capacity: p.capacity }])) }).replace(/</g, '\\u003c')}</script>`;
  } else if (page === 'como-llegar') {
    title = a.nav + ' · UXARBEITI';
    description = a.intro;
    body = `${intro(a)}<section class="arrival-hero wrap"><figure>${img(business.hero, 'UXARBEITI · Igorre', { priority: true })}</figure><div class="arrival-panel">${eyebrow(t.ui.location)}<h2>UXARBEITI Baserria</h2><p>${escape(a.help)}</p>${external(business.maps, a.map, 'button')}<a href="tel:+${business.phoneRaw}" class="text-link">${a.phone} · ${business.phone}</a><p class="fine-print">${escape(a.privacy)}</p></div></section><section class="arrival-steps wrap section">${a.steps.map(([num, title, text]) => `<article><span class="eyebrow">${num}</span><h2>${title}</h2><p>${escape(text)}</p></article>`).join('')}</section>${bookingCta()}`;
  } else if (Object.hasOwn(legal.pages, page)) {
    const info = legal.pages[page];
    title = info.title + ' · UXARBEITI';
    description = legal.intro;
    body = `${intro({ eyebrow: 'UXARBEITI', title: info.title, intro: legal.intro })}<div class="privacy-body wrap">${legal.ready || legal.preserved ? '' : `<p class="legal-draft" role="status">${legal.draft}</p>`}${info.sections.map(([heading, text]) => `<section><h2>${escape(heading)}</h2><p>${escape(text)}</p></section>`).join('')}<p class="fine-print">${escape(legal.version)}</p></div>`;
  } else throw new Error(`Unknown page: ${page}`);

  if (['index', 'alojamientos', 'domo-gorbeia', 'urkiola-etxea', 'reserva'].includes(page))
    body += `<section class="arrival-preview wrap"><div>${eyebrow(t.ui.location)}<h2>${a.preview}</h2><p>${escape(a.previewText)}</p></div>${cta(link('como-llegar'), a.nav, 'button button-cream')}</section>`;
  const canonical = `${siteUrl}${lang === 'es' ? '' : `${lang}/`}${page === 'index' ? '' : `${page}.html`}`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#243e32">${!legal.ready && !legal.preserved && Object.hasOwn(legal.pages, page) ? '<meta name="robots" content="noindex,nofollow">' : ''}<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${canonical}">${Object.keys(
    locales,
  )
    .map(
      (code) =>
        `<link rel="alternate" hreflang="${code}" href="${siteUrl}${code === 'es' ? '' : code + '/'}${page === 'index' ? '' : page + '.html'}">`,
    )
    .join(
      '',
    )}<meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${siteUrl}${image}"><link rel="icon" href="${asset('images/uxarbeiti/logo-light.png')}"><link rel="manifest" href="${asset('manifest.webmanifest')}"><link rel="preload" href="${asset('assets/fonts/cormorant-latin.woff2')}" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${asset(assets.css)}"><script defer src="${asset(assets.pricing)}"></script><script defer src="${asset(assets.js)}"></script></head><body data-page="${page}">${header}<main id="main">${body}</main>${footer}${contactPopup}</body></html>`;
}

module.exports = { pages, renderPage, escape };
