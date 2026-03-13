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

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initLanguageSwitcher === 'function') {
    initLanguageSwitcher();
  }

  initContactLinks();
  initNavbar();
  initCalendar();
  initBookingForm();
  initGallery();
  initScrollReveal();
  initSmoothScroll();
  initDateConstraints();
});

/* ==========================================
   NAVBAR — Scroll effect + Mobile menu
   ========================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

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
    return ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
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
  const waUrl  = `https://wa.me/${cfg.phone}?text=${waText}`;

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

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const name     = document.getElementById('b_name').value.trim();
    const email    = document.getElementById('b_email').value.trim();
    const phone    = document.getElementById('b_phone').value.trim();
    const guests   = document.getElementById('b_guests').value;
    const checkin  = document.getElementById('b_checkin').value;
    const checkout = document.getElementById('b_checkout').value;
    const message  = document.getElementById('b_message').value.trim();

    const subject = `Solicitud de reserva: ${name} | ${checkin} - ${checkout}`;
    const body = [
      'SOLICITUD DE RESERVA - UXARBEITI BASERRIA',
      '-----------------------------------------',
      `Nombre:      ${name}`,
      `Email:       ${email}`,
      `Teléfono:    ${phone}`,
      `Huéspedes:   ${guests}`,
      `Entrada:     ${checkin}`,
      `Salida:      ${checkout}`,
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
        setTimeout(() => { if (successEl) successEl.style.display = 'none'; }, 6000);
      }, 500);
    } catch {
      if (errorEl) errorEl.style.display = 'block';
    }
  });
}

/* ==========================================
   GALLERY — Lightbox
   ========================================== */
function initGallery() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  const images = Array.from(galleryItems).map(item => ({
    src: item.querySelector('img').src,
    alt: item.querySelector('img').alt
  }));

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = images[index].src;
    lightboxImg.alt = images[index].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigate(direction) {
    currentIndex = (currentIndex + direction + images.length) % images.length;
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = images[currentIndex].src;
      lightboxImg.alt = images[currentIndex].alt;
      lightboxImg.style.opacity = '1';
    }, 200);
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

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
