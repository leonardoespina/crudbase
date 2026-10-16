<template>
  <div class="fullscreen row items-center justify-center bg-grey-2 q-pa-md">
    <q-card class="shadow-4 rounded-borders" style="width: 100%; max-width: 860px;">
      <!-- Encabezado del Instalador -->
      <q-card-section class="bg-primary text-white text-center q-py-md">
        <q-avatar size="54px" color="white" text-color="primary" icon="rocket_launch" class="q-mb-xs" />
        <div class="text-h5 text-weight-bold">Asistente de Instalación y Configuración</div>
        <div class="text-caption text-grey-3">Configura tu base de datos, empresa, sede y administrador en minutos</div>
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
        <!-- PASO 1: Conexión y Creación de Base de Datos -->
        <q-step :name="1" title="Base de Datos" icon="storage" :done="step > 1 || isDbReady">
          <div class="text-subtitle1 text-weight-bold q-mb-xs text-primary">Conexión a PostgreSQL</div>
          <p class="text-body2 text-grey-8">
            Ingresa las credenciales de tu motor PostgreSQL. Si la base de datos no existe, 
            el instalador la creará automáticamente, generará tu archivo <strong>.env</strong> y sincronizará las tablas.
          </p>

          <q-banner v-if="dbSuccessMessage" class="bg-positive text-white q-mb-md rounded-borders">
            <template v-slot:avatar>
              <q-icon name="check_circle" />
            </template>
            {{ dbSuccessMessage }}
          </q-banner>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-8">
              <q-input
                v-model="dbForm.host"
                label="Host / Servidor de BD *"
                outlined
                dense
                hint="Ej: localhost o IP del servidor"
                :rules="[val => !!val || 'El host es obligatorio']"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model.number="dbForm.port"
                label="Puerto *"
                type="number"
                outlined
                dense
                :rules="[val => !!val || 'El puerto es obligatorio']"
              />
            </div>

            <div class="col-12 col-sm-6">
              <q-input
                v-model="dbForm.user"
                label="Usuario de PostgreSQL *"
                outlined
                dense
                hint="Por defecto: postgres"
                :rules="[val => !!val || 'El usuario es obligatorio']"
              />
            </div>

            <div class="col-12 col-sm-6">
              <q-input
                v-model="dbForm.password"
                label="Contraseña de PostgreSQL"
                :type="showDbPassword ? 'text' : 'password'"
                outlined
                dense
              >
                <template v-slot:append>
                  <q-icon
                    :name="showDbPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showDbPassword = !showDbPassword"
                  />
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-input
                v-model="dbForm.database"
                label="Nombre de la Base de Datos *"
                outlined
                dense
                hint="Nombre de la base de datos a crear o conectar (Ej: crudbase_db)"
                :rules="[val => !!val || 'El nombre de la BD es obligatorio']"
              />
            </div>
          </div>

          <div class="row justify-between q-mt-lg">
            <div>
              <q-chip v-if="isDbReady" color="positive" text-color="white" icon="check">
                Base de Datos Lista
              </q-chip>
            </div>
            <q-btn
              color="primary"
              icon="dns"
              label="Probar, Crear BD y Continuar"
              unelevated
              :loading="dbTesting"
              @click="submitDatabaseSetup"
            />
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
            Revisa los datos antes de inicializar la plataforma. Al hacer clic en <strong>Inicializar Sistema</strong>, 
            se crearán los módulos, roles, la sede matriz y tu usuario administrador.
          </p>

          <q-card flat bordered class="q-pa-md bg-grey-1 rounded-borders q-my-md">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <span class="text-grey-7 text-caption">Base de Datos:</span>
                <div class="text-weight-bold">{{ dbForm.database }} ({{ dbForm.host }}:{{ dbForm.port }})</div>
              </div>
              <div class="col-12 col-sm-6">
                <span class="text-grey-7 text-caption">Empresa:</span>
                <div class="text-weight-bold">{{ form.company.name }} ({{ form.company.taxId || 'Sin RIF' }})</div>
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
import { ref, onMounted } from 'vue'
import { useNotifications } from '../composables/core/useNotifications'
import { useSettingsStore } from '../stores/settings'

definePageMeta({
  layout: 'blank'
})

const notify = useNotifications()
const settingsStore = useSettingsStore()

const step = ref(1)
const isDbReady = ref(false)
const dbTesting = ref(false)
const dbSuccessMessage = ref('')
const showDbPassword = ref(false)
const installing = ref(false)
const logoFile = ref<File | null>(null)

const dbForm = ref({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'crudbase_db'
})

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

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/setup/status')
    if (res.isDatabaseConfigured) {
      isDbReady.value = true
      step.value = 2 // Si la BD ya está configurada, salta directo al paso de la empresa
    }
  } catch {
    // Modo inicial
  }
})

const submitDatabaseSetup = async () => {
  dbTesting.value = true
  dbSuccessMessage.value = ''
  try {
    const res: any = await $fetch('/api/setup/database', {
      method: 'POST',
      body: dbForm.value
    })

    isDbReady.value = true
    dbSuccessMessage.value = res.message || 'Base de datos conectada, creada y sincronizada exitosamente.'
    notify.success('¡Base de datos conectada y creada con éxito!')
    setTimeout(() => {
      step.value = 2
    }, 1200)
  } catch (error: any) {
    notify.error(error.data?.message || 'Error al conectar a PostgreSQL. Verifica los datos.')
  } finally {
    dbTesting.value = false
  }
}

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
    await settingsStore.fetchPublicSettings(true)
    navigateTo('/login')
  } catch (error: any) {
    notify.error(error.data?.message || 'Error durante la instalación')
  } finally {
    installing.value = false
  }
}
</script>
