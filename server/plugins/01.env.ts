import { z } from 'zod'
import { logger } from '../utils/logger'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  APP_TIMEZONE: z.string().default('America/Caracas'),
  COOKIE_SECURE: z.string().default('false')
})

export default defineNitroPlugin(() => {
  // Si no hay DATABASE_URL configurada, el sistema entra en MODO ASISTENTE DE INSTALACIÓN
  if (!process.env.DATABASE_URL) {
    ;(globalThis as any).__SETUP_MODE = true
    logger.warn('⚠️ DATABASE_URL no encontrada en .env.')
    logger.warn('🚀 Servidor iniciado en MODO INSTALADOR WEB. Configura la base de datos en: http://localhost:3000/setup')
    return
  }

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    logger.error('❌ Error en variables de entorno del servidor:')
    parsed.error.issues.forEach((issue) => {
      logger.error(`   - ${issue.path.join('.')}: ${issue.message}`)
    })
    process.exit(1)
  }

  logger.info('✅ Variables de entorno validadas exitosamente.')
})
