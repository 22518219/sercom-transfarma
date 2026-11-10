'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] p-4 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-[#141923] border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* LOGO SERCOM */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="bg-white p-3 rounded-xl shadow-md w-full max-w-[280px] flex justify-center items-center">
            <img
              src="/sercom-logo.png"
              alt="Sercom Servicios Comerciales"
              className="h-auto max-h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight pt-2">Plataforma Sercom-Transfarma</h1>
          <p className="text-xs text-slate-400">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 text-red-300 text-xs rounded-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* FORMULARIO DE INGRESO DE CREDANCIALES */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-100 text-xs rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
              placeholder="ejecutiva@transfarma.cl"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a2232] border border-slate-700/60 text-slate-100 text-xs rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg text-xs shadow-lg transition duration-200 disabled:opacity-50 tracking-wide"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

      </div>
    </div>
  )
}