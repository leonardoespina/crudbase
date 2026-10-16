<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useSettingsStore } from './app/stores/settings'

const settings = useSettingsStore()

useHead({
  title: settings.appName,
  titleTemplate: (title) => {
    return title && title !== settings.appName ? `${title} | ${settings.appName}` : settings.appName
  }
})
</script>
