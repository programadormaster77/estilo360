import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

export default function CreadorEmpresa() {
  const [data, setData] = useState({ email:"", pass:"", nombre:"", tipo:"barberia" });

  const handleCreate = async (e) => {
    e.preventDefault();
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.pass);
    const empresaId = cred.user.uid; // usar uid como company id
    await setDoc(doc(db, "empresas", empresaId), {
      nombre: data.nombre,
      tipo: data.tipo,
      adminUid: empresaId,
      creadoEn: new Date(),
    });
    // ahora crear servicios por defecto (puedes llamar un script createCompanySeed)
    // finalmente mostrar link: /empresa/{empresaId}
  }
}
