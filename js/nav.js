// ── Section nav: dynamic top offset + active state on scroll ──
(function () {
  var navLinks = document.querySelectorAll('.sec-nav-link');
  var navInner = document.getElementById('sectionNavInner');
  var sectionNav = document.querySelector('.section-nav');
  if (!navLinks.length || !navInner || !sectionNav) return;

  // Fix: set top dynamically based on actual header height
  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('header');
    if (header) {
      sectionNav.style.top = header.offsetHeight + 'px';
    }
  });

  var sectionIds = Array.from(navLinks).map(function (l) { return l.dataset.section; });
  var sections = sectionIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (l) {
      var isActive = l.dataset.section === id;
      l.classList.toggle('active', isActive);
      // Auto-scroll nav so active item is visible
      if (isActive) {
        var lRect = l.getBoundingClientRect();
        var nRect = navInner.getBoundingClientRect();
        if (lRect.left < nRect.left + 16 || lRect.right > nRect.right - 16) {
          navInner.scrollLeft += lRect.left - nRect.left - 24;
        }
      }
    });
  }

  function clearActive() {
    navLinks.forEach(function (l) { l.classList.remove('active'); });
  }

  var observer = new IntersectionObserver(function (entries) {
    var anyIntersecting = false;
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        anyIntersecting = true;
        setActive(entry.target.id);
      }
    });
    // If no section is intersecting (user is in hero), clear active state
    var allEntries = entries.filter(function (e) { return !e.isIntersecting; });
    if (allEntries.length === entries.length) {
      // All observed entries are not intersecting in this batch — check globally
      var anySectionVisible = false;
      sections.forEach(function (s) {
        var rect = s.getBoundingClientRect();
        var windowH = window.innerHeight;
        if (rect.top < windowH * 0.8 && rect.bottom > windowH * 0.2) {
          anySectionVisible = true;
        }
      });
      if (!anySectionVisible) {
        clearActive();
      }
    }
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(function (s) { observer.observe(s); });
})();
