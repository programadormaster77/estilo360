// components/professionalsgrid.js
export default function ProfessionalsGrid({ empleados = [] }) {
  if (!empleados || empleados.length === 0) {
    return (
      <p className="text-center col-span-full text-gray-500">
        No hay empleados registrados todavía
      </p>
    );
  }

  // 🔹 Función para normalizar URLs de Drive
  const formatFotoUrl = (url) => {
    if (!url) return "/images/default-user.png";

    // Detectar enlaces de Google Drive
    const match = url.match(/\/d\/(.*?)\//);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }

    return url; // si no es Drive, usar tal cual
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {empleados.map((emp) => (
        <div
          key={emp.id}
          className="bg-white rounded-2xl p-4 shadow text-center border border-gray-200"
        >
          {/* Imagen */}
          <div className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-3 border shadow">
            <img
              src={formatFotoUrl(emp.foto)}
              alt={emp.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/images/default-user.png"; // fallback
              }}
            />
          </div>

          {/* Nombre */}
          <h4 className="font-semibold text-gray-800">{emp.nombre}</h4>

          {/* Rol */}
          <p className="text-sm text-gray-500">{emp.rol || "Empleado"}</p>

          {/* Habilidades */}
          {emp.habilidades && Object.keys(emp.habilidades).length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {Object.keys(emp.habilidades)
                .filter((h) => emp.habilidades[h])
                .join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
