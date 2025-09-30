"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getCurrentUser } from "../lib/auth";

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let unsubscribe;

    async function fetchAppointments() {
      const user = await getCurrentUser();

      if (!user) {
        console.warn("Usuario no autenticado todavía");
        return;
      }

      const q = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        setAppointments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });
    }

    fetchAppointments();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div>
      <h2>Citas guardadas</h2>
      <ul>
        {appointments.map((appt) => (
          <li key={appt.id}>
            {appt.service} — {appt.date}
          </li>
        ))}
      </ul>
    </div>
  );
}
