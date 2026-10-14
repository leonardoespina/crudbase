import { io, type Socket } from 'socket.io-client'
import { Dialog } from 'quasar'
import { useAuthStore } from '../stores/auth'

export default defineNuxtPlugin(() => {
  const socket: Socket = io({
    autoConnect: false
  })

  // Escuchar revocación de sesión en tiempo real
  socket.on('session:revoked', (data: { userId: number; newSessionId: string }) => {
    const auth = useAuthStore()
    if (auth.user?.id === data.userId) {
      auth.clearSession()
      Dialog.create({
        title: '⚠️ Sesión Finalizada',
        message: 'Tu sesión se ha cerrado automáticamente porque tu usuario inició sesión en otro dispositivo o terminal.',
        ok: {
          label: 'Ir al Login',
          color: 'primary',
          unelevated: true
        },
        persistent: true
      }).onOk(() => {
        navigateTo('/login')
      })
    }
  })

  return {
    provide: {
      socket
    }
  }
})
