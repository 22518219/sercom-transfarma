// src/app/api/admin/create-executive/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Faltan variables de entorno de Supabase.' },
        { status: 500 }
      )
    }

    // Inicialización dentro del handler para evitar fallos durante 'npm run build'
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos los campos (email, contraseña, nombre) son requeridos.' },
        { status: 400 }
      )
    }

    // Crear usuario en Auth de Supabase
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
      return NextResponse.json({ error: 'No se pudo crear el usuario en Auth.' }, { status: 500 })
    }

    // Insertar el perfil con rol 'ejecutiva' en public.profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          id: userData.user.id,
          email,
          name,
          role: 'ejecutiva',
        },
      ])

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Ejecutiva creada exitosamente' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}