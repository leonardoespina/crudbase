import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserItem {
  id: number
  username: string
  name: string
  email?: string | null
  active: boolean
  roleId: number
  branchId?: number | null
  createdAt: string
  lastActiveAt?: string | null
  role?: { id: number; name: string }
  branch?: { id: number; code: string; name: string }
}

export const useUsersStore = defineStore('users', () => {
  const users = ref<UserItem[]>([])
  const loading = ref(false)

  async function fetchUsers(force = false) {
    if (users.value.length > 0 && !force) return
    loading.value = true
    try {
      users.value = await $fetch('/api/users')
    } finally {
      loading.value = false
    }
  }

  async function create(data: any) {
    const created: UserItem = await $fetch('/api/users', {
      method: 'POST',
      body: data
    })
    users.value.unshift(created)
    return created
  }

  async function update(id: number, data: any) {
    const updated: UserItem = await $fetch(`/api/users/${id}`, {
      method: 'PUT',
      body: data
    })
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx !== -1) {
      // Preservar relaciones
      users.value[idx] = { ...users.value[idx], ...updated }
    }
    return updated
  }

  async function remove(id: number) {
    await $fetch(`/api/users/${id}`, {
      method: 'DELETE'
    })
    users.value = users.value.filter((u) => u.id !== id)
  }

  return {
    users,
    loading,
    fetchUsers,
    create,
    update,
    remove
  }
})
