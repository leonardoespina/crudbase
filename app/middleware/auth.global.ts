import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const settings = useSettingsStore()

  // 1. Cargar configuraciones públicas si no están cargadas
  await settings.fetchPublicSettings()

  const isSetupPage = to.path === '/setup'
  const isLoginPage = to.path === '/login'

  // 2. Si el sistema NO está instalado y no está en /setup, redirigir a /setup
  if (!settings.isInstalled) {
    if (!isSetupPage) {
      return navigateTo('/setup')
    }
    return // Permitir ver /setup
  }

  // 3. Si el sistema YA está instalado y alguien intenta entrar a /setup, bloquear y mandar a login
  if (settings.isInstalled && isSetupPage) {
    return navigateTo('/login')
  }

  // 4. Si no tenemos el usuario en memoria, intentar recuperarlo de la cookie de sesión
  if (!auth.user) {
    await auth.fetchUser()
  }

  // 5. Protección de rutas protegidas
  if (!auth.isAuthenticated && !isLoginPage) {
    return navigateTo('/login')
  }

  // 6. Si ya está autenticado e intenta ir al login, mandarlo al dashboard
  if (auth.isAuthenticated && isLoginPage) {
    return navigateTo('/')
  }
})
