export function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-item__question');

    question.addEventListener('click', () => toggleFaq(item, faqItems));
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFaq(item, faqItems);
      }
    });
  });
}

function toggleFaq(item, allItems) {
  const isOpen = item.classList.contains('open');
  const question = item.querySelector('.faq-item__question');

  // Close all others
  allItems.forEach((other) => {
    other.classList.remove('open');
    const btn = other.querySelector('.faq-item__question');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });

  // Toggle current
  if (!isOpen) {
    item.classList.add('open');
    question.setAttribute('aria-expanded', 'true');
  }
}
