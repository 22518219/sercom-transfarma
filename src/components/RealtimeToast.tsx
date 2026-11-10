'use client'

import { useRouter } from 'next/navigation'

interface ToastProps {
  id: string
  sender: string
  subject: string
  onClose: (id: string) => void
}

export default function RealtimeToast({ id, sender, subject, onClose }: ToastProps) {
  const router = useRouter()

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-[#141923] border border-amber-500/80 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-start space-x-3 max-w-sm animate-bounce-short">
      <div className="text-2xl">📩</div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Nuevo Correo de Cartera
        </h4>
        <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{sender}</p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{subject}</p>
        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={() => {
              onClose(id)
              router.push('/dashboard/logs')
            }}
            className="text-[10px] bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded font-semibold transition"
          >
            Ver en Bitácora
          </button>
          <button
            onClick={() => onClose(id)}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}