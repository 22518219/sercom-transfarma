import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase con Service Role para saltar RLS en escrituras de Webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    // Adaptar según el proveedor de Webhook (ej. SendGrid, Mailgun, etc.)
    const sender = payload.from || payload.sender
    const recipient = payload.to || payload.recipient
    const subject = payload.subject || 'Sin Asunto'
    const bodyText = payload.text || payload['body-plain'] || ''
    const messageId = payload.messageId || payload['Message-Id'] || `msg_${Date.now()}`

    // 1. Buscar si el remitente coincide con un cliente registrado
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', sender)
      .maybeSingle()

    let executiveId = null

    // 2. Si se encuentra al cliente, obtener la ejecutiva asignada
    if (client) {
      const { data: userClient } = await supabaseAdmin
        .from('user_clients')
        .select('user_id')
        .eq('client_id', client.id)
        .maybeSingle()

      if (userClient) {
        executiveId = userClient.user_id
      }
    }

    // 3. Registrar el correo entrante en la base de datos
    const { data: newEmail, error } = await supabaseAdmin
      .from('emails')
      .insert([
        {
          message_id: messageId,
          client_id: client?.id || null,
          executive_id: executiveId,
          sender_email: sender,
          recipient_email: recipient,
          subject: subject,
          body_text: bodyText,
          status: 'unread',
          received_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error guardando el email:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: newEmail.id })
  } catch (err: any) {
    console.error('Inbound Error:', err)
    return NextResponse.json({ error: 'Error procesando el correo' }, { status: 500 })
  }
}