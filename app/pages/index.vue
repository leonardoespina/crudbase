<template>
  <q-page padding>
    <!-- Banner de Bienvenida -->
    <q-card class="bg-primary text-white q-mb-lg rounded-borders">
      <q-card-section class="q-pa-lg">
        <div class="text-h4 text-weight-bold">
          ¡Hola, {{ auth.user?.name || auth.user?.username }}!
        </div>
        <div class="text-subtitle1 text-grey-3 q-mt-xs">
          Bienvenido al panel central de {{ settingsStore.appName }}. Rol activo: <strong>{{ auth.user?.roleName }}</strong>.
        </div>
      </q-card-section>
    </q-card>

    <!-- Tarjetas de Acceso y Métricas -->
    <div class="row q-col-gutter-md">
      <!-- Sedes -->
      <div class="col-12 col-sm-6 col-md-3" v-if="can('BRANCHES', 'read')">
        <q-card class="cursor-pointer" @click="navigateTo('/admin/branches')">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-grey-7 text-uppercase text-weight-bold">Sedes Registradas</div>
              <div class="text-h5 text-weight-bold text-primary q-mt-xs">{{ branchesStore.branches.length }}</div>
            </div>
            <q-avatar color="blue-1" text-color="primary" icon="store" size="48px" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Usuarios -->
      <div class="col-12 col-sm-6 col-md-3" v-if="can('USERS', 'read')">
        <q-card class="cursor-pointer" @click="navigateTo('/admin/users')">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-grey-7 text-uppercase text-weight-bold">Usuarios del Sistema</div>
              <div class="text-h5 text-weight-bold text-teal q-mt-xs">{{ usersStore.users.length }}</div>
            </div>
            <q-avatar color="teal-1" text-color="teal" icon="group" size="48px" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Roles -->
      <div class="col-12 col-sm-6 col-md-3" v-if="can('ROLES', 'read')">
        <q-card class="cursor-pointer" @click="navigateTo('/admin/roles')">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-grey-7 text-uppercase text-weight-bold">Roles de Acceso</div>
              <div class="text-h5 text-weight-bold text-deep-purple q-mt-xs">{{ rolesStore.roles.length }}</div>
            </div>
            <q-avatar color="purple-1" text-color="deep-purple" icon="admin_panel_settings" size="48px" />
          </q-card-section>
        </q-card>
      </div>

      <!-- Auditoría -->
      <div class="col-12 col-sm-6 col-md-3" v-if="can('AUDIT', 'read')">
        <q-card class="cursor-pointer" @click="navigateTo('/admin/audit')">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-caption text-grey-7 text-uppercase text-weight-bold">Auditoría Reciente</div>
              <div class="text-h5 text-weight-bold text-amber-9 q-mt-xs">{{ auditStore.logs.length }}</div>
            </div>
            <q-avatar color="amber-1" text-color="amber-9" icon="history" size="48px" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { useBranchesStore } from '../stores/branches'
import { useUsersStore } from '../stores/users'
import { useRolesStore } from '../stores/roles'
import { useAuditStore } from '../stores/audit'
import { usePermissions } from '../composables/core/usePermissions'

const auth = useAuthStore()
const settingsStore = useSettingsStore()
const { can } = usePermissions()

const branchesStore = useBranchesStore()
const usersStore = useUsersStore()
const rolesStore = useRolesStore()
const auditStore = useAuditStore()

onMounted(async () => {
  settingsStore.fetchPublicSettings()
  if (can('BRANCHES', 'read')) branchesStore.fetchBranches()
  if (can('USERS', 'read')) usersStore.fetchUsers()
  if (can('ROLES', 'read')) rolesStore.fetchRoles()
  if (can('AUDIT', 'read')) auditStore.fetchLogs(10)
})
</script>
