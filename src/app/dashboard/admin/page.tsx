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

export default function AdminPage() {
  const [executives, setExecutives] = useState<Profile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [assignments, setAssignments] = useState<UserClient[]>([])
  const [loading, setLoading] = useState(true)

  // Asignación Múltiple
  const [selectedExec, setSelectedExec] = useState('')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    // Verificar si es Admin
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

    // Cargar perfiles de ejecutivas
    const { data: execsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'ejecutiva')

    // Cargar clientes
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('company_name', { ascending: true })

    // Cargar asignaciones vigentes
    const { data: assignData } = await supabase
      .from('user_clients')
      .select('*')

    if (execsData) setExecutives(execsData as Profile[])
    if (clientsData) setClients(clientsData as Client[])
    if (assignData) setAssignments(assignData as UserClient[])

    setLoading(false)
  }

  // Marcar / Desmarcar Todos
  const handleSelectAllClients = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClients(clients.map((c) => c.id))
    } else {
      setSelectedClients([])
    }
  }

  // Toggle Checkbox individual
  const handleToggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    )
  }

  // Guardar asignación múltiple
  const handleAssignMultipleClients = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedExec || selectedClients.length === 0) {
      alert('Selecciona una ejecutiva y al menos un cliente/mandante.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Eliminar asignaciones anteriores de los clientes seleccionados
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
        alert(`¡Éxito! Se asignaron ${selectedClients.length} mandantes correctamente.`)
        setSelectedClients([])
        setSelectedExec('')
        fetchData()
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-slate-400 text-xs uppercase tracking-wider">Cargando Administración...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-6 font-sans space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Encabezado */}
        <div className="flex justify-between items-center bg-[#141923] p-4 rounded-xl border border-slate-800 shadow-md">
          <div>
            <h1 className="text-lg font-bold text-white">Administración y Asignación de Cartera</h1>
            <p className="text-xs text-slate-400">Asigna uno o varios mandantes a una ejecutiva</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#1a2232] hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition"
          >
            ← Volver al Dashboard
          </button>
        </div>

        {/* Panel de Asignación Múltiple */}
        <div className="bg-[#141923] p-6 rounded-xl border border-slate-800 shadow-lg space-y-5 max-w-2xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Asignación Múltiple de Mandantes
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              {selectedClients.length} de {clients.length} seleccionados
            </span>
          </div>

          <form onSubmit={handleAssignMultipleClients} className="space-y-4">
            
            {/* 1. Seleccionar Ejecutiva */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                1. Seleccionar Ejecutiva Destino *
              </label>
              <select
                value={selectedExec}
                onChange={(e) => setSelectedExec(e.target.value)}
                className="w-full bg-[#1a2232] border border-slate-700/80 text-slate-100 text-xs rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">-- Selecciona una ejecutiva --</option>
                {executives.map((exec) => (
                  <option key={exec.id} value={exec.id}>
                    {exec.name} ({exec.email})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Lista de Mandantes con Checkboxes */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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

              {/* Contenedor escroleable de clientes */}
              <div className="max-h-60 overflow-y-auto bg-[#1a2232] border border-slate-700/80 rounded-lg p-2 space-y-1">
                {clients.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2 text-center">No hay clientes cargados en la base de datos.</p>
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
                      <span className="font-medium truncate">{c.company_name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg text-xs shadow-md transition disabled:opacity-50 tracking-wide"
            >
              {isSubmitting ? 'Guardando Asignación...' : `+ Asignar (${selectedClients.length}) Mandantes a la Ejecutiva`}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}