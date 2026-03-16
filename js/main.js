/* ============================================
   MENDIEN ARTEAN — Main JavaScript
   ============================================ */

// ============================================================
// CALENDARIO — Fechas reservadas
// Para sincronizar con Booking.com y Airbnb:
// 1. Booking.com: Extranet → Propiedades → Calendario → Exportar iCal
// 2. Airbnb: Calendario → Disponibilidad → Exportar calendario (.ics)
// 3. Actualiza el array BOOKED_DATES manualmente cada semana,
//    o implementa un proxy serverless (Netlify Functions / Vercel)
//    que parsee los .ics y devuelva JSON.
// ============================================================
const BOOKED_DATES = [
  // Formato: 'YYYY-MM-DD' — sustituye con tus fechas reales
  '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13',
  '2026-03-22', '2026-03-23',
  '2026-04-04', '2026-04-05', '2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10',
  '2026-04-18', '2026-04-19', '2026-04-20',
  '2026-05-01', '2026-05-02', '2026-05-03',
  '2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18',
  '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14',
  '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28', '2026-06-29', '2026-06-30',
  '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05',
  '2026-07-18', '2026-07-19', '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25',
  '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
  '2026-08-14', '2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
  '2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31',
];

const LOW_SEASON_BASE_RATE = 57;
const SUMMER_BASE_RATE = 75;
const DOMO_BASE_SURCHARGE = 100;
const EXTRA_PERSON_RATE = 10;
const PET_RATE = 10;
const CHILD_RATE = 5;
const CLEANING_FEE = 40;

function parseDateInput(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getNights(checkin, checkout) {
  const checkinDate = parseDateInput(checkin);
  const checkoutDate = parseDateInput(checkout);
  if (!checkinDate || !checkoutDate) return 1;

  const diff = checkoutDate.getTime() - checkinDate.getTime();
  const nights = Math.round(diff / 86400000);
  return Math.max(1, nights);
}

function getBaseRateBySeason(checkin, property = 'casa') {
  const checkinDate = parseDateInput(checkin);
  const month = checkinDate ? checkinDate.getMonth() : new Date().getMonth();
  const isLowSeason = month <= 4 || month >= 9; // Jan-May, Oct-Dec
  const seasonBaseRate = isLowSeason ? LOW_SEASON_BASE_RATE : SUMMER_BASE_RATE;
  const propertySurcharge = property === 'domo' ? DOMO_BASE_SURCHARGE : 0;

  return {
    rate: seasonBaseRate + propertySurcharge,
    seasonBaseRate,
    propertySurcharge,
    season: isLowSeason ? 'low' : 'summer'
  };
}

function calculateBookingEstimate({ property, checkin, checkout, guests, pets, children }) {
  const nights = getNights(checkin, checkout);
  const people = Math.max(1, Number.parseInt(guests, 10) || 1);
  const hasPets = Number.parseInt(pets, 10) > 0 ? 1 : 0;
  const hasChildren = Number.parseInt(children, 10) > 0 ? 1 : 0;
  const extraPeople = Math.max(0, people - 1);

  const { rate: baseRate, season, seasonBaseRate, propertySurcharge } = getBaseRateBySeason(checkin, property);

  const baseTotal = baseRate * nights;
  const extraPeopleTotal = extraPeople * EXTRA_PERSON_RATE * nights;
  const petsTotal = hasPets * PET_RATE * nights;
  const childrenTotal = hasChildren * CHILD_RATE * nights;
  const subtotal = baseTotal + extraPeopleTotal + petsTotal + childrenTotal;
  const total = subtotal + CLEANING_FEE;

  return {
    season,
    property: property === 'domo' ? 'domo' : 'casa',
    baseRate,
    seasonBaseRate,
    propertySurcharge,
    nights,
    people,
    extraPeople,
    hasPets,
    hasChildren,
    baseTotal,
    extraPeopleTotal,
    petsTotal,
    childrenTotal,
    subtotal,
    cleaningFee: CLEANING_FEE,
    total
  };
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initLanguageSwitcher === 'function') {
    initLanguageSwitcher();
  }

  initContactLinks();
  initNavbar();
  initGalleryTabs();
  initPropertySelectors();
  initBookingForm();
  initSmoothScroll();
  initDateConstraints();

  // Defer non-critical initialization to keep the first render responsive.
  const scheduleNonCriticalInit = (fn) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(fn, { timeout: 1200 });
      return;
    }
    window.setTimeout(fn, 0);
  };

  scheduleNonCriticalInit(() => {
    initCalendar();
    initGallery();
    initScrollReveal();
  });
});

