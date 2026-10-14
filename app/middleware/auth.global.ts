import { useAuthStore } from '../stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  // Si no tenemos el usuario en memoria, intentar recuperarlo de la cookie de sesión
  if (!auth.user) {
    await auth.fetchUser()
  }

  const isLoginPage = to.path === '/login'

  if (!auth.isAuthenticated && !isLoginPage) {
    return navigateTo('/login')
  }

  if (auth.isAuthenticated && isLoginPage) {
    return navigateTo('/')
  }
})
