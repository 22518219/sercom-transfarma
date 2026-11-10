'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase'

export interface EmailAlert {
  id: string
  sender_email: string
  subject: string
  received_at: string
}

export function useRealtimeAlerts(executiveId: string | null) {
  const [alerts, setAlerts] = useState<EmailAlert[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!executiveId) return

    // Suscripción al canal de cambios en la tabla 'emails'
    const channel = supabase
      .channel('realtime_emails')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emails',
          filter: `executive_id=eq.${executiveId}`,
        },
        (payload) => {
          const newEmail = payload.new as EmailAlert
          setAlerts((prev) => [newEmail, ...prev])

          // Opcional: Sonido de alerta al recibir un correo
          try {
            const audio = new Audio('/sounds/notification.mp3')
            audio.play().catch(() => {})
          } catch (e) {
            // Manejar bloqueo de reproducción automática del navegador
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [executiveId, supabase])

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((item) => item.id !== id))
  }

  return { alerts, dismissAlert }
}