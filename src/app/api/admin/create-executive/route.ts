// src/app/api/admin/create-executive/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Faltan variables de entorno de Supabase en el servidor.' },
        { status: 500 }
      )
    }

    // Inicialización aislada para no guardar sesión ni persistir cookies
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    const { email, password, name, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos los campos (nombre, correo y contraseña) son requeridos.' },
        { status: 400 }
      )
    }

    const assignedRole = role || 'ejecutiva'

    // 1. Crear usuario mediante la API de administración de Supabase Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!userData.user) {
      return NextResponse.json({ error: 'No se pudo generar el usuario.' }, { status: 500 })
    }

    // 2. Insertar/Actualizar el perfil en public.profiles con el rol asignado
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          id: userData.user.id,
          email,
          name,
          role: assignedRole,
        },
      ])

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Usuario creado exitosamente' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 })
  }
}