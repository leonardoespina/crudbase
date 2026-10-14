import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || 'America/Caracas'

/**
 * Retorna fecha y hora actual en objeto dayjs con la zona horaria del sistema.
 */
export function nowInTz(tz = DEFAULT_TIMEZONE) {
  return dayjs().tz(tz)
}

/**
 * Retorna el rango de fechas UTC para el día local actual.
 * Ideal para consultas a PostgreSQL que buscan "lo ocurrido hoy".
 */
export function getTodayRangeUtc(tz = DEFAULT_TIMEZONE) {
  const startLocal = dayjs().tz(tz).startOf('day')
  const endLocal = dayjs().tz(tz).endOf('day')

  return {
    start: startLocal.utc().toDate(),
    end: endLocal.utc().toDate()
  }
}

/**
 * Convierte una fecha UTC a string legible en la zona horaria de la empresa.
 */
export function formatToLocal(date: Date | string, format = 'YYYY-MM-DD HH:mm:ss', tz = DEFAULT_TIMEZONE) {
  return dayjs(date).tz(tz).format(format)
}

export { dayjs }
