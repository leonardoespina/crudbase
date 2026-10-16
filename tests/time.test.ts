import { describe, it, expect } from 'vitest'
import { nowInTz, getTodayRangeUtc, formatToLocal } from '../server/utils/time'

describe('Utilidades de Tiempo y Fechas (time.ts)', () => {
  it('nowInTz debe retornar un objeto dayjs válido con la zona horaria', () => {
    const now = nowInTz('America/Caracas')
    expect(now.isValid()).toBe(true)
  })

  it('getTodayRangeUtc debe retornar un rango de 24 horas en UTC que cubra el día local', () => {
    const tz = 'America/Caracas'
    const { start, end } = getTodayRangeUtc(tz)

    expect(start).toBeInstanceOf(Date)
    expect(end).toBeInstanceOf(Date)
    expect(end.getTime()).toBeGreaterThan(start.getTime())

    // La diferencia entre fin e inicio debe ser casi 24 horas (86399999 ms)
    const diffMs = end.getTime() - start.getTime()
    expect(diffMs).toBe(86399999)
  })

  it('formatToLocal debe formatear correctamente en la zona solicitada', () => {
    const fixedDate = new Date('2026-10-16T12:00:00Z')
    const formatted = formatToLocal(fixedDate, 'YYYY-MM-DD HH:mm', 'America/Caracas')
    // America/Caracas es UTC-4, por lo que 12:00 UTC son 08:00 AM
    expect(formatted).toBe('2026-10-16 08:00')
  })
})
