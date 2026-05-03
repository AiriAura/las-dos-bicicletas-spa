/* ============================================================
   LAS DOS BICICLETAS — JS MÓDULO ADMIN
   CRUD completo: Clientes + Mantenciones + Dashboard
   ============================================================ */

// ---- UMBRAL CLIENTE FRECUENTE ----
const UMBRAL_FRECUENTE = 3;

// ---- CACHÉ local para clientes (evitar queries repetidas) ----
let clientesCache = [];

// ---- UTILIDADES ----
const formatFecha = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPrecio = (n) => {
  if (!n && n !== 0) return '—';
  return '$' + Number(n).toLocaleString('es-CL');
};

const initials = (name) => {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

// Toast
const showToast = (msg, isError = false) => {
  const el = document.getElementById('toastMsg');
  const txt = document.getElementById('toastText');
  txt.textContent = msg;
  el.className = `toast align-items-center text-white border-0 ${isError ? 'bg-danger' : 'bg-success'}`;
  const t = new bootstrap.Toast(el, { delay: 3000 });
  t.show();
};

// ================================================================
// NAVEGACIÓN
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.sidebar-link[data-section]');
  const sections = document.querySelectorAll('.admin-section');
  const pageTitle = document.getElementById('pageTitle');

  const sectionNames = {
    dashboard: 'Dashboard',
    clientes: 'Clientes',
    mantenciones: 'Mantenciones',
    frecuentes: 'Clientes Frecuentes'
  };

  const navigate = (target) => {
    links.forEach(l => l.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    document.querySelector(`[data-section="${target}"]`)?.classList.add('active');
    document.getElementById(`section-${target}`)?.classList.add('active');
    if (pageTitle) pageTitle.textContent = sectionNames[target] || '';

    // Cierra sidebar en mobile
    document.getElementById('adminSidebar')?.classList.remove('open');

    // Carga datos al navegar
    if (target === 'dashboard') loadDashboard();
    if (target === 'clientes') loadClientes();
    if (target === 'mantenciones') loadMantenciones();
    if (target === 'frecuentes') loadFrecuentes();
  };

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.section);
    });
  });

  // Sidebar toggle mobile
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('adminSidebar')?.classList.toggle('open');
  });

  // Overlay para cerrar sidebar en mobile
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('adminSidebar');
    const toggle = document.getElementById('sidebarToggle');
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
      sidebar.classList.remove('open');
    }
  });

  // Establece fecha de hoy en el modal de mantención
  document.getElementById('mant-fecha')?.setAttribute('value', new Date().toISOString().split('T')[0]);

  // Carga inicial
  loadDashboard();
  precargarClientesSelect();
});

// ================================================================
// CLIENTES
// ================================================================
async function loadClientes(filtro = '') {
  const tbody = document.getElementById('clientes-list');
  if (!tbody) return;

  try {
    const snap = await db.collection('clientes').orderBy('nombre').get();
    clientesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const filtrados = filtro
      ? clientesCache.filter(c =>
          c.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
          c.telefono?.includes(filtro)
        )
      : clientesCache;

    if (filtrados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No hay clientes registrados aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map(c => `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="frecuente-avatar" style="width:32px;height:32px;font-size:.75rem;">${initials(c.nombre)}</div>
            <strong>${c.nombre || '—'}</strong>
          </div>
        </td>
        <td>${c.telefono || '—'}</td>
        <td>${c.tipoBici || '—'}</td>
        <td>
          <span class="fw-bold" style="color:var(--red)">${c.totalMantenciones || 0}</span>
        </td>
        <td>
          ${c.esClienteFrecuente
            ? `<span class="badge-frecuente">⭐ Frecuente</span>`
            : `<span class="badge-regular">Regular</span>`}
        </td>
        <td>
          <button class="btn-icon me-1" onclick="verHistorial('${c.id}', '${(c.nombre || '').replace(/'/g, "\\'")}')">
            <i class="bi bi-clock-history"></i>
          </button>
          <button class="btn-icon" onclick="wa('${c.telefono}')">
            <i class="bi bi-whatsapp" style="color:#25D366"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Error al cargar clientes.</td></tr>`;
    console.error(err);
  }
}

// Búsqueda en tiempo real
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-clientes')?.addEventListener('input', e => {
    loadClientes(e.target.value);
  });
});

// WhatsApp rápido
function wa(tel) {
  if (!tel) return;
  const clean = tel.replace(/[^0-9]/g, '');
  window.open(`https://wa.me/56${clean.replace(/^56/, '')}?text=Hola%2C%20te%20contactamos%20desde%20Las%20Dos%20Bicicletas.`, '_blank');
}

