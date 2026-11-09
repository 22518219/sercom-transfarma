'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedExec, setSelectedExec] = useState('TODAS LAS EJECUTIVAS')
  const [activeTab, setActiveTab] = useState('Dashboard')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserEmail(user.email || 'eayala@transfarma.cl')
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
          <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Cargando SCC Transfarma...</p>
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
            <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center font-black text-white text-xs">
              S
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              SCC Transfarma - <span className="text-slate-400 font-normal">Sistema de Control</span>
            </h1>
          </div>

          {/* Selector de Ejecutiva */}
          <div className="p-3 border-b border-slate-800/60">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filtrar Ejecutiva
            </label>
            <select
              value={selectedExec}
              onChange={(e) => setSelectedExec(e.target.value)}
              className="w-full bg-[#1a2232] border border-slate-700/60 text-white text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="TODAS LAS EJECUTIVAS">TODAS LAS EJECUTIVAS</option>
              <option value="Ejecutiva 1">Ejecutiva 1</option>
              <option value="Ejecutiva 2">Ejecutiva 2</option>
            </select>
          </div>

          {/* Navegación por Secciones */}
          <nav className="p-3 space-y-6 text-xs overflow-y-auto max-h-[calc(100vh-180px)]">
            
            {/* ANÁLISIS */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">ANÁLISIS</p>
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
                <li>
                  <button
                    onClick={() => router.push('/dashboard/reports')}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#1a2232] hover:text-slate-200 transition font-medium"
                  >
                    <span>🚚</span>
                    <span>Reporte Diario</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* GESTIÓN EJECUTIVA */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">GESTIÓN EJECUTIVA</p>
              <ul className="space-y-1">
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
                    onClick={() => router.push('/dashboard/admin')}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#1a2232] hover:text-slate-200 transition font-medium"
                  >
                    <span>👥</span>
                    <span>Administración Cartera</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* CONTROL DE GESTIÓN */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">CONTROL DE GESTIÓN</p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => router.push('/dashboard/tickets')}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#1a2232] hover:text-slate-200 transition font-medium"
                  >
                    <span>🎟️</span>
                    <span>Solicitudes a Áreas</span>
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
            <p className="text-[10px] text-emerald-400 font-semibold">Super-Administrador</p>
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
        
        {/* TOP BAR / FILTROS SUPERIORES */}
        <header className="bg-[#121824] border-b border-slate-800/60 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Filtros de Período y Operación</h2>
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              67 Registros Activos
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">AÑO</label>
              <select className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded px-2 py-1.5">
                <option>TODOS LOS AÑOS</option>
                <option>2026</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">PERÍODO FACTURACIÓN</label>
              <select className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded px-2 py-1.5">
                <option>Noviembre</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">MANDANTE</label>
              <select className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded px-2 py-1.5">
                <option>TODOS</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">OPERADOR</label>
              <select className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded px-2 py-1.5">
                <option>TODOS</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">IATA / ORIGEN</label>
              <select className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded px-2 py-1.5">
                <option>TODOS</option>
              </select>
            </div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="p-6 space-y-6">
          
          {/* PRIMERA FILA: CARDS DE KPI (MÉTRICAS RÁPIDAS) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-[#141923] p-4 rounded-xl border border-slate-800/80 flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CARTERA TOTAL</p>
                <p className="text-2xl font-black text-white mt-1">67</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Clientes asignados</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400 text-lg">
                👥
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-[#141923] p-4 rounded-xl border border-slate-800/80 flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VISITAS PROGRAMADAS</p>
                <p className="text-2xl font-black text-white mt-1">12</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Planificación mensual</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400 text-lg">
                📅
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-[#141923] p-4 rounded-xl border border-slate-800/80 flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VISITAS REALIZADAS</p>
                <p className="text-2xl font-black text-white mt-1">24</p>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">35% de cumplimiento</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 text-lg">
                ✓
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-[#141923] p-4 rounded-xl border border-slate-800/80 flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">% COBERTURA CARTERA</p>
                <p className="text-2xl font-black text-white mt-1">35%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">24 de 67 visitados</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 text-lg">
                📈
              </div>
            </div>

          </div>

          {/* SECCIÓN ANALYTICS HEADER */}
          <div className="flex items-center space-x-2 pt-2">
            <span className="text-indigo-400 text-sm">📊</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Panel de Analytics e Indicadores Estratégicos
            </h3>
          </div>

          {/* SEGUNDA FILA: MÉTRICAS SECUNDARIAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#141923] p-4 rounded-xl border border-slate-800/80 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Promedio Kilos / Orden</p>
                <p className="text-xl font-bold text-white mt-1">24,0 <span className="text-xs font-normal text-slate-400">Kg/orden</span></p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-800/80 text-indigo-400 flex items-center justify-center">⚖️</div>
            </div>

            <div className="bg-[#141923] p-4 rounded-xl border border-slate-800/80 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Volumen Total Filtrado</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">303.672,9 <span className="text-xs font-normal text-slate-400">Kg</span></p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center">📦</div>
            </div>

            <div className="bg-[#141923] p-4 rounded-xl border border-slate-800/80 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Envíos / Órdenes</p>
                <p className="text-xl font-bold text-white mt-1">12.639,0 <span className="text-xs font-normal text-slate-400">envíos</span></p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#1e1b4b] text-purple-400 flex items-center justify-center">📈</div>
            </div>
          </div>

          {/* TERCERA FILA: RANKINGS Y MÓDULOS RÁPIDOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Mandantes Kilos */}
            <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <span className="text-emerald-400">↗</span>
                <span>1. Top Mandantes con Mayor Cantidad de Kilos</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">KUEHNE + NAGEL</span>
                    <span className="text-slate-400 font-mono">72.400 Kg</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">NOVOFARMA</span>
                    <span className="text-slate-400 font-mono">48.200 Kg</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">LABORATORIO CHILE</span>
                    <span className="text-slate-400 font-mono">36.100 Kg</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accesos Rápidos a Módulos Operativos */}
            <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <span className="text-indigo-400">⚡</span>
                <span>Módulos de Gestión Directa</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => router.push('/dashboard/admin')}
                  className="p-3 bg-[#1a2232] hover:bg-indigo-900/40 border border-slate-700/60 rounded-lg text-left transition group"
                >
                  <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">Administración</p>
                  <p className="text-[10px] text-slate-400 mt-1">Cartera de 67 Clientes</p>
                </button>

                <button
                  onClick={() => router.push('/dashboard/logs')}
                  className="p-3 bg-[#1a2232] hover:bg-emerald-900/40 border border-slate-700/60 rounded-lg text-left transition group"
                >
                  <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">Bitácora</p>
                  <p className="text-[10px] text-slate-400 mt-1">Gestiones diarias</p>
                </button>

                <button
                  onClick={() => router.push('/dashboard/tickets')}
                  className="p-3 bg-[#1a2232] hover:bg-amber-900/40 border border-slate-700/60 rounded-lg text-left transition group"
                >
                  <p className="text-xs font-bold text-slate-200 group-hover:text-amber-400">Solicitudes</p>
                  <p className="text-[10px] text-slate-400 mt-1">Requerimientos internas</p>
                </button>

                <button
                  onClick={() => router.push('/dashboard/reports')}
                  className="p-3 bg-[#1a2232] hover:bg-sky-900/40 border border-slate-700/60 rounded-lg text-left transition group"
                >
                  <p className="text-xs font-bold text-slate-200 group-hover:text-sky-400">Reporte Diario</p>
                  <p className="text-[10px] text-slate-400 mt-1">Extracción AppTransfarma</p>
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  )
}