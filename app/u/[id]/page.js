"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import Navbar from "../../../components/navbar";
import ServicesGrid from "../../../components/servicesgrid";
import ProfessionalsGrid from "../../../components/professionalsgrid";
import AppointmentForm from "../../../components/appointmentform";

// 🎨 Estilos dinámicos según empresa
import themes from "../../../styles/themes";


export default function UserEmpresaPage() {
  const { id } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // 📌 Empresa
        const empresaDoc = await getDoc(doc(db, "empresas", id));
        if (empresaDoc.exists()) {
          const empresaData = empresaDoc.data();

          const serviciosProcesados = Object.entries(
            empresaData.servicios || {}
          )
            .filter(([_, value]) => value !== false)
            .map(([key, value]) =>
              typeof value === "string" ? value : key
            );

          setEmpresa({ id: empresaDoc.id, ...empresaData });
          setServicios(serviciosProcesados);
        }

        // 📌 Empleados
        const empleadosSnap = await getDocs(
          collection(db, "empresas", id, "empleados")
        );
        setEmpleados(
          empleadosSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };

    fetchData();
  }, [id]);

  if (!empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando empresa...</p>
      </div>
    );
  }

  // ⚡ Detectar estilo dinámico
  const estilo =
    themes[empresa.tipoEmpresa?.toLowerCase()] || themes.default;

  return (
    <main className={`min-h-screen ${estilo.pageBg}`}>
      <Navbar />

      {/* HERO */}
      <section
        className={`hero relative h-[70vh] flex items-center justify-center ${estilo.heroBg}`}
        style={{
          backgroundImage: `url(${estilo.heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className={`absolute inset-0 ${estilo.overlay}`} />
        <div className="container mx-auto relative z-10 px-6 text-center">
          <h1 className="text-4xl font-bold text-white drop-shadow">
            {empresa.nombreEmpresa}
          </h1>
          <p className="mt-2 text-white/90">
            Bienvenido a nuestra {empresa.tipoEmpresa}, agenda tu cita con
            nosotros.
          </p>
          <a
            href="#appointment"
            className={`inline-block mt-4 ${estilo.primaryBtn} px-6 py-3 rounded-lg text-white shadow transition`}
          >
            Agendar Cita
          </a>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="services" className={`services py-12 ${estilo.sectionBg}`}>
        <div className="container mx-auto px-6">
          <h2 className={`text-3xl font-bold text-center mb-10 ${estilo.sectionTitle}`}>
            Nuestros Servicios
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
            {servicios.length > 0 ? (
              servicios.map((s, idx) => (
                <div
                  key={idx}
                  className={`card ${estilo.cardBg} shadow rounded-xl p-4 text-center`}
                >
                  <p className="font-semibold">{s}</p>
                </div>
              ))
            ) : (
              <p className="text-center col-span-full text-gray-500">
                No hay servicios registrados
              </p>
            )}
          </div>
        </div>
      </section>

      {/* PROFESIONALES */}
      <section id="barbers" className={`team py-12 ${estilo.altSectionBg}`}>
        <div className="container mx-auto px-6">
          <h2 className={`text-3xl font-bold text-center mb-10 ${estilo.sectionTitle}`}>
            Nuestro Equipo
          </h2>
          <ProfessionalsGrid empleados={empleados} />
        </div>
      </section>

      {/* AGENDA */}
      <section id="appointment" className={`appointment py-12 ${estilo.sectionBg}`}>
        <div className="container mx-auto px-6">
          <h2 className={`text-3xl font-bold text-center mb-10 ${estilo.sectionTitle}`}>
            Agenda tu cita
          </h2>
          <div className="max-w-2xl mx-auto">
            <AppointmentForm empresaId={id} empleados={empleados} />
          </div>
        </div>
      </section>

      {/* MAPA */}
      {empresa.mapaEmbed && (
        <div className="mt-8 container mx-auto px-6">
          <h3 className="text-lg font-semibold mb-4">Ubicación</h3>
          <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg">
            <iframe
              src={empresa.mapaEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`py-10 mt-10 ${estilo.footerBg}`}>
        <div className="container mx-auto px-6 text-center">
          <p>
            © {new Date().getFullYear()} {empresa.nombreEmpresa} — Estilo360
          </p>
        </div>
      </footer>
    </main>
  );
}
