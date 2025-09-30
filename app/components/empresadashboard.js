// app/components/empresaDashboard.js
"use client";

import { useEffect, useState } from "react";
import { listenAppointmentsByEmpresa, getEmpleadosByEmpresa } from "../../lib/db";

export default function EmpresaDashboard({ empresaId = "estilo360" }) {
  const [citas, setCitas] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    // escucha real-time citas
    const unsub = listenAppointmentsByEmpresa(empresaId, setCitas);
    // carga empleados (una vez)
    getEmpleadosByEmpresa(empresaId).then(setEmpleados).catch(console.error);
    return () => unsub && unsub();
  }, [empresaId]);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Citas recientes</h3>
        {citas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay citas aún.</p>
        ) : (
          <ul className="divide-y">
            {citas.map((c) => (
              <li key={c.id} className="py-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{c.servicio} — {c.cliente || "Anon"}</p>
                    <p className="text-sm text-gray-600">{c.empresaId} · {c.empleado || "Cualquiera"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{c.fecha}</p>
                    <p className={`text-sm font-semibold ${c.estado === "confirmada" ? "text-green-600" : "text-yellow-600"}`}>{c.estado || "pendiente"}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Empleados</h3>
        {empleados.length === 0 ? (
          <p className="text-sm text-gray-500">No hay empleados registrados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {empleados.map(e => (
              <div key={e.id} className="p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">{(e.nombre || "X")[0]}</div>
                  <div>
                    <div className="font-medium">{e.nombre}</div>
                    <div className="text-sm text-gray-600">{e.rol || "Empleado"}</div>
                    <div className="text-sm text-gray-500">{e.email || ""}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