/* ==========================================
   NAVBAR — Scroll effect + Mobile menu
   ========================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  if (!navbar || !navToggle || !navLinks || !navOverlay) return;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    window.requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 80);
      ticking = false;
    });
    ticking = true;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    navOverlay.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  navOverlay.addEventListener('click', closeNav);

  navLinks.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  function closeNav() {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ==========================================
   CALENDAR — Interactive availability
   ========================================== */
function initCalendar() {
  const calendarDays = document.getElementById('calendarDays');
  const calendarTitle = document.getElementById('calendarTitle');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');

  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  // Expose renderCalendar for i18n system
  window.renderCalendar = renderCalendar;

  function getMonthNames() {
    if (typeof t === 'function') {
      return Array.from({ length: 12 }, (_, i) => t(`month.${i}`));
    }
    return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  }

  function isBooked(year, month, day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return BOOKED_DATES.includes(dateStr);
  }

  function isPast(year, month, day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(year, month, day) < today;
  }

  function isToday(year, month, day) {
    const today = new Date();
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  }

  function renderCalendar() {
    const monthNames = getMonthNames();
    calendarTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calendarDays.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day empty';
      calendarDays.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = day;

      if (isPast(currentYear, currentMonth, day)) {
        dayEl.classList.add('past');
      } else if (isBooked(currentYear, currentMonth, day)) {
        dayEl.classList.add('booked');
        dayEl.setAttribute('aria-label', `${day}, reservado`);
      } else {
        dayEl.classList.add('available');
        dayEl.setAttribute('aria-label', `${day}, disponible`);
        dayEl.addEventListener('click', () => {
          // Al hacer clic en fecha disponible → ir al formulario de reserva directa
          const checkinInput = document.getElementById('b_checkin');
          if (checkinInput) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            checkinInput.value = dateStr;
            // Actualizar checkout mínimo
            const checkoutInput = document.getElementById('b_checkout');
            if (checkoutInput) {
              const nextDay = new Date(currentYear, currentMonth, day + 1);
              const nextDateStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
              checkoutInput.min = nextDateStr;
            }
          }
          // Scroll al formulario
          const bookingSection = document.getElementById('booking');
          if (bookingSection) {
            const navHeight = document.getElementById('navbar').offsetHeight;
            window.scrollTo({ top: bookingSection.getBoundingClientRect().top + window.scrollY - navHeight, behavior: 'smooth' });
          }
        });
      }

      if (isToday(currentYear, currentMonth, day)) {
        dayEl.classList.add('today');
      }

      calendarDays.appendChild(dayEl);
    }
  }

  calPrev.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });

  calNext.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  renderCalendar();
}

/* ==========================================
   DATE CONSTRAINTS — Fechas mínimas en formulario
   ========================================== */
