<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Configuración de la Empresa</div>
        <div class="text-caption text-grey-7">Personaliza la identidad corporativa, logotipo y parámetros generales</div>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-8">
        <q-card flat bordered class="q-pa-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold text-primary q-mb-md">
              Datos Comerciales y de Marca
            </div>

            <q-form @submit.prevent="saveSettings" class="q-gutter-md">
              <q-input
                v-model="form.name"
                label="Nombre de la Aplicación / Empresa *"
                outlined
                dense
                hint="Se mostrará en la barra superior, bienvenida del panel y pestaña del navegador (ej: SIGAT - Sistema de Taller)"
                :rules="[val => !!val || 'El nombre es obligatorio']"
              />

              <q-input
                v-model="form.taxId"
                label="Documento Fiscal (RIF / NIT / RUT)"
                outlined
                dense
              />

              <q-select
                v-model="form.timezone"
                label="Zona Horaria de Operación *"
                :options="timezones"
                outlined
                dense
              />

              <!-- Subida de Nuevo Logotipo -->
              <div class="q-pt-sm">
                <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">Logotipo de la Empresa:</div>
                <q-file
                  v-model="logoFile"
                  label="Seleccionar Nueva Imagen"
                  outlined
                  dense
                  accept="image/*"
                  @update:model-value="handleLogoUpload"
                >
                  <template v-slot:prepend>
                    <q-icon name="image" />
                  </template>
                  <template v-slot:append v-if="form.logo">
                    <q-icon name="close" class="cursor-pointer" @click.stop="clearLogo" />
                  </template>
                </q-file>
              </div>

              <div class="row justify-end q-mt-md">
                <q-btn
                  unelevated
                  color="primary"
                  icon="save"
                  label="Guardar Configuración"
                  type="submit"
                  :loading="saving"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tarjeta Lateral de Previsualización -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="text-center q-pa-md">
          <q-card-section>
            <div class="text-caption text-uppercase text-grey-7 text-weight-bold q-mb-md">
              Vista Previa de Marca
            </div>

            <div class="q-pa-md bg-grey-2 rounded-borders flex flex-center" style="min-height: 140px;">
              <img
                v-if="form.logo"
                :src="form.logo"
                alt="Logo Preview"
                style="max-height: 100px; max-width: 100%; object-fit: contain;"
              />
              <div v-else class="text-grey-6 text-caption">
                <q-icon name="image" size="48px" /><br />
                Sin Logotipo Asignado
              </div>
            </div>

            <div class="text-h6 text-weight-bold q-mt-md text-primary">
              {{ form.name || 'Nombre de Empresa' }}
            </div>
            <div class="text-caption text-grey-7">
              {{ form.taxId || 'Sin identificación fiscal' }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../../../stores/settings'
import { useNotifications } from '../../../composables/core/useNotifications'

const settings = useSettingsStore()
const notify = useNotifications()

const saving = ref(false)
const logoFile = ref<File | null>(null)

const timezones = [
  'America/Caracas',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Mexico_City',
  'America/New_York',
  'America/Madrid'
]

const form = ref({
  name: '',
  taxId: '',
  logo: '',
  timezone: 'America/Caracas'
})

onMounted(async () => {
  await settings.fetchPublicSettings()
  form.value = {
    name: settings.appName,
    taxId: settings.taxId,
    logo: settings.logo || '',
    timezone: settings.timezone
  }
})

const handleLogoUpload = (file: File | null) => {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.logo = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearLogo = () => {
  logoFile.value = null
  form.value.logo = ''
}

const saveSettings = async () => {
  saving.value = true
  try {
    await settings.updateSettings(form.value)
    notify.success('Configuración corporativa actualizada exitosamente')
  } catch (error: any) {
    notify.error(error.data?.message || 'Error al guardar configuración')
  } finally {
    saving.value = false
  }
}
</script>
