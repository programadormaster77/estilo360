"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { setDoc, doc, collection, getDocs } from "firebase/firestore";

// 🔑 Credenciales fijas de administrador
const ADMIN_EMAIL = "programadormaster77@gmail.com";
const ADMIN_PASSWORD = "programando77";

export default function CreatorPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loadingAutoLogin, setLoadingAutoLogin] = useState(true);

  const [formData, setFormData] = useState({
    nombreEmpresa: "",
    email: "",
    password: "",
    tipoEmpresa: "barberia",
    servicios: [],
    mapaEmbed: "", // 👈 nuevo campo para el link del mapa
  });
  const [historial, setHistorial] = useState([]);

  // Servicios dinámicos
  const serviciosPorTipo = {
    barberia: ["Cortes", "Barba", "Cejas", "Tinturado"],
    estetica: ["Maquillaje", "Manicure", "Pedicure", "Depilación"],
    salon: ["Peinados", "Tintura", "Tratamientos capilares", "Uñas acrílicas"],
    tatuajes: ["Tatuajes pequeños", "Tatuajes grandes", "Piercing", "Retoques"],
  };

  const fetchHistorial = async () => {
    try {
      const snap = await getDocs(collection(db, "historialCreador"));
      setHistorial(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error cargando historial:", e);
    }
  };

  useEffect(() => {
    let mounted = true;
    const tryAutoLogin = async () => {
      setLoadingAutoLogin(true);
      try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        if (!mounted) return;
        setLoggedIn(true);
        await fetchHistorial();
      } catch (err) {
        console.warn("Auto-login administrador falló:", err.message);
        setLoggedIn(false);
      } finally {
        if (mounted) setLoadingAutoLogin(false);
      }
    };
    tryAutoLogin();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "servicio") {
      setFormData((prev) => ({
        ...prev,
        servicios: checked
          ? [...prev.servicios, value]
          : prev.servicios.filter((s) => s !== value),
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      if (cred.user.email !== ADMIN_EMAIL) {
        await firebaseSignOut(auth);
        alert("Acceso denegado: esa cuenta no es el administrador.");
        return;
      }
      setLoggedIn(true);
      await fetchHistorial();
    } catch (err) {
      console.error("Login falló:", err);
      alert("Error al iniciar sesión: " + err.message);
    }
  };

  const handleLogout = async () => {
    await firebaseSignOut(auth);
    setLoggedIn(false);
  };

  // ✅ Crear empresa directamente con el nuevo usuario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombreEmpresa || !formData.email || !formData.password) {
      alert("Completa todos los campos obligatorios.");
      return;
    }

    try {
      // 1) Crear usuario en Auth (queda logueado como ese usuario)
      const credNew = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const newUid = credNew.user.uid;

      // 2) Guardar empresa en Firestore (con el mismo uid del usuario)
      await setDoc(doc(db, "empresas", newUid), {
        nombreEmpresa: formData.nombreEmpresa,
        tipoEmpresa: formData.tipoEmpresa,
        servicios: formData.servicios,
        email: formData.email,
        mapaEmbed: formData.mapaEmbed || null, // 👈 guardar mapa
        fechaRegistro: new Date(),
        adminUid: newUid, // 👈 este usuario será admin de su empresa
      });

      // 3) Guardar historial
      await setDoc(doc(db, "historialCreador", newUid), {
        nombreEmpresa: formData.nombreEmpresa,
        email: formData.email,
        password: formData.password, // ⚠️ solo porque lo pediste
        tipoEmpresa: formData.tipoEmpresa,
        empresaLink: `/empresa/${newUid}`,
        usuariosLink: `/u/${newUid}`,
        mapaEmbed: formData.mapaEmbed || null, // 👈 también en historial
        fechaRegistro: new Date(),
      });

      alert("✅ Empresa creada con éxito.");
      await fetchHistorial();

      setFormData({
        nombreEmpresa: "",
        email: "",
        password: "",
        tipoEmpresa: "barberia",
        servicios: [],
        mapaEmbed: "",
      });
    } catch (err) {
      console.error("Error al crear empresa:", err);
      alert("Error al crear empresa: " + (err.message || err));
    }
  };

  if (loadingAutoLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Verificando sesión de administrador…</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="bg-white p-6 rounded-lg shadow-lg w-96"
        >
          <h2 className="text-xl font-bold mb-4">Login Administrador</h2>
          <input
            type="email"
            name="email"
            placeholder="Correo"
            onChange={handleChange}
            className="w-full mb-3 p-3 border rounded bg-white text-black placeholder-gray-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            onChange={handleChange}
            className="w-full mb-3 p-3 border rounded bg-white text-black placeholder-gray-500"
            required
          />
          <button className="w-full bg-blue-600 text-white p-3 rounded-lg">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🚀 Creador de Empresas</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setFormData({
                nombreEmpresa: "",
                email: "",
                password: "",
                tipoEmpresa: "barberia",
                servicios: [],
                mapaEmbed: "",
              })
            }
            className="px-3 py-2 border rounded"
          >
            Limpiar
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-600 text-white rounded"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg mb-8 max-w-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="nombreEmpresa"
            placeholder="Nombre de la Empresa"
            value={formData.nombreEmpresa}
            onChange={handleChange}
            className="w-full p-3 border rounded bg-white text-black placeholder-gray-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo de la Empresa"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded bg-white text-black placeholder-gray-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña de la Empresa"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded bg-white text-black placeholder-gray-500"
            required
          />
          <select
            name="tipoEmpresa"
            value={formData.tipoEmpresa}
            onChange={handleChange}
            className="w-full p-3 border rounded bg-white text-black"
          >
            <option value="barberia">Barbería</option>
            <option value="estetica">Estética</option>
            <option value="salon">Salón de Belleza</option>
            <option value="tatuajes">Tatuajes</option>
          </select>
        </div>

        {/* Nuevo campo: mapa */}
        <div className="mt-4">
          <label className="block font-medium mb-2">
            Ubicación (Link de Google Maps Embed - SRC)
          </label>
          <input
            type="text"
            name="mapaEmbed"
            placeholder="Ej: https://www.google.com/maps/embed?pb=..."
            value={formData.mapaEmbed}
            onChange={handleChange}
            className="w-full p-3 border rounded bg-white text-black placeholder-gray-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            👉 Ve a Google Maps → Compartir → Insertar mapa → Copia solo el
            <code> src=""</code> y pégalo aquí.
          </p>
        </div>

        <div className="mt-4">
          <p className="font-medium mb-2">Servicios disponibles:</p>
          <div className="grid grid-cols-2 gap-2">
            {serviciosPorTipo[formData.tipoEmpresa].map((serv) => (
              <label key={serv} className="flex items-center text-gray-800">
                <input
                  type="checkbox"
                  name="servicio"
                  value={serv}
                  checked={formData.servicios.includes(serv)}
                  onChange={handleChange}
                  className="mr-2"
                />
                {serv}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Crear Página
          </button>
          <button
            type="button"
            onClick={() => router.push("/empresa")}
            className="px-4 py-2 border rounded"
          >
            Ir a panel empresas
          </button>
        </div>
      </form>

      {/* Historial */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">📜 Historial</h2>
        {historial.length === 0 ? (
          <p>No hay empresas creadas aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">Empresa</th>
                  <th className="border p-2">Correo</th>
                  <th className="border p-2">Contraseña</th>
                  <th className="border p-2">Mapa</th>
                  <th className="border p-2">Links</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((item) => (
                  <tr key={item.id}>
                    <td className="border p-2">{item.nombreEmpresa}</td>
                    <td className="border p-2">{item.email}</td>
                    <td className="border p-2">{item.password}</td>
                    <td className="border p-2">
                      {item.mapaEmbed ? (
                        <a
                          href={item.mapaEmbed}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-600"
                        >
                          Ver mapa
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="border p-2">
                      <a
                        href={item.empresaLink}
                        className="text-blue-600 mr-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Empresa
                      </a>
                      <a
                        href={item.usuariosLink}
                        className="text-green-600"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Usuarios
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
