import { useQuasar } from 'quasar'

export function useNotifications() {
  const $q = useQuasar()

  return {
    success: (message: string) =>
      $q.notify({
        type: 'positive',
        message,
        icon: 'check_circle',
        timeout: 3000
      }),
    error: (message: string) =>
      $q.notify({
        type: 'negative',
        message,
        icon: 'error',
        timeout: 5000
      }),
    warning: (message: string) =>
      $q.notify({
        type: 'warning',
        message,
        icon: 'warning',
        timeout: 4000
      }),
    info: (message: string) =>
      $q.notify({
        type: 'info',
        message,
        icon: 'info',
        timeout: 3000
      })
  }
}
