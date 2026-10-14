<template>
  <q-layout view="lHh Lpr lFf">
    <AppHeader @toggleSidebar="leftDrawerOpen = !leftDrawerOpen" />

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <AppSidebar />
    </q-drawer>

    <q-page-container class="bg-grey-1">
      <NuxtPage />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from '../components/layout/AppHeader.vue'
import AppSidebar from '../components/layout/AppSidebar.vue'
import { useSocket } from '../composables/core/useSocket'

const leftDrawerOpen = ref(true)
const { connectSocket } = useSocket()

onMounted(() => {
  connectSocket()
})
</script>
