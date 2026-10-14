<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Roles y Permisos</div>
        <div class="text-caption text-grey-7">Configuración dinámica de accesos y matriz granular de seguridad</div>
      </div>
    </div>

    <SharedCrudTable
      title="Roles Registrados"
      :columns="columns"
      :rows="store.roles"
      :loading="store.loading"
      :show-add="can('ROLES', 'create')"
      add-label="Nuevo Rol"
      @add="openCreate"
    >
      <template v-slot:body-cell-isSystem="props">
        <q-td :props="props">
          <q-badge v-if="props.row.isSystem" color="purple" label="Sistema (Protegido)" />
          <q-badge v-else color="grey-6" label="Personalizado" />
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            v-if="can('ROLES', 'update')"
            flat
            round
            dense
            color="primary"
            icon="edit"
            @click="openEdit(props.row)"
          >
            <q-tooltip>Editar Rol y Permisos</q-tooltip>
          </q-btn>

          <q-btn
            v-if="can('ROLES', 'delete') && !props.row.isSystem"
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

    <!-- Modal Formulario con Matriz de Permisos -->
    <SharedFormDialog
      v-model="isDialogOpen"
      :title="isEditing ? 'Editar Rol y Permisos' : 'Nuevo Rol'"
      :loading="loading"
      max-width="850px"
      @save="submit"
    >
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="form.name"
            label="Nombre del Rol *"
            outlined
            dense
            hint="Ej: SUPERVISOR, AUDITOR"
            :rules="[val => !!val || 'El nombre es requerido']"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            v-model="form.description"
            label="Descripción del Rol"
            outlined
            dense
          />
        </div>
      </div>

      <div class="text-subtitle1 text-weight-bold text-primary q-mt-lg q-mb-xs">
        Matriz de Permisos por Módulo
      </div>
      <div class="text-caption text-grey-7 q-mb-sm">
        Asigna permisos granulares de Creación, Lectura, Edición y Borrado para este rol.
      </div>

      <!-- Acordeón por Categorías de Módulos -->
      <q-list bordered class="rounded-borders">
        <template v-for="(categoryModules, categoryName) in groupedPermissions" :key="categoryName">
          <q-expansion-item
            default-opened
            header-class="bg-grey-2 text-weight-bold text-primary"
            :label="categoryName"
          >
            <q-card>
              <q-card-section>
                <div class="row justify-end q-mb-sm q-gutter-sm">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="primary"
                    icon="check_box"
                    label="Marcar Todos"
                    @click="setGroupPermissions(categoryModules, true)"
                  />
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="negative"
                    icon="check_box_outline_blank"
                    label="Desmarcar Todos"
                    @click="setGroupPermissions(categoryModules, false)"
                  />
                </div>

                <div
                  v-for="item in categoryModules"
                  :key="item.moduleId"
                  class="row items-center q-py-sm"
                  style="border-bottom: 1px solid #eee;"
                >
                  <div class="col-12 col-md-4 text-weight-medium">
                    {{ item.moduleName }}
                    <span class="text-caption text-grey-6 q-ml-xs">({{ item.moduleCode }})</span>
                  </div>
                  <div class="col-12 col-md-8 row q-col-gutter-sm">
                    <div class="col-6 col-sm-3">
                      <q-checkbox v-model="item.canRead" label="Leer" color="primary" dense />
                    </div>
                    <div class="col-6 col-sm-3">
                      <q-checkbox v-model="item.canCreate" label="Crear" color="primary" dense />
                    </div>
                    <div class="col-6 col-sm-3">
                      <q-checkbox v-model="item.canUpdate" label="Editar" color="primary" dense />
                    </div>
                    <div class="col-6 col-sm-3">
                      <q-checkbox v-model="item.canDelete" label="Borrar" color="negative" dense />
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </template>
      </q-list>
    </SharedFormDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRolesStore } from '../../../stores/roles'
import { useRoleForm } from '../../../composables/features/useRoleForm'
import { usePermissions } from '../../../composables/core/usePermissions'

const store = useRolesStore()
const { can } = usePermissions()
const { isDialogOpen, isEditing, loading, form, openCreate, openEdit, setGroupPermissions, submit, remove } = useRoleForm()

const columns = [
  { name: 'name', label: 'Nombre del Rol', field: 'name', align: 'left' as const, sortable: true },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left' as const },
  { name: 'isSystem', label: 'Tipo', field: 'isSystem', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Acciones', align: 'right' as const }
]

const groupedPermissions = computed(() => {
  const groups: Record<string, any[]> = {}
  form.value.permissions.forEach((perm) => {
    const cat = perm.category || 'GENERAL'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(perm)
  })
  return groups
})

onMounted(() => {
  store.fetchRoles(true)
})
</script>
