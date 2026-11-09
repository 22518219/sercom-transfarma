'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Client {
  id: string
  code: number
  company_name: string
}

interface Ticket {
  id: string
  created_at: string
  area: 'Gerencia' | 'Operaciones' | 'Calidad'
  subject: string
  description: string
  priority: 'Baja' | 'Media' | 'Alta'
  status: 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado'
  clients: {
    code: number
    company_name: string
  } | null
}

export default function TicketsPage() {
  const [assignedClients, setAssignedClients] = useState<Client[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  // Campos del formulario
  const [selectedClient, setSelectedClient] = useState('')
  const [area, setArea] = useState<'Gerencia' | 'Operaciones' | 'Calidad'>('Operaciones')
  const [priority, setPriority] = useState<'Baja' | 'Media' | 'Alta'>('Media')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)

    // 1. Obtener usuario de autenticación actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 2. Buscar a la ejecutiva en la tabla executives por su email
    const { data: execData } = await supabase
      .from('executives')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (execData) {
      const { data: userClientsData } = await supabase
        .from('user_clients')
        .select('client_id, clients(id, code, company_name)')
        .eq('user_id', execData.id)

      if (userClientsData) {
        const clientList = userClientsData
          .map((uc: any) => uc.clients)
          .filter(Boolean) as Client[]
        setAssignedClients(clientList)
      }
    } else {
      const { data: allClients } = await supabase
        .from('clients')
        .select('id, code, company_name')
        .order('code', { ascending: true })

      if (allClients) {
        setAssignedClients(allClients as Client[])
      }
    }

    // 3. Cargar solicitudes creadas
    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('*, clients(code, company_name)')
      .order('created_at', { ascending: false })

    if (ticketsData) {
      setTickets(ticketsData as unknown as Ticket[])
    }

    setLoading(false)
  }

  const formatCode = (code: number) => String(code).padStart(3, '0')

  // Crear nueva solicitud
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !subject.trim() || !description.trim()) {
      alert('Por favor completa todos los campos requeridos.')
      return
    }

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: execData } = await supabase
      .from('executives')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    const activeUserId = execData ? execData.id : user.id

    const { error } = await supabase.from('tickets').insert([
      {
        user_id: activeUserId,
        client_id: selectedClient,
        area,
        priority,
        subject,
        description,
      },
    ])

    if (error) {
      alert('Error al enviar la solicitud: ' + error.message)
    } else {
      alert('Solicitud enviada exitosamente')
      setSubject('')
      setDescription('')
      setSelectedClient('')
      fetchInitialData()
    }
    setSubmitting(false)
  }

  // Cambiar estado de la solicitud (Cumplida / Resuelta, En Proceso, etc.)
  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', ticketId)

    if (error) {
      alert('Error al actualizar el estado: ' + error.message)
    } else {
      fetchInitialData()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-medium">⏳ Pendiente</span>
      case 'En Proceso':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">🔄 En Proceso</span>
      case 'Resuelto':
        return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-medium">✅ Resuelto</span>
      default:
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-medium">❌ Rechazado</span>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return <span className="text-red-600 font-semibold text-xs">🔴 Alta</span>
      case 'Media':
        return <span className="text-orange-500 font-semibold text-xs">🟠 Media</span>
      default:
        return <span className="text-gray-500 font-semibold text-xs">🟢 Baja</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 font-medium">Cargando Módulo de Solicitudes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Control de Solicitudes a Áreas</h1>
            <p className="text-sm text-gray-500">Gestión y seguimiento de requerimientos para Gerencia, Operaciones y Calidad</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition"
          >
            Volver al Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario de Nueva Solicitud */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-blue-600">Nueva Solicitud</h2>
            
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Área de Destino</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as any)}
                  className="w-full p-2 border rounded text-sm bg-white"
                >
                  <option value="Operaciones">⚙️ Operaciones</option>
                  <option value="Calidad">🔍 Calidad</option>
                  <option value="Gerencia">🏢 Gerencia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cliente Asignado</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full p-2 border rounded text-sm bg-white"
                  required
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {assignedClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      [{formatCode(client.code)}] {client.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2 border rounded text-sm bg-white"
                >
                  <option value="Baja">🟢 Baja</option>
                  <option value="Media">🟠 Media</option>
                  <option value="Alta">🔴 Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Asunto / Título</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Solicitud de despacho especial"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Detalle del Requerimiento</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe claramente la necesidad para el área destino..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm transition disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>

          {/* Listado / Historial de Solicitudes */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Estado de Solicitudes</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Fecha</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Área</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Cliente</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Asunto</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Prioridad</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-500">
                        No hay solicitudes registradas.
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{t.area}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {t.clients ? `[${formatCode(t.clients.code)}] ${t.clients.company_name}` : 'Sin especificar'}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{t.subject}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{getPriorityBadge(t.priority)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(t.status)}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                            className="text-xs p-1 border rounded bg-white font-medium text-gray-700 cursor-pointer border-gray-300 hover:border-blue-500"
                          >
                            <option value="Pendiente">⏳ Pendiente</option>
                            <option value="En Proceso">🔄 En Proceso</option>
                            <option value="Resuelto">✅ Resuelto</option>
                            <option value="Rechazado">❌ Rechazado</option>
                          </select>
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