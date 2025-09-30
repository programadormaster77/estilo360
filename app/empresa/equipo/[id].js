// app/empresa/empleados/[id].js
"use client";

import { useRouter } from "next/router";
import EmployeeProfile from "../../../components/employeeProfile";

export default function EmpleadoPage() {
  // En app router normal se usa params; aquí usamos useRouter por simplicidad
  const router = useRouter();
  const { query } = router;
  const id = query.id || null;

  if (!id) return <p>Cargando...</p>;

  return (
    <main className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Perfil del empleado</h1>
        <EmployeeProfile empleadoId={id} />
      </div>
    </main>
  );
}
