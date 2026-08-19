// Le formulaire poste vers notre relais serveur (netlify/functions/envoi-message),
// qui garde la clé d'envoi Brevo hors du navigateur et achemine vers la boîte
// de Carmine sans jamais exposer l'adresse de destination.
const RELAIS = '/api/envoi-message';

export function initContactForm() {
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
      const donnees = Object.fromEntries(new FormData(form).entries());
      const reponse = await fetch(RELAIS, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(donnees),
      });
      if (!reponse.ok) throw new Error(`relais: ${reponse.status}`);

      if (statusEl) {
        statusEl.className = 'form-status success';
        statusEl.textContent = document.documentElement.lang === 'fr'
          ? 'Message envoyé avec succès !'
          : 'Message sent successfully!';
      }

      // Redirect to thank-you page
      setTimeout(() => {
        window.location.href = '/thank-you';
      }, 1000);
    } catch (error) {
      console.error('Envoi du message impossible :', error);
      if (statusEl) {
        statusEl.className = 'form-status error';
        statusEl.textContent = document.documentElement.lang === 'fr'
          ? 'Erreur lors de l\'envoi. Veuillez réessayer.'
          : 'Error sending message. Please try again.';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}
