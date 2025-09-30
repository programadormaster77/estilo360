// scripts/create-company.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceaccountkey.json", "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function createCompany() {
  const empresaId = "estilo360"; // cambia si quieres otro id
  const empresaRef = db.collection("empresas").doc(empresaId);

  await empresaRef.set({
    nombre: "Estilo360",
    direccion: "Cll 123 #45-67, Ciudad",
    logo: "/images/logo.png",
    public: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // empleados de ejemplo
  const empleados = [
    {
      nombre: "Carlos Pérez",
      correo: "carlos@estilo360.com",
      foto: "",
      habilidades: ["corte","barba"],
      horarios: { lunes: ["09:00","10:00"], martes: ["10:00","11:00"] },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      nombre: "Laura Gómez",
      correo: "laura@estilo360.com",
      foto: "",
      habilidades: ["tinte","peinado"],
      horarios: { miercoles: ["12:00","13:00"] },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const emp of empleados) {
    await empresaRef.collection("empleados").add(emp);
  }

  // ejemplo: crear una cita (opcional)
  // await empresaRef.collection("citas").add({
  //   userId: "anon-uid",
  //   clienteNombre: "Prueba",
  //   empleadoId: "", // se puede dejar vacío si no se asigna
  //   servicio: "Corte",
  //   fechaHora: admin.firestore.Timestamp.fromDate(new Date(Date.now()+86400000)),
  //   estado: "pendiente",
  //   createdAt: admin.firestore.FieldValue.serverTimestamp()
  // });

  console.log("✅ Empresa y empleados de ejemplo creados:", empresaId);
  process.exit(0);
}

createCompany().catch(err => { console.error(err); process.exit(1); });
