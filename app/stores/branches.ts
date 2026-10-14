import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Branch {
  id: number
  code: string
  name: string
  description?: string | null
  active: boolean
  createdAt: string
}

export const useBranchesStore = defineStore('branches', () => {
  const branches = ref<Branch[]>([])
  const loading = ref(false)

  async function fetchBranches(includeInactive = true, force = false) {
    if (branches.value.length > 0 && !force) return
    loading.value = true
    try {
      branches.value = await $fetch('/api/branches', {
        query: { includeInactive: String(includeInactive) }
      })
    } finally {
      loading.value = false
    }
  }

  async function create(data: Partial<Branch>) {
    const created: Branch = await $fetch('/api/branches', {
      method: 'POST',
      body: data
    })
    branches.value.unshift(created)
    return created
  }

  async function update(id: number, data: Partial<Branch>) {
    const updated: Branch = await $fetch(`/api/branches/${id}`, {
      method: 'PUT',
      body: data
    })
    const idx = branches.value.findIndex((b) => b.id === id)
    if (idx !== -1) {
      branches.value[idx] = updated
    }
    return updated
  }

  async function remove(id: number) {
    await $fetch(`/api/branches/${id}`, {
      method: 'DELETE'
    })
    branches.value = branches.value.filter((b) => b.id !== id)
  }

  return {
    branches,
    loading,
    fetchBranches,
    create,
    update,
    remove
  }
})
