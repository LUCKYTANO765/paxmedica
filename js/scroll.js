// ── Smooth header shadow on scroll ──
(function () {
  var header = document.querySelector('header');
  if (!header) return;
  var scrolled = false;
  window.addEventListener('scroll', function () {
    var now = window.scrollY > 10;
    if (now !== scrolled) {
      scrolled = now;
      header.style.boxShadow = scrolled
        ? '0 4px 20px rgba(26,61,107,0.14)'
        : '0 2px 8px rgba(26,61,107,0.08)';
    }
  }, { passive: true });
})();
