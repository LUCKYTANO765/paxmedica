// ── Intersection Observer for fade-in animations ──
(function () {
  var els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(function (el) { observer.observe(el); });
})();


// ── Trigger fade-in for elements already in viewport on load ──
(function () {
  // Short delay to allow browser layout
  setTimeout(function () {
    var els = document.querySelectorAll('.fade-in:not(.visible)');
    var viewH = window.innerHeight;
    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < viewH * 0.9) {
        el.classList.add('visible');
      }
    });
  }, 80);
})();
