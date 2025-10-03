"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  setDoc,
  doc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EmpresaPage() {
  // Estado de autenticación
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    nombreEmpresa: "",
    tipoEmpresa: "barberia",
  });

  // Datos de empleados/citas
  const [formData, setFormData] = useState({
    nombre: "",
    habilidades: {
      corte: false,
      barba: false,
      cejas: false,
      tinturado: false,
      maquillaje: false,
      manicure: false,
      pedicure: false,
      depilacion: false,
      tatuajes: false,
      piercing: false,
    },
  });
  const [file, setFile] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [citas, setCitas] = useState([]);

  // Escuchar cambios de sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Escuchar empleados/citas si hay empresa logueada
  useEffect(() => {
    if (!user) return;

    const unsubEmpleados = onSnapshot(
      collection(db, "empresas", user.uid, "empleados"),
      (snapshot) =>
        setEmpleados(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    const unsubCitas = onSnapshot(
      collection(db, "empresas", user.uid, "citas"),
      (snapshot) =>
        setCitas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    return () => {
      unsubEmpleados();
      unsubCitas();
    };
  }, [user]);

  // Manejar auth form
  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthData({ ...authData, [name]: value });
  };

  // Registro
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        authData.email,
        authData.password
      );

      // Crear carpeta de empresa en Firestore
      await setDoc(doc(db, "empresas", cred.user.uid), {
        nombreEmpresa: authData.nombreEmpresa,
        tipoEmpresa: authData.tipoEmpresa,
        email: authData.email,
        fechaRegistro: new Date(),
      });
    } catch (error) {
      console.error("Error registrando empresa:", error.message);
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, authData.email, authData.password);
    } catch (error) {
      console.error("Error iniciando sesión:", error.message);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
  };

  // Manejo de empleados
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        habilidades: { ...formData.habilidades, [name]: checked },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    let fotoURL = "";
    if (file) {
      const storageRef = ref(
        storage,
        `empresas/${user.uid}/empleados/${Date.now()}-${file.name}`
      );
      await uploadBytes(storageRef, file);
      fotoURL = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "empresas", user.uid, "empleados"), {
      ...formData,
      foto: fotoURL,
    });

    setFormData({
      nombre: "",
      habilidades: Object.fromEntries(
        Object.keys(formData.habilidades).map((k) => [k, false])
      ),
    });
    setFile(null);
  };

  // -----------------------
  // RENDER
  // -----------------------

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
                  className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  name="tipoEmpresa"
                  value={authData.tipoEmpresa}
                  onChange={handleAuthChange}
                  className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={authData.password}
              onChange={handleAuthChange}
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
            >
              {authMode === "login" ? "Entrar" : "Registrar"}
            </button>
          </form>
          <p
            onClick={() =>
              setAuthMode(authMode === "login" ? "register" : "login")
            }
            className="mt-4 text-sm text-blue-600 cursor-pointer text-center hover:underline"
          >
            {authMode === "login"
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </p>
        </div>
      </div>
    );
  }

  // Si hay usuario logueado → Panel de Empresa
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Empresa</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Registrar empleado */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-6 max-w-md mx-auto mb-10 border border-gray-200"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Registrar Empleado
        </h2>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={handleChange}
          className="w-full p-3 mb-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 placeholder-gray-500"
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full mb-3"
        />
        <label className="block mb-2 text-gray-700 font-medium">
          Habilidades:
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.keys(formData.habilidades).map((hab) => (
            <label key={hab} className="flex items-center text-gray-700">
              <input
                type="checkbox"
                name={hab}
                checked={formData.habilidades[hab]}
                onChange={handleChange}
                className="mr-2"
              />
              {hab.charAt(0).toUpperCase() + hab.slice(1)}
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
        >
          Guardar Empleado
        </button>
      </form>

      {/* Empleados */}
      <div className="bg-white shadow-md rounded-xl p-6 max-w-3xl mx-auto border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Empleados Registrados
        </h2>
        <ul className="space-y-4">
          {empleados.map((empleado) => (
            <li
              key={empleado.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center">
                {empleado.foto && (
                  <img
                    src={empleado.foto}
                    alt={empleado.nombre}
                    className="w-12 h-12 rounded-full mr-3 object-cover"
                  />
                )}
                <p className="font-medium text-gray-800">{empleado.nombre}</p>
              </div>
              <div className="text-sm text-gray-600">
                {Object.entries(empleado.habilidades || {})
                  .filter(([_, v]) => v)
                  .map(([k]) => k)
                  .join(", ")}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Citas */}
      <div className="bg-white shadow-md rounded-xl p-6 max-w-3xl mx-auto mt-10 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Citas Agendadas
        </h2>
        <ul className="space-y-4">
          {citas.map((cita) => (
            <li
              key={cita.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {cita.servicio} - {cita.fecha} {cita.hora}
                </p>
                <p className="text-sm text-gray-500">
                  Cliente: {cita.usuarioNombre || "Anónimo"}
                </p>
                <p className="text-sm text-gray-500">
                  Empleado:{" "}
                  {empleados.find((e) => e.id === cita.empleadoId)?.nombre ||
                    "No asignado"}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  cita.estado === "pendiente"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {cita.estado}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
