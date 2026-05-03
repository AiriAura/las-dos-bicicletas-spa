/* ============================================================
   LAS DOS BICICLETAS — AUTENTICACIÓN
   ============================================================ */

// Guard para admin.html — redirige si no hay sesión
if (window.location.pathname.includes('admin.html')) {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      const el = document.getElementById('user-email-display');
      if (el) el.textContent = user.email;
    }
  });
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'login.html';
    });
  }
});
