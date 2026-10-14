import type { H3Event } from 'h3'
import { prisma } from './prisma'
import { getUserContext } from './auth'

/**
 * Envoltorio para operaciones transaccionales críticas que requieren idempotencia.
 * Si el cliente envía la cabecera 'Idempotency-Key', garantiza que la operación se ejecute una sola vez.
 */
export async function withIdempotency<T>(
  event: H3Event,
  operation: () => Promise<T>
): Promise<T> {
  const idempotencyKey = getHeader(event, 'idempotency-key')

  // Si no se envió clave de idempotencia, ejecutar normalmente
  if (!idempotencyKey) {
    return operation()
  }

  const user = await getUserContext(event)
  const path = event.node.req.url || 'unknown'

  // 1. Verificar si ya existe la clave
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey }
  })

  if (existing) {
    // Si no ha expirado, retornar la respuesta guardada
    if (new Date() < existing.expiresAt) {
      setResponseStatus(event, existing.statusCode)
      return JSON.parse(existing.response) as T
    }
    // Si expiró, eliminarla
    await prisma.idempotencyKey.delete({ where: { key: idempotencyKey } })
  }

  // 2. Ejecutar la operación real
  const result = await operation()
  const statusCode = getResponseStatus(event) || 200

  // 3. Guardar en la tabla con expiración de 24 horas
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  try {
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        path,
        userId: user.id,
        statusCode,
        response: JSON.stringify(result),
        expiresAt
      }
    })
  } catch {
    // Silenciar fallo de guardado de clave para no romper la respuesta al usuario
  }

  return result
}
