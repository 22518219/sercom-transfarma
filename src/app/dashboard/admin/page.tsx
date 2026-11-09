'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Executive {
  id: string
  name: string
  email: string
  phone?: string
  transfarma_user?: string
  transfarma_password?: string
}

interface Client {
  id: string
  code: number
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
  const [executives, setExecutives] = useState<Executive[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [assignments, setAssignments] = useState<UserClient[]>([])
  const [loading, setLoading] = useState(true)

  // Formulario nueva ejecutiva
  const [execName, setExecName] = useState('')
  const [execEmail, setExecEmail] = useState('')
  const [execPhone, setExecPhone] = useState('')
  const [transfarmaUser, setTransfarmaUser] = useState('')
  const [transfarmaPassword, setTransfarmaPassword] = useState('')

  // Formulario nuevo cliente
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: execsData } = await supabase
      .from('executives')
      .select('*')
      .order('name', { ascending: true })

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('code', { ascending: true })

    const { data: assignData } = await supabase
      .from('user_clients')
      .select('*')

    if (execsData) setExecutives(execsData as Executive[])
    if (clientsData) setClients(clientsData as Client[])
    if (assignData) setAssignments(assignData as UserClient[])

    setLoading(false)
  }

  const formatCode = (code: number) => String(code).padStart(3, '0')

  // Registrar nueva ejecutiva con credenciales externas
  const handleCreateExecutive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!execEmail || !execName) {
      alert('Por favor ingresa nombre y correo de la ejecutiva.')
      return
    }

    const { error } = await supabase
      .from('executives')
      .insert([
        {
          name: execName,
          email: execEmail,
          phone: execPhone,
          transfarma_user: transfarmaUser,
          transfarma_password: transfarmaPassword,
        },
      ])

    if (error) {
      alert('Error al registrar ejecutiva: ' + error.message)
    } else {
      alert(`Ejecutiva "${execName}" creada exitosamente con credenciales para apptransfarma.cl.`)
      setExecName('')
      setExecEmail('')
      setExecPhone('')
      setTransfarmaUser('')
      setTransfarmaPassword('')
      fetchData()
    }
  }

  // Registrar nuevo cliente
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('clients')
      .insert([
        {
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
      setCompanyName('')
      setContactPerson('')
      setClientEmail('')
      setClientPhone('')
      fetchData()
    }
  }

  // Asignar cliente a ejecutiva
  const handleAssignClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExec || !selectedClient) {
      alert('Selecciona una ejecutiva y un cliente')
      return
    }

    await supabase
      .from('user_clients')
      .delete()
      .eq('client_id', selectedClient)

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
            <p className="text-sm text-gray-500">Gestión de ejecutivas, credenciales externas y asignaciones</p>
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
                <label className="block text-xs font-medium text-gray-700">Correo Sercom</label>
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
                <label className="block text-xs font-medium text-gray-700">Teléfono (Opcional)</label>
                <input
                  type="text"
                  placeholder="+56 9 1234 5678"
                  value={execPhone}
                  onChange={(e) => setExecPhone(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-bold text-gray-600">Credenciales AppTransfarma</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Usuario apptransfarma.cl</label>
                  <input
                    type="text"
                    placeholder="mgonzalez"
                    value={transfarmaUser}
                    onChange={(e) => setTransfarmaUser(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Contraseña apptransfarma.cl</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={transfarmaPassword}
                    onChange={(e) => setTransfarmaPassword(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded text-sm transition"
              >
                Guardar Ejecutiva
              </button>
            </form>
          </div>

          {/* Formulario 2: Registrar Nuevo Cliente */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-blue-600">Registrar Cliente</h2>
            <form onSubmit={handleCreateClient} className="space-y-3">
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
                      [{formatCode(c.code)}] {c.company_name}
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

        {/* Tabla Resumen de Ejecutivas con Credenciales */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Ejecutivas y Credenciales de AppTransfarma</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Nombre</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Correo</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Usuario AppTransfarma</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Estado Credencial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {executives.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      No hay ejecutivas registradas aún.
                    </td>
                  </tr>
                ) : (
                  executives.map((exec) => (
                    <tr key={exec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{exec.name}</td>
                      <td className="px-4 py-2 text-gray-600">{exec.email}</td>
                      <td className="px-4 py-2 font-mono text-xs">{exec.transfarma_user || 'Sin configurar'}</td>
                      <td className="px-4 py-2">
                        {exec.transfarma_user && exec.transfarma_password ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Configurada
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                            Pendiente
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
  )
}