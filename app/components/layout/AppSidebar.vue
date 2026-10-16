<template>
  <q-list padding>
    <q-item-label header class="text-weight-bold text-uppercase text-grey-7">
      Menú Principal
    </q-item-label>

    <!-- Dashboard -->
    <q-item clickable v-ripple to="/" active-class="bg-blue-1 text-primary">
      <q-item-section avatar>
        <q-icon name="dashboard" />
      </q-item-section>
      <q-item-section class="text-weight-medium">Dashboard</q-item-section>
    </q-item>

    <q-separator class="q-my-sm" />

    <!-- Catálogos y Operación -->
    <q-item-label header class="text-weight-bold text-uppercase text-grey-7" v-if="can('BRANCHES', 'read')">
      Organización
    </q-item-label>

    <q-item
      v-if="can('BRANCHES', 'read')"
      clickable
      v-ripple
      to="/admin/branches"
      active-class="bg-blue-1 text-primary"
    >
      <q-item-section avatar>
        <q-icon name="store" />
      </q-item-section>
      <q-item-section>Sedes</q-item-section>
    </q-item>

    <q-separator class="q-my-sm" v-if="can('USERS', 'read') || can('ROLES', 'read') || can('AUDIT', 'read')" />

    <!-- Seguridad y Sistema -->
    <q-expansion-item
      icon="security"
      label="Seguridad y Control"
      default-opened
      v-if="can('USERS', 'read') || can('ROLES', 'read') || can('AUDIT', 'read')"
    >
      <q-list class="q-pl-md">
        <!-- Usuarios -->
        <q-item
          v-if="can('USERS', 'read')"
          clickable
          v-ripple
          to="/admin/users"
          active-class="bg-blue-1 text-primary"
        >
          <q-item-section avatar>
            <q-icon name="group" />
          </q-item-section>
          <q-item-section>Usuarios</q-item-section>
        </q-item>

        <!-- Roles y Permisos -->
        <q-item
          v-if="can('ROLES', 'read')"
          clickable
          v-ripple
          to="/admin/roles"
          active-class="bg-blue-1 text-primary"
        >
          <q-item-section avatar>
            <q-icon name="admin_panel_settings" />
          </q-item-section>
          <q-item-section>Roles y Permisos</q-item-section>
        </q-item>

        <!-- Auditoría -->
        <q-item
          v-if="can('AUDIT', 'read')"
          clickable
          v-ripple
          to="/admin/audit"
          active-class="bg-blue-1 text-primary"
        >
          <q-item-section avatar>
            <q-icon name="history" />
          </q-item-section>
          <q-item-section>Auditoría</q-item-section>
        </q-item>

        <!-- Configuración Corporativa -->
        <q-item
          v-if="can('SETTINGS', 'update')"
          clickable
          v-ripple
          to="/admin/settings"
          active-class="bg-blue-1 text-primary"
        >
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Configuración</q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import { usePermissions } from '../../composables/core/usePermissions'

const { can } = usePermissions()
</script>
