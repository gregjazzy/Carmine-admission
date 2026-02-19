export function initParallax() {
  // Disable on mobile
  if (window.innerWidth <= 768) return;

  const parallaxElements = document.querySelectorAll('[data-parallax]');
  if (!parallaxElements.length) return;

  let ticking = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target._isVisible = entry.isIntersecting;
      });
    },
    { rootMargin: '100px' }
  );

  parallaxElements.forEach((el) => {
    el._isVisible = false;
    observer.observe(el);
  });

  function updateParallax() {
    const scrollY = window.scrollY;

    parallaxElements.forEach((el) => {
      if (!el._isVisible) return;

      const speed = parseFloat(el.dataset.parallax) || 0.3;
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = centerY - viewportCenter;
      const offset = distance * speed;

      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
}
