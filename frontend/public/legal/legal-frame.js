(function () {
  function detectLanguage(translations) {
    const params = new URLSearchParams(window.location.search);
    const forced = (params.get('lang') || '').toLowerCase();
    if (translations && translations[forced]) return forced;

    const langs = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || 'it'];

    for (const lang of langs) {
      const short = String(lang || '').toLowerCase().slice(0, 2);
      if (!translations || translations[short]) return short;
    }

    return translations && translations.it ? 'it' : 'en';
  }

  function isEmbed() {
    return new URLSearchParams(window.location.search).get('embed') === '1';
  }

  function withLegalParams(href, lang) {
    const url = new URL(href, window.location.href);
    if (isEmbed()) url.searchParams.set('embed', '1');
    if (lang) url.searchParams.set('lang', lang);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function wireBackLink(backLink, fallback) {
    if (!backLink || isEmbed()) return;
    backLink.addEventListener('click', function (event) {
      event.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      if (document.referrer) {
        window.location.href = document.referrer;
        return;
      }
      window.location.href = fallback || '/';
    });
  }

  function rewriteInlineLinks(root, lang) {
    (root || document).querySelectorAll('a[href$=".html"], a[href*="privacy-policy"], a[href*="cookie-policy"], a[href*="termini-e-condizioni"], a[href*="contact.html"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('http')) return;
      link.setAttribute('href', withLegalParams(href, lang));
      if (isEmbed()) {
        link.removeAttribute('target');
        link.removeAttribute('rel');
      }
    });
  }

  function applyEmbedMode() {
    if (isEmbed()) {
      document.documentElement.classList.add('embed-mode');
    }
  }

  window.SketcharioLegal = {
    applyEmbedMode,
    detectLanguage,
    isEmbed,
    rewriteInlineLinks,
    wireBackLink,
    withLegalParams,
  };
})();
