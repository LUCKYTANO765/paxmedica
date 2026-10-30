(() => {
  const section = document.getElementById('peso');
  if (!section) return;
  const animation = section.querySelector('.peso-background-animation');
  const button = section.querySelector('.peso-play-button');
  const hover = window.matchMedia('(hover: hover)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pointerInside = false;
  let keyboardInside = false;
  let manualPlayback = false;
  let requested = false;
  animation.muted = true;

  function update() {
    requested = manualPlayback || (!reducedMotion.matches && (pointerInside || keyboardInside));
    button.setAttribute('aria-pressed', String(requested));
    button.textContent = requested ? 'Detener animación' : 'Reproducir animación';
    if (requested) {
      if (!animation.hasAttribute('src')) animation.src = animation.dataset.src;
      animation.play().catch(error => {
        if (error.name === 'AbortError' || !requested) return;
        pointerInside = keyboardInside = manualPlayback = false;
        update();
      });
    } else {
      section.classList.remove('is-playing');
      animation.pause();
      if (animation.readyState >= 1) animation.currentTime = 0;
    }
  }
  animation.addEventListener('playing', () => {
    if (requested) section.classList.add('is-playing');
    else animation.pause();
  });
  animation.addEventListener('error', () => {
    pointerInside = keyboardInside = manualPlayback = false;
    update();
  });
  section.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch' || !hover.matches) return;
    pointerInside = true;
    update();
  });
  section.addEventListener('pointerleave', () => {
    pointerInside = false;
    update();
  });
  section.addEventListener('focusin', event => {
    keyboardInside = event.target !== button && event.target.matches(':focus-visible');
    update();
  });
  section.addEventListener('focusout', () => {
    queueMicrotask(() => {
      keyboardInside = section.contains(document.activeElement) && document.activeElement !== button && document.activeElement.matches(':focus-visible');
      update();
    });
  });
  button.addEventListener('click', () => {
    manualPlayback = !manualPlayback;
    update();
  });
  reducedMotion.addEventListener('change', update);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pointerInside = keyboardInside = manualPlayback = false;
      update();
    }
  });
})();
