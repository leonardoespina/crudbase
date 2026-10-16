import { defineApiHandler } from '../../utils/handler'
import { SetupService } from '../../services/setupService'

export default defineApiHandler(async () => {
  const isDatabaseConfigured = !!process.env.DATABASE_URL

  if (!isDatabaseConfigured) {
    return {
      isInstalled: false,
      isDatabaseConfigured: false
    }
  }

  try {
    const isInstalled = await SetupService.isInstalled()
    return {
      isInstalled,
      isDatabaseConfigured: true
    }
  } catch {
    // Si la BD no responde aún o no tiene tablas
    return {
      isInstalled: false,
      isDatabaseConfigured: false
    }
  }
})
