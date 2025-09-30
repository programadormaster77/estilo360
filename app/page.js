"use client";

import Navbar from "../components/navbar";
import ServicesGrid from "../components/servicesgrid";
import ProfessionalsGrid from "../components/professionalsgrid";
import AppointmentForm from "../components/appointmentform";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home() {
  // ID de la empresa Barbería Elegance
  const empresaId = "ubqlbCUhrHW2UEIxMzNZVCjukZj2";

  // Estado para empleados y servicios
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);

  // Cargar datos desde Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener empleados
        const empleadosSnapshot = await getDocs(
          collection(db, "empresas", empresaId, "empleados")
        );
        setEmpleados(
          empleadosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        // 🚨 Si en Firestore guardas servicios, puedes cargarlos igual:
        const serviciosSnapshot = await getDocs(
          collection(db, "empresas", empresaId, "servicios")
        );
        setServicios(
          serviciosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    fetchData();
  }, []);

  // Aquí puedes cambiar las imágenes
  const heroImage = "/images/hero-barber.jpg";
  const servicesImage = "/images/servicios-bg.jpg";
  const teamImage = "/images/equipo-bg.jpg";
  const appointmentImage = "/images/agenda-bg.jpg";
  const mapsImage = "/images/maps-bg.jpg";

  return (
    <main className="min-h-screen bg-surface">
      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <section
        className="relative h-[70vh] md:h-[80vh] flex items-center"
        style={{
          backgroundImage: `url('${heroImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="container mx-auto relative z-10 px-6">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
              Barbería Elegance
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90 drop-shadow">
              Tu estilo, tu esencia — profesionales que te conocen.
            </p>
            <a
              href="#appointment"
              className="inline-block mt-6 bg-primary px-6 py-3 rounded-lg text-white shadow hover:opacity-95 transition"
            >
              Agendar Cita
            </a>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section
        id="services"
        className="py-12 md:py-20 relative"
        style={{
          backgroundImage: `url('${servicesImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white drop-shadow">
            Nuestros Servicios
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
            <ServicesGrid servicios={servicios} />
          </div>
        </div>
      </section>

      {/* PROFESIONALES */}
      <section
        id="barbers"
        className="py-12 md:py-20 relative"
        style={{
          backgroundImage: `url('${teamImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white drop-shadow">
            Nuestro Equipo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
            <ProfessionalsGrid empleados={empleados} />
          </div>
        </div>
      </section>

      {/* AGENDA */}
      <section
        id="appointment"
        className="py-12 md:py-20 relative"
        style={{
          backgroundImage: `url('${appointmentImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white drop-shadow">
            Agenda tu cita
          </h2>
          <div className="max-w-2xl mx-auto">
            <AppointmentForm empresaId={empresaId} empleados={empleados} />
          </div>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section
        id="ubicacion"
        className="py-12 md:py-20 relative"
        style={{
          backgroundImage: `url('${mapsImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white drop-shadow">
            Encuéntranos aquí
          </h2>
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-lg border border-gray-300">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31811.743466232816!2d-74.08571050000002!3d4.688448750000006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9acc5e220a93%3A0x81b3267a6b7c277!2sCl.%20121%20%2351-76%2C%20Bogot%C3%A1!5e0!3m2!1ses-419!2sco!4v1759007019061!5m2!1ses-419!2sco"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-footer text-footer-text py-10">
        <div className="container mx-auto px-6 text-center">
          <p>© {new Date().getFullYear()} Barbería Elegance — Estilo360</p>
        </div>
      </footer>
    </main>
  );
}
