'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .maybeSingle()

      setUserName(profile?.name || user.email || 'Usuario')
      setUserRole(profile?.role || 'ejecutiva')
      setLoading(false)
    }

    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Cargando Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Encabezado Bienvenida */}
      <div className="bg-[#141923]/90 border border-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Bienvenida, <span className="text-amber-400">{userName}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma Operativa Sercom-Transfarma • Perfil: <span className="uppercase font-semibold text-slate-300">{userRole}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {userRole === 'admin' && (
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow transition"
            >
              ⚙️ Panel de Administración
            </button>
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-700 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Tarjetas de Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => router.push('/dashboard/tickets')}
          className="bg-[#141923]/80 border border-slate-800 p-5 rounded-xl shadow-lg hover:border-amber-500/50 cursor-pointer transition group"
        >
          <div className="text-2xl mb-2">📋</div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
            Bitácora de Gestiones
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Registra y consulta el historial de solicitudes enviadas por tus mandantes.
          </p>
        </div>

        <div 
          onClick={() => router.push('/dashboard/admin')}
          className="bg-[#141923]/80 border border-slate-800 p-5 rounded-xl shadow-lg hover:border-emerald-500/50 cursor-pointer transition group"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
            Cartera y Mandantes
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Revisa los clientes asignados a tu cuenta y la información de contacto.
          </p>
        </div>

        <div className="bg-[#141923]/80 border border-slate-800 p-5 rounded-xl shadow-lg opacity-75">
          <div className="text-2xl mb-2">🔔</div>
          <h3 className="text-sm font-bold text-white">
            Alertas en Tiempo Real
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Pop-ups automáticos al recibir correos de contactos de tu cartera.
          </p>
        </div>
      </div>
    </div>
  )
}