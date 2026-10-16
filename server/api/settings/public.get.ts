import { defineApiHandler } from '../../utils/handler'
import { SetupService } from '../../services/setupService'

export default defineApiHandler(async () => {
  return SetupService.getPublicSettings()
})
