'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Profile {
  id: string
  name: string
  email: string
  role: string
}

interface Client {
  id: string
  rut: string
  company_name: string
  contact_person?: string
}

interface UserClient {
  id: string
  user_id: string
  client_id: string
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [assignments, setAssignments] = useState<UserClient[]>([])
  const [loading, setLoading] = useState(true)

  // Registro de usuario
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ejecutiva' | 'admin'>('ejecutiva')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Asignación múltiple
  const [selectedExec, setSelectedExec] = useState('')
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchUsers()
  }, [])

  const checkAdminAndFetchUsers = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

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

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true })

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('company_name', { ascending: true })

    const { data: assignData } = await supabase
      .from('user_clients')
      .select('*')

    if (profilesData) setUsers(profilesData as Profile[])
    if (clientsData) setClients(clientsData as Client[])
    if (assignData) setAssignments(assignData as UserClient[])

    setLoading(false)
  }

  // REGISTRAR USUARIO
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) {
      alert('Por favor completa todos los campos requeridos.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/create-executive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: fullName.trim(),
          role: role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Error al crear usuario: ' + (data.error || 'Error inesperado.'))
        setIsSubmitting(false)
        return
      }

      alert(`Usuario "${fullName}" creado exitosamente.`)
      setFullName('')
      setEmail('')
      setPassword('')
      setRole('ejecutiva')
      checkAdminAndFetchUsers()
    } catch (err: any) {
      alert('Error de conexión: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // MANEJO DE SELECCIÓN MÚLTIPLE DE CLIENTES
  const handleSelectAllClients = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClients(clients.map((c) => c.id))
    } else {
      setSelectedClients([])
    }
  }

  const handleToggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    )
  }

  // ASIGNAR MULTIPLES MANDANTES
  const handleAssignMultipleClients = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedExec || selectedClients.length === 0) {
      alert('Selecciona una ejecutiva y al menos un cliente.')
      return
    }

    try {
      // 1. Eliminar asignaciones previas de los clientes seleccionados
      await supabase
        .from('user_clients')
        .delete()
        .in('client_id', selectedClients)

      // 2. Crear las nuevas asignaciones en lote
      const newAssignments = selectedClients.map((clientId) => ({
        user_id: selectedExec,
        client_id: clientId,
      }))

      const { error } = await supabase
        .from('user_clients')
        .insert(newAssignments)

      if (error) {
        alert('Error al asignar cartera: ' + error.message)
      } else {
        alert(`Se asignaron ${selectedClients.length} mandantes a la ejecutiva con éxito.`)
        setSelectedClients([])
        setSelectedExec('')
        checkAdminAndFetchUsers()
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Cargando Usuarios y Cartera...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 p-6 font-sans space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ENCABEZADO */}
        <div className="flex justify-between items-center bg-[#121824] p-4 rounded-xl border border-slate-800/60 shadow-lg">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Administración de Usuarios y Cartera</h1>
            <p className="text-xs text-slate-400">Creación de cuentas y asignación de mandantes</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#1a2232] hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700/60 transition"
          >
            ← Volver al Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* FORMULARIO 1: CREAR USUARIO */}
          <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              1. Nuevo Registro de Usuario
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

          {/* FORMULARIO 2: ASIGNACIÓN MÚLTIPLE DE MANDANTES */}
          <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>2. Asignación Múltiple de Cartera</span>
              <span className="text-[10px] text-slate-400">({selectedClients.length} seleccionados)</span>
            </h2>

            <form onSubmit={handleAssignMultipleClients} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Seleccionar Ejecutiva Destino *
                </label>
                <select
                  value={selectedExec}
                  onChange={(e) => setSelectedExec(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- Selecciona una ejecutiva --</option>
                  {users.filter(u => u.role === 'ejecutiva').map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {exec.name} ({exec.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Seleccionar Mandantes / Clientes *
                  </label>
                  <label className="text-[10px] text-indigo-400 font-bold cursor-pointer flex items-center space-x-1">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllClients}
                      checked={selectedClients.length === clients.length && clients.length > 0}
                      className="rounded border-slate-700 bg-[#1a2232]"
                    />
                    <span>Marcar Todos</span>
                  </label>
                </div>

                <div className="max-h-48 overflow-y-auto bg-[#1a2232] border border-slate-700/60 rounded-lg p-2 space-y-1">
                  {clients.length === 0 ? (
                    <p className="text-[11px] text-slate-500 p-2 text-center">No hay clientes cargados.</p>
                  ) : (
                    clients.map((c) => (
                      <label
                        key={c.id}
                        className={`flex items-center space-x-2 p-2 rounded text-xs cursor-pointer transition ${
                          selectedClients.includes(c.id)
                            ? 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300'
                            : 'hover:bg-[#121824] text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(c.id)}
                          onChange={() => handleToggleClient(c.id)}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span className="font-mono text-indigo-400 text-[10px]">[{c.rut}]</span>
                        <span className="font-semibold truncate">{c.company_name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition"
              >
                + Asignar ({selectedClients.length}) Mandantes a Ejecutiva
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  )
}