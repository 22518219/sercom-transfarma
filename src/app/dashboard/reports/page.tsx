'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Client {
  id: string
  code: number
  company_name: string
}

interface Shipment {
  id: string
  created_at: string
  tracking_number: string
  destination: string
  packages_count: number
  status: 'En Ruta' | 'Entregado' | 'Con Novedad' | 'Cancelado'
  notes: string
  clients: {
    code: number
    company_name: string
  } | null
}

export default function ReportsPage() {
  const [assignedClients, setAssignedClients] = useState<Client[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  // Campos del formulario
  const [selectedClient, setSelectedClient] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [destination, setDestination] = useState('')
  const [packagesCount, setPackagesCount] = useState(1)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Buscar ejecutiva por email o cargar clientes
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

    // Cargar envíos ordenados por fecha
    const { data: shipmentsData } = await supabase
      .from('shipments')
      .select('*, clients(code, company_name)')
      .order('created_at', { ascending: false })

    if (shipmentsData) {
      setShipments(shipmentsData as unknown as Shipment[])
    }

    setLoading(false)
  }

  const formatCode = (code: number) => String(code).padStart(3, '0')

  // Registrar un nuevo envío
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !trackingNumber.trim() || !destination.trim()) {
      alert('Por favor completa los campos requeridos (Cliente, Nº Seguimiento y Destino).')
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

    const { error } = await supabase.from('shipments').insert([
      {
        user_id: activeUserId,
        client_id: selectedClient,
        tracking_number: trackingNumber,
        destination,
        packages_count: packagesCount,
        notes,
      },
    ])

    if (error) {
      alert('Error al registrar envío: ' + error.message)
    } else {
      alert('Envío registrado exitosamente')
      setTrackingNumber('')
      setDestination('')
      setPackagesCount(1)
      setNotes('')
      setSelectedClient('')
      fetchInitialData()
    }
    setSubmitting(false)
  }

  // Cambiar estado del envío
  const handleUpdateStatus = async (shipmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ status: newStatus })
      .eq('id', shipmentId)

    if (error) {
      alert('Error al actualizar estado del envío: ' + error.message)
    } else {
      fetchInitialData()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'En Ruta':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">🚚 En Ruta</span>
      case 'Entregado':
        return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-medium">✅ Entregado</span>
      case 'Con Novedad':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-medium">⚠️ Con Novedad</span>
      default:
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-medium">❌ Cancelado</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 font-medium">Cargando Reporte Diario de Envíos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reporte Diario de Envíos</h1>
            <p className="text-sm text-gray-500">Registro, seguimiento y estado de despachos por cliente</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition"
          >
            Volver al Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario de Nuevo Envío */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-blue-600">Registrar Despacho</h2>
            
            <form onSubmit={handleCreateShipment} className="space-y-4">
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Nº Seguimiento / Guía</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ST-994821"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Destino / Sucursal</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Santiago Centro / Av. Providencia 1230"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad de Bultos</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={packagesCount}
                  onChange={(e) => setPackagesCount(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Ej: Requiere transporte refrigerado / Entregar antes de las 14:00..."
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
                {submitting ? 'Guardando...' : 'Registrar Envío'}
              </button>
            </form>
          </div>

          {/* Listado de Envíos Registrados */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Control de Despachos</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Fecha</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Nº Guía</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Cliente</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Destino</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-600">Bultos</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-500">
                        No hay envíos registrados hoy.
                      </td>
                    </tr>
                  ) : (
                    shipments.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.tracking_number}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {s.clients ? `[${formatCode(s.clients.code)}] ${s.clients.company_name}` : 'Sin especificar'}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{s.destination}</td>
                        <td className="px-4 py-3 text-center font-medium">{s.packages_count}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(s.status)}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <select
                            value={s.status}
                            onChange={(e) => handleUpdateStatus(s.id, e.target.value)}
                            className="text-xs p-1 border rounded bg-white font-medium text-gray-700 cursor-pointer border-gray-300 hover:border-blue-500"
                          >
                            <option value="En Ruta">🚚 En Ruta</option>
                            <option value="Entregado">✅ Entregado</option>
                            <option value="Con Novedad">⚠️ Con Novedad</option>
                            <option value="Cancelado">❌ Cancelado</option>
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