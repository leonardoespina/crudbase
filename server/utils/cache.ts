import { LRUCache } from 'lru-cache'

// Caché de permisos en memoria (L1) para no consultar la base de datos en cada petición HTTP
export const permissionCache = new LRUCache<string, any>({
  max: 500, // Máximo 500 roles en memoria
  ttl: 1000 * 60 * 10 // 10 minutos
})

// Caché de configuraciones globales del sistema
export const settingsCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 30 // 30 minutos
})

/**
 * Invalida el caché de un rol cuando un administrador lo edita en la UI
 */
export function invalidateRolePermissionCache(roleId?: number) {
  if (roleId) {
    permissionCache.delete(`role_${roleId}`)
  } else {
    permissionCache.clear()
  }
}

/**
 * Invalida el caché de configuraciones
 */
export function invalidateSettingsCache(key?: string) {
  if (key) {
    settingsCache.delete(key)
  } else {
    settingsCache.clear()
  }
}
