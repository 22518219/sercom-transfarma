import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100 overflow-hidden">
      
      {/* 1. SIDEBAR INTACTO A LA IZQUIERDA */}
      <Sidebar />

      {/* 2. PANEL DERECHO CON MARCA DE AGUA */}
      <main className="relative flex-1 min-h-screen overflow-y-auto">
        
        {/* 🖼️ MARCA DE AGUA EXCLUSIVA EN EL PANEL DERECHO */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.12] grayscale pointer-events-none mix-blend-luminosity z-0"
          style={{ backgroundImage: "url('/instalaciones.png')" }}
        />

        {/* CONTENIDO DE LAS PÁGINAS */}
        <div className="relative z-10">
          {children}
        </div>

      </main>

    </div>
  );
}