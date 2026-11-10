'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { useRealtimeAlerts } from '../../hooks/useRealtimeAlerts'
import RealtimeToast from '../../components/RealtimeToast'

// COMPONENTE SIDEBAR
function Sidebar({ userEmail, userRole, loading, handleSignOut, pathname, router }: any) {
  const isActive = (path: string) => pathname === path

  return (
    <aside className="w-64 bg-[#121824] border-r border-slate-800/60 flex flex-col justify-between shrink-0 select-none min-h-screen">
      <div>
        {/* LOGO / HEADER SIDEBAR */}
        <div className="p-4 border-b border-slate-800/60 flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-inner">
            ST
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">SERCOM TRANSFARMA</h1>
            <p className="text-[10px] text-slate-400">Plataforma Operativa</p>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="p-3 space-y-5 text-xs overflow-y-auto max-h-[calc(100vh-140px)]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">PRINCIPAL</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => router.push('/dashboard')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg font-medium transition ${
                    isActive('/dashboard')
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

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">MÓDULOS DE GESTIÓN</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => router.push('/dashboard/admin')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition font-medium ${
                    isActive('/dashboard/admin')
                      ? 'bg-indigo-600 text-white font-semibold shadow-md'
                      : 'text-slate-400 hover:bg-[#1a2232] hover:text-slate-200'
                  }`}
                >
                  <span>👥</span>
                  <span>Cartera y Mandantes</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/dashboard/logs')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition font-medium ${
                    isActive('/dashboard/logs')
                      ? 'bg-indigo-600 text-white font-semibold shadow-md'
                      : 'text-slate-400 hover:bg-[#1a2232] hover:text-slate-200'
                  }`}
                >
                  <span>📋</span>
                  <span>Bitácora de Gestiones</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/dashboard/tickets')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition font-medium ${
                    isActive('/dashboard/tickets')
                      ? 'bg-indigo-600 text-white font-semibold shadow-md'
                      : 'text-slate-400 hover:bg-[#1a2232] hover:text-slate-200'
                  }`}
                >
                  <span>🎟️</span>
                  <span>Solicitudes a Áreas</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/dashboard/reports')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition font-medium ${
                    isActive('/dashboard/reports')
                      ? 'bg-indigo-600 text-white font-semibold shadow-md'
                      : 'text-slate-400 hover:bg-[#1a2232] hover:text-slate-200'
                  }`}
                >
                  <span>🚚</span>
                  <span>Reporte Diario</span>
                </button>
              </li>
            </ul>
          </div>

          {userRole === 'admin' && (
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2 mb-2">ADMINISTRACIÓN</p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => router.push('/dashboard/users')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition font-medium ${
                      isActive('/dashboard/users')
                        ? 'bg-amber-600 text-white font-semibold shadow-md'
                        : 'text-slate-400 hover:bg-[#1a2232] hover:text-slate-200'
                    }`}
                  >
                    <span>🔐</span>
                    <span>Gestión de Usuarios</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </nav>
      </div>

      {/* FOOTER DEL PERFIL */}
      <div className="p-3 border-t border-slate-800/60 bg-[#0f141f] flex items-center justify-between">
        <div className="truncate">
          <p className="text-xs font-bold text-slate-200 truncate">{userEmail}</p>
          <p className={`text-[10px] font-semibold ${userRole === 'admin' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {loading ? 'Cargando...' : userRole === 'admin' ? 'Administrador' : 'Ejecutiva'}
          </p>
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
  )
}

// LAYOUT PRINCIPAL DEL DASHBOARD
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setUserEmail(user.email || 'Usuario')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile && profile.role) {
        setUserRole(profile.role.toLowerCase())
      } else {
        setUserRole('admin')
      }

      setLoading(false)
    }

    fetchUserData()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Hook de alertas en tiempo real
  const { alerts, dismissAlert } = useRealtimeAlerts(userId)

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100 overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <Sidebar 
        userEmail={userEmail}
        userRole={userRole}
        loading={loading}
        handleSignOut={handleSignOut}
        pathname={pathname}
        router={router}
      />

      {/* 2. PANEL DERECHO CON MARCA DE AGUA */}
      <main className="relative flex-1 min-h-screen overflow-y-auto">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.65] grayscale pointer-events-none mix-blend-luminosity z-0"
          style={{ backgroundImage: "url('/instalaciones.png')" }}
        />
        <div className="relative z-10">
          {children}
        </div>

        {/* 3. ALERTAS FLOTANTES EN TIEMPO REAL (POP-UPS) */}
        <div className="fixed bottom-5 right-5 z-50 space-y-3 pointer-events-auto">
          {alerts.map((alert) => (
            <RealtimeToast
              key={alert.id}
              id={alert.id}
              sender={alert.sender_email}
              subject={alert.subject}
              onClose={dismissAlert}
            />
          ))}
        </div>
      </main>

    </div>
  )
}