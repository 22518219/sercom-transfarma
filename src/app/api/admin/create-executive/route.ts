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

    // Instancia limpia y aislada por Petición (No usa cookies ni LocalStorage)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })

    const { email, password, name, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son obligatorios.' },
        { status: 400 }
      )
    }

    // 1. Crear el usuario en Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Crear o actualizar el Perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          id: userData.user.id,
          email,
          name,
          role: role || 'ejecutiva'
        }
      ])

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Retorno limpio sin encabezados Set-Cookie
    return NextResponse.json({ message: 'Usuario creado exitosamente' }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error en servidor' }, { status: 500 })
  }
}