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

  // Submódulos / Pestañas principales
  const [activeTab, setActiveTab] = useState<'bitacora' | 'dashboard_gestiones'>('bitacora')

  // Parte 1: Estados Registro Cliente y Filtro
  const [selectedClient, setSelectedClient] = useState('')
  const [clientDetail, setClientDetail] = useState('')
  const [filterClient, setFilterClient] = useState('ALL')

  // Parte 2: Estados Registro Usend
  const [usendDate, setUsendDate] = useState('')
  const [usendTime, setUsendTime] = useState('')
  const [usendSubject, setUsendSubject] = useState('')
  const [emailSubjectUrl, setEmailSubjectUrl] = useState('')
  const [usendFile, setUsendFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [parsingEmail, setParsingEmail] = useState(false)

  // Parte 3: Filtro de Gráfico Usend
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

  // FUNCIÓN PARA EXTRAER ASUNTO, FECHA Y HORA DESDE EL ARCHIVO DE CORREO
  const extractEmailMetadata = (file: File) => {
    setParsingEmail(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      if (!content) {
        setParsingEmail(false)
        return
      }

      // 1. Extraer Asunto (Subject)
      const subjectMatch = content.match(/^Subject:\s*(.*)$/im)
      if (subjectMatch && subjectMatch[1]) {
        let extractedSubject = subjectMatch[1].trim()
        // Decodificar si el asunto viene codificado en UTF-8/MIME
        if (extractedSubject.includes('=?utf-8?')) {
          extractedSubject = extractedSubject.replace(/=\?utf-8\?[QB]\?(.*?)\?=/gi, '$1')
        }
        setUsendSubject(extractedSubject)
      } else {
        // Fallback al nombre del archivo si no encuentra cabecera de Subject
        setUsendSubject(file.name.replace(/\.[^/.]+$/, ""))
      }

      // 2. Extraer Fecha y Hora (Date)
      const dateMatch = content.match(/^Date:\s*(.*)$/im)
      if (dateMatch && dateMatch[1]) {
        const parsedDate = new Date(dateMatch[1].trim())
        if (!isNaN(parsedDate.getTime())) {
          const formattedDate = parsedDate.toISOString().split('T')[0]
          const formattedTime = parsedDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
          setUsendDate(formattedDate)
          setUsendTime(formattedTime)
        }
      }

      setParsingEmail(false)
    }

    reader.onerror = () => setParsingEmail(false)

    // Leer los primeros KB del archivo (suficiente para escanear los headers de correo)
    const blobHeader = file.slice(0, 100000)
    reader.readAsText(blobHeader)
  }

  // DESCARGA DE EXCEL MODERNO MULTI-PESTAÑA (.XLS)
  const handleExportExcel = () => {
    const filteredLogs = filterClient === 'ALL'
      ? logs
      : logs.filter(l => l.client_id === filterClient)

    if (filteredLogs.length === 0 && usendRequests.length === 0) {
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
   <Interior/>
   <NumberFormat/>
   <Protection/>
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
  <Style ss:ID="TableCellLink">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#059669" ss:Bold="1" ss:Underline="Single"/>
  </Style>
 </Styles>

 <!-- PESTAÑA 1: GESTIONES POR EJECUTIVA -->
 <Worksheet ss:Name="Gestiones por Ejecutiva">
  <Table ss:ExpandedColumnCount="5">
   <Column ss:Width="120"/>
   <Column ss:Width="90"/>
   <Column ss:Width="200"/>
   <Column ss:Width="160"/>
   <Column ss:Width="380"/>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="4" ss:StyleID="HeaderTitle"><Data ss:Type="String">SERCOM-TRANSFARMA - REGISTRO DE GESTIONES POR EJECUTIVA</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="4" ss:StyleID="SubTitle"><Data ss:Type="String">Fecha de exportación: ${currentDate} | Total registros: ${filteredLogs.length}</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Fecha y Hora</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Cód. Cliente</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Cliente / Mandante</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Ejecutiva</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Detalle de la Gestión</Data></Cell>
   </Row>
   ${filteredLogs.map(l => `
   <Row ss:Height="20">
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${new Date(l.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</Data></Cell>
    <Cell ss:StyleID="TableCellCode"><Data ss:Type="String">${formatCode(l.client?.code)}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(l.client?.company_name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(l.executive_name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${(l.detail || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
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
    <Cell ss:StyleID="${r.file_url ? 'TableCellLink' : 'TableCell'}"><Data ss:Type="String">${(r.file_url || 'Sin enlace').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
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
      extractEmailMetadata(droppedFile)
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

  // CÁLCULOS ESTADÍSTICOS USEND
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

  // CÁLCULOS ESTADÍSTICOS DASHBOARD DE GESTIONES
  const getLogsByExecutive = () => {
    const map: Record<string, number> = {}
    logs.forEach(l => {
      const exec = l.executive_name || 'Sin Asignar'
      map[exec] = (map[exec] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }

  const getUsendByExecutive = () => {
    const map: Record<string, number> = {}
    usendRequests.forEach(r => {
      const exec = r.executive_name || 'Sin Asignar'
      map[exec] = (map[exec] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }

  const getLogsByClient = () => {
    const map: Record<string, number> = {}
    logs.forEach(l => {
      const clientName = l.client?.company_name ? `[${formatCode(l.client.code)}] ${l.client.company_name}` : 'Cliente Desconocido'
      map[clientName] = (map[clientName] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }

  const filteredLogsList = filterClient === 'ALL'
    ? logs
    : logs.filter(l => l.client_id === filterClient)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Cargando Bitácora...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 p-6 font-sans space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ENCABEZADO Y SELECTOR DE SUBMÓDULOS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121824] p-4 rounded-xl border border-slate-800/60 shadow-lg">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Bitácora de Gestiones y Control Usend</h1>
            <p className="text-xs text-slate-400">Plataforma centralizada de registro, seguimiento y métricas ejecutivas</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-[#1a2232] p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setActiveTab('bitacora')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                  activeTab === 'bitacora'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 Registros & Bitácora
              </button>
              <button
                onClick={() => setActiveTab('dashboard_gestiones')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                  activeTab === 'dashboard_gestiones'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 Dashboard Gestiones & Usend
              </button>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#1a2232] hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700/60 transition"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* SUBMÓDULO 1: REGISTROS Y BITÁCORA */}
        {activeTab === 'bitacora' && (
          <div className="space-y-8">
            
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

              {/* PARTE 2: REGISTRO DE SOLICITUDES A USEND CON EXTRACCIÓN AUTO */}
              <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                    <span>2️⃣</span>
                    <span>Registro de Solicitudes a USEND</span>
                  </h2>
                  {parsingEmail && (
                    <span className="text-[10px] text-amber-400 animate-pulse font-semibold">
                      ⚡ Obteniendo datos del correo...
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveUsendRequest} className="space-y-4">
                  {/* ZONA DE ARRASTRAR Y SOLTAR CON AUTO-COMPLETADO */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Adjuntar o Arrastrar Correo (.eml descargado, .msg, .pdf)
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
                            const file = e.target.files[0]
                            setUsendFile(file)
                            extractEmailMetadata(file)
                          }
                        }}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer space-y-1 block">
                        {usendFile ? (
                          <div className="space-y-1">
                            <span className="text-lg">📧</span>
                            <p className="text-xs font-bold text-emerald-400 truncate">{usendFile.name}</p>
                            <p className="text-[10px] text-slate-400">{(usendFile.size / 1024).toFixed(1)} KB - Datos extraídos automáticamente</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-lg">📥</span>
                            <p className="text-xs font-medium text-slate-300">
                              Arrastra el correo (.eml) para autocompletar Asunto, Fecha y Hora
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

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

            {/* TABLA HISTORIAL DE GESTIONES CON BOTÓN DE DESCARGA EXCEL MULTI-PESTAÑA */}
            <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Historial de Gestiones Registradas</h2>
                  <p className="text-[11px] text-slate-400">Consultar o exportar gestiones por cliente</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                    className="bg-[#1a2232] border border-slate-700/60 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">TODOS LOS CLIENTES ({logs.length})</option>
                    {assignedClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{formatCode(c.code)}] {c.company_name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportExcel}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-600/60 shadow flex items-center space-x-1.5 transition"
                  >
                    <span>📊</span>
                    <span>Exportar Excel Completo (2 Pestañas)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800/80">
                  <thead className="bg-[#1a2232] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Fecha y Hora</th>
                      <th className="px-4 py-3">Cliente / Mandante</th>
                      <th className="px-4 py-3">Ejecutiva</th>
                      <th className="px-4 py-3">Detalle de la Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLogsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-500">
                          No hay gestiones registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredLogsList.map((log) => (
                        <tr key={log.id} className="hover:bg-[#1a2232]/50 transition">
                          <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                            {new Date(log.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            [{formatCode(log.client?.code)}] {log.client?.company_name}
                          </td>
                          <td className="px-4 py-3 text-slate-300 font-semibold">
                            {log.executive_name}
                          </td>
                          <td className="px-4 py-3 text-slate-300 max-w-md">
                            {log.detail}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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

              {/* TABLA USEND */}
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
        )}

        {/* SUBMÓDULO 2: DASHBOARD DE GESTIONES Y USEND INTEGRADO */}
        {activeTab === 'dashboard_gestiones' && (
          <div className="space-y-6">
            
            {/* KPI GENERALES DE AMBAS GESTIONES */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg text-center space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Gestiones de Clientes</span>
                <p className="text-4xl font-extrabold text-white">{logs.length}</p>
                <p className="text-[11px] text-slate-400">Registros directos con mandantes</p>
              </div>

              <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg text-center space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Solicitudes a Usend</span>
                <p className="text-4xl font-extrabold text-white">{usendRequests.length}</p>
                <p className="text-[11px] text-slate-400">Solicitudes enviadas a Usend</p>
              </div>

              <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg text-center space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Clientes Atendidos</span>
                <p className="text-4xl font-extrabold text-white">{getLogsByClient().length}</p>
                <p className="text-[11px] text-slate-400">Clientes únicos en la cartera</p>
              </div>

              <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg text-center space-y-1">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Ejecutivas Activas</span>
                <p className="text-4xl font-extrabold text-white">
                  {Array.from(new Set([...logs.map(l => l.executive_name), ...usendRequests.map(r => r.executive_name)])).filter(Boolean).length}
                </p>
                <p className="text-[11px] text-slate-400">Ejecutivas operando ambas áreas</p>
              </div>
            </div>

            {/* GRÁFICAS DE DISTRIBUCIÓN POR EJECUTIVA (CLIENTES Y USEND) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* DISTRIBUCIÓN GESTIONES CLIENTES POR EJECUTIVA */}
              <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
                <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  📋 Gestiones de Clientes por Ejecutiva
                </h2>
                <div className="space-y-3">
                  {getLogsByExecutive().length === 0 ? (
                    <p className="text-slate-500 text-xs">Sin gestiones para contabilizar.</p>
                  ) : (
                    getLogsByExecutive().map((exec) => {
                      const percentage = Math.round((exec.count / (logs.length || 1)) * 100)
                      return (
                        <div key={exec.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-200">{exec.name}</span>
                            <span className="text-indigo-400 font-bold">{exec.count} gestiones ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* DISTRIBUCIÓN SOLICITUDES USEND POR EJECUTIVA */}
              <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  📧 Solicitudes Usend por Ejecutiva
                </h2>
                <div className="space-y-3">
                  {getUsendByExecutive().length === 0 ? (
                    <p className="text-slate-500 text-xs">Sin solicitudes registradas.</p>
                  ) : (
                    getUsendByExecutive().map((exec) => {
                      const percentage = Math.round((exec.count / (usendRequests.length || 1)) * 100)
                      return (
                        <div key={exec.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-200">{exec.name}</span>
                            <span className="text-emerald-400 font-bold">{exec.count} solicitudes ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>

            {/* TOP 5 CLIENTES MÁS GESTIONADOS */}
            <div className="bg-[#141923] p-5 rounded-xl border border-slate-800/80 shadow-lg space-y-4">
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                🏆 Top 5 Clientes con Mayor Interacción en Gestiones
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getLogsByClient().length === 0 ? (
                  <p className="text-slate-500 text-xs col-span-2">Sin registros de clientes.</p>
                ) : (
                  getLogsByClient().map(([clientName, count]) => {
                    const percentage = Math.round((count / (logs.length || 1)) * 100)
                    return (
                      <div key={clientName} className="space-y-1 bg-[#121824] p-3 rounded-lg border border-slate-800/60">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-200 truncate">{clientName}</span>
                          <span className="text-amber-400 font-bold">{count} gestiones ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}