import { Server as SocketServer } from 'socket.io'
import { logger } from '../utils/logger'
import { eventBus } from '../utils/eventBus'

export let io: SocketServer

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const server = (event.node.req.socket as any)?.server

    if (server && !server.__sio) {
      io = new SocketServer(server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        }
      })

      server.__sio = io
      ;(globalThis as any).__sioInstance = io

      logger.info('⚡ Servidor WebSockets (Socket.io) inicializado correctamente.')

      io.on('connection', (socket) => {
        // Unirse a salas personalizadas por usuario y sede
        socket.on('join', (payload: { userId: number; branchId?: number | null }) => {
          if (payload?.userId) {
            socket.join(`user_${payload.userId}`)
          }

          if (payload?.branchId) {
            socket.join(`branch_${payload.branchId}`)
          } else {
            socket.join('global')
          }
        })
      })

      // Puente de EventBus a Socket.io
      eventBus.on('session:revoked', ({ userId, newSessionId }) => {
        io.to(`user_${userId}`).emit('session:revoked', { userId, newSessionId })
      })

      eventBus.on('branch:updated', ({ branchId }) => {
        io.to(`branch_${branchId}`).emit('branch:updated', { branchId })
        io.to('global').emit('branch:updated', { branchId })
      })

      eventBus.on('role:updated', ({ roleId }) => {
        io.emit('role:updated', { roleId })
      })
    }
  })
})
