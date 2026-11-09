'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Executive {
  id: string
  name: string
  email: string
  transfarma_user?: string
}

interface Client {
  id: string
  code: number
  company_name: string
  contact_person: string
  email: string
  phone: string
}

interface AssignmentDetail {
  id: string
  client_id: string
  user_id: string
  client: Client
  executive: Executive
}

export default function AdminPortfolioPage() {
  const [executives, setExecutives] = useState<Executive[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para el filtro por ejecutiva
  const [filterExecId, setFilterExecId] = useState<string>('ALL')

  // Formulario asignación
  const [selectedExec, setSelectedExec] = useState('')
  const [selectedClient, setSelectedClient] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const printRef = useRef<HTMLDivElement>(null)

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

    // Obtener Ejecutivas
    const { data: execsData } = await supabase
      .from('executives')
      .select('*')
      .order('name', { ascending: true })

    // Obtener Clientes
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('code', { ascending: true })

    // Obtener Asignaciones uniendo Clientes y Ejecutivas
    const { data: assignData } = await supabase
      .from('user_clients')
      .select(`
        id,
        client_id,
        user_id,
        client:clients!inner(id, code, company_name, contact_person, email, phone),
        executive:executives!inner(id, name, email)
      `)

    if (execsData) setExecutives(execsData as Executive[])
    if (clientsData) setClients(clientsData as Client[])
    if (assignData) setAssignments(assignData as unknown as AssignmentDetail[])

    setLoading(false)
  }

  const formatCode = (code: number) => String(code).padStart(3, '0')

  // Filtrado dinámico de asignaciones
  const filteredAssignments = filterExecId === 'ALL'
    ? assignments
    : assignments.filter(item => item.user_id === filterExecId)

  // Asignar cliente a ejecutiva
  const handleAssignClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExec || !selectedClient) {
      alert('Selecciona una ejecutiva y un cliente')
      return
    }

    // Eliminar asignación previa del cliente si existe
    await supabase
      .from('user_clients')
      .delete()
      .eq('client_id', selectedClient)

    // Crear la nueva asignación
    const { error } = await supabase
      .from('user_clients')
      .insert([{ user_id: selectedExec, client_id: selectedClient }])

    if (error) {
      alert('Error al asignar cliente: ' + error.message)
    } else {
      alert('Asignación realizada con éxito.')
      setSelectedExec('')
      setSelectedClient('')
      fetchData()
    }
  }

  // Eliminar asignación
  const handleUnassign = async (assignmentId: string) => {
    if (!confirm('¿Deseas desvincular este cliente de la ejecutiva?')) return

    const { error } = await supabase
      .from('user_clients')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      alert('Error al eliminar asignación: ' + error.message)
    } else {
      fetchData()
    }
  }

  // Función para exportar a PDF (Impresión nativa estilizada)
  const handleExportPDF = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Cargando Cartera de Clientes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center bg-[#121824] p-4 rounded-xl border border-slate-800/60 shadow-lg print:hidden">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Administración de Cartera y Asignaciones</h1>
            <p className="text-xs text-slate-400">Visualización general de ejecutivas y sus clientes corporativos asignados</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportPDF}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition flex items-center space-x-2"
            >
              <span>📄</span>
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#1a2232] hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700/60 transition"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Panel Formulario Asignación (Oculto en PDF) */}
        <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4 print:hidden">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Asignar Cliente a Ejecutiva</h2>
          <form onSubmit={handleAssignClient} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cliente Corporativo</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ejecutiva Encargada</label>
              <select
                value={selectedExec}
                onChange={(e) => setSelectedExec(e.target.value)}
                className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition"
            >
              Guardar Asignación
            </button>
          </form>
        </div>

        {/* ÁREA IMPRIMIBLE / TABLA PRINCIPAL DE ASIGNACIONES */}
        <div ref={printRef} className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4 print:bg-white print:text-black print:border-none print:shadow-none">
          
          {/* Título de Impresión (Solo Visible en PDF) */}
          <div className="hidden print:block mb-4 border-b pb-2">
            <h1 className="text-lg font-bold text-black">SERCOM-TRANSFARMA — REPORTE DE CARTERA Y EJECUTIVAS</h1>
            <p className="text-xs text-gray-600">Fecha de exportación: {new Date().toLocaleDateString('es-CL')}</p>
          </div>

          {/* Barra de Filtros y Totales */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4 print:border-gray-300">
            
            {/* Selector de Filtro por Ejecutiva */}
            <div className="flex items-center space-x-3 w-full sm:w-auto print:hidden">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider whitespace-nowrap">
                Filtrar Ejecutiva:
              </label>
              <select
                value={filterExecId}
                onChange={(e) => setFilterExecId(e.target.value)}
                className="bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="ALL">TODAS LAS EJECUTIVAS ({assignments.length})</option>
                {executives.map((exec) => {
                  const count = assignments.filter(a => a.user_id === exec.id).length
                  return (
                    <option key={exec.id} value={exec.id}>
                      {exec.name} ({count} clientes)
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full print:bg-gray-100 print:text-gray-800 print:border-gray-300">
                Mostrando: {filteredAssignments.length} Clientes Asignados
              </span>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/80 print:divide-gray-300 print:text-black">
              <thead className="bg-[#1a2232] text-slate-400 font-bold uppercase text-[10px] tracking-wider print:bg-gray-100 print:text-black">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Cliente / Mandante</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Ejecutiva Asignada</th>
                  <th className="px-4 py-3">Correo Ejecutiva</th>
                  <th className="px-4 py-3 text-right print:hidden">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500 print:text-gray-500">
                      No se encontraron clientes asignados para este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1a2232]/50 transition print:hover:bg-transparent">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-400 print:text-indigo-700">
                        {formatCode(item.client?.code)}
                      </td>
                      <td className="px-4 py-3 font-bold text-white print:text-black">
                        {item.client?.company_name}
                      </td>
                      <td className="px-4 py-3 text-slate-400 print:text-gray-700">
                        {item.client?.contact_person || 'Sin contacto'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[11px] font-semibold px-2.5 py-1 rounded-full print:bg-emerald-50 print:text-emerald-800 print:border-emerald-300">
                          {item.executive?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px] print:text-gray-700">
                        {item.executive?.email}
                      </td>
                      <td className="px-4 py-3 text-right print:hidden">
                        <button
                          onClick={() => handleUnassign(item.id)}
                          className="text-rose-400 hover:text-rose-300 font-semibold text-[11px] bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 px-2 py-1 rounded transition"
                        >
                          Desvincular
                        </button>
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