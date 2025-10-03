// components/navbar.js
"use client";

import { useState } from "react";

export default function Navbar({ empresa }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed w-full z-20 top-0 bg-white/80 backdrop-blur-sm">
      <nav className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo / Nombre */}
        <div className="flex items-center gap-4">
          <a href="/" className="text-xl font-bold text-primary">Estilo360</a>
          {empresa?.nombreEmpresa && (
            <span className="hidden md:inline text-sm text-slate-500">
              {empresa.nombreEmpresa}
            </span>
          )}
        </div>

        {/* Menú Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/home" className="hover:text-primary">Inicio</a>
          <a href="#services" className="hover:text-primary">Servicios</a>
          <a href="#barbers" className="hover:text-primary">Equipo</a>
          <a href="#appointment" className="hover:text-primary">Agendar</a>
          <a href="#ubicacion" className="hover:text-primary transition">Ubicación</a>
        </div>

        {/* Botón Mobile */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={() => setOpen(!open)}
            aria-label="menu"
            className="p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  open
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Menú Mobile desplegable */}
      {open && (
        <div className="md:hidden bg-white/95 border-t">
          <div className="px-4 py-4 flex flex-col gap-3">
            <a href="/home" onClick={() => setOpen(false)}>Inicio</a>
            <a href="#services" onClick={() => setOpen(false)}>Servicios</a>
            <a href="#barbers" onClick={() => setOpen(false)}>Equipo</a>
            <a href="#appointment" onClick={() => setOpen(false)}>Agendar</a>
            <a href="#ubicacion" onClick={() => setOpen(false)}>Ubicación</a>
          </div>
        </div>
      )}
    </header>
  );
}
