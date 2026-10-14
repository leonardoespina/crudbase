import { useNuxtApp } from '#app'
import { useAuthStore } from '../../stores/auth'

export function useSocket() {
  const { $socket } = useNuxtApp() as any
  const auth = useAuthStore()

  const connectSocket = () => {
    if (!auth.isAuthenticated || !auth.user) return

    if (!$socket.connected) {
      $socket.connect()
    }

    // Unirse a las salas del usuario y de su sede
    $socket.emit('join', {
      userId: auth.user.id,
      branchId: auth.user.branchId
    })
  }

  const disconnectSocket = () => {
    if ($socket.connected) {
      $socket.disconnect()
    }
  }

  return {
    socket: $socket,
    connectSocket,
    disconnectSocket
  }
}
