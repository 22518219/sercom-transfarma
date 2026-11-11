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
  file_url?: string
  gmail_url?: string
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
  gmail_url?: string
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
  const [clientGmailUrl, setClientGmailUrl] = useState('')
  const [clientFile, setClientFile] = useState<File | null>(null)
  const [isDraggingClient, setIsDraggingClient] = useState(false)
  const [uploadingClientFile, setUploadingClientFile] = useState(false)

  // Parte 2: Estados Registro Usend
  const [usendDate, setUsendDate] = useState('')
  const [usendTime, setUsendTime] = useState('')
  const [usendSubject, setUsendSubject] = useState('')
  const [usendGmailUrl, setUsendGmailUrl] = useState('')
  const [usendFile, setUsendFile] = useState<File | null>(null)
  const [isDraggingUsend, setIsDraggingUsend] = useState(false)
  const [uploadingUsendFile, setUploadingUsendFile] = useState(false)

  // Parte 3: Filtro de Gráfico
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year'>('month')

  const router = useRouter()
  const supabase = createClient()

  // Función formateadora a estilo YYYY-MM-DD HH:mm:ss
  const formatDateTimeISO = (isoString: string) => {
    if (!isoString) return '---'
    const d = new Date(isoString)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

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

  // FUNCIÓN DESCARGA EXCEL MULTI-PESTAÑA (.XLS)
  const handleExportExcel = () => {
    if (logs.length === 0 && usendRequests.length === 0) {
      alert('No hay datos disponibles para exportar.')
      return
    }

    const currentDate = new Date().toLocaleDateString('es-CL')

    const excelXML = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Sercom-Transfarma</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Color="#334155"/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Color="#0F172A" ss:Bold="1"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TableCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#334155"/>
  </Style>
  <Style ss:ID="TableCellCode">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Courier New" ss:Size="10" ss:Color="#2563EB" ss:Bold="1"/>
  </Style>
 </Styles>

 <!-- PESTAÑA 1: GESTIONES POR EJECUTIVA -->
 <Worksheet ss:Name="Gestiones por Ejecutiva">
  <Table ss:ExpandedColumnCount="6">
   <Column ss:Width="140"/>
   <Column ss:Width="90"/>
   <Column ss:Width="200"/>
   <Column ss:Width="160"/>
   <Column ss:Width="350"/>
   <Column ss:Width="250"/>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="5" ss:StyleID="HeaderTitle"><Data ss:Type="String">SERCOM-TRANSFARMA - REGISTRO DE GESTIONES POR EJECUTIVA</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="5" ss:StyleID="SubTitle"><Data ss:Type="String">Fecha de exportación: ${currentDate} | Total registros: ${logs.length}</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Fecha y Hora</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Cód. Cliente</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Cliente / Mandante</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Ejecutiva</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Detalle de la Gestión</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Enlace / Adjunto</Data></Cell>
   </Row>
   ${logs.map(l => `
   <Row ss:Height="20">
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${formatDateTimeISO(l.created_at)}</Data></Cell>
    <Cell ss:StyleID="TableCellCode"><Data ss:Type="String">${formatCode(l.client?.code)}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(l.client?.company_name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(l.executive_name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(l.detail || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(l.file_url || l.gmail_url || 'Sin adjunto').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>

 <!-- PESTAÑA 2: SOLICITUDES A USEND -->
 <Worksheet ss:Name="Solicitudes a Usend">
  <Table ss:ExpandedColumnCount="5">
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="160"/>
   <Column ss:Width="300"/>
   <Column ss:Width="250"/>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="4" ss:StyleID="HeaderTitle"><Data ss:Type="String">SERCOM-TRANSFARMA - REGISTRO DE SOLICITUDES A USEND</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="4" ss:StyleID="SubTitle"><Data ss:Type="String">Fecha de exportación: ${currentDate} | Total solicitudes: ${usendRequests.length}</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Fecha</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Hora</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Ejecutiva</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Asunto / Referencia</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Enlace / Adjunto</Data></Cell>
   </Row>
   ${usendRequests.map(r => `
   <Row ss:Height="20">
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${r.request_date}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${r.request_time}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(r.executive_name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(r.email_subject || 'Sin asunto').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(r.file_url || r.gmail_url || 'Sin enlace').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`

    const blob = new Blob([excelXML], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Bitacora_Completa_Sercom_${new Date().toISOString().split('T')[0]}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // EVENTOS DRAG & DROP CLIENTE
  const handleClientDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingClient(true)
  }
  const handleClientDragLeave = () => setIsDraggingClient(false)
  const handleClientDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingClient(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setClientFile(e.dataTransfer.files[0])
    }
  }

  // EVENTOS DRAG & DROP USEND
  const handleUsendDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingUsend(true)
  }
  const handleUsendDragLeave = () => setIsDraggingUsend(false)
  const handleUsendDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingUsend(false)
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

    setUploadingClientFile(true)
    let fileUrl = ''

    if (clientFile) {
      const fileExt = clientFile.name.split('.').pop()
      const fileName = `client_log_${Date.now()}.${fileExt}`
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('usend_emails')
        .upload(fileName, clientFile)

      if (!storageError && storageData) {
        const { data: urlData } = supabase.storage.from('usend_emails').getPublicUrl(fileName)
        fileUrl = urlData.publicUrl
      }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('logs')
      .insert([
        {
          client_id: selectedClient,
          user_id: user?.id,
          executive_name: currentUserName,
          channel: 'General',
          detail: clientDetail.trim(),
          summary: clientDetail.trim(),
          gmail_url: clientGmailUrl.trim() || null,
          file_url: fileUrl || null
        }
      ])

    setUploadingClientFile(false)

    if (error) {
      alert('Error al guardar gestión: ' + error.message)
    } else {
      alert('Gestión de cliente registrada con éxito.')
      setSelectedClient('')
      setClientDetail('')
      setClientGmailUrl('')
      setClientFile(null)
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

    setUploadingUsendFile(true)
    let fileUrl = ''

    if (usendFile) {
      const fileExt = usendFile.name.split('.').pop()
      const fileName = `usend_${Date.now()}.${fileExt}`
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('usend_emails')
        .upload(fileName, usendFile)

      if (!storageError && storageData) {
        const { data: urlData } = supabase.storage.from('usend_emails').getPublicUrl(fileName)
        fileUrl = urlData.publicUrl
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
          gmail_url: usendGmailUrl.trim() || null,
          file_url: fileUrl || null
        }
      ])

    setUploadingUsendFile(false)

    if (error) {
      alert('Error al guardar solicitud Usend: ' + error.message)
    } else {
      alert('Solicitud a Usend registrada correctamente.')
      setUsendSubject('')
      setUsendGmailUrl('')
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
        
        {/* ENCABEZADO CON BOTÓN DE EXCEL Y VOLVER */}
        <div className="flex justify-between items-center bg-[#121824] p-4 rounded-xl border border-slate-800/60 shadow-lg">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Bitácora de Gestiones y Control Usend</h1>
            <p className="text-xs text-slate-400">Registro diario de interacciones corporativas y solicitudes a Usend</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* BOTÓN DE DESCARGA EXCEL MULTI-PESTAÑA */}
            <button
              onClick={handleExportExcel}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg border border-emerald-600/60 shadow flex items-center space-x-1.5 transition"
            >
              <span>📊</span>
              <span>Descargar Reporte Excel (.xls)</span>
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#1a2232] hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700/60 transition"
            >
              ← Volver al Dashboard
            </button>
          </div>
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
                  rows={3}
                  placeholder="Escribe un resumen conciso de lo gestionado con el cliente..."
                  value={clientDetail}
                  onChange={(e) => setClientDetail(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              {/* ENLACE DIRECTO DE GMAIL */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Enlace Directo de Gmail (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://mail.google.com/mail/u/0/#search/..."
                  value={clientGmailUrl}
                  onChange={(e) => setClientGmailUrl(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* ARRASTRAR Y SOLTAR ARCHIVO */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Adjuntar o Arrastrar Correo / PDF (.eml, .msg, .pdf)
                </label>
                <div
                  onDragOver={handleClientDragOver}
                  onDragLeave={handleClientDragLeave}
                  onDrop={handleClientDrop}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition ${
                    isDraggingClient
                      ? 'border-indigo-400 bg-indigo-950/20'
                      : clientFile
                      ? 'border-indigo-500/80 bg-[#1a2232]'
                      : 'border-slate-700/80 hover:border-slate-600 bg-[#121824]'
                  }`}
                >
                  <input
                    type="file"
                    id="client-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setClientFile(e.target.files[0])
                    }}
                  />
                  <label htmlFor="client-file-upload" className="cursor-pointer space-y-1 block">
                    {clientFile ? (
                      <div className="space-y-1">
                        <span className="text-xl">📧</span>
                        <p className="text-xs font-bold text-indigo-400 truncate">{clientFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(clientFile.size / 1024).toFixed(1)} KB - Listo para adjuntar</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-xl">📥</span>
                        <p className="text-xs font-medium text-slate-300">Arrastra tu correo (.eml) o PDF aquí</p>
                        <p className="text-[10px] text-slate-500">o haz clic para explorar tu equipo</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingClientFile}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                {uploadingClientFile ? 'Subiendo Archivo...' : '+ Registrar Gestión de Cliente'}
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

              {/* ENLACE DIRECTO DE GMAIL */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Enlace Directo de Gmail (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://mail.google.com/mail/u/0/#search/..."
                  value={usendGmailUrl}
                  onChange={(e) => setUsendGmailUrl(e.target.value)}
                  className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* ARRASTRAR Y SOLTAR USEND */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Arrastrar Correo / Comprobante (.eml, .msg, .pdf)
                </label>
                <div
                  onDragOver={handleUsendDragOver}
                  onDragLeave={handleUsendDragLeave}
                  onDrop={handleUsendDrop}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition ${
                    isDraggingUsend
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : usendFile
                      ? 'border-emerald-500/80 bg-[#1a2232]'
                      : 'border-slate-700/80 hover:border-slate-600 bg-[#121824]'
                  }`}
                >
                  <input
                    type="file"
                    id="usend-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUsendFile(e.target.files[0])
                        if (!usendSubject) setUsendSubject(e.target.files[0].name.replace(/\.[^/.]+$/, ""))
                      }
                    }}
                  />
                  <label htmlFor="usend-file-upload" className="cursor-pointer space-y-1 block">
                    {usendFile ? (
                      <div className="space-y-1">
                        <span className="text-xl">📧</span>
                        <p className="text-xs font-bold text-emerald-400 truncate">{usendFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(usendFile.size / 1024).toFixed(1)} KB - Listo para subir</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-xl">📥</span>
                        <p className="text-xs font-medium text-slate-300">Arrastra tu correo desde Outlook/Gmail aquí</p>
                        <p className="text-[10px] text-slate-500">o haz clic para explorar tu equipo</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingUsendFile}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                {uploadingUsendFile ? 'Subiendo Archivo...' : '+ Registrar Solicitud Usend'}
              </button>
            </form>
          </div>

        </div>

        {/* PARTE 3: DASHBOARD ESTADÍSTICO Y REGISTROS */}
        <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4">
            <div>
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <span>3️⃣</span>
                <span>Gráfica Estadísticas y Métricas</span>
              </h2>
              <p className="text-[11px] text-slate-400">Consolidado de actividad y solicitudes registradas</p>
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
                Solicitudes Usend ({timeFilter.toUpperCase()})
              </span>
              <span className="text-5xl font-extrabold text-white">
                {getFilteredUsendCount()}
              </span>
              <p className="text-[11px] text-slate-400 mt-2">Registros en el periodo seleccionado</p>
            </div>

            <div className="md:col-span-2 bg-[#121824] p-6 rounded-xl border border-slate-800/60 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Resumen General de Actividad</span>
                <span className="font-mono text-amber-400">{logs.length} Gestiones / {usendRequests.length} Usend</span>
              </div>

              <div className="w-full bg-slate-800 h-6 rounded-full overflow-hidden flex">
                <div
                  className="bg-indigo-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${(logs.length / Math.max(1, logs.length + usendRequests.length)) * 100}%` }}
                >
                  Gestiones ({logs.length})
                </div>
                <div
                  className="bg-emerald-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${(usendRequests.length / Math.max(1, logs.length + usendRequests.length)) * 100}%` }}
                >
                  Usend ({usendRequests.length})
                </div>
              </div>
            </div>
          </div>

          {/* TABLA 1: HISTORIAL DE GESTIONES POR CLIENTE */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Historial de Gestiones por Cliente</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/80">
                <thead className="bg-[#1a2232] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Fecha</th>
                    <th className="px-4 py-2.5">Cliente</th>
                    <th className="px-4 py-2.5">Ejecutiva</th>
                    <th className="px-4 py-2.5">Detalle</th>
                    <th className="px-4 py-2.5 text-right">Adjunto / Gmail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-slate-500">
                        No hay gestiones registradas.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#1a2232]/50 transition">
                        <td className="px-4 py-2.5 font-mono text-emerald-400 whitespace-nowrap">
                          {formatDateTimeISO(log.created_at)}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-indigo-400">
                          [{formatCode(log.client?.code)}] {log.client?.company_name || 'Cliente'}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-white">{log.executive_name}</td>
                        <td className="px-4 py-2.5 text-slate-300">{log.detail}</td>
                        <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                          {log.file_url && (
                            <a
                              href={log.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-800/50 px-2 py-0.5 rounded text-[10px] font-bold transition"
                            >
                              <span>📎</span>
                              <span>Archivo</span>
                            </a>
                          )}
                          {log.gmail_url && (
                            <a
                              href={log.gmail_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-red-400 hover:text-red-300 bg-red-950/40 border border-red-800/50 px-2 py-0.5 rounded text-[10px] font-bold transition"
                            >
                              <span>✉️</span>
                              <span>Gmail</span>
                            </a>
                          )}
                          {!log.file_url && !log.gmail_url && (
                            <span className="text-slate-600 text-[10px]">Sin adjunto</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: HISTORIAL DE SOLICITUDES USEND */}
          <div className="space-y-3 pt-4 border-t border-slate-800/60">
            <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Historial de Solicitudes a Usend</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/80">
                <thead className="bg-[#1a2232] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Fecha / Hora</th>
                    <th className="px-4 py-2.5">Ejecutiva</th>
                    <th className="px-4 py-2.5">Asunto / Referencia</th>
                    <th className="px-4 py-2.5 text-right">Adjunto / Gmail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usendRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-slate-500">
                        No hay solicitudes registradas a Usend.
                      </td>
                    </tr>
                  ) : (
                    usendRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#1a2232]/50 transition">
                        <td className="px-4 py-2.5 font-mono text-emerald-400 whitespace-nowrap">
                          {req.request_date} {req.request_time}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-white">{req.executive_name}</td>
                        <td className="px-4 py-2.5 text-slate-300">{req.email_subject || 'Sin asunto'}</td>
                        <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                          {req.file_url && (
                            <a
                              href={req.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded text-[10px] font-bold transition"
                            >
                              <span>📎</span>
                              <span>Archivo</span>
                            </a>
                          )}
                          {req.gmail_url && (
                            <a
                              href={req.gmail_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-red-400 hover:text-red-300 bg-red-950/40 border border-red-800/50 px-2 py-0.5 rounded text-[10px] font-bold transition"
                            >
                              <span>✉️</span>
                              <span>Gmail</span>
                            </a>
                          )}
                          {!req.file_url && !req.gmail_url && (
                            <span className="text-slate-600 text-[10px]">Sin adjunto</span>
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