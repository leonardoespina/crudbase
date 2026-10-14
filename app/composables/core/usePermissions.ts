import { useAuthStore } from '../../stores/auth'

export function usePermissions() {
  const auth = useAuthStore()

  /**
   * Verifica si el usuario actual tiene permiso para una acción en un módulo.
   * Uso: can('USERS', 'create')
   */
  const can = (moduleCode: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    if (!auth.isAuthenticated || !auth.user) {
      return false
    }

    // Administrador general tiene acceso irrestricto
    if (auth.user.roleName === 'ADMIN') {
      return true
    }

    const perm = auth.user.permissions?.find((p) => p.moduleCode === moduleCode)
    if (!perm) {
      return false
    }

    switch (action) {
      case 'create': return !!perm.canCreate
      case 'read':   return !!perm.canRead
      case 'update': return !!perm.canUpdate
      case 'delete': return !!perm.canDelete
      default:       return false
    }
  }

  return { can }
}
