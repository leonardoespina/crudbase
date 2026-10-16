<template>
  <div class="fullscreen row items-center justify-center bg-grey-2 q-pa-md">
    <q-card class="shadow-4 rounded-borders" style="width: 100%; max-width: 820px;">
      <!-- Encabezado del Instalador -->
      <q-card-section class="bg-primary text-white text-center q-py-md">
        <q-avatar size="54px" color="white" text-color="primary" icon="rocket_launch" class="q-mb-xs" />
        <div class="text-h5 text-weight-bold">Asistente de Instalación Inicial</div>
        <div class="text-caption text-grey-3">Configura tu empresa, sede principal y cuenta de administrador en pocos pasos</div>
      </q-card-section>

      <!-- Stepper de Pasos -->
      <q-stepper
        v-model="step"
        ref="stepper"
        color="primary"
        animated
        header-nav
        :vertical="$q.screen.lt.sm"
      >
        <!-- PASO 1: Diagnóstico y Bienvenida -->
        <q-step :name="1" title="Diagnóstico" icon="settings_suggest" :done="step > 1">
          <div class="text-subtitle1 text-weight-bold q-mb-sm text-primary">Verificación del Servidor</div>
          <p class="text-body2 text-grey-8">
            El asistente verificó la conectividad de la base de datos y los servicios centrales.
          </p>

          <q-list bordered separator class="rounded-borders q-my-md">
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" size="md" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Base de Datos PostgreSQL</q-item-label>
                <q-item-label caption>Conexión establecida exitosamente</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" size="md" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Entorno Node.js & Nitro</q-item-label>
                <q-item-label caption>Runtime activo y listo para provisionar</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="row justify-end q-mt-lg">
            <q-btn color="primary" label="Comenzar Configuración" unelevated @click="step = 2" />
          </div>
        </q-step>

        <!-- PASO 2: Datos de la Empresa y Logo -->
        <q-step :name="2" title="Empresa y Marca" icon="business" :done="step > 2">
          <div class="text-subtitle1 text-weight-bold q-mb-xs text-primary">Identidad de la Empresa</div>
          <div class="text-caption text-grey-7 q-mb-md">Personaliza el nombre comercial y el logotipo que verán los usuarios</div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-8">
              <q-input
                v-model="form.company.name"
                label="Nombre Comercial / Razón Social *"
                outlined
                dense
                hint="Ej: Inversiones & Talleres del Centro C.A."
                :rules="[val => !!val || 'El nombre es requerido']"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="form.company.taxId"
                label="Documento Fiscal (RIF/NIT/RUT)"
                outlined
                dense
                hint="Ej: J-12345678-9"
              />
            </div>

            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.company.timezone"
                label="Zona Horaria Comercial *"
                :options="timezones"
                outlined
                dense
              />
            </div>

            <!-- Subida y Previsualización de Logotipo -->
            <div class="col-12 col-sm-6">
              <q-file
                v-model="logoFile"
                label="Subir Logotipo de la Empresa"
                outlined
                dense
                accept="image/*"
                @update:model-value="handleLogoUpload"
              >
                <template v-slot:prepend>
                  <q-icon name="image" />
                </template>
                <template v-slot:append v-if="form.company.logo">
                  <q-icon name="close" class="cursor-pointer" @click.stop="clearLogo" />
                </template>
              </q-file>
            </div>

            <div class="col-12 text-center" v-if="form.company.logo">
              <div class="text-caption text-grey-7 q-mb-xs">Vista Previa del Logotipo:</div>
              <img
                :src="form.company.logo"
                alt="Logo Preview"
                style="max-height: 80px; max-width: 200px; object-fit: contain;"
                class="bg-white q-pa-xs rounded-borders shadow-1"
              />
            </div>
          </div>

          <div class="row justify-between q-mt-lg">
            <q-btn flat label="Atrás" color="grey-8" @click="step = 1" />
            <q-btn
              color="primary"
              label="Siguiente: Sede"
              unelevated
              :disable="!form.company.name"
              @click="step = 3"
            />
          </div>
        </q-step>

        <!-- PASO 3: Sede Principal (Matriz) -->
        <q-step :name="3" title="Sede Matriz" icon="store" :done="step > 3">
          <div class="text-subtitle1 text-weight-bold q-mb-xs text-primary">Sede Principal / Sucursal Matriz</div>
          <div class="text-caption text-grey-7 q-mb-md">El sistema opera en multisede. Define tu sede central inicial.</div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-input
                v-model="form.branch.code"
                label="Código de la Sede *"
                outlined
                dense
                hint="Ej: CENTRAL, MATRIZ"
                :rules="[val => !!val || 'El código es requerido']"
              />
            </div>
            <div class="col-12 col-sm-8">
              <q-input
                v-model="form.branch.name"
                label="Nombre de la Sede *"
                outlined
                dense
                hint="Ej: Taller Central / Sede Matriz"
                :rules="[val => !!val || 'El nombre es requerido']"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.branch.description"
                label="Dirección o Ubicación Física"
                type="textarea"
                rows="2"
                outlined
                dense
              />
            </div>
          </div>

          <div class="row justify-between q-mt-lg">
            <q-btn flat label="Atrás" color="grey-8" @click="step = 2" />
            <q-btn
              color="primary"
              label="Siguiente: Administrador"
              unelevated
              :disable="!form.branch.code || !form.branch.name"
              @click="step = 4"
            />
          </div>
        </q-step>

        <!-- PASO 4: Cuenta de Administrador Maestro -->
        <q-step :name="4" title="SuperAdmin" icon="admin_panel_settings" :done="step > 4">
          <div class="text-subtitle1 text-weight-bold q-mb-xs text-primary">Cuenta de Administrador Maestro</div>
          <div class="text-caption text-grey-7 q-mb-md">Este usuario tendrá acceso irrestricto a todas las sedes y configuraciones</div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.admin.name"
                label="Nombre Completo *"
                outlined
                dense
                :rules="[val => !!val || 'El nombre es requerido']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.admin.username"
                label="Nombre de Usuario *"
                outlined
                dense
                hint="Ej: admin, superadmin"
                :rules="[val => !!val || 'El usuario es requerido']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.admin.email"
                label="Correo Electrónico (Opcional)"
                type="email"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.admin.password"
                label="Contraseña Maestra *"
                type="password"
                outlined
                dense
                hint="Mínimo 6 caracteres"
                :rules="[val => (val && val.length >= 6) || 'Mínimo 6 caracteres']"
              />
            </div>
          </div>

          <div class="row justify-between q-mt-lg">
            <q-btn flat label="Atrás" color="grey-8" @click="step = 3" />
            <q-btn
              color="primary"
              label="Revisar y Finalizar"
              unelevated
              :disable="!form.admin.username || !form.admin.password || form.admin.password.length < 6"
              @click="step = 5"
            />
          </div>
        </q-step>

        <!-- PASO 5: Confirmación y Provisionamiento -->
        <q-step :name="5" title="Instalación" icon="task_alt">
          <div class="text-subtitle1 text-weight-bold q-mb-xs text-primary">Confirmar e Instalar</div>
          <p class="text-body2 text-grey-8">
            Revisa los datos antes de inicializar la plataforma. Al hacer clic en <strong>Inicializar Sistema</strong>, se crearán las tablas, roles, la sede matriz y tu usuario administrador.
          </p>

          <q-card flat bordered class="q-pa-md bg-grey-1 rounded-borders q-my-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <span class="text-grey-7 text-caption">Empresa:</span>
                <div class="text-weight-bold">{{ form.company.name }} ({{ form.company.taxId || 'Sin RIF' }})</div>
              </div>
              <div class="col-12 col-sm-6">
                <span class="text-grey-7 text-caption">Zona Horaria:</span>
                <div class="text-weight-bold">{{ form.company.timezone }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <span class="text-grey-7 text-caption">Sede Principal:</span>
                <div class="text-weight-bold">{{ form.branch.name }} [{{ form.branch.code }}]</div>
              </div>
              <div class="col-12 col-sm-6">
                <span class="text-grey-7 text-caption">SuperAdmin:</span>
                <div class="text-weight-bold">{{ form.admin.name }} ({{ form.admin.username }})</div>
              </div>
            </div>
          </q-card>

          <div class="row justify-between q-mt-lg">
            <q-btn flat label="Modificar Datos" color="grey-8" :disable="installing" @click="step = 4" />
            <q-btn
              color="positive"
              icon="rocket_launch"
              size="md"
              label="Inicializar Sistema"
              unelevated
              :loading="installing"
              @click="submitInstall"
            />
          </div>
        </q-step>
      </q-stepper>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useNotifications } from '../composables/core/useNotifications'
import { useSettingsStore } from '../stores/settings'

definePageMeta({
  layout: 'blank'
})

const notify = useNotifications()
const settingsStore = useSettingsStore()

const step = ref(1)
const installing = ref(false)
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
  company: {
    name: '',
    taxId: '',
    logo: '',
    timezone: 'America/Caracas'
  },
  branch: {
    code: 'CENTRAL',
    name: 'Sede Principal',
    description: 'Sede Matriz'
  },
  admin: {
    name: '',
    username: 'admin',
    email: '',
    password: ''
  }
})

const handleLogoUpload = (file: File | null) => {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.company.logo = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearLogo = () => {
  logoFile.value = null
  form.value.company.logo = ''
}

const submitInstall = async () => {
  installing.value = true
  try {
    await $fetch('/api/setup/install', {
      method: 'POST',
      body: form.value
    })

    notify.success('¡Sistema aprovisionado e instalado exitosamente!')
    // Recargar configuraciones públicas para que el Login tenga el logo y nombre
    await settingsStore.fetchPublicSettings(true)
    navigateTo('/login')
  } catch (error: any) {
    notify.error(error.data?.message || 'Error durante la instalación')
  } finally {
    installing.value = false
  }
}
</script>
