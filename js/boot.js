'use strict';

(function bootStaticPage() {
  document.documentElement.classList.remove('no-js');

  function markLoaded() {
    const delay = Number(document.body?.dataset.preloaderDelay || 700);
    window.setTimeout(() => document.body?.classList.add('loaded'), delay);
  }

  function syncFooterYear() {
    const year = document.getElementById('footer-year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      markLoaded();
      syncFooterYear();
    }, { once: true });
  } else {
    markLoaded();
    syncFooterYear();
  }
})();
