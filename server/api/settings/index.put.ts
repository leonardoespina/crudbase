import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { SetupService } from '../../services/setupService'

const schema = z.object({
  name: z.string().min(2).optional(),
  taxId: z.string().optional(),
  logo: z.string().optional(),
  timezone: z.string().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'SETTINGS', 'update')
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return SetupService.updateSettings(valid, actor.id, ip)
})
