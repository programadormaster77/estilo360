// components/appointmentform.js
"use client";

import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Datos de prueba (luego los traeremos de Firestore dinámicamente)
const serviciosPrueba = ["Corte de Cabello", "Tinte & Color", "Cuidado de Barba"];
const profesionalesPrueba = [
  { id: 1, nombre: "Carlos Torres", servicios: ["Corte de Cabello", "Cuidado de Barba"] },
  { id: 2, nombre: "Juan Pérez", servicios: ["Cuidado de Barba"] },
  { id: 3, nombre: "Laura Gómez", servicios: ["Tinte & Color"] },
];

export default function AppointmentForm({ empresaId }) {
  const [step, setStep] = useState(1);
  const [servicio, setServicio] = useState("");
  const [profesional, setProfesional] = useState(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!empresaId) {
      alert("No se encontró la empresa. Revisa el ID.");
      return;
    }
    if (!servicio || !profesional || !fecha || !hora) {
      alert("Completa todos los pasos antes de confirmar.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(
        collection(db, "empresas", empresaId, "citas"), // 👈 dinámico
        {
          servicio,
          profesionalId: profesional.id,
          profesionalNombre: profesional.nombre,
          fecha,
          hora,
          estado: "pendiente", // pendiente | confirmada | cancelada
          createdAt: serverTimestamp(),
        }
      );

      alert("✅ Cita guardada correctamente en la empresa.");
      // reset
      setStep(1);
      setServicio("");
      setProfesional(null);
      setFecha("");
      setHora("");
    } catch (err) {
      console.error(err);
      alert("❌ Error guardando la cita.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/20 text-white">
      {/* Paso 1 */}
      {step === 1 && (
        <div>
          <h3 className="text-xl font-semibold mb-6">1. Selecciona servicio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {serviciosPrueba.map((s, i) => (
              <button
                key={i}
                onClick={() => { setServicio(s); setStep(2); }}
                className="p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 transition text-left"
              >
                <div className="font-medium">{s}</div>
                <div className="text-sm text-gray-200/80 mt-1">Seleccione para continuar</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <div>
          <h3 className="text-xl font-semibold mb-6">2. Selecciona profesional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profesionalesPrueba.filter(p => p.servicios.includes(servicio)).map(p => (
              <button
                key={p.id}
                onClick={() => { setProfesional(p); setStep(3); }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 transition"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  {p.nombre.split(" ")[0][0]}
                </div>
                <div className="text-left">
                  <div className="font-medium">{p.nombre}</div>
                  <div className="text-sm text-gray-200/80">{p.servicios.join(", ")}</div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="mt-6 text-sm text-blue-300 hover:text-blue-400 transition"
          >
            ← Cambiar servicio
          </button>
        </div>
      )}

      {/* Paso 3 */}
      {step === 3 && (
        <div>
          <h3 className="text-xl font-semibold mb-6">3. Fecha y hora</h3>
          <input
            type="date"
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <input
            type="time"
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 mb-6 focus:outline-none focus:ring-2 focus:ring-primary"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-blue-300 hover:text-blue-400 transition"
            >
              ← Elegir otro profesional
            </button>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-primary px-6 py-3 rounded-lg shadow-md text-white font-medium hover:opacity-90 transition"
            >
              {loading ? "Guardando..." : "Confirmar cita"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
