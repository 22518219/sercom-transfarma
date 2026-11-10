import Sidebar from "@/components/Sidebar"; // Si tu Sidebar está en components
// O si tu Sidebar está en dashboard/page.tsx, usa: import Sidebar from "./page";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100 overflow-hidden">
      
      {/* 1. SIDEBAR INTACTO A LA IZQUIERDA (Sin marca de agua) */}
      <Sidebar />

      {/* 2. PANEL DERECHO / CONTENIDO PRINCIPAL (Con marca de agua en el fondo) */}
      <main className="relative flex-1 min-h-screen overflow-y-auto">
        
        {/* 🖼️ MARCA DE AGUA EXCLUSIVA EN EL PANEL DERECHO */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.12] grayscale pointer-events-none mix-blend-luminosity z-0"
          style={{ backgroundImage: "url('/instalaciones.png')" }}
        />

        {/* CONTENIDO DE LAS PÁGINAS (DASHBOARD, CARTERA, BITÁCORA, ETC.) */}
        <div className="relative z-10">
          {children}
        </div>

      </main>

    </div>
  );
}