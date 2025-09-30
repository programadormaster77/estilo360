// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ⚡ Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBLITU130hvvvrgERSNXCN0MM39OUeKzAg",
  authDomain: "estilo360-d809d.firebaseapp.com",
  projectId: "estilo360-d809d",
  storageBucket: "estilo360-d809d.appspot.com", // 👈 corregido
  messagingSenderId: "620119596749",
  appId: "1:620119596749:web:07272107ecbedf1da05384"
};

// ✅ Inicializa solo una vez
const app = initializeApp(firebaseConfig);

// ✅ Exporta instancias únicas
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
