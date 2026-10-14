<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <q-btn
        flat
        dense
        round
        icon="menu"
        aria-label="Menu"
        @click="$emit('toggleSidebar')"
      />

      <q-toolbar-title class="text-weight-bold">
        {{ config.public.appName }}
      </q-toolbar-title>

      <!-- Indicador de Sede Activa -->
      <div v-if="auth.user?.branchName" class="q-mr-md gt-xs">
        <q-chip color="primary-light" text-color="white" icon="store" dense>
          {{ auth.user.branchName }}
        </q-chip>
      </div>
      <div v-else-if="auth.isAdmin" class="q-mr-md gt-xs">
        <q-chip color="orange-9" text-color="white" icon="public" dense>
          Acceso Global
        </q-chip>
      </div>

      <!-- Menú de Usuario -->
      <q-btn flat no-caps class="q-ml-sm">
        <q-avatar size="32px" color="white" text-color="primary" class="text-weight-bold">
          {{ auth.user?.username?.charAt(0).toUpperCase() || 'U' }}
        </q-avatar>
        <span class="q-ml-sm gt-xs">{{ auth.user?.name || auth.user?.username }}</span>
        <q-icon name="arrow_drop_down" />

        <q-menu auto-close>
          <q-list style="min-width: 200px">
            <q-item-label header class="text-weight-bold">
              {{ auth.user?.roleName }}
            </q-item-label>
            <q-separator />

            <q-item clickable @click="isPasswordDialogOpen = true">
              <q-item-section avatar><q-icon name="key" /></q-item-section>
              <q-item-section>Cambiar Contraseña</q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable @click="handleLogout" class="text-negative">
              <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
              <q-item-section>Cerrar Sesión</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>

    <!-- Modal Cambiar Contraseña -->
    <q-dialog v-model="isPasswordDialogOpen">
      <q-card style="min-width: 350px">
        <q-card-section class="bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">Cambiar Contraseña</div>
        </q-card-section>

        <q-form @submit.prevent="submitPasswordChange">
          <q-card-section class="q-pa-md q-gutter-md">
            <q-input
              v-model="passwordForm.currentPassword"
              label="Contraseña Actual *"
              type="password"
              outlined
              dense
              :rules="[val => !!val || 'Requerido']"
            />
            <q-input
              v-model="passwordForm.newPassword"
              label="Nueva Contraseña (mínimo 6 caracteres) *"
              type="password"
              outlined
              dense
              :rules="[val => (val && val.length >= 6) || 'Mínimo 6 caracteres']"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md bg-grey-1">
            <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
            <q-btn unelevated label="Actualizar" color="primary" type="submit" :loading="passwordLoading" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useNotifications } from '../../composables/core/useNotifications'

defineEmits<{
  (e: 'toggleSidebar'): void
}>()

const auth = useAuthStore()
const config = useRuntimeConfig()
const notify = useNotifications()

const isPasswordDialogOpen = ref(false)
const passwordLoading = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: ''
})

const submitPasswordChange = async () => {
  passwordLoading.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: passwordForm.value
    })
    notify.success('Contraseña cambiada exitosamente')
    isPasswordDialogOpen.value = false
    passwordForm.value = { currentPassword: '', newPassword: '' }
  } catch (e: any) {
    notify.error(e.data?.message || 'Error al cambiar contraseña')
  } finally {
    passwordLoading.value = false
  }
}

const handleLogout = async () => {
  await auth.logout()
  notify.info('Sesión cerrada correctamente')
}
</script>
