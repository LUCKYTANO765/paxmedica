// ── FAQ Accordion ──
(function () {
  var items = document.querySelectorAll('.faq-item');
  items.forEach(function (item) {
    var btn = item.querySelector('.faq-btn');
    var body = item.querySelector('.faq-body');
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close all
      items.forEach(function (i) {
        i.classList.remove('open');
        i.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
      });

      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
