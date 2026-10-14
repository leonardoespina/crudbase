<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Gestión de Sedes</div>
        <div class="text-caption text-grey-7">Administra las sucursales y puntos de operación multisede</div>
      </div>
    </div>

    <!-- Tabla CRUD Reutilizable -->
    <SharedCrudTable
      title="Sedes Registradas"
      :columns="columns"
      :rows="store.branches"
      :loading="store.loading"
      :show-add="can('BRANCHES', 'create')"
      add-label="Nueva Sede"
      @add="openCreate"
    >
      <!-- Slot de Estado -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <SharedStatusBadge :active="props.row.active" />
        </q-td>
      </template>

      <!-- Slot de Acciones -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            v-if="can('BRANCHES', 'update')"
            flat
            round
            dense
            color="primary"
            icon="edit"
            @click="openEdit(props.row)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>

          <q-btn
            v-if="can('BRANCHES', 'delete')"
            flat
            round
            dense
            color="negative"
            icon="delete"
            @click="remove(props.row)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </SharedCrudTable>

    <!-- Modal Formulario -->
    <SharedFormDialog
      v-model="isDialogOpen"
      :title="isEditing ? 'Editar Sede' : 'Nueva Sede'"
      :loading="loading"
      @save="submit"
    >
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <q-input
            v-model="form.code"
            label="Código *"
            outlined
            dense
            hint="Ej: CENTRAL, NORTE"
            :disable="isEditing"
            :rules="[val => !!val || 'El código es requerido']"
          />
        </div>

        <div class="col-12 col-sm-8">
          <q-input
            v-model="form.name"
            label="Nombre de la Sede *"
            outlined
            dense
            :rules="[val => !!val || 'El nombre es requerido']"
          />
        </div>

        <div class="col-12">
          <q-input
            v-model="form.description"
            label="Descripción o Dirección"
            type="textarea"
            rows="3"
            outlined
            dense
          />
        </div>

        <div class="col-12" v-if="isEditing">
          <q-toggle
            v-model="form.active"
            label="Sede Activa"
            color="positive"
          />
        </div>
      </div>
    </SharedFormDialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBranchesStore } from '../../../stores/branches'
import { useBranchForm } from '../../../composables/features/useBranchForm'
import { usePermissions } from '../../../composables/core/usePermissions'

const store = useBranchesStore()
const { can } = usePermissions()
const { isDialogOpen, isEditing, loading, form, openCreate, openEdit, submit, remove } = useBranchForm()

const columns = [
  { name: 'code', label: 'Código', field: 'code', align: 'left' as const, sortable: true },
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' as const, sortable: true },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left' as const },
  { name: 'status', label: 'Estado', field: 'active', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Acciones', align: 'right' as const }
]

onMounted(() => {
  store.fetchBranches(true)
})
</script>
