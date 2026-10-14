<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Gestión de Usuarios</div>
        <div class="text-caption text-grey-7">Administración de operadores, asignación de roles y sedes</div>
      </div>
    </div>

    <SharedCrudTable
      title="Usuarios del Sistema"
      :columns="columns"
      :rows="store.users"
      :loading="store.loading"
      :show-add="can('USERS', 'create')"
      add-label="Nuevo Usuario"
      @add="openCreate"
    >
      <template v-slot:body-cell-role="props">
        <q-td :props="props">
          <q-badge color="primary" :label="props.row.role?.name || 'Sin Rol'" />
        </q-td>
      </template>

      <template v-slot:body-cell-branch="props">
        <q-td :props="props">
          <q-badge v-if="props.row.branch" color="teal" :label="props.row.branch.name" />
          <q-badge v-else color="grey-6" label="Acceso Global" />
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <SharedStatusBadge :active="props.row.active" />
        </q-td>
      </template>

      <template v-slot:body-cell-lastActiveAt="props">
        <q-td :props="props">
          {{ formatDate(props.row.lastActiveAt) }}
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            v-if="can('USERS', 'update')"
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
            v-if="can('USERS', 'delete')"
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

    <!-- Modal Formulario de Usuario -->
    <SharedFormDialog
      v-model="isDialogOpen"
      :title="isEditing ? 'Editar Usuario' : 'Nuevo Usuario'"
      :loading="loading"
      @save="submit"
    >
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="form.username"
            label="Nombre de Usuario *"
            outlined
            dense
            :disable="isEditing"
            :rules="[val => !!val || 'El usuario es obligatorio']"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="form.name"
            label="Nombre Completo *"
            outlined
            dense
            :rules="[val => !!val || 'El nombre es obligatorio']"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="form.email"
            label="Correo Electrónico"
            type="email"
            outlined
            dense
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="form.password"
            :label="isEditing ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'"
            type="password"
            outlined
            dense
            :rules="isEditing ? [] : [val => (val && val.length >= 6) || 'Mínimo 6 caracteres']"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-select
            v-model="form.roleId"
            :options="rolesStore.roles"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            label="Rol de Acceso *"
            outlined
            dense
            :rules="[val => !!val || 'El rol es obligatorio']"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-select
            v-model="form.branchId"
            :options="branchesStore.branches"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            clearable
            label="Sede Asignada (Vacío = Acceso Global)"
            outlined
            dense
          />
        </div>

        <div class="col-12" v-if="isEditing">
          <q-toggle
            v-model="form.active"
            label="Usuario Activo"
            color="positive"
          />
        </div>
      </div>
    </SharedFormDialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUsersStore } from '../../../stores/users'
import { useRolesStore } from '../../../stores/roles'
import { useBranchesStore } from '../../../stores/branches'
import { useUserForm } from '../../../composables/features/useUserForm'
import { usePermissions } from '../../../composables/core/usePermissions'
import { useFormatDate } from '../../../composables/core/useFormatDate'

const store = useUsersStore()
const rolesStore = useRolesStore()
const branchesStore = useBranchesStore()
const { can } = usePermissions()
const { formatDate } = useFormatDate()
const { isDialogOpen, isEditing, loading, form, openCreate, openEdit, submit, remove } = useUserForm()

const columns = [
  { name: 'username', label: 'Usuario', field: 'username', align: 'left' as const, sortable: true },
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' as const, sortable: true },
  { name: 'role', label: 'Rol', field: (row: any) => row.role?.name, align: 'center' as const, sortable: true },
  { name: 'branch', label: 'Sede', field: (row: any) => row.branch?.name, align: 'center' as const, sortable: true },
  { name: 'status', label: 'Estado', field: 'active', align: 'center' as const, sortable: true },
  { name: 'lastActiveAt', label: 'Última Actividad', field: 'lastActiveAt', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Acciones', align: 'right' as const }
]

onMounted(() => {
  store.fetchUsers(true)
})
</script>
