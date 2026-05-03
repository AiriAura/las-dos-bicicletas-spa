# 🚲 Las Dos Bicicletas — Guía de instalación y uso

## Estructura de archivos

```
las-dos-bicicletas/
├── index.html          ← Sitio público (landing page)
├── admin.html          ← Panel interno del taller
├── login.html          ← Acceso al panel interno
├── firebase.json       ← Configuración Firebase Hosting
├── css/
│   ├── style.css       ← Estilos sitio público
│   └── admin.css       ← Estilos panel admin
├── js/
│   ├── firebase-config.js  ← ⚠️ TU CONFIGURACIÓN AQUÍ
│   ├── main.js             ← JS sitio público
│   ├── admin.js            ← JS módulo admin
│   └── auth.js             ← Autenticación
└── assets/
    └── images/         ← Pon tus fotos aquí
```

---

## PASO 1 — Configurar Firebase

1. Ve a https://console.firebase.google.com
2. Crea un proyecto nuevo: "las-dos-bicicletas"
3. En el proyecto, haz clic en **"Agregar app" → Web**
4. Copia la configuración que te muestra Firebase
5. Abre `js/firebase-config.js` y reemplaza los valores:

```js
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  // etc...
};
```

---

## PASO 2 — Activar Firestore

1. En Firebase Console → **Firestore Database**
2. Clic en "Crear base de datos"
3. Elige **"Comenzar en modo producción"**
4. Selecciona región: `us-central1` (recomendado)

### Reglas de seguridad (pegar en Firebase Console → Firestore → Reglas):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## PASO 3 — Activar Authentication

1. Firebase Console → **Authentication** → "Comenzar"
2. Método de acceso → **Email/Contraseña** → Activar
3. Pestaña "Usuarios" → Agregar usuario:
   - Email: el correo con el que entrará el taller
   - Contraseña: crea una segura

---

## PASO 4 — Desplegar en Firebase Hosting

```bash
# Instalar Firebase CLI (solo la primera vez)
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar en la carpeta del proyecto
firebase init hosting

# Cuando pregunte la carpeta pública, pon: .
# ¿Configurar como SPA? No

# Publicar
firebase deploy --only hosting
```

Tu web estará disponible en: `https://tu-proyecto.web.app`

---

## Cómo editar contenido

### Cambiar precios
Abre `index.html` y busca la sección `<!-- SERVICIOS -->`.
Cada servicio tiene un `<div class="service-price">` — edita el valor ahí.

### Cambiar textos
Todo el texto del sitio está en `index.html`. Búscalo con Ctrl+F por el texto que quieres cambiar.

### Cambiar número de WhatsApp
Busca en `index.html` todas las ocurrencias de `56998625113` y reemplázalas por el número real (sin espacios, con código de país sin el +).

### Reemplazar imágenes placeholder
En la sección de galería (`<!-- GALERÍA TRABAJOS -->`), reemplaza cada `<div class="gallery-placeholder">` por:
```html
<img src="assets/images/tu-foto.jpg" alt="Descripción" class="img-fluid w-100" style="height:220px;object-fit:cover;border-radius:12px;">
```

### Agregar testimonios reales
Busca la sección `<!-- TESTIMONIOS -->` y reemplaza el texto de cada `.testimonial-text` con la reseña real del cliente.

---

## Lógica de fidelización

- Al registrar una mantención, el sistema suma +1 al contador del cliente.
- Cuando llega a **3 mantenciones**, el cliente se marca automáticamente como "Frecuente ⭐".
- En el panel "Clientes Frecuentes" puedes ver todos los clientes que califican y contactarlos por WhatsApp.
- Para cambiar el umbral (ej: de 3 a 5), edita esta línea en `js/admin.js`:
  ```js
  const UMBRAL_FRECUENTE = 3; // ← cambia este número
  ```

---

## Costos estimados (plan Spark gratuito de Firebase)

| Recurso | Límite gratuito | Uso estimado taller pequeño |
|---|---|---|
| Firestore reads | 50.000/día | ~500/día → ✅ gratis |
| Firestore writes | 20.000/día | ~50/día → ✅ gratis |
| Hosting | 10 GB transferencia/mes | ✅ gratis |
| Authentication | 10.000 usuarios/mes | ✅ gratis |

**Para un taller pequeño, esto es completamente gratuito.**

---

## Soporte y mantenimiento

Para agregar nuevos servicios, edita `index.html` en la sección de servicios.
Para cambiar los tipos de bicicleta en el formulario, edita el `<select id="cliente-tipobici">` en `admin.html`.
Para resetear contraseña del admin: Firebase Console → Authentication → Usuarios → Restablecer contraseña.
