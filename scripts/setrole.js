// scripts/setrole.js
// Script para asignar custom claims (role, empresaId) a un usuario en Firebase Auth.
// Uso (desde la raíz del proyecto):
// 1) Con argumentos:
//    node scripts/setrole.js <uid> <role> <empresaId>
//    Ej: node scripts/setrole.js CjHd72jxkA9mX5q123 admin estilo360
// 2) Interactivo (sin argumentos):
//    node scripts/setrole.js
//
// Requisitos:
// - Tener lib/firebaseadmin.js que exporte `authAdmin` (inicializado con service account).
// - Ejecutar desde la carpeta raíz del proyecto.
// - serviceaccountkey.json debe existir en la raíz y lib/firebaseadmin.js debe leerlo.

import readline from "readline";
import { authAdmin } from "../lib/firebaseadmin.js";

/**
 * Valida rol permitido.
 * Agrega/ajusta roles según tu política (admin, empleado, cliente, etc.)
 */
function validarRol(role) {
  if (!role) return false;
  const r = role.toString().toLowerCase();
  const permitidos = ["admin", "empleado", "cliente", "user", "usuario"];
  return permitidos.includes(r) ? r : false;
}

/**
 * Asigna las custom claims al usuario
 */
async function asignarClaims(uid, role, empresaId) {
  try {
    await authAdmin.setCustomUserClaims(uid, { role, empresaId });
    console.log(`\n✅ Rol asignado correctamente:`);
    console.log(`   uid: ${uid}`);
    console.log(`   role: ${role}`);
    console.log(`   empresaId: ${empresaId}\n`);
  } catch (err) {
    console.error("\n❌ Error asignando custom claims:", err);
    process.exitCode = 1;
  }
}

/**
 * Modo interactivo (pregunta por uid, role, empresaId)
 */
async function modoInteractivo() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const pregunta = (q) => new Promise((res) => rl.question(q, (ans) => res(ans.trim())));

  const uid = await pregunta("Ingresa el UID del usuario: ");
  if (!uid) {
    console.log("UID vacío — abortando.");
    rl.close();
    process.exit(1);
  }

  let role = await pregunta("Ingresa el role (admin / empleado / cliente): ");
  role = validarRol(role);
  if (!role) {
    console.log("Role no válido. Valores permitidos: admin, empleado, cliente (o user/usuario).");
    rl.close();
    process.exit(1);
  }

  const empresaId = await pregunta("Ingresa el empresaId (ej: estilo360): ");
  if (!empresaId) {
    console.log("empresaId vacío — abortando.");
    rl.close();
    process.exit(1);
  }

  const confirmar = await pregunta(`Confirma asignar role='${role}' y empresaId='${empresaId}' al uid='${uid}' ? (y/N): `);
  rl.close();

  if (confirmar.toLowerCase() === "y" || confirmar.toLowerCase() === "yes") {
    await asignarClaims(uid, role, empresaId);
    process.exit(0);
  } else {
    console.log("Operación cancelada por el usuario.");
    process.exit(0);
  }
}

/**
 * Entrada principal
 */
async function main() {
  const args = process.argv.slice(2);

  // Si se pasan 3 argumentos: uid, role, empresaId -> ejecuta directo
  if (args.length === 3) {
    const [uid, roleArg, empresaId] = args;
    const role = validarRol(roleArg);
    if (!uid) {
      console.error("Error: UID inválido.");
      process.exit(1);
    }
    if (!role) {
      console.error("Error: role inválido. Valores permitidos: admin, empleado, cliente.");
      process.exit(1);
    }
    if (!empresaId) {
      console.error("Error: empresaId inválido.");
      process.exit(1);
    }

    console.log(`Asignando role='${role}' empresaId='${empresaId}' al uid='${uid}' ...`);
    await asignarClaims(uid, role, empresaId);
    process.exit(0);
  }

  // Si no hay args, usar modo interactivo
  await modoInteractivo();
}

main();
