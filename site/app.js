/* Progressive enhancement: navigation and content remain usable without JavaScript. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  $$('dialog').forEach((dialog) => {
    $('.close-dialog', dialog)?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
  const menu = $('#mobile-menu');
  const toggle = $('.menu-toggle');
  toggle?.addEventListener('click', () => {
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
  });
  menu?.addEventListener('close', () => toggle.setAttribute('aria-expanded', 'false'));
  window.matchMedia('(min-width:1081px)').addEventListener('change', (event) => {
    if (event.matches && menu.open) menu.close();
  });

  const contactLauncher = $('#contact-launcher');
  const contactDialog = $('#contact-dialog');
  if (contactLauncher && contactDialog) {
    const message = $('#contact-message');
    const link = $('#contact-continue');
    const destination = new URL(link.href);
    const updateMessage = () => {
      destination.searchParams.set('text', message.value.trim() || link.dataset.defaultMessage);
      link.href = destination.href;
    };
    contactLauncher.setAttribute('aria-haspopup', 'dialog');
    contactLauncher.setAttribute('aria-controls', 'contact-dialog');
    contactLauncher.setAttribute('aria-expanded', 'false');
    contactLauncher.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      contactDialog.showModal();
      contactLauncher.setAttribute('aria-expanded', 'true');
    });
    contactDialog.addEventListener('close', () => {
      contactLauncher.setAttribute('aria-expanded', 'false');
    });
    $$('[data-chat-message]').forEach((button) => {
      button.addEventListener('click', () => {
        message.value = button.dataset.chatMessage;
        $$('[data-chat-message]').forEach((topic) =>
          topic.setAttribute('aria-pressed', String(topic === button)),
        );
        updateMessage();
      });
    });
    message.addEventListener('input', () => {
      $$('[data-chat-message]').forEach((topic) => topic.setAttribute('aria-pressed', 'false'));
      updateMessage();
    });
  }

  const galleryData = $('#gallery-data');
  if (galleryData) {
    const data = JSON.parse(galleryData.textContent);
    const dialog = $('#lightbox');
    let active = 0;
    const warmed = new Set();
    const preloadNext = () => {
      const connection = navigator.connection;
      if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType)) return;
      const src = data.photos[(active + 1) % data.photos.length];
      if (warmed.has(src)) return;
      warmed.add(src);
      const photo = new Image();
      photo.decoding = 'async';
      photo.fetchPriority = 'low';
      photo.src = src;
    };
    const show = (index) => {
      active = (index + data.photos.length) % data.photos.length;
      $('figure img', dialog).src = data.photos[active];
      $('figure img', dialog).alt = data.captions[active];
      $('figcaption', dialog).textContent = data.captions[active];
      $('.photo-counter', dialog).textContent = `${active + 1} / ${data.photos.length}`;
      if (dialog.open) preloadNext();
    };
    $$('[data-gallery-index]').forEach((button) =>
      button.addEventListener('click', () => {
        show(Number(button.dataset.galleryIndex));
        dialog.showModal();
        preloadNext();
      }),
    );
    $$('[data-photo-step]').forEach((button) =>
      button.addEventListener('click', () => show(active + Number(button.dataset.photoStep))),
    );
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        show(active + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    let touchX = null;
    dialog.addEventListener(
      'touchstart',
      (event) => {
        touchX = event.touches[0].clientX;
      },
      { passive: true },
    );
    dialog.addEventListener(
      'touchend',
      (event) => {
        if (touchX !== null) {
          const distance = event.changedTouches[0].clientX - touchX;
          if (Math.abs(distance) > 60) show(active + (distance < 0 ? 1 : -1));
        }
        touchX = null;
      },
      { passive: true },
    );
  }

  // Retire the previous offline cache; reservation data must never enter a service-worker cache.
  if ('serviceWorker' in navigator) {
    const script =
      document.currentScript || $$('script[src]').find((node) => /\/assets\/app\./.test(node.src));
    if (script) {
      const worker = new URL('../sw.js', script.src);
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations
            .filter((reg) => new URL(reg.scope).href === new URL('./', worker).href)
            .forEach((reg) => reg.update().catch(() => {}));
        })
        .catch(() => {});
    }
  }
})();
