// src/app/api/admin/create-executive/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Faltan variables de entorno en el servidor.' },
        { status: 500 }
      )
    }

    // Cliente del servidor con sesión totalmente deshabilitada para no interferir con la sesión del Admin
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios (nombre, correo y contraseña).' },
        { status: 400 }
      )
    }

    // 1. Crear usuario directamente en Supabase Auth mediante admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'No se pudo generar el usuario.' }, { status: 500 })
    }

    // 2. Registrar el perfil en public.profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          id: authData.user.id,
          email,
          name,
          role: 'ejecutiva',
        },
      ])

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Ejecutiva creada exitosamente' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}