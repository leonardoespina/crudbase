<template>
  <q-table
    :title="title"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :filter="internalFilter"
    :pagination="initialPagination"
    :grid="$q.screen.lt.md"
    row-key="id"
    flat
    bordered
    class="sticky-header-table"
  >
    <!-- Barra Superior -->
    <template v-slot:top-right>
      <q-input
        borderless
        dense
        debounce="300"
        v-model="internalFilter"
        placeholder="Buscar..."
        class="q-mr-md bg-grey-2 q-px-sm rounded-borders"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-btn
        v-if="showAdd"
        color="primary"
        icon="add"
        :label="addLabel"
        unelevated
        @click="$emit('add')"
      />
    </template>

    <!-- Reenvío de slots del componente padre -->
    <template v-for="(_, slot) in $slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>

    <!-- Modo Grid Automático para Pantallas Pequeñas (Tablets / Móviles) -->
    <template v-slot:item="props">
      <div class="q-pa-xs col-12 col-sm-6">
        <q-card bordered flat class="q-mb-sm">
          <q-card-section class="q-pb-none">
            <div
              v-for="col in props.cols.filter((c: any) => c.name !== 'actions')"
              :key="col.name"
              class="row justify-between q-mb-sm"
            >
              <div class="text-caption text-grey-7">{{ col.label }}</div>
              <div class="text-weight-medium text-right" style="max-width: 65%; word-break: break-word;">
                <slot :name="`body-cell-${col.name}`" v-bind="{ ...props, col: col, value: col.value }">
                  {{ col.value }}
                </slot>
              </div>
            </div>
          </q-card-section>

          <template v-if="props.cols.some((c: any) => c.name === 'actions')">
            <q-separator />
            <q-card-actions align="right" class="bg-grey-1">
              <slot name="body-cell-actions" v-bind="{ ...props, col: props.cols.find((c: any) => c.name === 'actions'), value: null }" />
            </q-card-actions>
          </template>
        </q-card>
      </div>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  rows: any[]
  columns: any[]
  loading?: boolean
  filter?: string
  showAdd?: boolean
  addLabel?: string
}>(), {
  title: '',
  loading: false,
  filter: '',
  showAdd: true,
  addLabel: 'Nuevo'
})

const emit = defineEmits<{
  (e: 'update:filter', value: string): void
  (e: 'add'): void
}>()

const internalFilter = computed({
  get: () => props.filter,
  set: (val) => emit('update:filter', val)
})

const initialPagination = ref({
  sortBy: 'id',
  descending: true,
  page: 1,
  rowsPerPage: 10
})
</script>
