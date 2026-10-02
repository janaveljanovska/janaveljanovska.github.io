(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = document.querySelector('.motion-toggle');
  const diagram = document.querySelector('.curiosity-diagram');
  const diagramLabel = document.querySelector('.diagram-label');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const chapterLinks = [...document.querySelectorAll('.chapter-controls a')];
  const labels = ['01 — THE PATTERNS', '02 — THE PEOPLE', '03 — THE ROOTS'];
  const heroArt = document.querySelector('.hero-art');
  const footerFlower = document.querySelector('.footer-flower');
  let userPaused = false;
  let activeChapter = 0;
  let framePending = false;

  try { userPaused = localStorage.getItem('jana-motion-paused') === 'true'; } catch (_) { /* Storage is optional. */ }

  const motionIsPaused = () => reducedMotion.matches || userPaused;

  function setMotionPreference() {
    const paused = motionIsPaused();
    root.classList.toggle('motion-paused', paused);
    root.classList.toggle('motion-ready', !paused);
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.querySelector('.motion-label').textContent = paused ? 'Motion paused' : 'Pause motion';
    motionToggle.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    motionToggle.title = reducedMotion.matches ? 'Your device’s reduced motion setting is enabled' : paused ? 'Enable animation' : 'Pause animation';
    // System preferences take priority over the optional site control.
    motionToggle.disabled = reducedMotion.matches;
    motionToggle.hidden = false;
    scheduleFrame();
  }

  function setChapter(index) {
    activeChapter = index;
    diagram.dataset.active = String(index);
    diagramLabel.textContent = labels[index];
    chapterLinks.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function updateScroll() {
    framePending = false;
    const y = window.scrollY;
    const viewport = window.innerHeight;
    const scrollable = root.scrollHeight - viewport;
    root.style.setProperty('--scroll', scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0);

    // The illustration follows the chapter crossing the middle of the viewport.
    let nextChapter = 0;
    chapters.forEach((chapter, index) => {
      if (chapter.getBoundingClientRect().top <= viewport * 0.52) nextChapter = index;
    });
    if (nextChapter !== activeChapter) setChapter(nextChapter);

    if (motionIsPaused()) return;

    const heroRect = heroArt.getBoundingClientRect();
    if (heroRect.bottom > 0) {
      heroArt.style.setProperty('--portrait-shift', `${Math.min(y * 0.025, 13)}px`);
      heroArt.style.setProperty('--orbit-rotation', `${y * 0.009}deg`);
    }

    const diagramRect = diagram.getBoundingClientRect();
    if (diagramRect.bottom > 0 && diagramRect.top < viewport) {
      diagram.style.setProperty('--diagram-rotation', `${y * 0.015}deg`);
    }

    const flowerRect = footerFlower.getBoundingClientRect();
    if (flowerRect.top < viewport && flowerRect.bottom > 0) {
      footerFlower.style.setProperty('--flower-rotation', `${(viewport - flowerRect.top) * 0.045}deg`);
    }
  }

  function scheduleFrame() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateScroll);
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.09, rootMargin: '0px 0px -25px 0px' });
    document.querySelectorAll('.reveal, .curiosity-diagram').forEach(element => revealObserver.observe(element));
    setMotionPreference();
  } else {
    document.querySelectorAll('.reveal, .curiosity-diagram').forEach(element => element.classList.add('is-visible'));
  }

  motionToggle.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('jana-motion-paused', String(userPaused)); } catch (_) { /* No persistence required. */ }
    setMotionPreference();
  });

  reducedMotion.addEventListener('change', setMotionPreference);
  window.addEventListener('scroll', scheduleFrame, { passive: true });
  window.addEventListener('resize', scheduleFrame, { passive: true });
  window.addEventListener('pageshow', scheduleFrame);
  document.fonts.ready.then(scheduleFrame);
  scheduleFrame();
})();
