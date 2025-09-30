// lib/db.js
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

/* Subcolecciones / colecciones sugeridas:
   empresas
   empleados
   citas
   fotos (opcional)
*/

export function listenAppointmentsByEmpresa(empresaId, cb) {
  const q = query(
    collection(db, "citas"),
    where("empresaId", "==", empresaId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(arr);
  });
}

export async function getEmpleadosByEmpresa(empresaId) {
  const q = query(collection(db, "empleados"), where("empresaId", "==", empresaId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function linkAuthToEmpleado(empleadoId, uid) {
  const ref = doc(db, "empleados", empleadoId);
  await updateDoc(ref, { authUid: uid });
}

export async function addCita(cita) {
  return await addDoc(collection(db, "citas"), { ...cita, createdAt: serverTimestamp() });
}

export async function addFotoMeta(meta) {
  return await addDoc(collection(db, "fotos"), { ...meta, createdAt: serverTimestamp() });
}
