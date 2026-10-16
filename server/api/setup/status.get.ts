import { defineApiHandler } from '../../utils/handler'
import { SetupService } from '../../services/setupService'

export default defineApiHandler(async () => {
  const isInstalled = await SetupService.isInstalled()
  return {
    isInstalled,
    hasDatabaseConnection: true
  }
})
