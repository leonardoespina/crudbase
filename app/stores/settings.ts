import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface PublicSettings {
  appName: string
  taxId?: string
  logo?: string | null
  timezone: string
  isInstalled: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  const appName = ref('CRUDBASE')
  const taxId = ref('')
  const logo = ref<string | null>(null)
  const timezone = ref('America/Caracas')
  const isInstalled = ref(true)
  const loaded = ref(false)

  async function fetchPublicSettings(force = false) {
    if (loaded.value && !force) return

    try {
      const data: any = await $fetch('/api/settings/public')
      appName.value = data.appName || 'CRUDBASE'
      taxId.value = data.taxId || ''
      logo.value = data.logo || null
      timezone.value = data.timezone || 'America/Caracas'
      isInstalled.value = data.isInstalled ?? true
      loaded.value = true
      return data
    } catch {
      // Fallback
      loaded.value = true
    }
  }

  async function checkInstallStatus() {
    try {
      const res: any = await $fetch('/api/setup/status')
      isInstalled.value = res.isInstalled
      return res.isInstalled
    } catch {
      return true
    }
  }

  async function updateSettings(payload: { name?: string; taxId?: string; logo?: string; timezone?: string }) {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: payload
    })
    if (payload.name) appName.value = payload.name
    if (payload.taxId !== undefined) taxId.value = payload.taxId
    if (payload.logo !== undefined) logo.value = payload.logo
    if (payload.timezone) timezone.value = payload.timezone
  }

  return {
    appName,
    taxId,
    logo,
    timezone,
    isInstalled,
    loaded,
    fetchPublicSettings,
    checkInstallStatus,
    updateSettings
  }
})
