// ============================================================
// CONFIGURACIÓN FIREBASE — LAS DOS BICICLETAS
// ============================================================
// INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto nuevo llamado "las-dos-bicicletas"
// 3. Agrega una app web
// 4. Copia tu configuración y reemplaza los valores abajo
// 5. Activa Firestore Database (modo producción)
// 6. Activa Authentication → Email/Password
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyDHM4FNw2qUJUNKsR3WznWtSrMHxpGtRV4",
  authDomain: "las-dos-bicicletas-7b336.firebaseapp.com",
  projectId: "las-dos-bicicletas-7b336",
  storageBucket: "las-dos-bicicletas-7b336.firebasestorage.app",
  messagingSenderId: "545727179466",
  appId: "1:545727179466:web:138ac79104234f3482e233"
};

// Inicialización Firebase
firebase.initializeApp(firebaseConfig);

// Referencias globales
const db = firebase.firestore();
const auth = firebase.auth();

// ============================================================
// REGLAS FIRESTORE RECOMENDADAS (pegar en Firebase Console)
// ============================================================
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /{document=**} {
//       allow read, write: if request.auth != null;
//     }
//   }
// }
// ============================================================
