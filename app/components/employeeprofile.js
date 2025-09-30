// app/components/employeeProfile.js
"use client";

import { useEffect, useState } from "react";
import { auth, storage } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, addFotoMeta } from "../../lib/db";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import jsPDF from "jspdf";

export default function EmployeeProfile({ empleadoId, onSignOut }) {
  const [user, setUser] = useState(null);
  const [misCitas, setMisCitas] = useState([]);
  const [fotos, setFotos] = useState([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    // cargar citas del empleado
    (async () => {
      const q = query(collection(db, "citas"), where("empleadoId", "==", empleadoId));
      const snap = await getDocs(q);
      setMisCitas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
    // cargar fotos asociadas
    (async () => {
      const q = query(collection(db, "fotos"), where("empleadoId", "==", empleadoId));
      const snap = await getDocs(q);
      setFotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
    return () => unsub();
  }, [empleadoId]);

  async function handleFile(file, clienteId) {
    if (!file) return;
    const storageRef = ref(storage, `empleados/${empleadoId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on("state_changed",
      null,
      (error) => { console.error(error); alert("Error subiendo"); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        // guardar metadatos en Firestore
        await addFotoMeta({ empleadoId, url, nombre: file.name, clienteId: clienteId || null });
        setFotos(prev => [{ url, nombre: file.name, clienteId: clienteId || null }, ...prev]);
      }
    );
  }

  function exportPdf() {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 10;
    fotos.forEach((f, i) => {
      if (i > 0 && i % 2 === 0) doc.addPage();
      doc.text(`${f.nombre}`, 10, y);
      doc.addImage(f.url, 'JPEG', 10, y+5, 80, 60);
      y += 70;
    });
    doc.save(`galeria_${empleadoId}.pdf`);
  }

  if (!user) return <p className="text-sm text-gray-500">Inicia sesión para administrar tu perfil.</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mi perfil</h3>
        <div>
          <button className="bg-gray-200 px-3 py-1 rounded mr-2" onClick={exportPdf}>Exportar PDF</button>
          <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => { auth.signOut(); onSignOut && onSignOut(); }}>Salir</button>
        </div>
      </div>

      <section className="bg-white p-4 rounded">
        <h4 className="font-medium mb-2">Mis citas</h4>
        {misCitas.length === 0 ? <p className="text-sm text-gray-500">No hay citas asignadas.</p> : (
          <ul className="divide-y">
            {misCitas.map(c => (
              <li key={c.id} className="py-2">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{c.servicio} — {c.cliente}</div>
                    <div className="text-sm text-gray-600">{c.fecha}</div>
                  </div>
                  <div className="text-sm">{c.estado}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white p-4 rounded">
        <h4 className="font-medium mb-2">Subir foto / galería</h4>
        <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} className="mb-2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {fotos.map((f, i) => (
            <div key={i} className="rounded overflow-hidden">
              <img src={f.url} alt={f.nombre} className="w-full h-28 object-cover" />
              <div className="p-2 text-sm">{f.clienteId ? `Cliente: ${f.clienteId}` : f.nombre}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
