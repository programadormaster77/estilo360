// app/components/employeeAuth.js
"use client";

import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getEmpleadosByEmpresa, linkAuthToEmpleado } from "../../lib/db";

export default function EmployeeAuth({ empresaId = "estilo360", onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState("");

  useEffect(() => {
    getEmpleadosByEmpresa(empresaId).then(setEmpleados).catch(console.error);
  }, [empresaId]);

  async function registerAndLink(e) {
    e.preventDefault();
    if (!selectedEmpleado) return alert("Selecciona el nombre del empleado al que te va a vincular.");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await linkAuthToEmpleado(selectedEmpleado, cred.user.uid);
      onAuth && onAuth(cred.user);
    } catch (err) {
      console.error(err); alert(err.message);
    }
  }

  async function login(e) {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      onAuth && onAuth(cred.user);
    } catch (err) {
      console.error(err); alert(err.message);
    }
  }

  async function loginGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // aquí pedimos al empleado que seleccione a cuál empleado corresponde y hacemos link
      if (!selectedEmpleado) {
        if (!confirm("No seleccionaste un empleado. Si deseas vincular tu cuenta al perfil del empleado, selecciónalo antes.")) {
          onAuth && onAuth(result.user);
          return;
        } else return;
      }
      await linkAuthToEmpleado(selectedEmpleado, result.user.uid);
      onAuth && onAuth(result.user);
    } catch (err) {
      console.error(err); alert(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white/5 p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Acceso de Empleados</h3>

      <label className="block text-sm">Selecciona tu nombre (vinculación)</label>
      <select className="w-full p-2 rounded mb-4" value={selectedEmpleado} onChange={e => setSelectedEmpleado(e.target.value)}>
        <option value="">— Seleccionar —</option>
        {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
      </select>

      <form onSubmit={login} className="space-y-3">
        <input type="email" placeholder="Correo" className="w-full p-2 rounded" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" className="w-full p-2 rounded" value={password} onChange={e=>setPassword(e.target.value)} required />
        <div className="flex gap-2">
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Iniciar sesión</button>
          <button type="button" onClick={registerAndLink} className="bg-secondary text-white px-4 py-2 rounded">Crear & Vincular</button>
        </div>
      </form>

      <div className="mt-4">
        <button onClick={loginGoogle} className="w-full bg-white text-black py-2 rounded">Continuar con Google</button>
      </div>
    </div>
  );
}
