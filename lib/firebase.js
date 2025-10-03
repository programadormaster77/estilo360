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
  storageBucket: "estilo360-d809d.appspot.com",
  messagingSenderId: "620119596749",
  appId: "1:620119596749:web:07272107ecbedf1da05384"
};

// ✅ Inicializa solo una vez
const app = initializeApp(firebaseConfig);

// ✅ Exporta instancias únicas
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
