'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Client {
  id: string
  company_name: string
  rut: string
}

interface LogEntry {
  id: string
  created_at: string
  type: 'telefono' | 'correo'
  notes: string
  clients: {
    company_name: string
  } | null
}

export default function BitacoraPage() {
  const [assignedClients, setAssignedClients] = useState<Client[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Campos del formulario
  const [selectedClient, setSelectedClient] = useState('')
  const [type, setType] = useState<'telefono' | 'correo'>('telefono')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)

    // 1. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 2. Cargar la cartera asignada a esta ejecutiva desde user_clients
    const { data: userClientsData, error: ucError } = await supabase
      .from('user_clients')
      .select('client_id, clients(id, company_name, rut)')
      .eq('user_id', user.id)

    if (ucError) {
      console.error('Error al cargar cartera:', ucError)
    } else if (userClientsData) {
      // Extraer los clientes de la consulta relacional
      const clientList = userClientsData
        .map((uc: any) => uc.clients)
        .filter(Boolean) as Client[]
      setAssignedClients(clientList)
    }

    // 3. Cargar las gestiones (bitácora) registradas por este usuario
    const { data: logsData, error: logsError } = await supabase
      .from('logs')
      .select('id, created_at, type, notes, clients(company_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (logsError) {
      console.error('Error al cargar bitácora:', logsError)
    } else if (logsData) {
      setLogs(logsData as unknown as LogEntry[])
    }

    setLoading(false)
  }

  // Registrar nueva gestión en la bitácora
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !notes.trim()) {
      alert('Por favor selecciona un cliente e ingresa el detalle de la gestión.')
      return
    }

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('logs')
      .insert([
        {
          user_id: user.id,
          client_id: selectedClient,
          type,
          notes,
        },
      ])

    if (error) {
      alert('Error al guardar la gestión: ' + error.message)
    } else {
      setNotes('')
      setSelectedClient('')
      fetchInitialData()
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 font-medium">Cargando Bitácora Diaria...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bitácora Diaria de Gestiones</h1>
            <p className="text-sm text-gray-500">Registra y revisa tus interacciones diarias con la cartera asignada</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition"
          >
            Volver al Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario de Registro de Gestiones */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-blue-600">Nueva Gestión</h2>
            
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cliente Asignado
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full p-2 border rounded text-sm bg-white"
                  required
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {assignedClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company_name} ({client.rut})
                    </option>
                  ))}
                </select>
                {assignedClients.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No tienes clientes asignados aún. Solicita asignación al Administrador.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo de Contacto
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="telefono"
                      checked={type === 'telefono'}
                      onChange={() => setType('telefono')}
                      className="mr-2"
                    />
                    📞 Teléfono
                  </label>
                  <label className="flex items-center text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="correo"
                      checked={type === 'correo'}
                      onChange={() => setType('correo')}
                      className="mr-2"
                    />
                    ✉️ Correo
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Resumen de la Gestión
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe un breve detalle de lo conversado o acordado con el cliente..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm transition disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Registrar Gestión'}
              </button>
            </form>
          </div>

          {/* Historial de Gestiones Diarias */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Historial de Registros</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Fecha / Hora</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Cliente</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Tipo</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-500">
                        No has registrado gestiones todavía.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('es-CL')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {log.clients?.company_name || 'Sin especificar'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.type === 'telefono' ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                              📞 Teléfono
                            </span>
                          ) : (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                              ✉️ Correo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs max-w-xs break-words">
                          {log.notes}
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