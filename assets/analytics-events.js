(function () {
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a') : null;
    if (!link || typeof window.gtag !== 'function') return;

    var eventName = link.matches('a[href*="suko-app-releases"]') ? 'download_click'
      : link.matches('a[href*="buy.polar.sh"]') ? 'begin_checkout'
      : null;

    if (eventName) window.gtag('event', eventName, { link_url: link.href });
  });
})();
