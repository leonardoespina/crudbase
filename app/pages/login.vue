<template>
  <div class="fullscreen row items-center justify-center bg-grey-2 q-pa-md">
    <q-card class="q-pa-lg shadow-4 rounded-borders" style="width: 100%; max-width: 420px;">
      <q-card-section class="text-center q-pb-none">
        <!-- Logotipo Corporativo Dinámico o Icono por Defecto -->
        <div v-if="settings.logo" class="q-mb-md">
          <img
            :src="settings.logo"
            alt="Logo"
            style="max-height: 80px; max-width: 220px; object-fit: contain;"
          />
        </div>
        <q-avatar v-else size="64px" color="primary" text-color="white" icon="lock" class="q-mb-md" />

        <div class="text-h5 text-weight-bold text-primary">{{ settings.appName }}</div>
        <div class="text-caption text-grey-7 q-mt-xs">Inicia sesión con tus credenciales autorizadas</div>
      </q-card-section>

      <q-form @submit.prevent="handleLogin" class="q-gutter-md q-pt-md">
        <q-input
          v-model="username"
          label="Usuario *"
          outlined
          dense
          autofocus
          :disable="auth.loading"
          :rules="[val => !!val || 'El usuario es obligatorio']"
        >
          <template v-slot:prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Contraseña *"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          :disable="auth.loading"
          :rules="[val => !!val || 'La contraseña es obligatoria']"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-btn
          unelevated
          color="primary"
          size="lg"
          class="full-width q-mt-md"
          label="Ingresar al Sistema"
          type="submit"
          :loading="auth.loading"
        />
      </q-form>

      <q-card-section class="text-center text-caption text-grey-6 q-pt-lg">
        Acceso restringido · Uso empresarial interno
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { useNotifications } from '../composables/core/useNotifications'

definePageMeta({
  layout: 'blank'
})

const auth = useAuthStore()
const settings = useSettingsStore()
const notify = useNotifications()

const username = ref('')
const password = ref('')
const showPassword = ref(false)

onMounted(async () => {
  await settings.fetchPublicSettings()
})

const handleLogin = async () => {
  try {
    await auth.login({
      username: username.value,
      password: password.value
    })
    notify.success(`Bienvenido, ${auth.user?.name || auth.user?.username}`)
    navigateTo('/')
  } catch (error: any) {
    notify.error(error.data?.message || 'Error de autenticación. Verifica tus credenciales.')
  }
}
</script>
