export function initTestimonials() {
  const facades = document.querySelectorAll('.vimeo-facade');
  if (!facades.length) return;

  facades.forEach((facade) => {
    // Make facades keyboard accessible
    facade.setAttribute('role', 'button');
    facade.setAttribute('tabindex', '0');
    facade.setAttribute('aria-label', 'Play video');

    facade.addEventListener('click', () => loadVideo(facade));
    facade.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        loadVideo(facade);
      }
    });
  });
}

function loadVideo(facade) {
  const videoId = facade.dataset.vimeoId;
  if (!videoId) return;

  const wrapper = facade.parentElement;
  if (!wrapper) return;

  const embed = document.createElement('div');
  embed.className = 'vimeo-embed';
  embed.innerHTML = `<iframe
    src="https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
    title="Video testimonial"
  ></iframe>`;

  wrapper.replaceChild(embed, facade);
}
