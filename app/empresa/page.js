"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "../../lib/firebase"; 
// Si estás usando app/empresa/[id]/page.js cambia la ruta arriba a: "../../../lib/firebase"

import {
  collection,
  addDoc,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/* ----------------- CONFIG ----------------- */
// Clave para operaciones sensibles
const ADMIN_CLAVE = "8790";

const defaultServicesByType = {
  barberia: ["Corte de cabello", "Barba", "Cejas", "Tinturado"],
  estetica: ["Maquillaje", "Manicure", "Pedicure", "Depilación"],
  salon: ["Peinados", "Tintura", "Tratamientos capilares", "Uñas acrílicas"],
  tatuajes: ["Tatuajes pequeños", "Tatuajes grandes", "Piercing", "Retoques"],
};

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

const displayName = (key) =>
  String(key || "")
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");

/* Normaliza servicios para Firestore */
function normalizeServicios(raw, tipoEmpresa) {
  const out = {};

  if (!raw) {
    (defaultServicesByType[tipoEmpresa] || []).forEach((label) => {
      out[slugify(label)] = true;
    });
    return out;
  }

  if (Array.isArray(raw)) {
    raw.forEach((val) => {
      if (typeof val === "string" && val.trim()) {
        out[slugify(val)] = true;
      } else if (typeof val === "object" && val !== null) {
        Object.entries(val).forEach(([k, v]) => {
          out[k] = !!v;
        });
      }
    });
  } else if (typeof raw === "object") {
    Object.entries(raw).forEach(([k, v]) => {
      if (/^\d+$/.test(k)) {
        if (typeof v === "string" && v.trim()) {
          out[slugify(v)] = true;
        }
      } else {
        out[k] = !!v;
      }
    });
  }

  (defaultServicesByType[tipoEmpresa] || []).forEach((label) => {
    const s = slugify(label);
    if (!(s in out)) out[s] = true;
  });

  return out;
}

/* ----------------- COMPONENT ----------------- */
export default function EmpresaPage() {
  // auth / empresa
  const [user, setUser] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    nombreEmpresa: "",
    tipoEmpresa: "barberia",
  });

  // empleados / citas / form empleado
  const [formData, setFormData] = useState({ nombre: "", habilidades: {} });
  const [file, setFile] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [citas, setCitas] = useState([]);
  const [editando, setEditando] = useState(null);

  // servicios
  const [servicios, setServicios] = useState({});
  const [nuevoServicio, setNuevoServicio] = useState("");

  // carga inicial/escucha auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setEmpresa(null);
        setServicios({});
        return;
      }

      try {
        const docRef = doc(db, "empresas", u.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setEmpresa(data);
          const norm = normalizeServicios(data.servicios, data.tipoEmpresa || "barberia");
          setServicios(norm);
        } else {
          setEmpresa(null);
          setServicios(normalizeServicios(null, "barberia"));
        }
      } catch (err) {
        console.error("Error leyendo empresa:", err);
      }
    });

    return () => unsub();
  }, []);

  // realtime empleados/citas
  useEffect(() => {
    if (!user) return;

    const unsubEmpleados = onSnapshot(
      collection(db, "empresas", user.uid, "empleados"),
      (snap) => setEmpleados(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("snapshot empleados err:", err)
    );

    const unsubCitas = onSnapshot(
      collection(db, "empresas", user.uid, "citas"),
      (snap) => setCitas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("snapshot citas err:", err)
    );

    return () => {
      unsubEmpleados();
      unsubCitas();
    };
  }, [user]);

  /* ---------- AUTH HANDLERS ---------- */
  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthData((s) => ({ ...s, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const cred = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
      const normalized = normalizeServicios(null, authData.tipoEmpresa);
      await setDoc(doc(db, "empresas", cred.user.uid), {
        nombreEmpresa: authData.nombreEmpresa,
        tipoEmpresa: authData.tipoEmpresa,
        email: authData.email,
        servicios: normalized,
        ubicacion: "",
        fechaRegistro: new Date(),
        adminUid: cred.user.uid,
      });

      alert("Empresa creada. Ahora puedes iniciar sesión con ese correo.");
    } catch (err) {
      console.error("Error registrando empresa:", err);
      alert("Error registrando empresa: " + (err.message || err));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, authData.email, authData.password);
    } catch (err) {
      console.error("Error login:", err);
      alert("Login error: " + (err.message || err));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };
  /* ---------- EMPLEADOS ---------- */
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    if (type === "checkbox") {
      setFormData((s) => ({ ...s, habilidades: { ...s.habilidades, [name]: checked } }));
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Debes iniciar sesión como empresa para crear empleados.");

    const clave = prompt("Ingresa la clave para registrar/editar empleado:");
    if (clave !== ADMIN_CLAVE) {
      alert("Clave incorrecta.");
      return;
    }

    try {
      let fotoURL = formData.foto || "";

      if (file) {
        const storageRef = ref(storage, `empresas/${user.uid}/empleados/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        fotoURL = await getDownloadURL(storageRef);
      }

      const empleadoData = {
        nombre: formData.nombre,
        habilidades: formData.habilidades,
        foto: fotoURL,
      };

      if (editando) {
        await updateDoc(doc(db, "empresas", user.uid, "empleados", editando), empleadoData);
        setEditando(null);
      } else {
        await addDoc(collection(db, "empresas", user.uid, "empleados"), empleadoData);
      }

      setFormData({ nombre: "", habilidades: {}, foto: "" });
      setFile(null);
      alert("Empleado guardado correctamente ✅");
    } catch (err) {
      console.error("Error guardando empleado:", err);
      alert("Error guardando empleado: " + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    const clave = prompt("Ingresa la clave para eliminar empleado:");
    if (clave !== ADMIN_CLAVE) {
      alert("Clave incorrecta.");
      return;
    }
    if (!confirm("¿Seguro que deseas eliminar este empleado?")) return;
    try {
      await deleteDoc(doc(db, "empresas", user.uid, "empleados", id));
    } catch (err) {
      console.error("Error eliminando empleado:", err);
      alert("Error: " + (err.message || err));
    }
  };

  const handleEdit = (empleado) => {
    setFormData({
      nombre: empleado.nombre || "",
      habilidades: empleado.habilidades || {},
      foto: empleado.foto || "",
    });
    setEditando(empleado.id);
  };

  /* ---------- SERVICIOS CRUD ---------- */
  const defaultSlugs = new Set(
    Object.values(defaultServicesByType).flat().map((label) => slugify(label))
  );

  const persistServicios = async (newObj) => {
    setServicios(newObj);
    if (!user) return;
    try {
      await updateDoc(doc(db, "empresas", user.uid), { servicios: newObj });
    } catch (err) {
      console.error("Error actualizando servicios:", err);
      alert("Error actualizando servicios: " + (err.message || err));
    }
  };

  const toggleServicio = async (key) => {
    const next = { ...servicios, [key]: !servicios[key] };
    await persistServicios(next);
  };

  const addServicio = async () => {
    if (!nuevoServicio || !nuevoServicio.trim()) return alert("Escribe el nombre del servicio.");
    const clave = prompt("Ingresa la clave para agregar servicio:");
    if (clave !== ADMIN_CLAVE) return alert("Clave incorrecta.");

    const label = nuevoServicio.trim();
    const key = slugify(label);
    const next = { ...servicios, [key]: true };

    await persistServicios(next);
    setNuevoServicio("");
  };

  const editServicio = async (oldKey) => {
    const clave = prompt("Ingresa la clave para editar servicio:");
    if (clave !== ADMIN_CLAVE) return alert("Clave incorrecta.");

    const currentLabel = displayName(oldKey);
    const nuevoLabel = prompt(`Nuevo nombre para "${currentLabel}":`, currentLabel);
    if (!nuevoLabel || !nuevoLabel.trim()) return alert("Nombre inválido.");

    const newKey = slugify(nuevoLabel);
    if (newKey === oldKey) return alert("El nombre no cambió.");

    const next = { ...servicios };
    next[newKey] = !!next[oldKey];
    delete next[oldKey];

    await persistServicios(next);
    alert("Servicio actualizado.");
  };

  const deleteServicio = async (key) => {
    const clave = prompt("Ingresa la clave para eliminar servicio:");
    if (clave !== ADMIN_CLAVE) return alert("Clave incorrecta.");

    if (!confirm(`¿Eliminar servicio "${displayName(key)}"?`)) return;

    if (defaultSlugs.has(key)) {
      const next = { ...servicios, [key]: false };
      await persistServicios(next);
      return alert("Servicio por defecto desactivado (no se elimina).");
    }

    const next = { ...servicios };
    delete next[key];
    await persistServicios(next);

    alert("Servicio eliminado.");
  };

  /* ---------- RENDER ---------- */
  if (!user) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-xl p-6 max-w-md w-full border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            {authMode === "login" ? "Iniciar Sesión" : "Registrar Empresa"}
          </h2>

          <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
            {authMode === "register" && (
              <>
                <input
                  type="text"
                  name="nombreEmpresa"
                  placeholder="Nombre de la Empresa"
                  value={authData.nombreEmpresa}
                  onChange={handleAuthChange}
                  className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
                  required
                />
                <select
                  name="tipoEmpresa"
                  value={authData.tipoEmpresa}
                  onChange={handleAuthChange}
                  className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
                >
                  <option value="barberia">Barbería</option>
                  <option value="estetica">Estética</option>
                  <option value="salon">Salón de Belleza</option>
                  <option value="tatuajes">Tatuajes</option>
                </select>
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={authData.email}
              onChange={handleAuthChange}
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={authData.password}
              onChange={handleAuthChange}
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
              required
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition">
              {authMode === "login" ? "Entrar" : "Registrar"}
            </button>
          </form>

          <p onClick={() => setAuthMode((m) => (m === "login" ? "register" : "login"))} className="mt-4 text-sm text-blue-600 cursor-pointer text-center hover:underline">
            {authMode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </p>
        </div>
      </div>
    );
  }

  // Usuario autenticado
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Empresa: {empresa?.nombreEmpresa || "Sin nombre"}</h1>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">Cerrar Sesión</button>
      </div>

      {/* SERVICIOS */}
      <div className="bg-white shadow-md rounded-xl p-6 max-w-3xl mx-auto mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Servicios Ofrecidos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {Object.entries(servicios).length === 0 ? (
            <p className="text-gray-500">No hay servicios registrados.</p>
          ) : (
            Object.entries(servicios).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!val} onChange={() => toggleServicio(key)} className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-800">{displayName(key)}</div>
                    <div className="text-sm text-gray-500">{defaultSlugs.has(key) ? "Predeterminado" : "Personalizado"}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editServicio(key)} className="text-blue-600 hover:underline text-sm">Editar</button>
                  <button onClick={() => deleteServicio(key)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input placeholder="Agregar servicio (ej. Corte premium)" value={nuevoServicio} onChange={(e) => setNuevoServicio(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500" />
          <button onClick={addServicio} className="bg-green-600 text-white px-4 py-2 rounded-lg">Agregar</button>
        </div>
      </div>

      {/* UBICACIÓN GOOGLE MAPS */}
      <div className="bg-white shadow-md rounded-xl p-6 max-w-3xl mx-auto mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ubicación</h2>
        <input
          type="text"
          placeholder="Pega aquí el link de Google Maps (src del iframe)"
          value={empresa?.ubicacion || ""}
          onChange={(e) => setEmpresa((prev) => ({ ...prev, ubicacion: e.target.value }))}
          className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-500"
        />
        <button
          onClick={async () => {
            try {
              await updateDoc(doc(db, "empresas", user.uid), {
                ubicacion: empresa.ubicacion || "",
              });
              alert("Ubicación actualizada correctamente.");
            } catch (err) {
              console.error("Error actualizando ubicación:", err);
              alert("Error actualizando ubicación.");
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Guardar Ubicación
        </button>

        {empresa?.ubicacion && (
          <div className="mt-4">
            <iframe
              src={empresa.ubicacion}
              width="100%"
              height="250"
              allowFullScreen
              loading="lazy"
              className="rounded-lg"
            ></iframe>
          </div>
        )}
      </div>

      {/* FORMULARIO EMPLEADOS */}
<form
  onSubmit={handleSubmit}
  className="bg-white shadow-lg rounded-xl p-6 max-w-md mx-auto mb-10 border border-gray-200"
>
  <h2 className="text-xl font-semibold mb-4 text-gray-800">
    {editando ? "Editar Empleado" : "Registrar Empleado"}
  </h2>

  {/* Nombre */}
  <label className="block mb-2 text-gray-700 font-medium">Nombre</label>
  <input
    type="text"
    name="nombre"
    placeholder="Ej: Carlos Pérez"
    value={formData.nombre}
    onChange={handleChange}
    className="w-full p-3 mb-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-400"
    required
  />

  {/* Imagen por URL */}
  <label className="block mb-2 text-gray-700 font-medium">URL de la Imagen</label>
  <input
    type="url"
    name="foto"
    placeholder="Ej: https://drive.google.com/file/d/ID/view?usp=sharing"
    value={formData.foto}
    onChange={(e) => {
      let value = e.target.value;
      // Si es un enlace de Google Drive, lo convertimos automáticamente
      const match = value.match(/\/d\/(.*?)\//);
      if (match && match[1]) {
        value = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
      setFormData((prev) => ({ ...prev, foto: value }));
    }}
    className="w-full p-3 mb-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-400"
    required
  />

  {/* Vista previa de la imagen */}
  {formData.foto && (
    <div className="flex justify-center mb-4">
      <img
        src={formData.foto}
        alt="Vista previa"
        className="w-24 h-24 rounded-full object-cover border shadow"
        onError={(e) => {
          e.currentTarget.src = "/images/default-avatar.png"; // 👈 fallback si falla
        }}
      />
    </div>
  )}

  {/* Habilidades */}
  <label className="block mb-2 text-gray-700 font-medium">
    Habilidades (elige de los servicios activos):
  </label>
  <div className="grid grid-cols-2 gap-3 mb-4">
    {Object.entries(servicios).filter(([k, v]) => v).length === 0 ? (
      <p className="text-sm text-gray-500">
        No hay servicios activos para asignar habilidades.
      </p>
    ) : (
      Object.entries(servicios)
        .filter(([k, v]) => v)
        .map(([k]) => (
          <label
            key={k}
            className="flex items-center space-x-2 text-gray-800"
          >
            <input
              type="checkbox"
              name={k}
              checked={!!formData.habilidades[k]}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600"
            />
            <span>{displayName(k)}</span>
          </label>
        ))
    )}
  </div>

  {/* Botón */}
  <button
    type="submit"
    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
  >
    {editando ? "Actualizar" : "Guardar"}
  </button>
</form>



      {/* LISTA EMPLEADOS */}
      <div className="bg-white shadow-md rounded-xl p-6 max-w-3xl mx-auto border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Empleados Registrados</h2>
        <ul className="space-y-4">
          {empleados.length === 0 ? (
            <p className="text-gray-500">No hay empleados registrados.</p>
          ) : (
            empleados.map((emp) => (
              <li key={emp.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {emp.foto && <img src={emp.foto} alt={emp.nombre} className="w-12 h-12 rounded-full object-cover" />}
                  <div>
                    <p className="font-medium text-gray-800">{emp.nombre}</p>
                    <p className="text-sm text-gray-500">
                      Habilidades: {Object.keys(emp.habilidades || {}).filter((h) => emp.habilidades[h]).map(displayName).join(", ") || "Ninguna"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:underline text-sm">Editar</button>
                  <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* CITAS */}
      <div className="bg-white shadow-md rounded-xl p-6 max-w-3xl mx-auto mt-10 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Citas Agendadas</h2>
        <ul className="space-y-4">
          {citas.length === 0 ? (
            <p className="text-gray-500">No hay citas agendadas.</p>
          ) : (
            citas.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{c.servicio} - {c.fecha} {c.hora}</p>
                  <p className="text-sm text-gray-500">Cliente: {c.usuarioNombre || "Anónimo"}</p>
                  <p className="text-sm text-gray-500">Empleado: {empleados.find((e) => e.id === c.empleadoId)?.nombre || "No asignado"}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${c.estado === "pendiente" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                  {c.estado}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
