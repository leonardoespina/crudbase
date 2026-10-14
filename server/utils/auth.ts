import type { H3Event } from 'h3'
import { verifyToken, type TokenPayload } from './jwt'
import { UnauthorizedError, ForbiddenError, SessionTerminatedError } from '../domain/errors'
import { prisma } from './prisma'
import { permissionCache } from './cache'

export interface UserContext {
  id: number
  username: string
  name: string
  roleId: number
  roleName: string
  isAdmin: boolean
  branchId?: number | null
}

/**
 * 1. Verifica autenticación mediante JWT (Header o Cookie)
 */
export async function requireAuth(event: H3Event): Promise<TokenPayload> {
  let token = getHeader(event, 'authorization')?.split(' ')[1]
  if (!token) {
    token = getCookie(event, 'auth_token')
  }

  if (!token) {
    throw new UnauthorizedError('Se requiere token de autenticación')
  }

  const decoded = verifyToken(token)
  event.context.auth = decoded

  // Validación de sesión activa en BD
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  })

  if (!user || !user.active) {
    throw new UnauthorizedError('Usuario inactivo o no encontrado')
  }

  // Verificación de sesión única
  if (user.activeSessionId && decoded.sessionId && decoded.sessionId !== user.activeSessionId) {
    throw new SessionTerminatedError()
  }

  // Actualización periódica de última actividad (throttled a cada 30 segundos)
  const now = new Date()
  if (!user.lastActiveAt || now.getTime() - new Date(user.lastActiveAt).getTime() > 30000) {
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: now }
    }).catch(() => {})
  }

  event.context.userRecord = user
  return decoded
}

/**
 * 2. Obtiene el contexto completo del usuario autenticado
 */
export async function getUserContext(event: H3Event): Promise<UserContext> {
  const auth = await requireAuth(event)
  const user = (event.context.userRecord as any) || await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { role: true }
  })

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    roleId: user.roleId,
    roleName: user.role?.name || 'UNKNOWN',
    isAdmin: user.role?.name === 'ADMIN',
    branchId: user.branchId
  }
}

/**
 * 3. Valida permisos contra la matriz dinámica en BD (Con caché L1 en memoria)
 */
export async function requirePermission(
  event: H3Event,
  moduleCode: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<UserContext> {
  const context = await getUserContext(event)

  // Si es ADMIN general, tiene acceso irrestricto
  if (context.isAdmin) {
    return context
  }

  // 1. Buscar en caché en memoria primero
  const cacheKey = `role_${context.roleId}`
  let rolePermissions = permissionCache.get(cacheKey)

  if (!rolePermissions) {
    // Si no está en caché, consultar a PostgreSQL
    const permissions = await prisma.rolePermission.findMany({
      where: { roleId: context.roleId },
      include: { module: true }
    })

    rolePermissions = permissions.reduce((acc: any, curr) => {
      acc[curr.module.code] = {
        canCreate: curr.canCreate,
        canRead: curr.canRead,
        canUpdate: curr.canUpdate,
        canDelete: curr.canDelete
      }
      return acc
    }, {})

    // Guardar en caché L1 por 10 minutos
    permissionCache.set(cacheKey, rolePermissions)
  }

  const modulePerm = rolePermissions[moduleCode]

  if (!modulePerm) {
    throw new ForbiddenError(`Tu rol no tiene acceso al módulo: ${moduleCode}`)
  }

  const hasAccess =
    (action === 'create' && modulePerm.canCreate) ||
    (action === 'read' && modulePerm.canRead) ||
    (action === 'update' && modulePerm.canUpdate) ||
    (action === 'delete' && modulePerm.canDelete)

  if (!hasAccess) {
    throw new ForbiddenError(`No tienes permiso para '${action}' en el módulo ${moduleCode}`)
  }

  return context
}

/**
 * 4. Exige rol de Administrador
 */
export async function requireAdmin(event: H3Event): Promise<UserContext> {
  const context = await getUserContext(event)
  if (!context.isAdmin) {
    throw new ForbiddenError('Acción restringida exclusivamente a Administradores Generales')
  }
  return context
}
