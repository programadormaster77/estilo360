"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

export default function AppointmentForm({ empresaId }) {
  const [step, setStep] = useState(1);
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  const [servicio, setServicio] = useState(null);
  const [empleado, setEmpleado] = useState(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [loading, setLoading] = useState(false);

  // userId fallback anon
  function getLocalUserId() {
    const k = "estilo360_userid";
    let u = localStorage.getItem(k);
    if (!u) {
      u = "anon-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
      localStorage.setItem(k, u);
    }
    return u;
  }

  // Cargar servicios desde el doc de empresa
  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      try {
        const dRef = doc(db, "empresas", empresaId);
        const docSnap = await getDoc(dRef);
        if (docSnap.exists()) {
          const data = docSnap.data();

          if (data?.servicios) {
            // procesar servicios tipo objeto {0:"Peinados", 1:"Tratamientos capilares", corte:true}
            const servArray = Object.entries(data.servicios)
              .filter(([_, v]) => v !== false)
              .map(([k, v]) => {
                if (typeof v === "string") {
                  return { id: k, name: v };
                }
                if (v === true) {
                  return { id: k, name: k };
                }
                return null;
              })
              .filter(Boolean);
            setServicios(servArray);
          } else {
            setServicios([]);
          }
        }
      } catch (err) {
        console.error("Error leyendo servicios:", err);
      }
    })();
  }, [empresaId]);

  // Cargar empleados con snapshot en tiempo real
  useEffect(() => {
    if (!empresaId) return;
    const unsub = onSnapshot(
      collection(db, "empresas", empresaId, "empleados"),
      (snap) => {
        setEmpleados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, [empresaId]);

  const handleConfirm = async () => {
    if (!servicio || !empleado || !fecha || !hora) {
      alert("Completa todos los pasos.");
      return;
    }
    setLoading(true);
    try {
      const userId = auth?.currentUser?.uid || getLocalUserId();
      await addDoc(collection(db, "empresas", empresaId, "citas"), {
        servicio: servicio.name,
        empleadoId: empleado.id,
        empleadoNombre: empleado.nombre,
        fecha,
        hora,
        usuarioId: userId,
        usuarioNombre: auth?.currentUser?.displayName || null,
        estado: "pendiente",
        createdAt: serverTimestamp(),
      });
      alert("Cita guardada ✅");
      setStep(1);
      setServicio(null);
      setEmpleado(null);
      setFecha("");
      setHora("");
    } catch (err) {
      console.error(err);
      alert("Error guardando la cita: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // UI: paso a paso con datos ya cargados
  return (
    <div className="bg-white/5 p-6 rounded-xl text-white">
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">1. Selecciona servicio</h3>
          <div className="grid grid-cols-1 gap-3">
            {servicios.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setServicio(s);
                  setStep(2);
                }}
                className="p-3 rounded bg-white/10 text-left hover:bg-white/20 transition"
              >
                <div className="font-medium">{s.name}</div>
              </button>
            ))}
            {servicios.length === 0 && (
              <p className="text-sm text-gray-300">
                No hay servicios registrados para esta empresa.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && servicio && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            2. Selecciona profesional
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {empleados
              .filter((e) => {
                if (!servicio) return true;
                // validar si empleado tiene el servicio en sus habilidades
                if (
                  e.habilidades &&
                  typeof e.habilidades === "object" &&
                  e.habilidades[servicio.name]
                )
                  return true;

                if (Array.isArray(e.servicios)) {
                  return e.servicios.includes(servicio.name);
                }
                if (typeof e.servicios === "string") {
                  return e.servicios
                    .toLowerCase()
                    .includes(servicio.name.toLowerCase());
                }
                return false;
              })
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setEmpleado(e);
                    setStep(3);
                  }}
                  className="p-3 rounded bg-white/10 text-left flex gap-3 items-center hover:bg-white/20 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-black">
                    {(e.nombre || "")[0]}
                  </div>
                  <div>
                    <div className="font-medium">{e.nombre}</div>
                    <div className="text-sm text-white/80">
                      {Object.keys(e.habilidades || {})
                        .filter((k) => e.habilidades[k])
                        .join(", ")}
                    </div>
                  </div>
                </button>
              ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="mt-4 text-sm text-blue-300"
          >
            ← Cambiar servicio
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">3. Fecha y hora</h3>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full p-2 rounded mb-3 bg-white/10"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full p-2 rounded mb-4 bg-white/10"
          />
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-blue-300"
            >
              ← Elegir otro profesional
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-blue-600 px-4 py-2 rounded"
            >
              {loading ? "Guardando..." : "Confirmar cita"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
