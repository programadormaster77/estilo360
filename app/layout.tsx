import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ Metadata tipada correctamente para TS
export const metadata: Metadata = {
  title: "Barbería Elegance - Estilo360",
  description:
    "Agenda tu cita con los mejores profesionales en cortes, barba y estética.",
  icons: {
    icon: "/images/logo-estilo360.png", // favicon (PNG)
    apple: "/images/logo-estilo360.png", // icono Apple
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
