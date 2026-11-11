import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extraer campos de manera flexible para soportar múltiples proveedores de webhook
    const rawSender = body.sender || body.from || body.from_email || body['from-email'] || '';
    const rawRecipient = body.recipient || body.to || body.to_email || body['to-email'] || '';
    const rawSubject = body.subject || body.title || '(Sin asunto)';
    const rawText = body.text || body.body || body['body-plain'] || body.html || '';
    
    // Obtener la URL directa si la envía el proveedor o construir un link de búsqueda en Gmail
    const messageId = body['message-id'] || body.message_id || body.messageId || '';
    const gmailUrl = body.gmail_url || body.email_url || (
      messageId 
        ? `https://mail.google.com/mail/u/0/#search/rfc822msgid%3A${encodeURIComponent(messageId)}`
        : `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(rawSubject)}`
    );

    if (!rawSender) {
      return NextResponse.json(
        { error: 'El campo sender/from es requerido.' },
        { status: 400 }
      );
    }

    // Extraer solo la dirección de correo si viene en formato "Nombre <correo@dominio.cl>"
    const cleanSender = (rawSender.match(/<([^>]+)>/)?.[1] || rawSender).trim().toLowerCase();
    const cleanRecipient = (rawRecipient.match(/<([^>]+)>/)?.[1] || rawRecipient).trim().toLowerCase();

    // 2. Buscar el cliente en la tabla `clients` mediante coincidencia parcial (ilike)
    const { data: clientData, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id')
      .ilike('email', `%${cleanSender}%`)
      .limit(1)
      .maybeSingle();

    if (clientErr) console.error('Error buscando cliente:', clientErr);

    let clientId: string | null = clientData?.id || null;
    let executiveId: string | null = null;
    let executiveName: string | null = null;

    // 3. Si se encontró el cliente, buscar la ejecutiva asignada en `user_clients`
    if (clientId) {
      const { data: relationData, error: relErr } = await supabaseAdmin
        .from('user_clients')
        .select('user_id')
        .eq('client_id', clientId)
        .limit(1)
        .maybeSingle();

      if (relErr) {
        console.error('Error buscando ejecutiva en user_clients:', relErr);
      } else if (relationData) {
        executiveId = relationData.user_id;

        // Buscar el nombre completo de la ejecutiva en `profiles`
        const { data: profileData, error: profErr } = await supabaseAdmin
          .from('profiles')
          .select('full_name, name')
          .eq('id', executiveId)
          .maybeSingle();

        if (profErr) {
          console.error('Error buscando perfil de ejecutiva:', profErr);
        } else if (profileData) {
          executiveName = profileData.full_name || profileData.name || null;
        }
      }
    }

    // 4. Guardar el correo en la tabla `emails`
    const { data: emailRecord, error: emailError } = await supabaseAdmin
      .from('emails')
      .insert({
        sender_email: cleanSender,
        recipient_email: cleanRecipient || null,
        subject: rawSubject,
        text: rawText,
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

    // 5. Registrar automáticamente en la tabla `logs` (bitácora de gestiones) con gmail_url y fecha/hora
    let gestionSuccess = false;
    if (executiveId && clientId) {
      const { error: logError } = await supabaseAdmin
        .from('logs')
        .insert({
          user_id: executiveId,
          client_id: clientId,
          executive_name: executiveName || 'Katty Paredes',
          channel: 'EMAIL',
          summary: rawSubject,
          detail: rawText,
          gmail_url: gmailUrl, // Link directo a Gmail
          created_at: new Date().toISOString(), // Incluye Fecha + Hora en formato ISO
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
      executiveName: executiveName,
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