import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        { error: 'El campo sender es requerido.' },
        { status: 400 }
      );
    }

    const cleanSender = sender.trim().toLowerCase();

    // 1. Buscar el cliente en la tabla `clients` mediante coincidencia parcial (ilike)
    const { data: clientData, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id')
      .ilike('email', `%${cleanSender}%`)
      .limit(1)
      .maybeSingle();

    if (clientErr) console.error('Error buscando cliente:', clientErr);

    let clientId: string | null = clientData?.id || null;
    let executiveId: string | null = null;

    // 2. Si se encontró el cliente, buscar la ejecutiva asignada en `user_clients`
    if (clientId) {
      const { data: relationData, error: relErr } = await supabaseAdmin
        .from('user_clients')
        .select('user_id')
        .eq('client_id', clientId)
        .limit(1)
        .maybeSingle();

      if (relErr) console.error('Error buscando ejecutiva:', relErr);
      else if (relationData) executiveId = relationData.user_id;
    }

    // 3. Guardar el correo en la tabla `emails`
    const { data: emailRecord, error: emailError } = await supabaseAdmin
      .from('emails')
      .insert({
        sender_email: cleanSender,
        recipient_email: recipient ? recipient.trim().toLowerCase() : null,
        subject: subject || '(Sin asunto)',
        text: text || html || '',
        executive_id: executiveId,
      })
      .select('id')
      .single();

    if (emailError) {
      console.error('Error al insertar en tabla emails:', emailError);
      return NextResponse.json(
        { error: 'Error al registrar el correo.', details: emailError.message },
        { status: 500 }
      );
    }

    // 4. Intentar registrar automáticamente en `gestiones`
    // 4. Registrar automáticamente en la tabla `logs`
let gestionSuccess = false;
if (executiveId && clientId) {
  const { error: logError } = await supabaseAdmin
    .from('logs')
    .insert({
      user_id: executiveId,
      client_id: clientId,
      channel: 'EMAIL',
      summary: subject || 'Correo recibido de cliente',
      detail: text || html || '',
      created_at: new Date().toISOString(),
    });

  if (logError) {
    console.error('Error al registrar en la tabla logs:', logError.message);
  } else {
    gestionSuccess = true;
  }
}

    return NextResponse.json({
      success: true,
      emailId: emailRecord.id,
      executiveId: executiveId,
      gestionCreated: gestionSuccess,
    });

  } catch (error: any) {
    console.error('Error crítico en /api/emails/inbound:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}