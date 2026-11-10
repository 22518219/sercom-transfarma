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
  email?: string
}

interface UserClient {
  id: string
  user_id: string
  client_id: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [assignments, setAssignments] = useState<UserClient[]>([])
  const [loading, setLoading] = useState(true)

  // Formulario Registro de Usuario
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [role, setRole] = useState<'ejecutiva' | 'admin'>('ejecutiva')
  const [isRegistering, setIsRegistering] = useState(false)

  // Asignación Múltiple
  const [selectedExec, setSelectedExec] = useState('')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  // Filtros de la Tabla
  const [searchTerm, setSearchTerm] = useState('')
  const [filterExecId, setFilterExecId] = useState('ALL')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Validar Rol Admin
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (currentProfile && currentProfile.role !== 'admin') {
      alert('Acceso restringido solo para Administradores.')
      router.push('/dashboard')
      return
    }

    // Cargar Usuarios / Ejecutivas
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true })

    // Cargar Clientes
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('company_name', { ascending: true })

    // Cargar Asignaciones
    const { data: assignData } = await supabase
      .from('user_clients')
      .select('*')

    if (profilesData) setUsers(profilesData as Profile[])
    if (clientsData) setClients(clientsData as Client[])
    if (assignData) setAssignments(assignData as UserClient[])

    setLoading(false)
  }

  // REGISTRO DE USUARIO VÍA API ROUTE
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !userEmail || !userPassword) {
      alert('Por favor completa todos los campos requeridos.')
      return
    }

    setIsRegistering(true)

    try {
      const response = await fetch('/api/admin/create-executive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail.trim(),
          password: userPassword.trim(),
          name: fullName.trim(),
          role: role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Error al crear usuario: ' + (data.error || 'Error inesperado.'))
        setIsRegistering(false)
        return
      }

      alert(`Usuario "${fullName}" creado exitosamente.`)
      setFullName('')
      setUserEmail('')
      setUserPassword('')
      setRole('ejecutiva')
      fetchData()
    } catch (err: any) {
      alert('Error de conexión: ' + err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  // MANEJO DE CHECKBOXES SELECCIÓN MÚLTIPLE
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

  // GUARDAR ASIGNACIÓN MÚLTIPLE
  const handleAssignMultipleClients = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedExec || selectedClients.length === 0) {
      alert('Selecciona una ejecutiva y al menos un cliente/mandante.')
      return
    }

    setIsAssigning(true)

    try {
      // 1. Eliminar asignaciones previas de los clientes marcados
      await supabase
        .from('user_clients')
        .delete()
        .in('client_id', selectedClients)

      // 2. Insertar lote para la ejecutiva seleccionada
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
        alert(`Se asignaron ${selectedClients.length} mandantes con éxito.`)
        setSelectedClients([])
        setSelectedExec('')
        fetchData()
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message)
    } finally {
      setIsAssigning(false)
    }
  }

  // DESVINCULAR MANDANTE INDIVIDUAL
  const handleUnassignClient = async (clientId: string) => {
    if (!confirm('¿Deseas quitar la asignación de este mandante?')) return

    const { error } = await supabase
      .from('user_clients')
      .delete()
      .eq('client_id', clientId)

    if (error) {
      alert('Error al desvincular: ' + error.message)
    } else {
      fetchData()
    }
  }

  // FILTRADO DINÁMICO DE CLIENTES Y ASIGNACIONES
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.rut && client.rut.toLowerCase().includes(searchTerm.toLowerCase()))

    if (filterExecId === 'ALL') return matchesSearch

    const currentAssignment = assignments.find((a) => a.client_id === client.id)
    if (filterExecId === 'UNASSIGNED') {
      return matchesSearch && !currentAssignment
    }

    return matchesSearch && currentAssignment?.user_id === filterExecId
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Cargando Módulo Admin...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-6 font-sans space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ENCABEZADO */}
        <div className="flex justify-between items-center bg-[#141923] p-4 rounded-xl border border-slate-800 shadow-md">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Administración de Usuarios y Asignación de Cartera</h1>
            <p className="text-xs text-slate-400">Panel de control de cuentas corporativas y distribución de mandantes</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#1a2232] hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition"
          >
            ← Volver al Dashboard
          </button>
        </div>

        {/* SECCIÓN DE FORMULARIOS SUPERIORES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* FORMULARIO 1: CREAR USUARIOS */}
          <div className="bg-[#141923] p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              1. Nuevo Registro de Ejecutiva / Usuario
            </h2>

            <form onSubmit={handleRegisterUser} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María González"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/80 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="mgonzalez@transfarma.cl"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/80 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/80 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Perfil / Rol *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'ejecutiva' | 'admin')}
                  className="w-full bg-[#1a2232] border border-slate-700/80 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="ejecutiva">Ejecutiva</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                {isRegistering ? 'Guardando Usuario...' : '+ Registrar Usuario'}
              </button>
            </form>
          </div>

          {/* FORMULARIO 2: CUADRO DE ASIGNACIÓN MÚLTIPLE */}
          <div className="bg-[#141923] p-5 rounded-xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                2. Asignación Múltiple de Cartera
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold">
                ({selectedClients.length} seleccionados)
              </span>
            </div>

            <form onSubmit={handleAssignMultipleClients} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  1. Seleccionar Ejecutiva Destino *
                </label>
                <select
                  value={selectedExec}
                  onChange={(e) => setSelectedExec(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/80 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    2. Seleccionar Mandantes / Clientes *
                  </label>
                  <label className="text-[10px] text-indigo-400 font-bold cursor-pointer flex items-center space-x-1.5 hover:text-indigo-300">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllClients}
                      checked={selectedClients.length === clients.length && clients.length > 0}
                      className="rounded border-slate-700 bg-[#1a2232] text-emerald-500 focus:ring-0"
                    />
                    <span>Marcar Todos</span>
                  </label>
                </div>

                <div className="max-h-48 overflow-y-auto bg-[#1a2232] border border-slate-700/80 rounded-lg p-2 space-y-1">
                  {clients.length === 0 ? (
                    <p className="text-[11px] text-slate-500 p-2 text-center">No hay clientes cargados.</p>
                  ) : (
                    clients.map((c) => (
                      <label
                        key={c.id}
                        className={`flex items-center space-x-2.5 p-2 rounded-lg text-xs cursor-pointer transition ${
                          selectedClients.includes(c.id)
                            ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-200'
                            : 'hover:bg-[#121824] text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(c.id)}
                          onChange={() => handleToggleClient(c.id)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className="font-mono text-indigo-400 text-[10px]">[{c.rut || 'S/R'}]</span>
                        <span className="font-semibold truncate">{c.company_name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isAssigning}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                {isAssigning ? 'Guardando Asignación...' : `+ Asignar (${selectedClients.length}) Mandantes a Ejecutiva`}
              </button>
            </form>
          </div>

        </div>

        {/* TABLA RESUMEN DE CARTERA (UBICADA JUSTO DEBAJO DEL CUADRO DE ASIGNACIÓN) */}
        <div className="bg-[#141923] p-6 rounded-xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Listado de Mandantes y Ejecutivas Asignadas</h2>
              <p className="text-xs text-slate-400">Resumen detallado de la cartera completa y su estado de asignación</p>
            </div>

            {/* BARRA DE BÚSQUEDA Y FILTRO */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar mandante o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#1a2232] border border-slate-700/80 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 w-full sm:w-48"
              />

              <select
                value={filterExecId}
                onChange={(e) => setFilterExecId(e.target.value)}
                className="bg-[#1a2232] border border-slate-700/80 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="ALL">TODAS LAS EJECUTIVAS ({clients.length})</option>
                <option value="UNASSIGNED">SIN ASIGNAR</option>
                {users.filter(u => u.role === 'ejecutiva').map((exec) => {
                  const count = assignments.filter(a => a.user_id === exec.id).length
                  return (
                    <option key={exec.id} value={exec.id}>
                      {exec.name} ({count} clientes)
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* TABLA DE RESULTADOS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
              <thead className="bg-[#1a2232] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">RUT</th>
                  <th className="px-4 py-3">Empresa / Mandante</th>
                  <th className="px-4 py-3">Contacto Principal</th>
                  <th className="px-4 py-3">Ejecutiva Asignada</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">
                      No se encontraron mandantes para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const currentAssignment = assignments.find((a) => a.client_id === client.id)
                    const assignedExec = users.find((u) => u.id === currentAssignment?.user_id)

                    return (
                      <tr key={client.id} className="hover:bg-[#1a2232]/50 transition">
                        <td className="px-4 py-3 font-mono text-indigo-400 font-bold">
                          {client.rut || 'S/R'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">
                          {client.company_name}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {client.contact_person || 'Sin contacto'}
                        </td>
                        <td className="px-4 py-3">
                          {assignedExec ? (
                            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[11px] font-semibold px-2.5 py-1 rounded-full inline-block">
                              👤 {assignedExec.name} ({assignedExec.email})
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 text-[10px] font-medium px-2.5 py-1 rounded-full inline-block">
                              Sin Asignar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {currentAssignment && (
                            <button
                              onClick={() => handleUnassignClient(client.id)}
                              className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 px-2.5 py-1 rounded transition"
                            >
                              Desvincular
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}