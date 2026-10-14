import mitt from 'mitt'

export type AppEvents = {
  'role:updated': { roleId: number }
  'user:created': { userId: number; branchId?: number | null }
  'user:updated': { userId: number; branchId?: number | null }
  'session:revoked': { userId: number; newSessionId: string }
  'branch:updated': { branchId: number }
  'setting:updated': { key: string; value: string }
}

export const eventBus = mitt<AppEvents>()

// Invalidador reactivo de caché
eventBus.on('role:updated', ({ roleId }) => {
  import('./cache').then(({ invalidateRolePermissionCache }) => {
    invalidateRolePermissionCache(roleId)
  })
})

eventBus.on('setting:updated', ({ key }) => {
  import('./cache').then(({ invalidateSettingsCache }) => {
    invalidateSettingsCache(key)
  })
})
