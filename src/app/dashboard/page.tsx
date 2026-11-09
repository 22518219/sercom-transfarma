'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-medium text-sm">Cargando Plataforma Sercom-Transfarma...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* Navbar Superior Ejecutivo */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white font-black text-xl px-3 py-1.5 rounded-lg shadow-inner tracking-wider">
              ST
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">SERCOM <span className="text-indigo-400 font-normal">TRANSFARMA</span></h1>
              <p className="text-xs text-slate-400">Sistema Consolidado de Gestión Operativa</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <span className="block text-xs text-slate-400">Ejecutiva Activa</span>
              <span className="text-xs font-semibold text-slate-200 font-mono">{userEmail}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs px-3.5 py-2 rounded-lg border border-slate-700 transition font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Saludo y Métricas / Resumen */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Panel de Control
            </span>
            <h2 className="text-2xl font-extrabold mt-2 tracking-tight">Bienvenida de Nuevo</h2>
            <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
              Gestión centralizada de carteras, minutas diarias, solicitudes internas a áreas y automatización de reportes.
            </p>
          </div>
        </div>

        {/* Módulos Operativos */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Módulos del Sistema</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Tarjeta 1: Administración */}
            <div 
              onClick={() => router.push('/dashboard/admin')}
              className="group bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                    👥
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 px-2.5 py-1 rounded-full">
                    Gestión
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition">
                  Administración de Cartera
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Registro de ejecutivas, asignación de carteras con códigos correlativos y credenciales externas.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                Acceder al Módulo $\rightarrow$
              </div>
            </div>

            {/* Tarjeta 2: Bitácora */}
            <div 
              onClick={() => router.push('/dashboard/logs')}
              className="group bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                    📋
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 px-2.5 py-1 rounded-full">
                    Diario
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition">
                  Bitácora de Gestiones
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Registro detallado de llamadas, acuerdos, notas de seguimiento y gestiones diarias.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                Acceder al Módulo $\rightarrow$
              </div>
            </div>

            {/* Tarjeta 3: Solicitudes */}
            <div 
              onClick={() => router.push('/dashboard/tickets')}
              className="group bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg group-hover:bg-amber-600 group-hover:text-white transition">
                    🎟️
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-700 px-2.5 py-1 rounded-full">
                    Soporte
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition">
                  Solicitudes a Áreas
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Requerimientos directos a Gerencia, Operaciones y Calidad con control de estados.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
                Acceder al Módulo $\rightarrow$
              </div>
            </div>

            {/* Tarjeta 4: Reporte Diario */}
            <div 
              onClick={() => router.push('/dashboard/reports')}
              className="group bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition">
                    🚚
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 px-2.5 py-1 rounded-full">
                    Extracción
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition">
                  Reporte Diario de Envíos
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Extracción automática desde apptransfarma.cl y envío de correo consolidado.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                Acceder al Módulo $\rightarrow$
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  )
}