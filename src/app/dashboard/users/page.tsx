'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  created_at?: string
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Campos del formulario
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ejecutiva' | 'admin'>('ejecutiva')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchUsers()
  }, [])

  const checkAdminAndFetchUsers = async () => {
    setLoading(true)

    // 1. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 2. Verificar rol en profiles
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!currentProfile || currentProfile.role !== 'admin') {
      alert('Acceso restringido. Este módulo solo es visible para Administradores.')
      router.push('/dashboard')
      return
    }

    // 3. Cargar listado de usuarios / perfiles
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true })

    if (!error && profilesData) {
      setUsers(profilesData as Profile[])
    }

    setLoading(false)
  }

  // REGISTRAR USUARIO VÍA API ROUTE (EVITA CAMBIO DE SESIÓN)
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !email || !password) {
      alert('Por favor completa todos los campos requeridos.')
      return
    }

    setIsSubmitting(true)

    try {
      // Petición al endpoint del servidor
      const response = await fetch('/api/admin/create-executive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: fullName.trim(),
          role: role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Error al crear usuario: ' + (data.error || 'Ocurrió un error inesperado.'))
        setIsSubmitting(false)
        return
      }

      alert(`Usuario "${fullName}" creado exitosamente como [${role.toUpperCase()}]. Tu sesión se mantiene activa.`)
      
      // Limpiar formulario
      setFullName('')
      setEmail('')
      setPassword('')
      setRole('ejecutiva')

      // Recargar la lista de usuarios
      checkAdminAndFetchUsers()

    } catch (err: any) {
      alert('Error de conexión al registrar usuario: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Cargando Gestión de Usuarios...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 p-6 font-sans space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ENCABEZADO */}
        <div className="flex justify-between items-center bg-[#121824] p-4 rounded-xl border border-slate-800/60 shadow-lg">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Gestión de Usuarios y Perfiles</h1>
            <p className="text-xs text-slate-400">Creación y administración de accesos del sistema</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#1a2232] hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700/60 transition"
          >
            ← Volver al Dashboard
          </button>
        </div>

        {/* FORMULARIO Y LISTADO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* REGISTRO DE USUARIO */}
          <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Nuevo Registro de Usuario
            </h2>

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Miguel López"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@transfarma.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Perfil / Rol *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'ejecutiva' | 'admin')}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="ejecutiva">Ejecutiva</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : '+ Registrar Usuario'}
              </button>
            </form>
          </div>

          {/* LISTADO DE USUARIOS EXISTENTES */}
          <div className="lg:col-span-2 bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Usuarios Registrados en el Sistema ({users.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/80">
                <thead className="bg-[#1a2232] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Nombre</th>
                    <th className="px-4 py-2.5">Correo</th>
                    <th className="px-4 py-2.5">Rol / Perfil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-slate-500">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#1a2232]/50 transition">
                        <td className="px-4 py-2.5 font-bold text-white">{u.name}</td>
                        <td className="px-4 py-2.5 text-slate-400 font-mono">{u.email}</td>
                        <td className="px-4 py-2.5">
                          {u.role === 'admin' ? (
                            <span className="bg-amber-950/60 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded text-[10px] font-bold">
                              ADMINISTRADOR
                            </span>
                          ) : (
                            <span className="bg-indigo-950/60 text-indigo-400 border border-indigo-800/50 px-2 py-0.5 rounded text-[10px] font-bold">
                              EJECUTIVA
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}