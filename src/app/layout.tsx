import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar"; // Ajusta esta ruta si tu Sidebar está en otra carpeta

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sercom Transfarma - Plataforma Operativa",
  description: "Plataforma Operativa Sercom Transfarma",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-[#0b0f17] text-slate-100 overflow-hidden">
        
        {/* 1. MENÚ LATERAL (SIDEBAR A LA IZQUIERDA, SIN MARCA DE AGUA) */}
        <Sidebar />

        {/* 2. PANEL CONTENEDOR DERECHO (CON MARCA DE AGUA) */}
        <main className="relative flex-1 min-h-screen overflow-y-auto">
          
          {/* 🖼️ MARCA DE AGUA SUTIL (public/instalaciones.png) */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-[0.06] grayscale pointer-events-none mix-blend-luminosity z-0"
            style={{ backgroundImage: "url('/instalaciones.png')" }}
          />

          {/* CONTENIDO PRINCIPAL DE LAS VISTAS */}
          <div className="relative z-10">
            {children}
          </div>

        </main>

      </body>
    </html>
  );
}