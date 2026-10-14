import { z } from 'zod'
import { logger } from '../utils/logger'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres para ser seguro'),
  APP_TIMEZONE: z.string().default('America/Caracas'),
  COOKIE_SECURE: z.string().default('false')
})

export default defineNitroPlugin(() => {
  logger.info('🔍 Validando variables de entorno del servidor (Fail-Fast)...')

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    logger.error('❌ Error crítico en variables de entorno. El servidor no puede arrancar:')
    parsed.error.issues.forEach((issue) => {
      logger.error(`   - ${issue.path.join('.')}: ${issue.message}`)
    })
    process.exit(1)
  }

  logger.info('✅ Variables de entorno validadas exitosamente.')
})
