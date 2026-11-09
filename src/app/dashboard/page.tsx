'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Dashboard')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserEmail(user.email || 'Usuario Operativo')
        setLoading(false)
      }
    }
    checkUser()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Cargando Sercom-Transfarma...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 flex font-sans">
      
      {/* SIDEBAR LATERAL IZQUIERDO */}
      <aside className="w-64 bg-[#121824] border-r border-slate-800/60 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Logo / Header Sidebar */}
          <div className="p-4 border-b border-slate-800/60 flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-inner">
              ST
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">SERCOM TRANSFARMA</h1>
              <p className="text-[10px] text-slate-400">Plataforma Operativa</p>
            </div>
          </div>

          {/* Navegación por Secciones del Proyecto */}
          <nav className="p-3 space-y-6 text-xs overflow-y-auto">
            
            {/* PRINCIPAL */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">PRINCIPAL</p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { setActiveTab('Dashboard'); router.push('/dashboard') }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg font-medium transition ${
                      activeTab === 'Dashboard'
                        ? 'bg-indigo-600 text-white font-semibold shadow-md'
                        : 'text-slate-400 hover:bg-[#1a2232] hover:text-slate-200'
                    }`}
                  >
                    <span>📊</span>
                    <span>Dashboard</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* MÓDULOS DEL SISTEMA */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">MÓDULOS DE GESTIÓN</p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => router.push('/dashboard/admin')}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#1a2232] hover:text-slate-200 transition font-medium"
                  >
                    <span>👥</span>
                    <span>Administración de Cartera</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/dashboard/logs')}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#1a2232] hover:text-slate-200 transition font-medium"
                  >
                    <span>📋</span>
                    <span>Bitácora de Gestiones</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/dashboard/tickets')}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#1a2232] hover:text-slate-200 transition font-medium"
                  >
                    <span>🎟️</span>
                    <span>Solicitudes a Áreas</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/dashboard/reports')}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#1a2232] hover:text-slate-200 transition font-medium"
                  >
                    <span>🚚</span>
                    <span>Reporte Diario (Envíos)</span>
                  </button>
                </li>
              </ul>
            </div>

          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800/60 bg-[#0f141f] flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-slate-200 truncate">{userEmail}</p>
            <p className="text-[10px] text-indigo-400 font-semibold">Ejecutiva Activa</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Cerrar Sesión"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-[#1a2232] transition"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* TOP BAR / ENCABEZADO */}
        <header className="bg-[#121824] border-b border-slate-800/60 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Panel General de Control</h2>
            <p className="text-xs text-slate-400">Consolidado operativo Sercom-Transfarma</p>
          </div>

          <span className="bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 text-xs font-bold px-3 py-1 rounded-full">
            67 Clientes Corporativos
          </span>
        </header>

        {/* CONTENIDO DE MÓDULOS */}
        <div className="p-6 space-y-6">
          
          {/* CARDS DE ACCESO A MÓDULOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Administración */}
            <div 
              onClick={() => router.push('/dashboard/admin')}
              className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 hover:border-indigo-500/80 transition-all cursor-pointer shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Módulo 01</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400 text-sm">
                    👥
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition">
                  Administración de Cartera
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Gestión de ejecutivas, credenciales para apptransfarma.cl y asignación de clientes.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-indigo-400 flex items-center">
                Acceder →
              </div>
            </div>

            {/* Card 2: Bitácora */}
            <div 
              onClick={() => router.push('/dashboard/logs')}
              className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 hover:border-emerald-500/80 transition-all cursor-pointer shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Módulo 02</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 text-sm">
                    📋
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                  Bitácora de Gestiones
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Registro diario de llamados, acuerdos y minutas por cliente.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-emerald-400 flex items-center">
                Acceder →
              </div>
            </div>

            {/* Card 3: Solicitudes */}
            <div 
              onClick={() => router.push('/dashboard/tickets')}
              className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 hover:border-amber-500/80 transition-all cursor-pointer shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Módulo 03</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 text-sm">
                    🎟️
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                  Solicitudes a Áreas
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Requerimientos internos a Gerencia, Operaciones y Calidad.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-amber-400 flex items-center">
                Acceder →
              </div>
            </div>

            {/* Card 4: Reporte Diario */}
            <div 
              onClick={() => router.push('/dashboard/reports')}
              className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 hover:border-sky-500/80 transition-all cursor-pointer shadow-lg group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Módulo 04</span>
                  <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400 text-sm">
                    🚚
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition">
                  Reporte Diario de Envíos
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Extracción automatizada desde apptransfarma.cl y envío de correo.
                </p>
              </div>
              <div className="mt-4 text-xs font-semibold text-sky-400 flex items-center">
                 Acceder →
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  )
}