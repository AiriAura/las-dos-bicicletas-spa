/* ============================================================
   LAS DOS BICICLETAS — JS SITIO PÚBLICO
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Navbar scroll effect ----
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  // ---- Smooth scroll para links internos ----
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80; // altura del navbar fijo
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth'
      });
      // Cierra menú móvil si está abierto
      const navCollapse = document.getElementById('navMenu');
      if (navCollapse?.classList.contains('show')) {
        bootstrap.Collapse.getInstance(navCollapse)?.hide();
      }
    });
  });

  // ---- Animación reveal al hacer scroll ----
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Aplica reveal a tarjetas, pasos y secciones
  document.querySelectorAll(
    '.service-card, .step-card, .testimonial-card, .gallery-item, .trust-item, .location-info-card'
  ).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 3) * 0.08}s`;
    revealObserver.observe(el);
  });

});
