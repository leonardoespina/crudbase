import { describe, it, expect, beforeEach } from 'vitest'
import {
  permissionCache,
  settingsCache,
  invalidateRolePermissionCache,
  invalidateSettingsCache
} from '../server/utils/cache'

describe('Caché L1 en Memoria (cache.ts)', () => {
  beforeEach(() => {
    permissionCache.clear()
    settingsCache.clear()
  })

  it('permissionCache debe guardar y recuperar permisos de un rol', () => {
    const roleId = 1
    const permissions = { USERS: { create: true, read: true, update: true, delete: false } }

    permissionCache.set(`role_${roleId}`, permissions)
    expect(permissionCache.get(`role_${roleId}`)).toEqual(permissions)
  })

  it('invalidateRolePermissionCache debe invalidar solo el rol indicado o todos', () => {
    permissionCache.set('role_1', { data: 1 })
    permissionCache.set('role_2', { data: 2 })

    invalidateRolePermissionCache(1)
    expect(permissionCache.has('role_1')).toBe(false)
    expect(permissionCache.has('role_2')).toBe(true)

    invalidateRolePermissionCache()
    expect(permissionCache.has('role_2')).toBe(false)
  })

  it('settingsCache debe invalidar claves específicas o limpiar todo', () => {
    settingsCache.set('app_installed', 'true')
    settingsCache.set('company_name', 'Acme Corp')

    invalidateSettingsCache('company_name')
    expect(settingsCache.has('company_name')).toBe(false)
    expect(settingsCache.has('app_installed')).toBe(true)

    invalidateSettingsCache()
    expect(settingsCache.has('app_installed')).toBe(false)
  })
})
