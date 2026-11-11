import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase con service_role para omitir RLS en el webhook backend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, recipient, subject, text, html } = body;

    if (!sender) {
      return NextResponse.json(
        { error: 'El campo sender (remitente) es requerido.' },
        { status: 400 }
      );
    }

    const cleanSender = sender.trim().toLowerCase();

    // 1. Buscar el client_id correspondiente al remitente en la tabla `clients`
    // 1. Buscar cliente con ILIKE para coincidencia parcial
const { data: clientData } = await supabaseAdmin
  .from('clients')
  .select('id')
  .ilike('email', `%${cleanSender}%`)
  .maybeSingle();

let clientId = clientData?.id || null;
let executiveId: string | null = null;

// 2. Buscar ejecutiva si se encontró cliente
if (clientId) {
  const { data: relationData } = await supabaseAdmin
    .from('user_clients')
    .select('user_id')
    .eq('client_id', clientId)
    .maybeSingle();

  if (relationData) {
    executiveId = relationData.user_id;
  }
}

// 3. Insertar el correo
const { data: emailRecord, error: emailError } = await supabaseAdmin
  .from('emails')
  .insert({
    sender_email: cleanSender,
    recipient_email: recipient ? recipient.trim().toLowerCase() : null,
    subject: subject || '(Sin asunto)',
    body: text || html || '',
    executive_id: executiveId, // Si es nulo o inválido, asegura que en la tabla no obligue a tener FK estricta sin NULL
  })
  .select('id')
  .single();

    if (emailError) {
      console.error('Error insertando correo en tabla emails:', emailError);
      return NextResponse.json(
        { error: 'Error al registrar el correo.' },
        { status: 500 }
      );
    }

    // 4. NUEVO: Registrar la gestión automáticamente en la tabla `gestiones`
    if (executiveId && clientId) {
      const { error: gestionError } = await supabaseAdmin
        .from('gestiones') // Si tu tabla se llama distinto (ej: management_logs), actualiza este nombre
        .insert({
          user_id: executiveId,
          client_id: clientId,
          type: 'CORREO_RECIBIDO',
          channel: 'EMAIL',
          detail: `[Correo Entrante] ${subject || 'Sin asunto'}\n\n${text || ''}`.trim(),
          source_email_id: emailRecord.id,
          created_at: new Date().toISOString(),
        });

      if (gestionError) {
        console.error('Error al registrar la gestión automática:', gestionError);
        // No bloqueamos la respuesta ya que el correo y la notificación en tiempo real igual se guardaron
      }
    }

    // 5. Retornar éxito
    return NextResponse.json({
      success: true,
      emailId: emailRecord.id,
      executiveId: executiveId,
      gestionCreated: Boolean(executiveId && clientId),
    });

  } catch (error: any) {
    console.error('Error crítico en /api/emails/inbound:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}