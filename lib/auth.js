import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);

// Garantiza que siempre tengamos un usuario anónimo
export function ensureAnonymousUser() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        localStorage.setItem("userId", user.uid);
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          localStorage.setItem("userId", cred.user.uid);
          resolve(cred.user);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

// Obtener el usuario actual
export async function getCurrentUser() {
  const userId = localStorage.getItem("userId");
  if (userId) {
    return { uid: userId };
  }
  return await ensureAnonymousUser();
}
