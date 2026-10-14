<template>
  <q-dialog v-model="internalIsOpen" persistent :maximized="$q.screen.lt.md">
    <q-card :style="$q.screen.lt.md ? '' : { width: '100%', maxWidth: maxWidth }">
      <!-- Cabecera Estándar -->
      <q-card-section class="bg-primary text-white row items-center q-py-sm">
        <div class="text-subtitle1 text-weight-bold">{{ title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <!-- Cuerpo del Formulario -->
      <q-form @submit.prevent="$emit('save')">
        <q-card-section class="q-pa-md">
          <slot />
        </q-card-section>

        <q-separator />

        <!-- Botones de Acción -->
        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            :label="saveLabel"
            type="submit"
            :loading="loading"
            class="q-px-md"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  loading?: boolean
  saveLabel?: string
  maxWidth?: string
}>(), {
  loading: false,
  saveLabel: 'Guardar',
  maxWidth: '700px'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save'): void
}>()

const internalIsOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>
