<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Auditoría del Sistema</div>
        <div class="text-caption text-grey-7">Bitácora inalterable de accesos, modificaciones y transacciones</div>
      </div>
    </div>

    <SharedCrudTable
      title="Registros de Actividad"
      :columns="columns"
      :rows="store.logs"
      :loading="store.loading"
      :show-add="false"
    >
      <template v-slot:body-cell-user="props">
        <q-td :props="props">
          <span v-if="props.row.user" class="text-weight-medium">
            {{ props.row.user.name }} ({{ props.row.user.username }})
          </span>
          <span v-else class="text-grey-6">Sistema / Automático</span>
        </q-td>
      </template>

      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <q-badge :color="getActionColor(props.row.action)" :label="props.row.action" />
        </q-td>
      </template>

      <template v-slot:body-cell-createdAt="props">
        <q-td :props="props">
          {{ formatDate(props.row.createdAt) }}
        </q-td>
      </template>

      <template v-slot:body-cell-details="props">
        <q-td :props="props">
          <span class="text-caption ellipsis" style="max-width: 300px; display: inline-block;">
            {{ props.row.details || '—' }}
          </span>
          <q-btn
            v-if="props.row.details"
            flat
            dense
            round
            icon="visibility"
            size="sm"
            color="primary"
            @click="showDetails(props.row)"
          >
            <q-tooltip>Ver Detalles</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </SharedCrudTable>

    <!-- Modal para ver JSON de detalles -->
    <q-dialog v-model="isDetailDialogOpen">
      <q-card style="min-width: 400px; max-width: 600px;">
        <q-card-section class="bg-primary text-white row items-center q-py-sm">
          <div class="text-subtitle1 text-weight-bold">Detalle de Auditoría</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="text-caption text-grey-7 q-mb-sm">
            Entidad: <strong>{{ selectedLog?.entity }}</strong> | Acción: <strong>{{ selectedLog?.action }}</strong>
          </div>
          <pre class="bg-grey-2 q-pa-sm rounded-borders text-caption" style="white-space: pre-wrap; word-break: break-all;">{{ formatJson(selectedLog?.details) }}</pre>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuditStore, type AuditLogItem } from '../../../stores/audit'
import { useFormatDate } from '../../../composables/core/useFormatDate'

const store = useAuditStore()
const { formatDate } = useFormatDate()

const isDetailDialogOpen = ref(false)
const selectedLog = ref<AuditLogItem | null>(null)

const columns = [
  { name: 'createdAt', label: 'Fecha y Hora', field: 'createdAt', align: 'left' as const, sortable: true },
  { name: 'user', label: 'Operador', field: (row: any) => row.user?.username, align: 'left' as const, sortable: true },
  { name: 'action', label: 'Acción', field: 'action', align: 'center' as const, sortable: true },
  { name: 'entity', label: 'Entidad', field: 'entity', align: 'center' as const, sortable: true },
  { name: 'ip', label: 'IP', field: 'ip', align: 'center' as const },
  { name: 'details', label: 'Detalles', field: 'details', align: 'left' as const }
]

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE': return 'positive'
    case 'UPDATE': return 'info'
    case 'DELETE': return 'negative'
    case 'LOGIN': return 'primary'
    case 'LOGOUT': return 'grey-7'
    default: return 'purple'
  }
}

const showDetails = (log: AuditLogItem) => {
  selectedLog.value = log
  isDetailDialogOpen.value = true
}

const formatJson = (str?: string | null) => {
  if (!str) return 'Sin detalles adicionales'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

onMounted(() => {
  store.fetchLogs(100)
})
</script>
