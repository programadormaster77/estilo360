// lib/firebaseadmin.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// lee las credenciales del archivo json
const serviceAccount = JSON.parse(
  readFileSync("./serviceaccountkey.json", "utf-8")
);

// inicializa firebase admin solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const authAdmin = admin.auth();
const dbAdmin = admin.firestore();

export { authAdmin, dbAdmin };
