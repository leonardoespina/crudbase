import dayjs from 'dayjs'

export function useFormatDate() {
  const formatDate = (date?: string | Date | null, format = 'DD/MM/YYYY HH:mm') => {
    if (!date) return '—'
    return dayjs(date).format(format)
  }

  const formatShortDate = (date?: string | Date | null) => {
    if (!date) return '—'
    return dayjs(date).format('DD/MM/YYYY')
  }

  return {
    formatDate,
    formatShortDate
  }
}