function initDateConstraints() {
  const checkinInput = document.getElementById('b_checkin');
  const checkoutInput = document.getElementById('b_checkout');
  if (!checkinInput || !checkoutInput) return;

  const today = new Date().toISOString().split('T')[0];
  checkinInput.min = today;

  checkinInput.addEventListener('change', () => {
    if (checkinInput.value) {
      const nextDay = new Date(checkinInput.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkoutInput.min = nextDay.toISOString().split('T')[0];
      if (checkoutInput.value && checkoutInput.value <= checkinInput.value) {
        checkoutInput.value = '';
      }
    }
  });
}

/* ==========================================
   CONTACT LINKS — rellena hrefs y textos desde config.js
   config.js está en .gitignore; usa config.example.js como plantilla.
   ========================================== */
function initContactLinks() {
  const cfg = window.SITE_CONFIG;
  if (!cfg) return;

  const waText = encodeURIComponent('Hola, me gustaría obtener más información sobre UXARBEITI Baserria');
  const waUrl = `https://wa.me/${cfg.phone}?text=${waText}`;

  // Actualiza todos los enlaces de WhatsApp
  document.querySelectorAll('[data-wa]').forEach(el => {
    el.href = waUrl;
  });

  // Actualiza el número de teléfono visible en la sección de contacto
  document.querySelectorAll('[data-wa-display]').forEach(el => {
    el.textContent = cfg.phoneDisplay;
  });

  // Actualiza el JSON-LD del <head> con teléfono y email reales
  const ldScript = document.querySelector('script[type="application/ld+json"]');
  if (ldScript) {
    ldScript.textContent = ldScript.textContent
      .replace('"__PHONE__"', `"+${cfg.phone}"`)
      .replace('"__EMAIL__"', `"${cfg.email}"`);
  }
}

/* ==========================================
   BOOKING FORM — mailto: (sin registro, sin backend)
   Al enviar, abre el cliente de correo del usuario
   con todos los campos pre-rellenados.
   ========================================== */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const successEl = document.getElementById('formSuccess');
  const errorEl = document.getElementById('formError');

  if (!form) return;

  const propertyInput = document.getElementById('b_property');
  const guestsInput = document.getElementById('b_guests');
  const petsInput = document.getElementById('b_pets');
  const childrenInput = document.getElementById('b_children');
  const checkinInput = document.getElementById('b_checkin');
  const checkoutInput = document.getElementById('b_checkout');
  const nightsInput = document.getElementById('b_nights');

  const lineSeasonBase = document.getElementById('lineSeasonBase');
  const lineExtraPeople = document.getElementById('lineExtraPeople');
  const linePets = document.getElementById('linePets');
  const lineChildren = document.getElementById('lineChildren');
  const lineCleaning = document.getElementById('lineCleaning');
  const lineTotal = document.getElementById('lineTotal');

  const i18n = (key, fallback) => {
    if (typeof t === 'function') return t(key);
    return fallback;
  };

  const updateEstimateUI = () => {
    const estimate = calculateBookingEstimate({
      property: propertyInput?.value || 'casa',
      checkin: checkinInput?.value || '',
      checkout: checkoutInput?.value || '',
      guests: guestsInput?.value || '1',
      pets: petsInput?.value || '0',
      children: childrenInput?.value || '0'
    });

    if (nightsInput) nightsInput.value = String(estimate.nights);

    const seasonLabel = estimate.season === 'low'
      ? i18n('booking.breakdown.season.low', 'Temporada baja')
      : i18n('booking.breakdown.season.summer', 'Verano');

    if (lineSeasonBase) {
      lineSeasonBase.textContent = `${seasonLabel}: ${estimate.baseRate}€ x ${estimate.nights} = ${estimate.baseTotal}€`;
    }
    if (lineExtraPeople) {
      lineExtraPeople.textContent = `${estimate.extraPeople} x ${EXTRA_PERSON_RATE}€ x ${estimate.nights} = ${estimate.extraPeopleTotal}€`;
    }
    if (linePets) {
      linePets.textContent = `${estimate.hasPets} x ${PET_RATE}€ x ${estimate.nights} = ${estimate.petsTotal}€`;
    }
    if (lineChildren) {
      lineChildren.textContent = `${estimate.hasChildren} x ${CHILD_RATE}€ x ${estimate.nights} = ${estimate.childrenTotal}€`;
    }
    if (lineCleaning) {
      lineCleaning.textContent = `${estimate.cleaningFee}€`;
    }
    if (lineTotal) {
      lineTotal.textContent = `${estimate.total}€`;
    }

    return estimate;
  };

  [propertyInput, guestsInput, petsInput, childrenInput, checkinInput, checkoutInput]
    .filter(Boolean)
    .forEach(el => el.addEventListener('change', updateEstimateUI));

  updateEstimateUI();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const name = document.getElementById('b_name').value.trim();
    const email = document.getElementById('b_email').value.trim();
    const phone = document.getElementById('b_phone').value.trim();
    const property = document.getElementById('b_property').value;
    const propertyName = property === 'domo' ? 'Domo Gorbeia' : 'Urkiola Etxea';
    const guests = guestsInput ? guestsInput.value : '1';
    const pets = petsInput ? petsInput.value : '0';
    const children = childrenInput ? childrenInput.value : '0';
    const checkin = document.getElementById('b_checkin').value;
    const checkout = document.getElementById('b_checkout').value;
    const nights = nightsInput ? nightsInput.value : String(getNights(checkin, checkout));
    const message = document.getElementById('b_message').value.trim();
    const estimate = updateEstimateUI();

    const petsLabel = Number.parseInt(pets, 10) > 0 ? i18n('booking.yes', 'Sí') : i18n('booking.no', 'No');
    const childrenLabel = Number.parseInt(children, 10) > 0 ? i18n('booking.yes', 'Sí') : i18n('booking.no', 'No');
    const seasonLabel = estimate.season === 'low'
      ? i18n('booking.breakdown.season.low', 'Temporada baja')
      : i18n('booking.breakdown.season.summer', 'Verano');

    const subject = `Solicitud de reserva (${propertyName}): ${name} | ${checkin} - ${checkout} | ${estimate.total}€`;
    const body = [
      'SOLICITUD DE RESERVA - UXARBEITI BASERRIA',
      '-----------------------------------------',
      `Alojamiento: ${propertyName}`,
      `Nombre:      ${name}`,
      `Email:       ${email}`,
      `Teléfono:    ${phone}`,
      `Personas:    ${guests}`,
      `Noches:      ${nights}`,
      `Mascotas:    ${petsLabel}`,
      `Niños:       ${childrenLabel}`,
      `Entrada:     ${checkin}`,
      `Salida:      ${checkout}`,
      '-----------------------------------------',
      `Temporada:   ${seasonLabel}`,
      `Base:        ${estimate.baseRate}€ x ${estimate.nights} = ${estimate.baseTotal}€`,
      `Extras pers: ${estimate.extraPeopleTotal}€`,
      `Mascotas:    ${estimate.petsTotal}€`,
      `Niños:       ${estimate.childrenTotal}€`,
      `Limpieza:    ${estimate.cleaningFee}€`,
      `TOTAL EST.:  ${estimate.total}€`,
      '-----------------------------------------',
      `Mensaje:     ${message || '(ninguno)'}`,
      '-----------------------------------------',
      'Enviado desde uxarbeiti.eus',
    ].join('\n');

    const dest = (window.SITE_CONFIG && window.SITE_CONFIG.email) || '';
    const mailtoUrl = `mailto:${dest}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      window.location.href = mailtoUrl;
      setTimeout(() => {
        if (successEl) successEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
        form.reset();
        updateEstimateUI();
        setTimeout(() => { if (successEl) successEl.style.display = 'none'; }, 6000);
      }, 500);
    } catch {
      if (errorEl) errorEl.style.display = 'block';
    }
  });
}

/* ==========================================
   GALLERY — Tabs (Domo / Casa Rural)
   ========================================== */
function initGalleryTabs() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const items = document.querySelectorAll('.gallery-item[data-property]');

  if (!tabs.length) return;

  function switchTab(tabName) {
    // Actualizar tabs activas
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));

    // Mostrar/ocultar items
    let idx = 0;
    items.forEach(item => {
      if (item.dataset.property === tabName) {
        item.style.display = '';
        item.dataset.index = idx++;
      } else {
        item.style.display = 'none';
      }
    });
  }

  window.switchGalleryTab = switchTab;

  // Click en tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Click en "Ver fotos" de las property cards
  document.querySelectorAll('[data-gallery-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(btn.dataset.galleryTab);
      const gallery = document.getElementById('gallery');
      if (gallery) gallery.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ==========================================
   PROPERTY SELECTOR — choose stay from cards
   ========================================== */
function initPropertySelectors() {
  const cards = document.querySelectorAll('.property-card[data-property-card]');
  const selectButtons = document.querySelectorAll('.property-select-btn[data-select-property]');
  const bookingSelect = document.getElementById('b_property');
  const pricingBlocks = document.querySelectorAll('.pricing-property[data-pricing-property]');
  const bookingSection = document.getElementById('booking');

  if (!cards.length) return;

  const setSelectedProperty = (property, options = {}) => {
    const { syncBooking = true, syncGallery = false, scrollToBooking = false } = options;

    cards.forEach(card => {
      card.classList.toggle('is-selected', card.dataset.propertyCard === property);
    });

    pricingBlocks.forEach(block => {
      block.classList.toggle('is-active', block.dataset.pricingProperty === property);
    });

    if (syncBooking && bookingSelect) {
      const previousValue = bookingSelect.value;
      bookingSelect.value = property;
      if (previousValue !== property) {
        bookingSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    if (syncGallery && typeof window.switchGalleryTab === 'function') {
      window.switchGalleryTab(property);
    }

    if (scrollToBooking && bookingSection) {
      const navHeight = document.getElementById('navbar')?.offsetHeight || 0;
      const top = bookingSection.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
      bookingSelect?.focus({ preventScroll: true });
    }
  };

  selectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setSelectedProperty(btn.dataset.selectProperty, {
        syncBooking: true,
        syncGallery: true,
        scrollToBooking: true
      });
    });
  });

  if (bookingSelect) {
    bookingSelect.addEventListener('change', () => {
      setSelectedProperty(bookingSelect.value, { syncBooking: false, syncGallery: false });
    });
  }

  const initialProperty = bookingSelect?.value || 'domo';
  setSelectedProperty(initialProperty, { syncBooking: true, syncGallery: false });
}

/* ==========================================
   GALLERY — Lightbox
   ========================================== */
function initGallery() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let visibleImages = [];
  let currentIndex = 0;

  function getVisibleImages() {
    return Array.from(document.querySelectorAll('.gallery-item'))
      .filter(item => item.style.display !== 'none')
      .map(item => ({
        src: item.querySelector('img').src,
        alt: item.querySelector('img').alt
      }));
  }

  function openLightbox(index) {
    visibleImages = getVisibleImages();
    currentIndex = index;
    lightboxImg.src = visibleImages[index].src;
    lightboxImg.alt = visibleImages[index].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigate(direction) {
    currentIndex = (currentIndex + direction + visibleImages.length) % visibleImages.length;
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = visibleImages[currentIndex].src;
      lightboxImg.alt = visibleImages[currentIndex].alt;
      lightboxImg.style.opacity = '1';
    }, 200);
  }

  // Delegamos el click al contenedor para que funcione con items dinámicos
  const galleryGrid = document.getElementById('galleryGrid');
  if (galleryGrid) {
    galleryGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (!item || item.style.display === 'none') return;
      const idx = parseInt(item.dataset.index, 10);
      openLightbox(idx);
    });
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigate(-1));
  lightboxNext.addEventListener('click', () => navigate(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  lightboxImg.style.transition = 'opacity 0.2s ease';
}

/* ==========================================
   SCROLL REVEAL — Animate elements on scroll
   ========================================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

/* ==========================================
   SMOOTH SCROLL — Anchor links
   ========================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      // Validar que el selector es un ID simple antes de usarlo
      if (!/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(targetId)) return;

      const target = document.querySelector(targetId);
      if (target) {
        const navHeight = document.getElementById('navbar').offsetHeight;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - navHeight,
          behavior: 'smooth'
        });
      }
    });
  });
}
