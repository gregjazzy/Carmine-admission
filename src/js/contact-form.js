import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_sq8z9cw';
const TEMPLATE_ID = 'template_y31d8sd';
const PUBLIC_KEY = 'WcGWFcWeI6MAScfmE';

export function initContactForm() {
  emailjs.init(PUBLIC_KEY);

  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Client-side validation
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('field-error');
      } else {
        field.classList.remove('field-error');
      }
    });

    // Email format validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      isValid = false;
      emailField.classList.add('field-error');
    }

    if (!isValid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const statusEl = form.querySelector('.form-status');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    // Reset status
    if (statusEl) {
      statusEl.className = 'form-status';
      statusEl.textContent = '';
    }

    try {
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form);

      if (statusEl) {
        statusEl.className = 'form-status success';
        statusEl.textContent = document.documentElement.lang === 'fr'
          ? 'Message envoy\u00e9 avec succ\u00e8s !'
          : 'Message sent successfully!';
      }

      // Redirect to thank-you page
      setTimeout(() => {
        window.location.href = '/thank-you.html';
      }, 1000);
    } catch (error) {
      console.error('EmailJS error:', error);
      if (statusEl) {
        statusEl.className = 'form-status error';
        statusEl.textContent = document.documentElement.lang === 'fr'
          ? 'Erreur lors de l\'envoi. Veuillez r\u00e9essayer.'
          : 'Error sending message. Please try again.';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Remove error styling on input
  form.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => field.classList.remove('field-error'));
  });
}
