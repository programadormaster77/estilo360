"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import Navbar from "../../../components/navbar";
import ServicesGrid from "../../../components/servicesgrid";
import ProfessionalsGrid from "../../../components/professionalsgrid";
import AppointmentForm from "../../../components/appointmentform";

// Importa tu themes.js (ruta según tu proyecto)
import themes from "../../../styles/themes";

/**
 * UserEmpresaPage (corregido)
 *
 * - Evita llamadas condicionales de hooks (mantenemos el mismo orden en cada render)
 * - Inyecta/limpia el CSS de tema dinámicamente sin romper el orden de hooks
 * - Comentarios para que veas dónde tocar si quieres cambiar rutas
 */
export default function UserEmpresaPage() {
  const { id } = useParams();

  // --- estados ---
  const [empresa, setEmpresa] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);

  // --- 1) efecto de carga de datos (siempre declarado) ---
  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const fetchData = async () => {
      try {
        // Empresa
        const empresaDoc = await getDoc(doc(db, "empresas", id));
        if (empresaDoc.exists()) {
          const empresaData = empresaDoc.data();
          const serviciosProcesados = Object.entries(empresaData.servicios || {})
            .filter(([_, value]) => value !== false)
            .map(([key, value]) => (typeof value === "string" ? value : key));

          if (!mounted) return;
          setEmpresa({ id: empresaDoc.id, ...empresaData });
          setServicios(serviciosProcesados);
        } else {
          if (!mounted) return;
          setEmpresa(null);
          setServicios([]);
        }

        // Empleados
        const empleadosSnap = await getDocs(collection(db, "empresas", id, "empleados"));
        if (!mounted) return;
        setEmpleados(empleadosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [id]);

  // --- 2) efecto que inyecta el CSS dinámico (siempre declarado, usa 'empresa' como dependencia) ---
  useEffect(() => {
    // Determina el tema según la empresa (puede ser undefined si empresa === null)
    const estiloLocal = themes[empresa?.tipoEmpresa?.toLowerCase()] || themes.default;

    // Si no hay archivo cssFile definido, no hacemos nada (pero el hook ya fue declarado)
    if (!estiloLocal || !estiloLocal.cssFile) return;

    // Evitar duplicados: eliminar otros <link data-theme="..."> distintos
    const existingThemeLinks = Array.from(document.querySelectorAll('link[data-theme]'));
    existingThemeLinks.forEach((l) => {
      if (l.getAttribute("data-theme") !== estiloLocal.cssFile) {
        l.remove();
      }
    });

    // Si ya existe el link exacto no lo añadimos de nuevo
    let link = document.querySelector(`link[data-theme="${estiloLocal.cssFile}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = estiloLocal.cssFile; // e.g. "/styles/barberia.css"
      link.setAttribute("data-theme", estiloLocal.cssFile);
      document.head.appendChild(link);
    }

    // cleanup: remover solo el link que agregamos (si se llegó a crear aquí)
    return () => {
      // si el link sigue presente y coincide con este tema, lo removemos
      const current = document.querySelector(`link[data-theme="${estiloLocal.cssFile}"]`);
      if (current && current.parentNode) {
        current.parentNode.removeChild(current);
      }
    };
  }, [empresa]); // se reejecuta cuando cambia empresa (o su tipo)

  // --- 3) si aún no cargó la empresa, mostramos "cargando" ---
  if (!empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando empresa...</p>
      </div>
    );
  }

  // --- 4) ya con empresa cargada: obtenemos las clases del tema para render ---
  const estilo = themes[empresa.tipoEmpresa?.toLowerCase()] || themes.default;

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className={`relative h-[70vh] flex items-center justify-center ${estilo.heroClass}`}>
        <div className="container mx-auto relative z-10 px-6 text-center">
          <h1 className="text-4xl font-bold text-white drop-shadow">{empresa.nombreEmpresa}</h1>
          <p className="mt-2 text-white/90">
            Bienvenido a nuestra {empresa.tipoEmpresa}, agenda tu cita con nosotros.
          </p>
          <a href="#appointment" className={`inline-block mt-4 ${estilo.primaryBtn || "bg-blue-600 hover:bg-blue-700"} px-6 py-3 rounded-lg text-white shadow transition`}>
            Agendar Cita
          </a>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="services" className={`py-12 relative ${estilo.servicesClass || ""}`}>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-10">Nuetros Servicios</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
            {servicios.length > 0 ? (
              servicios.map((s, idx) => (
                <div key={idx} className={`${estilo.cardBg || "bg-white"} shadow rounded-xl p-4 text-center`}>
                  <p className="font-semibold">{s}</p>
                </div>
              ))
            ) : (
              <p className="text-center col-span-full text-gray-500">No hay servicios registrados</p>
            )}
          </div>
        </div>
      </section>

      {/* PROFESIONALES */}
      <section id="barbers" className={`py-12 relative ${estilo.teamClass || ""}`}>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-10">Nuestro Equipo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
            <ProfessionalsGrid empleados={empleados} />
          </div>
        </div>
      </section>

      {/* AGENDA */}
      <section id="appointment" className={`py-12 relative ${estilo.appointmentClass || ""}`}>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-10">Agenda tu cita</h2>
          <div className="max-w-2xl mx-auto">
            <AppointmentForm empresaId={empresa.id} empleados={empleados} />
          </div>
        </div>
      </section>

      {/* MAPA */}
      {empresa.mapaEmbed && (
        <div className={`mt-8 container mx-auto px-6 ${estilo.mapClass || ""}`}>
          <h3 className="text-lg font-semibold mb-4">Ubicación</h3>
          <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg">
            <iframe
              src={empresa.mapaEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`${estilo.footerClass || "bg-footer text-footer-text"} py-10 mt-10`}>
        <div className="container mx-auto px-6 text-center">
          <p>© {new Date().getFullYear()} {empresa.nombreEmpresa} — Estilo360</p>
        </div>
      </footer>
    </main>
  );
}
