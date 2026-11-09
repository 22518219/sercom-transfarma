'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

interface Client {
  id: string
  code: number
  company_name: string
}

interface LogEntry {
  id: string
  created_at: string
  client_id: string
  executive_name: string
  detail: string
  client?: Client
}

interface UsendEntry {
  id: string
  created_at: string
  request_date: string
  request_time: string
  executive_name: string
  email_subject?: string
  file_url?: string
}

export default function LogsPage() {
  const [assignedClients, setAssignedClients] = useState<Client[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [usendRequests, setUsendRequests] = useState<UsendEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserName, setCurrentUserName] = useState('')

  // Parte 1: Estados Registro Cliente
  const [selectedClient, setSelectedClient] = useState('')
  const [clientDetail, setClientDetail] = useState('')

  // Parte 2: Estados Registro Usend
  const [usendDate, setUsendDate] = useState('')
  const [usendTime, setUsendTime] = useState('')
  const [usendSubject, setUsendSubject] = useState('')
  const [emailSubjectUrl, setEmailSubjectUrl] = useState('') // Estado corregido
  const [usendFile, setUsendFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Parte 3: Filtro de Gráfico
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year'>('month')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const now = new Date()
    setUsendDate(now.toISOString().split('T')[0])
    setUsendTime(now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }))

    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .maybeSingle()

    const userName = profile?.name || user.email || 'Ejecutiva'
    setCurrentUserName(userName)

    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, code, company_name')
      .order('code', { ascending: true })

    if (clientsData) setAssignedClients(clientsData as Client[])

    const { data: logsData } = await supabase
      .from('logs')
      .select('*, client:clients(id, code, company_name)')
      .order('created_at', { ascending: false })

    if (logsData) setLogs(logsData as unknown as LogEntry[])

    const { data: usendData } = await supabase
      .from('usend_requests')
      .select('*')
      .order('request_date', { ascending: false })

    if (usendData) setUsendRequests(usendData as UsendEntry[])

    setLoading(false)
  }

  const formatCode = (code?: number) => code ? String(code).padStart(3, '0') : '---'

  // EVENTOS DRAG & DROP
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setUsendFile(droppedFile)
      
      if (!usendSubject) {
        setUsendSubject(droppedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  // GUARDAR GESTIÓN CLIENTE
  const handleSaveClientLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !clientDetail.trim()) {
      alert('Selecciona un cliente e ingresa el detalle de la gestión.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('logs')
      .insert([
        {
          client_id: selectedClient,
          user_id: user?.id,
          executive_name: currentUserName,
          detail: clientDetail.trim()
        }
      ])

    if (error) {
      alert('Error al guardar gestión: ' + error.message)
    } else {
      alert('Gestión de cliente registrada con éxito.')
      setSelectedClient('')
      setClientDetail('')
      fetchInitialData()
    }
  }

  // GUARDAR REGISTRO USEND
  const handleSaveUsendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usendDate || !usendTime) {
      alert('Ingresa fecha y hora de la solicitud.')
      return
    }

    setUploadingFile(true)
    let finalFileUrl = emailSubjectUrl.trim()

    // Si adjuntó un archivo físico (.eml, .pdf, .msg), subimos a Supabase Storage
    if (usendFile) {
      const fileExt = usendFile.name.split('.').pop()
      const fileName = `usend_${Date.now()}.${fileExt}`
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('usend_emails')
        .upload(fileName, usendFile)

      if (!storageError && storageData) {
        const { data: urlData } = supabase.storage.from('usend_emails').getPublicUrl(fileName)
        finalFileUrl = urlData.publicUrl
      }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('usend_requests')
      .insert([
        {
          request_date: usendDate,
          request_time: usendTime,
          user_id: user?.id,
          executive_name: currentUserName,
          email_subject: usendSubject.trim() || 'Solicitud a Usend',
          file_url: finalFileUrl || null
        }
      ])

    setUploadingFile(false)

    if (error) {
      alert('Error al guardar solicitud Usend: ' + error.message)
    } else {
      alert('Solicitud a Usend registrada correctamente.')
      setUsendSubject('')
      setEmailSubjectUrl('')
      setUsendFile(null)
      fetchInitialData()
    }
  }

  // CÁLCULO ESTADÍSTICAS USEND
  const getFilteredUsendCount = () => {
    const now = new Date()
    return usendRequests.filter(req => {
      const reqDate = new Date(req.request_date)
      const diffTime = Math.abs(now.getTime() - reqDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (timeFilter === 'day') return diffDays <= 1
      if (timeFilter === 'week') return diffDays <= 7
      if (timeFilter === 'month') return diffDays <= 30
      if (timeFilter === 'quarter') return diffDays <= 90
      if (timeFilter === 'semester') return diffDays <= 180
      if (timeFilter === 'year') return diffDays <= 365
      return true
    }).length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Cargando Bitácora...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 p-6 font-sans space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-center bg-[#121824] p-4 rounded-xl border border-slate-800/60 shadow-lg">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Bitácora de Gestiones y Control Usend</h1>
            <p className="text-xs text-slate-400">Registro diario de interacciones corporativas y solicitudes a Usend</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#1a2232] hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700/60 transition"
          >
            ← Volver al Dashboard
          </button>
        </div>

        {/* PARTE 1 Y PARTE 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PARTE 1: REGISTRO DE GESTIONES POR CLIENTE */}
          <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
              <span>1️⃣</span>
              <span>Registro de Gestión por Ejecutiva</span>
            </h2>

            <form onSubmit={handleSaveClientLog} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Seleccionar Cliente / Mandante *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {assignedClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{formatCode(c.code)}] {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Breve Detalle de la Gestión *</label>
                <textarea
                  rows={4}
                  placeholder="Escribe un resumen conciso de lo gestionado con el cliente..."
                  value={clientDetail}
                  onChange={(e) => setClientDetail(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition"
              >
                + Registrar Gestión de Cliente
              </button>
            </form>
          </div>

          {/* PARTE 2: REGISTRO DE SOLICITUDES A USEND */}
          <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <span>2️⃣</span>
              <span>Registro de Solicitudes a USEND</span>
            </h2>

            <form onSubmit={handleSaveUsendRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={usendDate}
                    onChange={(e) => setUsendDate(e.target.value)}
                    className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hora *</label>
                  <input
                    type="time"
                    value={usendTime}
                    onChange={(e) => setUsendTime(e.target.value)}
                    className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Asunto / Referencia del Correo *</label>
                <input
                  type="text"
                  placeholder="Ej: Solicitud de retiro urgente pedido #4589"
                  value={usendSubject}
                  onChange={(e) => setUsendSubject(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Enlace directo de Gmail (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://mail.google.com/mail/u/0/#search/..."
                  value={emailSubjectUrl}
                  onChange={(e) => setEmailSubjectUrl(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* ZONA DE ARRASTRAR Y SOLTAR / ADJUNTAR ARCHIVO */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  O Adjuntar Archivo (.eml descargado, .pdf, .msg)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : usendFile
                      ? 'border-emerald-500/80 bg-[#1a2232]'
                      : 'border-slate-700/80 hover:border-slate-600 bg-[#121824]'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUsendFile(e.target.files[0])
                        if (!usendSubject) setUsendSubject(e.target.files[0].name.replace(/\.[^/.]+$/, ""))
                      }
                    }}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer space-y-1 block">
                    {usendFile ? (
                      <div className="space-y-1">
                        <span className="text-lg">📧</span>
                        <p className="text-xs font-bold text-emerald-400 truncate">{usendFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(usendFile.size / 1024).toFixed(1)} KB - Listo para subir</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-lg">📥</span>
                        <p className="text-xs font-medium text-slate-300">
                          Haz clic para adjuntar archivo descargado (.eml / .pdf)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingFile}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                {uploadingFile ? 'Subiendo Registro...' : '+ Registrar Solicitud Usend'}
              </button>
            </form>
          </div>

        </div>

        {/* PARTE 3: GRÁFICA ESTADÍSTICA Y DASHBOARD DE GESTIONES USEND */}
        <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4">
            <div>
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <span>3️⃣</span>
                <span>Gráfica Estadísticas Usend</span>
              </h2>
              <p className="text-[11px] text-slate-400">Consolidado de solicitudes enviadas a Usend por periodo de tiempo</p>
            </div>

            <div className="flex items-center space-x-1 bg-[#1a2232] p-1 rounded-lg border border-slate-700/60">
              {(['day', 'week', 'month', 'quarter', 'semester', 'year'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md capitalize transition ${
                    timeFilter === t
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'day' ? 'Día' : t === 'week' ? 'Semana' : t === 'month' ? 'Mes' : t === 'quarter' ? 'Trimestre' : t === 'semester' ? 'Semestre' : 'Año'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="bg-[#121824] p-6 rounded-xl border border-slate-800/60 text-center">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                Total Solicitudes ({timeFilter.toUpperCase()})
              </span>
              <span className="text-5xl font-extrabold text-white">
                {getFilteredUsendCount()}
              </span>
              <p className="text-[11px] text-slate-400 mt-2">Registros acumulados en el periodo seleccionado</p>
            </div>

            <div className="md:col-span-2 bg-[#121824] p-6 rounded-xl border border-slate-800/60 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Volumen de Actividad Usend</span>
                <span className="font-mono text-amber-400">{usendRequests.length} Solicitudes Históricas Totales</span>
              </div>

              <div className="w-full bg-slate-800 h-6 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-black"
                  style={{ width: `${Math.min(100, (getFilteredUsendCount() / (usendRequests.length || 1)) * 100)}%` }}
                >
                  {Math.round((getFilteredUsendCount() / (usendRequests.length || 1)) * 100)}%
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-semibold text-slate-400">
                <div>Día</div>
                <div>Semana</div>
                <div>Mes</div>
                <div>Trimestre</div>
                <div>Semestre</div>
                <div>Año</div>
              </div>
            </div>
          </div>

          {/* TABLA DE HISTORIAL CON LINK DIRECTO AL CORREO */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Historial de Solicitudes Registradas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/80">
                <thead className="bg-[#1a2232] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Fecha</th>
                    <th className="px-4 py-2.5">Hora</th>
                    <th className="px-4 py-2.5">Ejecutiva</th>
                    <th className="px-4 py-2.5">Asunto / Referencia</th>
                    <th className="px-4 py-2.5 text-right">Correo / Enlace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usendRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-slate-500">
                        No hay solicitudes registradas a Usend.
                      </td>
                    </tr>
                  ) : (
                    usendRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#1a2232]/50 transition">
                        <td className="px-4 py-2.5 font-mono text-amber-400">{req.request_date}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-400">{req.request_time}</td>
                        <td className="px-4 py-2.5 font-bold text-white">{req.executive_name}</td>
                        <td className="px-4 py-2.5 text-slate-300">{req.email_subject || 'Sin asunto'}</td>
                        <td className="px-4 py-2.5 text-right">
                          {req.file_url ? (
                            <a
                              href={req.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded text-[11px] font-bold transition"
                            >
                              <span>📧</span>
                              <span>Ver / Abrir Correo</span>
                            </a>
                          ) : (
                            <span className="text-slate-600 text-[10px]">Sin enlace</span>
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
    </div>
  )
}