// Guardar cliente nuevo
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save-cliente-btn')?.addEventListener('click', async () => {
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const tipoBici = document.getElementById('cliente-tipobici').value;
    const errEl = document.getElementById('cliente-error');

    errEl.classList.add('d-none');

    if (!nombre) {
      errEl.textContent = 'El nombre es obligatorio.';
      errEl.classList.remove('d-none');
      return;
    }

    try {
      await db.collection('clientes').add({
        nombre,
        telefono,
        tipoBici,
        fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
        totalMantenciones: 0,
        esClienteFrecuente: false,
        beneficioSugerido: ''
      });

      bootstrap.Modal.getInstance(document.getElementById('modalCliente'))?.hide();
      document.getElementById('cliente-nombre').value = '';
      document.getElementById('cliente-telefono').value = '';
      document.getElementById('cliente-tipobici').value = '';
      showToast(`✅ Cliente "${nombre}" registrado correctamente.`);
      loadClientes();
      loadDashboard();
      precargarClientesSelect();
    } catch (err) {
      errEl.textContent = 'Error al guardar. Intenta nuevamente.';
      errEl.classList.remove('d-none');
      console.error(err);
    }
  });
});

// ================================================================
// MANTENCIONES
// ================================================================
async function loadMantenciones() {
  const tbody = document.getElementById('mantenciones-list');
  if (!tbody) return;

  try {
    const snap = await db.collection('mantenciones').orderBy('fecha', 'desc').limit(100).get();

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay mantenciones registradas aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = snap.docs.map(d => {
      const m = d.data();
      return `
        <tr>
          <td><strong>${m.clienteNombre || '—'}</strong></td>
          <td>${m.servicio || '—'}</td>
          <td>${formatFecha(m.fecha)}</td>
          <td>${formatPrecio(m.precio)}</td>
          <td>${formatFecha(m.proximaFecha)}</td>
          <td>
            ${m.estado === 'completado'
              ? `<span class="badge-estado-completado">Completado</span>`
              : `<span class="badge-estado-pendiente">Pendiente</span>`}
          </td>
          <td title="${m.observaciones || ''}" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${m.observaciones || '—'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Error al cargar mantenciones.</td></tr>`;
    console.error(err);
  }
}

// Precarga select de clientes en modal de mantención
async function precargarClientesSelect() {
  const sel = document.getElementById('mant-cliente');
  if (!sel) return;

  try {
    const snap = await db.collection('clientes').orderBy('nombre').get();
    sel.innerHTML = '<option value="">Seleccionar cliente...</option>';
    snap.docs.forEach(d => {
      const c = d.data();
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${c.nombre} ${c.tipoBici ? `(${c.tipoBici})` : ''}`;
      opt.dataset.nombre = c.nombre;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error('Error cargando clientes para select:', err);
  }
}

// Guardar mantención
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save-mant-btn')?.addEventListener('click', async () => {
    const clienteId = document.getElementById('mant-cliente').value;
    const servicio = document.getElementById('mant-servicio').value;
    const precio = parseFloat(document.getElementById('mant-precio').value) || 0;
    const fechaStr = document.getElementById('mant-fecha').value;
    const proximaStr = document.getElementById('mant-proxima').value;
    const observaciones = document.getElementById('mant-observaciones').value.trim();
    const estado = document.getElementById('mant-estado').value;
    const errEl = document.getElementById('mant-error');
    const selCliente = document.getElementById('mant-cliente');

    errEl.classList.add('d-none');

    if (!clienteId || !servicio || !fechaStr) {
      errEl.textContent = 'Cliente, servicio y fecha son obligatorios.';
      errEl.classList.remove('d-none');
      return;
    }

    const clienteNombre = selCliente.options[selCliente.selectedIndex]?.dataset.nombre || '';

    try {
      // 1. Registrar mantención
      await db.collection('mantenciones').add({
        clienteId,
        clienteNombre,
        servicio,
        precio,
        fecha: firebase.firestore.Timestamp.fromDate(new Date(fechaStr + 'T12:00:00')),
        proximaFecha: proximaStr
          ? firebase.firestore.Timestamp.fromDate(new Date(proximaStr + 'T12:00:00'))
          : null,
        observaciones,
        estado,
        creadoEn: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 2. Actualizar contador en cliente (transacción simple)
      const clienteRef = db.collection('clientes').doc(clienteId);
      await db.runTransaction(async (tx) => {
        const clienteDoc = await tx.get(clienteRef);
        if (!clienteDoc.exists) throw new Error('Cliente no encontrado');
        const total = (clienteDoc.data().totalMantenciones || 0) + 1;
        const esFrecuente = total >= UMBRAL_FRECUENTE;
        tx.update(clienteRef, {
          totalMantenciones: total,
          esClienteFrecuente: esFrecuente,
          beneficioSugerido: esFrecuente
            ? 'Descuento 10% en próxima mantención o ajuste gratis'
            : ''
        });
      });

      // 3. Cierra modal y limpia
      bootstrap.Modal.getInstance(document.getElementById('modalMantencion'))?.hide();
      document.getElementById('mant-cliente').value = '';
      document.getElementById('mant-servicio').value = '';
      document.getElementById('mant-precio').value = '';
      document.getElementById('mant-fecha').value = new Date().toISOString().split('T')[0];
      document.getElementById('mant-proxima').value = '';
      document.getElementById('mant-observaciones').value = '';
      document.getElementById('mant-estado').value = 'completado';

      showToast(`✅ Mantención de ${clienteNombre} registrada correctamente.`);
      loadMantenciones();
      loadDashboard();
      loadClientes();
      loadFrecuentes();

    } catch (err) {
      errEl.textContent = 'Error al guardar. Intenta nuevamente.';
      errEl.classList.remove('d-none');
      console.error(err);
    }
  });
});

// ================================================================
// HISTORIAL POR CLIENTE
// ================================================================
async function verHistorial(clienteId, nombre) {
  document.getElementById('historial-nombre').textContent = nombre;
  const listEl = document.getElementById('historial-list');
  const resumenEl = document.getElementById('historial-resumen');
  listEl.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Cargando...</td></tr>';

  // Muestra modal
  new bootstrap.Modal(document.getElementById('modalHistorial')).show();

  try {
    const [clienteSnap, mantSnap] = await Promise.all([
      db.collection('clientes').doc(clienteId).get(),
      db.collection('mantenciones').where('clienteId', '==', clienteId).orderBy('fecha', 'desc').get()
    ]);

    const c = clienteSnap.data();
    const mantencionesCliente = mantSnap.docs.map(d => d.data());

    // Resumen
    const totalPagado = mantencionesCliente.reduce((sum, m) => sum + (m.precio || 0), 0);
    resumenEl.innerHTML = `
      <div class="col-6 col-md-3">
        <div class="stat-card">
          <div class="stat-value" style="font-size:1.5rem">${c?.totalMantenciones || 0}</div>
          <div class="stat-label">Mantenciones</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card">
          <div class="stat-value" style="font-size:1.5rem">${formatPrecio(totalPagado)}</div>
          <div class="stat-label">Total pagado</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card">
          <div class="stat-value" style="font-size:1.2rem">${c?.tipoBici || '—'}</div>
          <div class="stat-label">Tipo bici</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card" style="${c?.esClienteFrecuente ? 'border-color:rgba(245,166,35,.4)' : ''}">
          <div class="stat-value" style="font-size:1rem;margin-top:.25rem">
            ${c?.esClienteFrecuente ? '⭐ Frecuente' : 'Regular'}
          </div>
          <div class="stat-label">Estado</div>
          ${c?.beneficioSugerido ? `<div style="font-size:.72rem;color:#f5a623;margin-top:.3rem">${c.beneficioSugerido}</div>` : ''}
        </div>
      </div>
    `;

    // Tabla
    if (mantencionesCliente.length === 0) {
      listEl.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Sin mantenciones registradas.</td></tr>';
      return;
    }

    listEl.innerHTML = mantencionesCliente.map(m => `
      <tr>
        <td>${formatFecha(m.fecha)}</td>
        <td>${m.servicio || '—'}</td>
        <td>${formatPrecio(m.precio)}</td>
        <td>${formatFecha(m.proximaFecha)}</td>
        <td style="max-width:180px;font-size:.82rem;color:rgba(255,255,255,.5)">${m.observaciones || '—'}</td>
      </tr>
    `).join('');

  } catch (err) {
    listEl.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Error al cargar historial.</td></tr>`;
    console.error(err);
  }
}

// ================================================================
// CLIENTES FRECUENTES
// ================================================================
async function loadFrecuentes() {
  const container = document.getElementById('frecuentes-list');
  if (!container) return;

  container.innerHTML = '<div class="col-12 text-center text-muted py-4">Cargando...</div>';

  try {
    const snap = await db.collection('clientes')
      .where('esClienteFrecuente', '==', true)
      .orderBy('totalMantenciones', 'desc')
      .get();

    if (snap.empty) {
      container.innerHTML = `
        <div class="col-12">
          <div class="admin-card">
            <div class="admin-card-body text-center py-5">
              <div style="font-size:3rem;margin-bottom:.75rem">⭐</div>
              <h5 style="color:var(--text-white)">Aún no hay clientes frecuentes</h5>
              <p style="color:var(--text-muted-admin);font-size:.9rem">
                Cuando un cliente alcance ${UMBRAL_FRECUENTE} mantenciones, aparecerá aquí automáticamente.
              </p>
            </div>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = snap.docs.map(d => {
      const c = d.data();
      return `
        <div class="col-sm-6 col-lg-4">
          <div class="frecuente-card">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="frecuente-avatar">${initials(c.nombre)}</div>
              <div>
                <div class="fw-bold" style="color:var(--text-white)">${c.nombre}</div>
                <div style="font-size:.82rem;color:var(--text-muted-admin)">${c.tipoBici || 'Bicicleta'}</div>
              </div>
              <span class="badge-frecuente ms-auto">⭐ Frecuente</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span style="font-size:.82rem;color:var(--text-muted-admin)">Mantenciones</span>
              <span class="fw-bold text-red">${c.totalMantenciones}</span>
            </div>
            ${c.beneficioSugerido ? `
              <div style="background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.2);border-radius:8px;padding:.6rem .8rem;font-size:.82rem;color:#f5a623;margin-bottom:.75rem">
                <i class="bi bi-gift-fill me-1"></i>${c.beneficioSugerido}
              </div>` : ''}
            <div class="d-flex gap-2">
              <button class="btn btn-primary-admin flex-fill" style="font-size:.82rem;padding:.4rem" onclick="verHistorial('${d.id}', '${(c.nombre || '').replace(/'/g, "\\'")}')">
                <i class="bi bi-clock-history me-1"></i>Historial
              </button>
              ${c.telefono ? `
                <button class="btn-icon flex-fill" style="background:rgba(37,211,102,.12);border-color:rgba(37,211,102,.2);color:#25D366" onclick="wa('${c.telefono}')">
                  <i class="bi bi-whatsapp me-1"></i>WhatsApp
                </button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = '<div class="col-12 text-center text-danger py-4">Error al cargar clientes frecuentes.</div>';
    console.error(err);
  }
}

// ================================================================
// DASHBOARD
// ================================================================
async function loadDashboard() {
  try {
    const [clientesSnap, mantSnap] = await Promise.all([
      db.collection('clientes').get(),
      db.collection('mantenciones').orderBy('fecha', 'desc').limit(200).get()
    ]);

    const clientes = clientesSnap.docs.map(d => d.data());
    const mantenciones = mantSnap.docs.map(d => d.data());

    const totalClientes = clientes.length;
    const totalMant = mantenciones.length;
    const totalFrecuentes = clientes.filter(c => c.esClienteFrecuente).length;
    const totalIngresos = mantenciones.reduce((s, m) => s + (m.precio || 0), 0);

    document.getElementById('stat-clientes').textContent = totalClientes;
    document.getElementById('stat-mantenciones').textContent = totalMant;
    document.getElementById('stat-frecuentes').textContent = totalFrecuentes;
    document.getElementById('stat-ingresos').textContent = formatPrecio(totalIngresos);

    // Últimas 5 mantenciones
    const tbody = document.getElementById('dashboard-mantenciones-list');
    if (tbody) {
      const ultimas = mantenciones.slice(0, 5);
      if (ultimas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Sin mantenciones aún.</td></tr>';
      } else {
        tbody.innerHTML = ultimas.map(m => `
          <tr>
            <td><strong>${m.clienteNombre || '—'}</strong></td>
            <td>${m.servicio || '—'}</td>
            <td>${formatFecha(m.fecha)}</td>
            <td>${formatPrecio(m.precio)}</td>
            <td>${m.estado === 'completado'
              ? '<span class="badge-estado-completado">Completado</span>'
              : '<span class="badge-estado-pendiente">Pendiente</span>'}</td>
          </tr>
        `).join('');
      }
    }

    // Próximas mantenciones sugeridas (proxima fecha >= hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximas = mantenciones
      .filter(m => m.proximaFecha && m.proximaFecha.toDate() >= hoy)
      .sort((a, b) => a.proximaFecha.toDate() - b.proximaFecha.toDate())
      .slice(0, 5);

    const tbodyProx = document.getElementById('dashboard-proximas-list');
    if (tbodyProx) {
      if (proximas.length === 0) {
        tbodyProx.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Sin mantenciones próximas programadas.</td></tr>';
      } else {
        // Buscar teléfono del cliente
        const clientesMap = {};
        clientesSnap.docs.forEach(d => { clientesMap[d.id] = d.data(); });

        tbodyProx.innerHTML = proximas.map(m => {
          const cliente = clientesMap[m.clienteId];
          const tel = cliente?.telefono || '';
          return `
            <tr>
              <td><strong>${m.clienteNombre || '—'}</strong></td>
              <td>${tel || '—'}</td>
              <td>${formatFecha(m.proximaFecha)}</td>
              <td>
                ${tel
                  ? `<button class="btn-icon" onclick="wa('${tel}')" title="Recordar por WhatsApp">
                       <i class="bi bi-whatsapp" style="color:#25D366"></i>
                     </button>`
                  : '—'}
              </td>
            </tr>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error('Error cargando dashboard:', err);
  }
}
