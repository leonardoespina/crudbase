import type { EventHandler } from 'h3'
import { DomainError } from '../domain/errors'
import { logger } from './logger'

/**
 * Wrapper estándar para todos los API Handlers en server/api/
 * Centraliza el manejo de errores de dominio, logging estructurado y tiempos de respuesta.
 */
export function defineApiHandler(handler: EventHandler): EventHandler {
  return defineEventHandler(async (event) => {
    const start = Date.now()
    const method = event.node.req.method || 'GET'
    const url = event.node.req.url || '/'
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

    try {
      const response = await handler(event)
      const durationMs = Date.now() - start

      // Log HTTP exitoso
      logger.info(`HTTP ${method} ${url}`, {
        method,
        url,
        statusCode: getResponseStatus(event) || 200,
        durationMs,
        ip
      })

      return response
    } catch (error: any) {
      const durationMs = Date.now() - start

      // Si es un error de dominio controlado
      if (error instanceof DomainError) {
        logger.warn(`Domain Error: ${error.message}`, {
          code: error.code,
          statusCode: error.statusCode,
          method,
          url,
          durationMs,
          ip
        })

        throw createError({
          statusCode: error.statusCode,
          statusMessage: error.message,
          data: {
            code: error.code,
            message: error.message
          }
        })
      }

      // Errores de validación de Zod
      if (error?.name === 'ZodError') {
        const issues = error.issues?.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')
        logger.warn(`Zod Validation Error: ${issues}`, { method, url, durationMs, ip })

        throw createError({
          statusCode: 400,
          statusMessage: 'Error de validación en los datos enviados',
          data: {
            code: 'VALIDATION_ERROR',
            details: error.issues
          }
        })
      }

      // Errores inesperados (falla de BD, bug)
      logger.error(`Unhandled Error: ${error.message || 'Error interno'}`, {
        method,
        url,
        durationMs,
        ip,
        stack: error.stack
      })

      throw createError({
        statusCode: 500,
        statusMessage: 'Error interno del servidor. Consulte los registros de auditoría.',
        data: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      })
    }
  })
}
