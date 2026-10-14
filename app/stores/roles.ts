import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ModuleItem {
  id: number
  code: string
  name: string
  category: string
}

export interface RolePermissionItem {
  id?: number
  moduleId: number
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  module?: ModuleItem
}

export interface RoleItem {
  id: number
  name: string
  description?: string | null
  isSystem: boolean
  permissions: RolePermissionItem[]
  _count?: { users: number }
}

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<RoleItem[]>([])
  const modules = ref<ModuleItem[]>([])
  const loading = ref(false)

  async function fetchRoles(force = false) {
    if (roles.value.length > 0 && !force) return
    loading.value = true
    try {
      roles.value = await $fetch('/api/roles')
    } finally {
      loading.value = false
    }
  }

  async function fetchModules() {
    if (modules.value.length > 0) return
    modules.value = await $fetch('/api/modules')
  }

  async function create(data: Partial<RoleItem>) {
    const created: RoleItem = await $fetch('/api/roles', {
      method: 'POST',
      body: data
    })
    roles.value.unshift(created)
    return created
  }

  async function update(id: number, data: Partial<RoleItem>) {
    const updated: RoleItem = await $fetch(`/api/roles/${id}`, {
      method: 'PUT',
      body: data
    })
    const idx = roles.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      roles.value[idx] = updated
    }
    return updated
  }

  async function remove(id: number) {
    await $fetch(`/api/roles/${id}`, {
      method: 'DELETE'
    })
    roles.value = roles.value.filter((r) => r.id !== id)
  }

  return {
    roles,
    modules,
    loading,
    fetchRoles,
    fetchModules,
    create,
    update,
    remove
  }
})
