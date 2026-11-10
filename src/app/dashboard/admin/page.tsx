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
  contact_person: string
  email: string
  phone: string
}

interface UserClient {
  id: string
  user_id: string
  client_id: string
}

export default function AdminPortfolioPage() {
  const [executives, setExecutives] = useState<Profile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [assignments, setAssignments] = useState<UserClient[]>([])
  const [loading, setLoading] = useState(true)

  // Formulario nuevo usuario / ejecutiva
  const [execName, setExecName] = useState('')
  const [execEmail, setExecEmail] = useState('')
  const [execPassword, setExecPassword] = useState('')
  const [creatingExec, setCreatingExec] = useState(false)

  // Formulario nuevo cliente
  const [rut, setRut] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  // Selección para asignación
  const [selectedExec, setSelectedExec] = useState('')
  const [selectedClient, setSelectedClient] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    // 1. Validar sesión activa
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 2. Verificar rol en la base de datos
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

    // 3. Cargar Ejecutivas
    const { data: execsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'ejecutiva')

    // 4. Cargar Clientes
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('company_name', { ascending: true })

    // 5. Cargar Asignaciones
    const { data: assignData } = await supabase
      .from('user_clients')
      .select('*')

    if (execsData) setExecutives(execsData as Profile[])
    if (clientsData) setClients(clientsData as Client[])
    if (assignData) setAssignments(assignData as UserClient[])

    setLoading(false)
  }

  // Registrar usuario mediante API Route (Mantiene la sesión de Admin activa)
  const handleCreateExecutive = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!execEmail || !execPassword || !execName) {
      alert('Por favor completa todos los campos.')
      return
    }

    setCreatingExec(true)

    try {
      const response = await fetch('/api/admin/create-executive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: execEmail,
          password: execPassword,
          name: execName,
          role: 'ejecutiva'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Error al crear ejecutiva: ' + (data.error || 'Ocurrió un error.'))
        return
      }

      alert(`Ejecutiva "${execName}" creada con éxito.`)
      
      // Resetear campos del formulario local
      setExecName('')
      setExecEmail('')
      setExecPassword('')

      // Cargar nuevamente la tabla de datos de la base de datos (SIN refrescar la sesión auth)
      fetchData()

    } catch (err: any) {
      alert('Error de conexión: ' + err.message)
    } finally {
      setCreatingExec(false)
    }
  }

  // Registrar un nuevo cliente
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('clients')
      .insert([
        {
          rut,
          company_name: companyName,
          contact_person: contactPerson,
          email: clientEmail,
          phone: clientPhone,
        },
      ])

    if (error) {
      alert('Error al registrar cliente: ' + error.message)
    } else {
      alert('Cliente creado exitosamente')
      setRut('')
      setCompanyName('')
      setContactPerson('')
      setClientEmail('')
      setClientPhone('')
      fetchData()
    }
  }

  // Asignar o reasignar cliente a ejecutiva
  const handleAssignClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExec || !selectedClient) {
      alert('Selecciona una ejecutiva y un cliente')
      return
    }

    // Eliminar asignación previa si existe
    await supabase
      .from('user_clients')
      .delete()
      .eq('client_id', selectedClient)

    // Crear nueva asignación
    const { error } = await supabase
      .from('user_clients')
      .insert([{ user_id: selectedExec, client_id: selectedClient }])

    if (error) {
      alert('Error al asignar cartera: ' + error.message)
    } else {
      alert('Cartera actualizada con éxito')
      setSelectedExec('')
      setSelectedClient('')
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 font-medium">Cargando Módulo de Administración...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Administración de Cartera</h1>
            <p className="text-sm text-gray-500">Gestión de ejecutivas, clientes y asignaciones</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition"
          >
            Volver al Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Formulario 1: Crear Nueva Ejecutiva */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-indigo-600">Crear Ejecutiva</h2>
            <form onSubmit={handleCreateExecutive} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="María González"
                  value={execName}
                  onChange={(e) => setExecName(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="mgonzalez@transfarma.cl"
                  value={execEmail}
                  onChange={(e) => setExecEmail(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={execPassword}
                  onChange={(e) => setExecPassword(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={creatingExec}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded text-sm transition disabled:opacity-50"
              >
                {creatingExec ? 'Guardando...' : 'Crear Ejecutiva'}
              </button>
            </form>
          </div>

          {/* Formulario 2: Registrar Nuevo Cliente */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-blue-600">Registrar Cliente</h2>
            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">RUT Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="76.xxx.xxx-k"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Nombre Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Farmacias Ejemplo SpA"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Contacto</label>
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Correo</label>
                  <input
                    type="email"
                    placeholder="contacto@cliente.cl"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+56 9 1234 5678"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm transition"
              >
                Guardar Cliente
              </button>
            </form>
          </div>

          {/* Formulario 3: Asignación de Cartera */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-green-600">Asignar Cartera</h2>
            <form onSubmit={handleAssignClient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full p-2 border rounded text-sm bg-white"
                  required
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar Ejecutiva</label>
                <select
                  value={selectedExec}
                  onChange={(e) => setSelectedExec(e.target.value)}
                  className="w-full p-2 border rounded text-sm bg-white"
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

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded text-sm transition"
              >
                Asignar Cliente a Ejecutiva
              </button>
            </form>
          </div>

        </div>

        {/* Tabla Resumen de Clientes y Ejecutivas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Listado de Clientes y Ejecutivas Asignadas</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">RUT</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Empresa</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Contacto</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Ejecutiva Asignada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      No hay clientes registrados aún.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const currentAssignment = assignments.find((a) => a.client_id === client.id)
                    const assignedExec = executives.find((e) => e.id === currentAssignment?.user_id)

                    return (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{client.rut}</td>
                        <td className="px-4 py-2">{client.company_name}</td>
                        <td className="px-4 py-2">{client.contact_person || '-'}</td>
                        <td className="px-4 py-2">
                          {assignedExec ? (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                              {assignedExec.name || assignedExec.email}
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                              Sin Asignar
                            </span>
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