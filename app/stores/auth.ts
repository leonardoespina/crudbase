import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserPermission {
  moduleCode: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface AuthUser {
  id: number
  username: string
  name: string
  email?: string | null
  roleId: number
  roleName: string
  branchId?: number | null
  branchName?: string | null
  permissions: UserPermission[]
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.roleName === 'ADMIN')

  async function login(credentials: { username: string; password: string }) {
    loading.value = true
    try {
      const res: any = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      user.value = res.user
      token.value = res.token
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    try {
      const res: any = await $fetch('/api/auth/me')
      user.value = res.user
      return res.user
    } catch {
      clearSession()
      return null
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignorar error al cerrar sesión
    } finally {
      clearSession()
      navigateTo('/login')
    }
  }

  function clearSession() {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    fetchUser,
    logout,
    clearSession
  }
})
