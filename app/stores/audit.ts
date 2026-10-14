import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AuditLogItem {
  id: number
  userId?: number | null
  action: string
  entity: string
  entityId?: number | null
  details?: string | null
  ip?: string | null
  createdAt: string
  user?: { id: number; username: string; name: string } | null
}

export const useAuditStore = defineStore('audit', () => {
  const logs = ref<AuditLogItem[]>([])
  const loading = ref(false)

  async function fetchLogs(limit = 100, entity?: string) {
    loading.value = true
    try {
      logs.value = await $fetch('/api/audit', {
        query: { limit, entity }
      })
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    loading,
    fetchLogs
  }
})
