<template>
  <q-badge :color="active ? 'positive' : 'grey-7'" :label="active ? 'Activo' : 'Inactivo'" />
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean
}>()
</script>
