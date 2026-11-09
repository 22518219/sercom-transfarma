'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'ejecutiva'
}

export default function UsersAdminPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  // Campos del formulario
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'ejecutiva'>('ejecutiva')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // Buscar perfil por ID primero, y si no por EMAIL
    let { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile && user.email) {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', user.email)
        .maybeSingle()

      profile = profileByEmail
    }

    const currentRole = profile?.role?.toLowerCase()

    // Permitir acceso si el rol es admin o si el usuario es eayala@transfarma.cl
    if (currentRole !== 'admin' && user.email !== 'eayala@transfarma.cl') {
      alert('Acceso restringido. Este módulo solo es visible para Administradores.')
      router.push('/dashboard')
      return
    }

    // Cargar listado de perfiles
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true })

    if (allProfiles) setProfiles(allProfiles as UserProfile[])
    setLoading(false)
  }

  // Crear usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name) {
      alert('Completa todos los campos requeridos.')
      return
    }

    setLoading(true)
    const tempSupabase = createClient()

    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (authError) {
      alert('Error en autenticación: ' + authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{ id: authData.user.id, email, name, role }])

      if (profileError) {
        alert('Error al guardar perfil: ' + profileError.message)
      } else {
        alert(`Usuario "${name}" registrado como [${role.toUpperCase()}].`)
        setName('')
        setEmail('')
        setPassword('')
        setRole('ejecutiva')
        checkAdminAndFetch()
      }
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Cargando Módulo de Administración de Usuarios...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center bg-[#121824] p-4 rounded-xl border border-slate-800/60 shadow-lg">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Administración de Usuarios y Perfiles</h1>
            <p className="text-xs text-slate-400">Creación de usuarios con accesos (Administrador / Ejecutiva)</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#1a2232] hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700/60 transition"
          >
            ← Volver al Dashboard
          </button>
        </div>

        {/* Formulario */}
        <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
            <span>🔐</span>
            <span>Crear Nuevo Usuario</span>
          </h2>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre Completo *</label>
              <input
                type="text"
                placeholder="Ej: Paula Venegas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Correo Electrónico *</label>
              <input
                type="email"
                placeholder="usuario@transfarma.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contraseña *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Perfil / Rol *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'ejecutiva')}
                className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
              >
                <option value="ejecutiva">Ejecutiva</option>
                <option value="admin">Administrador (Admin)</option>
              </select>
            </div>

            <div className="lg:col-span-4 flex justify-end">
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-6 rounded-lg text-xs shadow transition"
              >
                + Registrar Usuario
              </button>
            </div>
          </form>
        </div>

        {/* Listado */}
        <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Listado de Usuarios Registrados</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/80">
              <thead className="bg-[#1a2232] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-[#1a2232]/50 transition">
                    <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{p.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        p.role === 'admin'
                          ? 'bg-purple-950/80 text-purple-400 border-purple-800/60'
                          : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                      }`}>
                        {p.role === 'admin' ? 'ADMINISTRADOR' : 'EJECUTIVA'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}